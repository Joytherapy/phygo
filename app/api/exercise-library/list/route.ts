import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getTranslatedExercisesBatch, type ExerciseLang } from '@/lib/exerciseTranslation';

export const dynamic = 'force-dynamic';

// Legge dalla nuova architettura "Exercise Animatic" (exercises / exercise_translations /
// exercise_assets), separata dal vecchio provider wger (exercise_cache) e dalla Pro Library
// editoriale (library_items). Al momento non c'e' alcun gating per piano.
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SIGNED_URL_TTL_SECONDS = 60 * 30; // 30 minuti, come gli altri signed url del progetto

// Con ~1270 esercizi, un solo .in('exercise_id', exerciseIds) con tutti gli id supera la
// lunghezza massima di URL accettata da PostgREST (Bad Request). Si spezzano quindi le query
// in blocchi piu' piccoli, eseguiti in parallelo, e si uniscono i risultati.
const ID_CHUNK_SIZE = 150;
const SIGNED_URL_CHUNK_SIZE = 500;
// PostgREST risponde al massimo con 1000 righe per richiesta (limite di default "db-max-rows"),
// quindi la lettura iniziale degli esercizi va paginata esplicitamente, altrimenti con piu' di
// 1000 esercizi i restanti spariscono silenziosamente dalla pagina (nessun errore, solo un
// elenco troncato).
const PAGE_SIZE = 1000;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function parseLang(value: string | null): ExerciseLang {
  return value === 'en' || value === 'es' || value === 'fr' ? value : 'it';
}

