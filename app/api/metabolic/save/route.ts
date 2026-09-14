import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  calculateMetabolicProfile,
  validateInput,
  calculateAdaptiveInsight,
  type MetabolicInput,
  type AdaptiveInsightInput,
  type AdaptiveInsightResult,
} from '@/lib/metabolicCalculator';
import { UI_STRINGS, type AppLang } from '@/lib/i18n/uiStrings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserId() {
  const cookieStore = cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  return user?.id ?? null;
}

// Determina se l'utente autenticato e' un paziente (esiste una riga in
// `patients` con patient_user_id = lui) o un professionista. Stesso pattern
// gia' usato da middleware.ts per instradare tra /dashboard e /my-phygo.
async function resolveOwnPatientId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('patients')
    .select('id')
    .eq('patient_user_id', userId)
    .maybeSingle();
  return data?.id ?? null;
}

// POST: calcola (di nuovo, lato server, mai fidandosi dei numeri del client)
// e salva una riga storica.
// - Professionista (Clinical Toolkit): passa `patientId` esplicitamente,
//   scelto tramite lo stesso picker paziente usato da ClinicalActionBar.
// - Paziente (futuro My PHYGO): `patientId` viene SEMPRE risolto qui dal
//   proprio user id, mai accettato dal client, cosi' un paziente non puo'
//   mai scrivere sul profilo di un altro.
export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await req.json();
    const ownPatientId = await resolveOwnPatientId(userId);
    const enteredBy: 'professional' | 'patient' = ownPatientId ? 'patient' : 'professional';

    const patientId = enteredBy === 'patient' ? ownPatientId : body.patientId ?? null;

    const input: MetabolicInput = {
      sex: body.sex,
      age: body.age,
      weightKg: body.weightKg,
      heightCm: body.heightCm,
      activityLevel: body.activityLevel,
      bodyFatPct: body.bodyFatPct ?? null,
      goal: body.goal,
      macroStrategy: body.macroStrategy,
      customMacroPct: body.customMacroPct ?? null,
    };

    const errors = validateInput(input);
    if (errors.length > 0) {
      return NextResponse.json({ error: 'Invalid input', errors }, { status: 400 });
    }

    const result = calculateMetabolicProfile(input);

    const { data, error } = await supabase
      .from('metabolic_profiles')
      .insert({
        patient_id: patientId,
        created_by_user_id: userId,
        entered_by: enteredBy,
        shared_with_professional: body.sharedWithProfessional ?? true,
        sex: input.sex,
        age: input.age,
        weight_kg: input.weightKg,
        height_cm: input.heightCm,
        activity_level: input.activityLevel,
        body_fat_pct: input.bodyFatPct,
        goal: input.goal,
        macro_strategy: input.macroStrategy,
        custom_macro_pct: input.customMacroPct,
        bmr: result.bmr,
        tdee: result.tdee,
        bmi: result.bmi,
        bmi_category: result.bmiCategory,
        lean_body_mass_kg: result.leanBodyMassKg,
        fat_mass_kg: result.fatMassKg,
        calorie_target: result.calorieTarget,
        calorie_target_maintain: result.calorieTargets.maintain,
        calorie_target_fat_loss: result.calorieTargets.fat_loss,
        calorie_target_muscle_gain: result.calorieTargets.muscle_gain,
        calorie_target_performance: result.calorieTargets.performance,
        protein_g: result.macros.proteinG,
        carbs_g: result.macros.carbsG,
        fat_g: result.macros.fatG,
        calculation_method: result.calculationMethod,
        notes: body.notes ?? null,
      })
      .select('id, created_at')
      .single();

    if (error) {
      console.error('metabolic save error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fa comparire il profilo salvato anche nel "Piano di trattamento e
    // riferimenti clinici" della scheda paziente — lo stesso posto dove
    // compaiono esercizi, test e questionari — cosi' il professionista lo
    // trova insieme a tutto il resto invece che solo nella card Nutrizione
    // dedicata. Non blocca il salvataggio principale se fallisce: il dato
    // che conta davvero (la riga in metabolic_profiles) e' gia' al sicuro.
    if (patientId) {
      const lang: AppLang = (['it', 'en', 'es', 'fr'] as const).includes(body.lang) ? body.lang : 'en';
      const kcalSuffix = UI_STRINGS[lang].metabolicCalculator.kcalPerDaySuffix;
      const { error: refError } = await supabase.from('patient_clinical_references').insert({
        patient_id: patientId,
        content_type: 'metabolic_profile',
        content_id: data.id,
        payload: {
          label: `${result.calorieTarget} ${kcalSuffix} — TDEE ${result.tdee}`,
        },
      });
      if (refError) {
        console.error('metabolic clinical reference insert error:', refError);
      }
    }

    return NextResponse.json({ saved: true, id: data.id, createdAt: data.created_at, result });
  } catch (err) {
    console.error('metabolic save error:', err);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
}

// GET: storico. ?patientId= per il professionista (deve appartenere a un
// paziente esistente — stesso livello di fiducia del resto dell'app, single
// tenant); senza parametro, per un utente-paziente risolve automaticamente
// il proprio patient_id, cosi' non puo' mai leggere lo storico di un altro.
export async function GET(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const requestedPatientId = searchParams.get('patientId');

    const ownPatientId = await resolveOwnPatientId(userId);
    const patientId = ownPatientId ?? requestedPatientId;

    if (!patientId) {
      return NextResponse.json({ error: 'patientId mancante' }, { status: 400 });
    }

    let query = supabase
      .from('metabolic_profiles')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    // Un paziente vede solo le proprie voci condivise con il professionista
    // quando le legge il professionista; le proprie le vede sempre.
    if (ownPatientId && requestedPatientId && requestedPatientId !== ownPatientId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { data, error } = await query;
    if (error) {
      console.error('metabolic history error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const profiles = data ?? [];

    // "Phygo Adapt": ricalibra il TDEE dal trend di peso REALE del paziente
    // nel tempo — un vantaggio che solo un sistema con storico longitudinale
    // puo' offrire, non una calcolatrice TDEE isolata. Calcolato qui (non
    // sul client) cosi' resta autorevole e riproducibile.
    let adaptiveInsight: AdaptiveInsightResult | null = null;
    if (profiles.length >= 2) {
      const chronological = [...profiles].reverse(); // erano ordinati piu' recente -> piu' vecchio
      const entries: AdaptiveInsightInput[] = chronological.map((p) => ({
        weightKg: Number(p.weight_kg),
        calorieTarget: Number(p.calorie_target),
        createdAt: p.created_at,
      }));
      adaptiveInsight = calculateAdaptiveInsight(entries, Number(profiles[0].tdee));
    }

    return NextResponse.json({ profiles, adaptiveInsight });
  } catch (err) {
    console.error('metabolic history error:', err);
    return NextResponse.json({ error: 'History failed' }, { status: 500 });
  }
}
