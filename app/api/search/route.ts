import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SearchResult {
  id: string;
  title: string;
  section: string;
  sectionLabel: string;
  href: string;
  subtitle?: string;
}

const IT_EN_TRANSLATIONS: Record<string, string> = {
  spalla: 'shoulder', gomito: 'elbow', polso: 'wrist', mano: 'hand', anca: 'hip',
  ginocchio: 'knee', caviglia: 'ankle', piede: 'foot', colonna: 'spine', collo: 'neck',
  cervicale: 'cervical', lombare: 'lumbar', bacino: 'pelvis', torace: 'chest', addome: 'abdomen',
  testa: 'head', cranio: 'skull', coscia: 'thigh', gamba: 'leg', braccio: 'arm',
  avambraccio: 'forearm', alluce: 'toe', dito: 'finger', schiena: 'back', polpaccio: 'calf',
  glutei: 'glutes', quadricipite: 'quadriceps', ischiocrurali: 'hamstrings', bicipite: 'biceps',
  tricipite: 'triceps', trapezio: 'trapezius', addominali: 'core', toracica: 'thoracic',
  cuore: 'heart', polmone: 'lung', fegato: 'liver', rene: 'kidney', cervello: 'brain',
  nervo: 'nerve', muscolo: 'muscle', osso: 'bone', articolazione: 'joint', legamento: 'ligament',
  tendine: 'tendon', vescica: 'bladder', intestino: 'bowel', prostata: 'prostate',
  utero: 'uterus', vagina: 'vagina', respiratorio: 'respiratory', cardiaco: 'cardiac',
  polmonare: 'pulmonary', neurologico: 'neurological', linfatico: 'lymphatic', pelvico: 'pelvic',
  dolore: 'pain', frattura: 'fracture', lesione: 'injury', infiammazione: 'inflammation',
  tendinite: 'tendinitis', artrosi: 'arthritis', ernia: 'hernia', distorsione: 'sprain',
  lussazione: 'dislocation', protesi: 'prosthesis', chirurgia: 'surgery', tumore: 'tumor',
  cancro: 'cancer', ictus: 'stroke', paralisi: 'paralysis', debolezza: 'weakness',
  rigidita: 'stiffness', gonfiore: 'swelling', edema: 'edema', spasmo: 'spasm',
  instabilita: 'instability', compressione: 'compression', infezione: 'infection',
  emorragia: 'bleeding', trauma: 'trauma', soffocamento: 'choking', arresto: 'arrest',
  test: 'test', valutazione: 'assessment', trattamento: 'treatment', terapia: 'therapy',
  riabilitazione: 'rehabilitation', esercizio: 'exercise', respirazione: 'breathing',
  massaggio: 'massage', mobilizzazione: 'mobilization', manipolazione: 'manipulation',
  pediatrico: 'pediatric', infantile: 'infant', adulto: 'adult', anziano: 'elderly',
  acuto: 'acute', cronico: 'chronic', bilaterale: 'bilateral', unilaterale: 'unilateral',
};
const EN_IT_TRANSLATIONS: Record<string, string> = Object.fromEntries(
  Object.entries(IT_EN_TRANSLATIONS).map(([it, en]) => [en, it])
);

