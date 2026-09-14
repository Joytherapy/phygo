import { NextResponse } from 'next/server';
import { calculateMetabolicProfile, validateInput, type MetabolicInput } from '@/lib/metabolicCalculator';

// Calcolo autorevole lato server: il client (Clinical Toolkit o, in futuro,
// My PHYGO) manda solo gli input grezzi, questo endpoint applica sempre la
// stessa versione della formula — cosi' un risultato salvato e' sempre
// riproducibile con lo stesso `calculationMethod`, indipendentemente da quale
// build del frontend l'ha generato.
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<MetabolicInput>;

    if (
      !body ||
      !body.sex ||
      typeof body.age !== 'number' ||
      typeof body.weightKg !== 'number' ||
      typeof body.heightCm !== 'number' ||
      !body.activityLevel ||
      !body.goal ||
      !body.macroStrategy
    ) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }

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
    const result = calculateMetabolicProfile(input);

    return NextResponse.json({ result, errors });
  } catch (err) {
    console.error('metabolic calculate error:', err);
    return NextResponse.json({ error: 'Calculation failed' }, { status: 500 });
  }
}