export async function GET(request: Request) {
  try {
    const lang = parseLang(new URL(request.url).searchParams.get('lang'));

    const cookieStore = cookies();
    const supabase = createServerClient(
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
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Lettura paginata: continua finche' una pagina torna piena (PAGE_SIZE righe), altrimenti
    // si e' arrivati in fondo. Evita il troncamento silenzioso a 1000 righe di PostgREST.
    const exercises: {
      id: string;
      external_id: string;
      primary_muscle: string | null;
      secondary_muscles: string[] | null;
      equipment: string[] | null;
      category: string | null;
      subcategory: string | null;
      body_region: string | null;
      difficulty: string | null;
      tags: string[] | null;
    }[] = [];
    // ^ "tags" e' il campo delle etichette trasversali (es. "cardio-hiit"), indipendenti dalla
    // zona del corpo e dall'attrezzo: un esercizio puo' avere piu' tag.
    for (let page = 0; ; page++) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data: pageData, error: exError } = await adminSupabase
        .from('exercises')
        .select('id, external_id, primary_muscle, secondary_muscles, equipment, category, subcategory, body_region, difficulty, tags')
        .eq('source', 'exercise_animatic')
        .is('archived_at', null)
        .order('id', { ascending: true })
        .range(from, to);

      if (exError) {
        console.error('exercise-library list error (exercises):', exError.message);
        return NextResponse.json({ error: 'Errore lettura esercizi' }, { status: 500 });
      }

      exercises.push(...(pageData || []));
      if (!pageData || pageData.length < PAGE_SIZE) break;
    }

    const exerciseIds = exercises.map((e) => e.id);
    if (exerciseIds.length === 0) {
      return NextResponse.json({ exercises: [] });
    }

    const idChunks = chunk(exerciseIds, ID_CHUNK_SIZE);

    // 'en' è la lingua sorgente in cui è scritto il contenuto Exercise Animatic.
    const trResults = await Promise.all(
      idChunks.map((ids) =>
        adminSupabase
          .from('exercise_translations')
          .select('exercise_id, name, instructions, tips')
          .in('exercise_id', ids)
          .eq('lang', 'en')
      )
    );
    const trError = trResults.find((r) => r.error)?.error;
    if (trError) {
      console.error('exercise-library list error (translations):', trError.message);
      return NextResponse.json({ error: 'Errore lettura traduzioni' }, { status: 500 });
    }
    const sourceTranslations = trResults.flatMap((r) => r.data || []);

    const assetResults = await Promise.all(
      idChunks.map((ids) =>
        adminSupabase
          .from('exercise_assets')
          .select('exercise_id, asset_type, storage_bucket, storage_key')
          .in('exercise_id', ids)
      )
    );
    const assetError = assetResults.find((r) => r.error)?.error;
    if (assetError) {
      console.error('exercise-library list error (assets):', assetError.message);
      return NextResponse.json({ error: 'Errore lettura media' }, { status: 500 });
    }
    const assets = assetResults.flatMap((r) => r.data || []);

    // Un signed url per ogni oggetto nel bucket privato "exercise-media" — necessario perche'
    // il bucket non e' pubblico, quindi non basta un getPublicUrl. Con ~3600 asset generarli uno
    // alla volta sarebbe lentissimo: si usa createSignedUrls (plurale, batch) a blocchi,
    // raggruppati per bucket ed eseguiti in parallelo.
    const keyToAssetInfo = new Map<string, { exercise_id: string; asset_type: string }>();
    const keysByBucket = new Map<string, string[]>();
    for (const asset of assets || []) {
      keyToAssetInfo.set(`${asset.storage_bucket}::${asset.storage_key}`, {
        exercise_id: asset.exercise_id,
        asset_type: asset.asset_type,
      });
      const arr = keysByBucket.get(asset.storage_bucket) || [];
      arr.push(asset.storage_key);
      keysByBucket.set(asset.storage_bucket, arr);
    }

    const signedByKey = new Map<string, string>();
    await Promise.all(
      Array.from(keysByBucket.entries()).flatMap(([bucket, keys]) =>
        chunk(keys, SIGNED_URL_CHUNK_SIZE).map(async (keyChunk) => {
          const { data: signedList, error: signError } = await adminSupabase.storage
            .from(bucket)
            .createSignedUrls(keyChunk, SIGNED_URL_TTL_SECONDS);
          if (signError || !signedList) {
            console.error('exercise-library list error (signed urls):', signError?.message);
            return;
          }
          for (const item of signedList) {
            if (item.signedUrl && item.path) {
              const info = keyToAssetInfo.get(`${bucket}::${item.path}`);
              if (info) {
                signedByKey.set(`${info.exercise_id}:${info.asset_type}`, item.signedUrl);
              }
            }
          }
        })
      )
    );

    // Traduzione lazy e cache-ata (invariata al secondo giro): prima richiesta reale in una
    // lingua diversa dall'inglese chiama OpenAI una sola volta per l'intero lotto mancante e
    // salva il risultato in exercise_translations, esattamente come per condizioni/altre sezioni.
    const translatedByExercise = await getTranslatedExercisesBatch(
      (sourceTranslations || []).map((t) => ({
        exercise_id: t.exercise_id,
        name: t.name,
        instructions: t.instructions,
        tips: t.tips,
      })),
      lang
    );

    const sourceByExercise = new Map((sourceTranslations || []).map((t) => [t.exercise_id, t]));

    const result = (exercises || []).map((e) => {
      const translated = translatedByExercise.get(e.id);
      const source = sourceByExercise.get(e.id);
      return {
        id: e.id,
        name: translated?.name || source?.name || e.external_id,
        instructions: translated?.instructions ?? source?.instructions ?? null,
        tips: translated?.tips ?? source?.tips ?? null,
        primary_muscle: e.primary_muscle,
        secondary_muscles: e.secondary_muscles,
        equipment: e.equipment,
        category: e.category,
        subcategory: e.subcategory,
        body_region: e.body_region,
        difficulty: e.difficulty,
        tags: e.tags || [],
        video_url: signedByKey.get(`${e.id}:video`) || null,
        image_start_url: signedByKey.get(`${e.id}:image_start`) || null,
        image_end_url: signedByKey.get(`${e.id}:image_end`) || null,
      };
    });

    result.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ exercises: result, lang, expires_in: SIGNED_URL_TTL_SECONDS });
  } catch (err) {
    console.error('exercise-library list error:', err);
    return NextResponse.json({ error: 'List failed' }, { status: 500 });
  }
}