const BODY_ZONE_ANATOMY_TEXT: Record<string, { name: string; text: string }> = {
  'cervical-spine': { name: 'Cervical Spine', text: "La colonna cervicale è composta da 7 vertebre (C1-C7), articolate tramite dischi intervertebrali e faccette articolari zigapofisarie. C1 (atlante) e C2 (epistrofeo/asse) formano un complesso specializzato. I muscoli profondi (lunghi del collo, lunghi della testa, piccoli retti) garantiscono stabilità segmentale; i muscoli superficiali (sternocleidomastoideo, scaleni, splenio) generano movimento. Innervazione: plesso cervicale C1-C4 e plesso brachiale C5-T1. Biomeccanica: segmento vertebrale più mobile, flessione ~50°, estensione ~60°, rotazione ~80°. Rilevanza clinica: cervicalgia meccanica, colpo di frusta whiplash, cefalea cervicogenica, vertigini cervicogeniche, radicolopatia, stenosi del canale cervicale, mielopatia." },
  'trapezius': { name: 'Trapezius', text: "Il trapezio è un ampio muscolo triangolare piatto, suddiviso in tre fasci: superiore, medio, inferiore. Innervato dal nervo accessorio spinale XI nervo cranico. Lavora in sinergia con il dentato anteriore nel ritmo scapolo-omerale. Rilevanza clinica: tensione miofasciale, trigger point, cefalea tensiva, dolore cervicale riferito, discinesia scapolare, sindrome da conflitto subacromiale, scapola alata." },
  'shoulder': { name: 'Shoulder', text: "La spalla è il complesso articolare più mobile del corpo: sterno-costo-clavicolare, acromion-claveare, gleno-omerale, spazio subdeltoideo, scapolo-toracica. Cuffia dei rotatori: sovraspinato, sottospinato, piccolo rotondo, sottoscapolare. Deltoide. Plesso brachiale C5-T1, nervo sovrascapolare, nervo ascellare, nervo sottoscapolare. Ritmo scapolo-omerale. Rilevanza clinica: sindrome da conflitto subacromiale, lesioni della cuffia dei rotatori, capsulite adesiva spalla congelata, instabilità gleno-omerale, lussazione." },
  'chest': { name: 'Chest', text: "Il gran pettorale origina da clavicola, sterno, cartilagini costali. Il piccolo pettorale origina dalle coste 3-5 e si inserisce sul processo coracoideo. Nervi pettorale laterale e mediale. Rilevanza clinica: sindrome dello stretto toracico thoracic outlet syndrome, lesioni del gran pettorale, spalla protratta e intrarotata." },
  'biceps': { name: 'Biceps', text: "Il bicipite brachiale ha capo lungo (tubercolo sovraglenoideo, solco intertubercolare) e capo breve (processo coracoideo). Nervo muscolocutaneo C5-C6. Flessore del gomito e supinatore. Rilevanza clinica: tendinopatia del capo lungo del bicipite, lesioni prossimali e distali del tendine bicipitale." },
  'triceps': { name: 'Triceps', text: "Il tricipite brachiale ha capo lungo (tubercolo infraglenoideo), laterale e mediale, inserzione su olecrano ulnare. Nervo radiale C6-C8. Unico estensore del gomito. Rilevanza clinica: lesioni del tendine tricipitale, riabilitazione post-frattura di gomito e post-protesi di gomito." },
  'elbow': { name: 'Elbow', text: "Il gomito comprende omero-ulnare, omero-radiale, radio-ulnare prossimale. Epicondilo laterale e mediale. Legamento collaterale ulnare e radiale. Nervo ulnare nel tunnel cubitale, nervi mediano e radiale. Rilevanza clinica: epicondilite laterale gomito del tennista, epicondilite mediale gomito del golfista, sindrome del tunnel cubitale." },
  'forearm': { name: 'Forearm', text: "L'avambraccio ha compartimento anteriore flessore (nervo mediano) e posteriore estensore (nervo radiale). Rilevanza clinica: tendinopatie da overuse dei flessori/estensori, sindrome del tunnel radiale, epicondilite laterale resistente." },
  'wrist-hand': { name: 'Wrist Hand', text: "Il polso ha 8 ossa carpali, tunnel carpale con nervo mediano, retinacolo degli estensori con 6 compartimenti. Mano 27 ossa, muscoli intrinseci ed estrinseci. Nervo mediano, ulnare, radiale. Rilevanza clinica: sindrome del tunnel carpale, tenosinovite di De Quervain, dito a scatto, malattia di Dupuytren." },
  'core-abdomen': { name: 'Core Abdomen', text: "Il core comprende diaframma, pavimento pelvico, trasverso dell'addome, multifido, paraspinali, retto dell'addome, obliqui. Nervi intercostali toracici T7-T12, nervo ileo-ipogastrico/ileo-inguinale L1. Rilevanza clinica: lombalgia cronica non specifica, diastasi dei muscoli retti addominali post-partum, controllo motorio del core." },
  'thoracic-spine': { name: 'Thoracic Spine', text: "La colonna dorsale ha 12 vertebre T1-T12, articolazioni costo-vertebrali e costo-trasversarie, cifosi fisiologica. Muscoli paraspinali toracici, romboidi. Nervi spinali toracici T1-T12. Rilevanza clinica: rigidità toracica, fratture da compressione vertebrale, osteoporosi, ipercifosi." },
  'lumbar-spine': { name: 'Lumbar Spine', text: "La colonna lombare ha 5 vertebre L1-L5, dischi intervertebrali spessi, legamento ileo-lombare, legamento longitudinale posteriore, muscoli erettori spinali, multifido, quadrato dei lombi. Nervo femorale, otturatorio, sciatico. Rilevanza clinica: lombalgia aspecifica, ernia del disco lombare, radicolopatia, sciatalgia, stenosi del canale lombare, claudicatio neurogena." },
  'hip': { name: 'Hip', text: "L'anca è un'enartrosi tra testa del femore e acetabolo, labbro acetabolare, legamento ileo-femorale, pubo-femorale, ischio-femorale. Glutei, ileopsoas, adduttori, piriforme. Nervo femorale, otturatorio, gluteo superiore/inferiore, sciatico. Rilevanza clinica: coxartrosi, conflitto femoro-acetabolare FAI, displasia congenita dell'anca, segno di Trendelenburg." },
  'glutes': { name: 'Glutes', text: "Grande gluteo, medio gluteo, piccolo gluteo, piriforme e rotatori esterni profondi. Nervo gluteo inferiore, gluteo superiore, sciatico. Rilevanza clinica: sindrome del dolore trocanterico, tendinopatia glutea, sindrome del piriforme, dolore femoro-rotuleo, lombalgia." },
  'quadriceps': { name: 'Quadriceps', text: "Il quadricipite femorale ha retto femorale, vasto laterale, mediale, intermedio, vasto mediale obliquo, tendine rotuleo. Nervo femorale L2-L4. Rilevanza clinica: sindrome femoro-rotulea, lesione del LCA, protesi di ginocchio, tendinopatia rotulea ginocchio del saltatore." },
  'hamstrings': { name: 'Hamstrings', text: "Gli ischiocrurali comprendono bicipite femorale, semitendinoso, semimembranoso, tuberosità ischiatica. Nervo tibiale, nervo peroneale comune. Rilevanza clinica: lesioni muscolari degli ischiocrurali, Nordic hamstring curl, stabilità dinamica del LCA." },
  'calf': { name: 'Calf', text: "Il polpaccio ha tricipite surale con gastrocnemio e soleo, tendine d'Achille, tibiale posteriore. Nervo tibiale S1-S2. Rilevanza clinica: tendinopatia achillea, rottura del tendine d'Achille, test di Thompson, sindrome da stress tibiale mediale shin splints." },
  'ankle-foot': { name: 'Ankle Foot', text: "La caviglia ha articolazione tibio-tarsica talo-crurale, legamenti collaterali laterali peroneo-astragalico anteriore, legamento deltoideo, sindesmosi tibio-peroneale distale. Piede 26 ossa, fascia plantare, windlass mechanism. Nervo tibiale posteriore, peroneale superficiale/profondo. Rilevanza clinica: distorsione di caviglia laterale, fascite plantare, alluce valgo, neuroma di Morton." },
  'whole-body': { name: 'Whole Body', text: "Equilibrio e controllo posturale: sistema visivo, vestibolare, somatosensoriale/propriocettivo. Strategie posturali caviglia, anca, passo compensatorio. Rilevanza clinica: deficit dell'equilibrio, rischio di caduta nell'anziano, vertigine parossistica posizionale benigna, posturografia." },
  'knee': { name: 'Knee', text: "Il ginocchio ha articolazione femoro-tibiale e femoro-rotulea, menischi mediale e laterale, legamento crociato anteriore LCA, legamento crociato posteriore LCP, legamento collaterale mediale LCM, legamento collaterale laterale LCL, rotula, troclea femorale. Nervo femorale, tibiale, peroneale comune, nervo safeno. Rilevanza clinica: lesioni del LCA, lesioni meniscali, artrosi femoro-tibiale, sindrome femoro-rotulea, screw-home mechanism." },
};

