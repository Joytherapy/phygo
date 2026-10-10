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
          .select('exercise_id, asset_type, variant, is_default, storage_bucket, storage_key')
          .in('exercise_id', ids)
      )
    );
    const assetError = assetResults.find((r) => r.error)?.error;
    if (assetError) {
      console.error('exercise-library list error (assets):', assetError.message);
      return NextResponse.json({ error: 'Errore lettura media' }, { status: 500 });
    }
    const assets = assetResults.flatMap((r) => r.data || []);

    // Da quando esiste anche il video verticale (variant 'vertical' / 'vertical-female',
    // aggiunto per il mobile, sempre is_default:false), un esercizio può avere PIÙ di un
    // asset_type:'video'. Si sceglie quindi, per ciascun esercizio, un solo video
    // "orizzontale" (quello con is_default:true, escludendo le varianti verticali — comportamento
    // identico a prima) e separatamente, se presente, un solo video "verticale" per il mobile.
    const videoDefaultKeyByExercise = new Map<string, { bucket: string; key: string }>();
    const videoVerticalKeyByExercise = new Map<string, { bucket: string; key: string }>();
    const imageStartKeyByExercise = new Map<string, { bucket: string; key: string }>();
    const imageEndKeyByExercise = new Map<string, { bucket: string; key: string }>();
    for (const asset of assets || []) {
      const ref = { bucket: asset.storage_bucket, key: asset.storage_key };
      const isVertical = asset.variant === 'vertical' || asset.variant === 'vertical-female';
      if (asset.asset_type === 'video' && isVertical) {
        // Se per errore ce ne fossero due (es. maschile+femminile), si tiene il primo trovato.
        if (!videoVerticalKeyByExercise.has(asset.exercise_id)) videoVerticalKeyByExercise.set(asset.exercise_id, ref);
      } else if (asset.asset_type === 'video' && asset.is_default) {
        videoDefaultKeyByExercise.set(asset.exercise_id, ref);
      } else if (asset.asset_type === 'image_start' && (asset.is_default || !imageStartKeyByExercise.has(asset.exercise_id))) {
        imageStartKeyByExercise.set(asset.exercise_id, ref);
      } else if (asset.asset_type === 'image_end' && (asset.is_default || !imageEndKeyByExercise.has(asset.exercise_id))) {
        imageEndKeyByExercise.set(asset.exercise_id, ref);
      }
    }

    // Un signed url per ogni oggetto nel bucket privato "exercise-media" — necessario perche'
    // il bucket non e' pubblico, quindi non basta un getPublicUrl. Con ~3600 asset generarli uno
    // alla volta sarebbe lentissimo: si usa createSignedUrls (plurale, batch) a blocchi,
    // raggruppati per bucket ed eseguiti in parallelo. Si firmano solo le chiavi scelte sopra
    // (un video orizzontale + un video verticale al massimo per esercizio), non tutti gli asset.
    const chosenRefs = [
      ...videoDefaultKeyByExercise.values(),
      ...videoVerticalKeyByExercise.values(),
      ...imageStartKeyByExercise.values(),
      ...imageEndKeyByExercise.values(),
    ];
    const keysByBucket = new Map<string, string[]>();
    for (const ref of chosenRefs) {
      const arr = keysByBucket.get(ref.bucket) || [];
      arr.push(ref.key);
      keysByBucket.set(ref.bucket, arr);
    }

    const signedByBucketKey = new Map<string, string>();
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
              signedByBucketKey.set(`${bucket}::${item.path}`, item.signedUrl);
            }
          }
        })
      )
    );
    function signedUrlFor(ref: { bucket: string; key: string } | undefined): string | null {
      if (!ref) return null;
      return signedByBucketKey.get(`${ref.bucket}::${ref.key}`) || null;
    }

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
        video_url: signedUrlFor(videoDefaultKeyByExercise.get(e.id)),
        // Video in formato verticale (9:16), pensato per lo schermo del telefono: null se per
        // questo esercizio non è ancora stato caricato (es. non faceva parte del lotto "VERTICAL
        // VIDEOS"). Il sito mostra questo se presente e lo schermo è stretto, altrimenti il video
        // normale qui sopra.
        video_vertical_url: signedUrlFor(videoVerticalKeyByExercise.get(e.id)),
        image_start_url: signedUrlFor(imageStartKeyByExercise.get(e.id)),
        image_end_url: signedUrlFor(imageEndKeyByExercise.get(e.id)),
      };
    });

    result.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ exercises: result, lang, expires_in: SIGNED_URL_TTL_SECONDS });
  } catch (err) {
    console.error('exercise-library list error:', err);
    return NextResponse.json({ error: 'List failed' }, { status: 500 });
  }
}