function getSearchWords(q: string): string[] {
  const words = q.toLowerCase().trim().split(/\s+/).filter((w) => w.length >= 2);
  const expanded = new Set<string>();
  words.forEach((w) => {
    expanded.add(w);
    if (IT_EN_TRANSLATIONS[w]) expanded.add(IT_EN_TRANSLATIONS[w]);
    if (EN_IT_TRANSLATIONS[w]) expanded.add(EN_IT_TRANSLATIONS[w]);
  });
  return Array.from(expanded);
}

function buildOrFilter(column: string, words: string[]): string {
  return words.map((w) => `${column}.ilike.%${w}%`).join(',');
}

function matchesAnyWord(text: string, words: string[]): boolean {
  const textLower = text.toLowerCase();
  return words.some((w) => textLower.includes(w));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const words = getSearchWords(q);
    if (words.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const orName = buildOrFilter('name', words);
    const orTitle = buildOrFilter('title', words);
    const results: SearchResult[] = [];

    const [
      mtTechniques, mtConcepts, airwayTechniques, blsProcedures,
      oncologyStructures, oncologyTreatments, oncologyTests, oncologyRehab,
      cardioStructures, cardioTests, cardioRehab,
      pelvicStructures, pelvicTests, pelvicRehab,
      neuroTests, brainZones, firstAidTopics, bodyZones, libraryItems,
      cardioConditions, oncologyConditions, pelvicConditions,
      bodyZoneConditions, brainZoneConditions,
    ] = await Promise.all([
      adminSupabase.from('manual_therapy_techniques').select('id, name, joint_region').or(orName).limit(8),
      adminSupabase.from('manual_therapy_concepts').select('id, name, category').or(orName).limit(4),
      adminSupabase.from('airway_clearance_techniques').select('id, name, technique_category').or(orName).limit(8),
      adminSupabase.from('bls_procedures').select('id, name, procedure_category').or(orName).limit(8),
      adminSupabase.from('oncology_structures').select('id, name, category').or(orName).limit(8),
      adminSupabase.from('oncology_treatments').select('id, name, category').or(orName).limit(8),
      adminSupabase.from('oncology_tests').select('id, name, category').or(orName).limit(6),
      adminSupabase.from('oncology_rehab').select('id, name, category').or(orName).limit(6),
      adminSupabase.from('cardiopulmonary_structures').select('id, name, category').or(orName).limit(6),
      adminSupabase.from('cardiopulmonary_tests').select('id, name, category').or(orName).limit(6),
      adminSupabase.from('cardiopulmonary_rehab').select('id, name, category').or(orName).limit(6),
      adminSupabase.from('pelvic_floor_structures').select('id, name, category').or(orName).limit(6),
      adminSupabase.from('pelvic_floor_tests').select('id, name, category').or(orName).limit(6),
      adminSupabase.from('pelvic_floor_rehab').select('id, name, category').or(orName).limit(6),
      adminSupabase.from('neuro_tests').select('id, name, category').or(orName).limit(6),
      adminSupabase.from('brain_zones').select('id, name, slug').or(orName).limit(6),
      adminSupabase.from('first_aid_topics').select('id, name, category, slug').or(orName).limit(6),
      adminSupabase.from('body_zones').select('id, name, slug').or(orName).limit(8),
      adminSupabase.from('library_items').select('id, title').or(orTitle).limit(10),
      adminSupabase.from('cardiopulmonary_condition_tags').select('condition_id, system, knowledge_base:condition_id(id, condition_name)').limit(80),
      adminSupabase.from('oncology_conditions').select('condition_id, system, knowledge_base:condition_id(id, condition_name)').limit(80),
      adminSupabase.from('pelvic_floor_condition_tags').select('condition_id, system, knowledge_base:condition_id(id, condition_name)').limit(80),
      adminSupabase.from('body_zone_conditions').select('zone_id, condition_id, body_zones:zone_id(name, slug), knowledge_base:condition_id(id, condition_name)').limit(100),
      adminSupabase.from('brain_zone_conditions').select('zone_id, condition_id, brain_zones:zone_id(name, slug), knowledge_base:condition_id(id, condition_name)').limit(100),
    ]);

    const push = (items: any[] | null, prefix: string, section: string, sectionLabel: string, href: string, subtitleField?: string) => {
      (items ?? []).forEach((item) =>
        results.push({ id: `${prefix}-${item.id}`, title: item.name, section, sectionLabel, href, subtitle: subtitleField ? item[subtitleField] : undefined })
      );
    };

    push(mtTechniques.data, 'mt', 'manual-therapy', 'Manual Therapy', '/dashboard/clinical-tools', 'joint_region');
    push(mtConcepts.data, 'mtc', 'manual-therapy', 'Manual Therapy — Principi', '/dashboard/clinical-tools');
    push(airwayTechniques.data, 'aw', 'cardiopulmonary', 'Cardiopulmonary — Disostruzione', '/dashboard/cardiopulmonary');
    push(blsProcedures.data, 'bls', 'bls', 'BLSD', '/dashboard/bls');
    push(oncologyStructures.data, 'onc-s', 'oncology', 'Oncology — Anatomia', '/dashboard/oncology');
    push(oncologyTreatments.data, 'onc-t', 'oncology', 'Oncology — Trattamenti', '/dashboard/oncology');
    push(oncologyTests.data, 'onc-te', 'oncology', 'Oncology — Valutazione', '/dashboard/oncology');
    push(oncologyRehab.data, 'onc-r', 'oncology', 'Oncology — Riabilitazione', '/dashboard/oncology');
    push(cardioStructures.data, 'cardio-s', 'cardiopulmonary', 'Cardiopulmonary — Anatomia', '/dashboard/cardiopulmonary');
    push(cardioTests.data, 'cardio-te', 'cardiopulmonary', 'Cardiopulmonary — Valutazione', '/dashboard/cardiopulmonary');
    push(cardioRehab.data, 'cardio-r', 'cardiopulmonary', 'Cardiopulmonary — Riabilitazione', '/dashboard/cardiopulmonary');
    push(pelvicStructures.data, 'pf-s', 'pelvic-floor', 'Pelvic Floor — Anatomia', '/dashboard/pelvic-floor');
    push(pelvicTests.data, 'pf-te', 'pelvic-floor', 'Pelvic Floor — Valutazione', '/dashboard/pelvic-floor');
    push(pelvicRehab.data, 'pf-r', 'pelvic-floor', 'Pelvic Floor — Riabilitazione', '/dashboard/pelvic-floor');
    push(neuroTests.data, 'neuro-te', 'neurology', 'Neurology — Test', '/dashboard/brain-map');
    push(brainZones.data, 'brain', 'neurology', 'Neurology — Anatomia', '/dashboard/brain-map');

    (firstAidTopics.data ?? []).forEach((t: any) =>
      results.push({ id: `fa-${t.id}`, title: t.name, section: 'first-aid', sectionLabel: 'First Aid', href: `/dashboard/first-aid/${t.slug}` })
    );

    (bodyZones.data ?? []).forEach((z: any) =>
      results.push({ id: `bz-${z.id}`, title: z.name, section: 'body-map', sectionLabel: 'Body Map', href: `/dashboard/body-map/${z.slug}` })
    );

    const pushConditions = (data: any[] | null, prefix: string, section: string, sectionLabel: string, href: string) => {
      (data ?? []).forEach((c: any) => {
        const name = c.knowledge_base?.condition_name;
        if (name && matchesAnyWord(name, words)) {
          results.push({ id: `${prefix}-${c.condition_id}`, title: name, section, sectionLabel, href });
        }
      });
    };

    pushConditions(cardioConditions.data, 'cardio-c', 'cardiopulmonary', 'Cardiopulmonary — Patologie', '/dashboard/cardiopulmonary');
    pushConditions(oncologyConditions.data, 'onc-c', 'oncology', 'Oncology — Patologie', '/dashboard/oncology');
    pushConditions(pelvicConditions.data, 'pf-c', 'pelvic-floor', 'Pelvic Floor — Patologie', '/dashboard/pelvic-floor');

    (bodyZoneConditions.data ?? []).forEach((c: any) => {
      const name = c.knowledge_base?.condition_name;
      const zoneSlug = c.body_zones?.slug;
      const zoneName = c.body_zones?.name;
      if (name && zoneSlug && matchesAnyWord(name, words)) {
        results.push({ id: `bz-c-${c.zone_id}-${c.condition_id}`, title: name, section: 'body-map', sectionLabel: 'Body Map — Patologie', href: `/dashboard/body-map/${zoneSlug}`, subtitle: zoneName });
      }
    });

    (brainZoneConditions.data ?? []).forEach((c: any) => {
      const name = c.knowledge_base?.condition_name;
      const zoneSlug = c.brain_zones?.slug;
      const zoneName = c.brain_zones?.name;
      if (name && zoneSlug && matchesAnyWord(name, words)) {
        results.push({ id: `brz-c-${c.zone_id}-${c.condition_id}`, title: name, section: 'neurology', sectionLabel: 'Neurology — Patologie', href: `/dashboard/brain-map/${zoneSlug}`, subtitle: zoneName });
      }
    });

    (libraryItems.data ?? []).forEach((item: any) =>
      results.push({ id: `lib-${item.id}`, title: item.title, section: 'library', sectionLabel: 'Pro Library', href: '/dashboard/library' })
    );

    const meaningfulWords = words.filter((w) => w !== 'anatomia' && w !== 'anatomy');
    const isGenericAnatomyQuery = (words.includes('anatomia') || words.includes('anatomy')) && meaningfulWords.length === 0;    Object.entries(BODY_ZONE_ANATOMY_TEXT).forEach(([slug, zone]) => {
      if (isGenericAnatomyQuery || matchesAnyWord(zone.text, meaningfulWords.length > 0 ? meaningfulWords : words) || matchesAnyWord(zone.name, meaningfulWords.length > 0 ? meaningfulWords : words)) {        results.push({
          id: `bz-anat-${slug}`,
          title: `Anatomia — ${zone.name}`,
          section: 'body-map',
          sectionLabel: 'Body Map — Anatomia Dettagliata',
          href: `/dashboard/body-map/${slug}`,
        });
      }
    });
    const scoreResult = (r: SearchResult): number => {
      const titleLower = r.title.toLowerCase();
      return words.reduce((score, w) => score + (titleLower.includes(w) ? 1 : 0), 0);
    };
    const sortedResults = results
      .map((r) => ({ r, score: scoreResult(r) }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.r);

    return NextResponse.json({ results: sortedResults.slice(0, 60) });  } catch (err) {
    console.error('search error:', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}