import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { requireQuizUser } from '@/lib/quiz/authServer'
import { isQuizSubject, isQuizDifficulty, isQuizLanguage, QUIZ_SUBJECT_SCOPES, type QuizLanguage, type QuizSubject } from '@/lib/quiz/subjects'

// Service-role client — same reasoning as knowledge-resolve/route.ts: quiz_questions
// has RLS enabled with zero policies, so it is only ever reachable through routes
// like this one, never via a direct anon/authenticated Supabase call. That is what
// keeps correct_index/explanation out of reach of the client (a row-level policy
// couldn't hide just those two columns on its own).
const adminSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const TARGET_POOL_SIZE = 50 // cached questions kept on hand per subject+difficulty+language —
// user asked for "at least 50 per subject"; since this is per difficulty tier too, a subject
// with all three difficulties in use ends up with far more than 50 questions overall.
const QUESTIONS_PER_QUIZ = 8
const GENERATE_BATCH = 10 // how many new questions to ask the model for on each shortfall call —
// kept modest so a single quiz-start request doesn't wait too long on OpenAI; the pool climbs
// toward TARGET_POOL_SIZE a batch at a time across repeated plays, not all at once.
const EXISTING_QUESTIONS_SAMPLE = 50 // how many already-cached questions to show the model, so it avoids near-duplicates

// Questions are generated in whichever of the site's four languages the
// student is using (lib/i18n/uiStrings.ts's AppLang) — each subject+
// difficulty+language combination gets its own cached pool, filled lazily
// the first time someone actually plays a quiz in that language.
const LANGUAGE_LABELS_IT: Record<QuizLanguage, string> = { it: 'italiano', en: 'inglese', es: 'spagnolo', fr: 'francese' }

// Every subject sources grounding text from tables whose schema was already
// verified this session (same tables the Smart Study Panel matches against),
// rather than re-deriving a filter over knowledge_base's per-language jsonb —
// this keeps one uniform fetch/format code path for all 12 subjects instead of
// a separate condition-lookup branch for the 8 body systems.
type ContentRow = { name: string; parts: string[] }

async function fetchStructuresAndTests(structTable: string, testTable: string): Promise<ContentRow[]> {
  const [structures, tests] = await Promise.all([
    adminSupabase.from(structTable).select('name, anatomy, function, clinical_relevance').limit(40),
    adminSupabase.from(testTable).select('name, procedure, interpretation').limit(40),
  ])
  const rows: ContentRow[] = []
  for (const r of structures.data ?? []) {
    const parts = [r.anatomy, r.function, r.clinical_relevance].filter((v): v is string => !!v && v.trim().length > 0)
    if (parts.length) rows.push({ name: r.name, parts })
  }
  for (const r of tests.data ?? []) {
    const parts = [r.procedure, r.interpretation].filter((v): v is string => !!v && v.trim().length > 0)
    if (parts.length) rows.push({ name: r.name, parts })
  }
  return rows
}

const BODY_SYSTEM_TABLES: Record<string, { struct: string; test: string }> = {
  cardiopulmonary: { struct: 'cardiopulmonary_structures', test: 'cardiopulmonary_tests' },
  endocrine: { struct: 'endocrine_structures', test: 'endocrine_tests' },
  urinary: { struct: 'urinary_structures', test: 'urinary_tests' },
  gastrointestinal: { struct: 'gastrointestinal_structures', test: 'gastrointestinal_tests' },
  immune: { struct: 'immune_structures', test: 'immune_tests' },
  hematology: { struct: 'hematology_structures', test: 'hematology_tests' },
  oncology: { struct: 'oncology_structures', test: 'oncology_tests' },
  pelvicFloor: { struct: 'pelvic_floor_structures', test: 'pelvic_floor_tests' },
}

const ALL_STRUCTURE_TABLES = Object.values(BODY_SYSTEM_TABLES).map((t) => t.struct)

async function fetchContentForSubject(subject: string): Promise<ContentRow[]> {
  if (subject === 'anatomy') {
    // Combine all 8 systems' structures tables — this is the broadest, most
    // literal "anatomy" content PHYGO has, a handful of rows from each system
    // rather than everything from one, so no single system dominates the pool.
    //
    // SUBJECT-PURE QUIZ FIX: deliberately select ONLY the `anatomy` column,
    // never `function`/`clinical_relevance` — those are exactly the fields
    // that made the model write physiology/clinical questions under the
    // 'anatomy' label (confirmed by the live-data audit referenced in
    // lib/quiz/subjects.ts). A subject whose OWN scope legitimately covers
    // function/clinical content (cardiopulmonary, endocrine, etc.) still
    // gets it via fetchStructuresAndTests below — this restriction is
    // specific to the cross-system 'anatomy' pool.
    const results = await Promise.all(
      ALL_STRUCTURE_TABLES.map((table) => adminSupabase.from(table).select('name, anatomy').limit(8))
    )
    const rows: ContentRow[] = []
    for (const res of results) {
      for (const r of res.data ?? []) {
        const parts = [r.anatomy].filter((v): v is string => !!v && v.trim().length > 0)
        if (parts.length) rows.push({ name: r.name, parts })
      }
    }
    return rows
  }
  if (subject === 'neurology') {
    const { data } = await adminSupabase.from('neuro_tests').select('name, procedure, interpretation').limit(40)
    return (data ?? [])
      .map((r) => ({ name: r.name, parts: [r.procedure, r.interpretation].filter((v): v is string => !!v && v.trim().length > 0) }))
      .filter((r) => r.parts.length > 0)
  }
  if (subject === 'physiology') {
    const { data } = await adminSupabase.from('physiology_concepts').select('name, explanation, clinical_relevance').limit(40)
    return (data ?? [])
      .map((r) => ({ name: r.name, parts: [r.explanation, r.clinical_relevance].filter((v): v is string => !!v && v.trim().length > 0) }))
      .filter((r) => r.parts.length > 0)
  }
  if (subject === 'sportsMedicine') {
    const { data } = await adminSupabase.from('sports_medicine_concepts').select('name, explanation, clinical_relevance').limit(40)
    return (data ?? [])
      .map((r) => ({ name: r.name, parts: [r.explanation, r.clinical_relevance].filter((v): v is string => !!v && v.trim().length > 0) }))
      .filter((r) => r.parts.length > 0)
  }
  const bodySystem = BODY_SYSTEM_TABLES[subject]
  if (bodySystem) return fetchStructuresAndTests(bodySystem.struct, bodySystem.test)
  return []
}

function buildPrompt(
  subject: QuizSubject,
  difficulty: string,
  language: QuizLanguage,
  content: ContentRow[],
  count: number,
  existingQuestions: string[]
) {
  const snippets = content
    .slice(0, 35)
    .map((r) => `- ${r.name}: ${r.parts.join(' — ')}`)
    .join('\n')

  const scope = QUIZ_SUBJECT_SCOPES[subject]

  const difficultyGuidance: Record<string, string> = {
    easy: 'Domande dirette di riconoscimento/definizione, adatte a chi ha appena iniziato a studiare l\'argomento.',
    medium: 'Domande che richiedono di collegare due informazioni del materiale (es. struttura e sua funzione, o test e sua interpretazione).',
    hard: 'Domande di ragionamento clinico che richiedono di applicare il materiale a un caso o un confronto tra più elementi, senza però uscire dai contenuti forniti.',
  }
  const languageLabel = LANGUAGE_LABELS_IT[language]

  const existingBlock =
    existingQuestions.length > 0
      ? `\nQueste domande esistono già per questo stesso argomento e livello — NON ripeterle e NON generarne varianti troppo simili (stesso quesito con parole diverse):\n${existingQuestions
          .map((q) => `- ${q}`)
          .join('\n')}\n`
      : ''

  return `Sei un assistente didattico per studenti di fisioterapia. Genera esattamente ${count} domande a risposta multipla NUOVE e TRA LORO DIVERSE, scritte interamente in ${languageLabel.toUpperCase()} (testo della domanda, opzioni e spiegazione tutti in ${languageLabel}), sull'argomento "${subject}", livello di difficoltà "${difficulty}".

AMBITO OBBLIGATORIO DELLA MATERIA "${subject}" (SCOPE — vincolo assoluto, più importante di qualunque altra istruzione in questo prompt):
IN SCOPO — genera SOLO domande di questo tipo: ${scope.inScope}
FUORI SCOPO — NON generare MAI domande di questo tipo, anche se il contenuto fornito sotto le menziona o le sfiora: ${scope.outOfScope}
Se un contenuto fornito sotto tocca un argomento fuori scopo, ignora quella parte e usa solo ciò che rientra nello scopo di "${subject}". La materia di una domanda è determinata da COSA la domanda chiede effettivamente, non dal fatto che l'argomento sia correlato o menzionato nei contenuti.

${difficultyGuidance[difficulty] ?? ''}

Le domande devono essere estremamente specifiche: cita nomi precisi (strutture, test, parametri, valori) presi dai contenuti forniti invece di formulazioni generiche o vaghe ("qual è vero riguardo a X" senza dettagli). Ogni domanda deve poter essere risposta correttamente solo da chi conosce davvero il dettaglio specifico citato nei contenuti, non per esclusione logica delle altre opzioni.

I contenuti seguenti (forniti in italiano, tratti dal materiale didattico di PHYGO) sono la base di partenza obbligatoria — ogni domanda deve essere coerente con questi e non contraddirli mai:

${snippets}
${existingBlock}
Oltre a questi contenuti, puoi integrare — solo per arricchire dettagli, cifre o meccanismi non contraddetti da quanto sopra — nozioni consolidate e ampiamente accettate di anatomia, fisiologia, biomeccanica e riabilitazione, del livello di un manuale universitario di fisioterapia (es. Kendall, Neumann, Kapandji, Stanfield, Hall) e di linee guida cliniche mainstream. NON introdurre invece: dati clinici incerti, studi specifici con numeri/percentuali/anni che non sei certo siano corretti, o affermazioni sperimentali/controverse — in caso di dubbio, resta sul contenuto fornito sopra invece di rischiare un'informazione inventata o imprecisa.

Rispondi SOLO con un array JSON valido (nessun testo fuori dall'array), con questa forma esatta per ciascun elemento:
{"question": "...", "options": ["...", "...", "...", "..."], "correct_index": 0, "explanation": "..."}

Regole:
- Esattamente 4 opzioni per domanda, plausibili, specifiche e mutuamente esclusive (evita distrattori palesemente assurdi).
- "correct_index" è l'indice (0-3) dell'opzione corretta in "options".
- "explanation" è OBBLIGATORIA per ogni domanda: 1-3 frasi che spiegano perché la risposta è corretta e, quando utile, perché le altre non lo sono. Non lasciarla mai vuota.
- Ogni domanda deve essere diversa dalle altre generate in questa stessa risposta e da quelle elencate sopra come già esistenti — varia argomento specifico, struttura della domanda e taglio (definizione, funzione, confronto, applicazione clinica).
- Tutto il testo generato (domanda, opzioni, spiegazione) deve essere in ${languageLabel}, anche se i contenuti di partenza sono in italiano.`
}

// SUBJECT-PURE QUIZ FIX — VALIDATION PASS (GENERATE → SUBJECT SCOPE CHECK →
// APPROVE/REJECT): buildPrompt() above already constrains generation with
// the same QUIZ_SUBJECT_SCOPES text, but a single prompt constraint is not
// enforcement — the live-data audit that motivated this fix found the model
// drifting off-subject even with a reasonable prompt. This is the actual
// gate: a second, independent, temperature-0 classification call that reads
// back each freshly generated question and asks "does this really belong to
// the declared subject, under this exact scope definition" — sharing the
// SAME QUIZ_SUBJECT_SCOPES text (imported, not restated) so generation and
// validation can never silently describe the subject two different ways.
// A question is inserted into quiz_questions only if it passes.
//
// FAILS CLOSED: if the validation call itself errors (JSON parse failure,
// OpenAI error, length mismatch), every candidate in that batch is treated
// as a REJECT rather than silently waved through — for the exact bug this
// fixes, serving fewer cached questions this one time is a better failure
// mode than re-admitting contamination. The pool just tries again the next
// time a student starts a quiz in that subject and the pool is still below
// TARGET_POOL_SIZE.
async function validateSubjectPurity(
  subject: QuizSubject,
  candidates: Array<{ question: string; options: string[] }>
): Promise<boolean[]> {
  if (candidates.length === 0) return []
  const scope = QUIZ_SUBJECT_SCOPES[subject]
  const list = candidates.map((q, i) => `${i}. ${q.question}`).join('\n')
  const prompt = `Sei un validatore di qualità per un sistema di quiz universitario di fisioterapia. Per ciascuna domanda numerata sotto, stabilisci se appartiene VERAMENTE ed ESCLUSIVAMENTE alla materia "${subject}", definita così:

IN SCOPO: ${scope.inScope}
FUORI SCOPO (rifiuta anche se l'argomento è solo correlato o menzionato di sfuggita): ${scope.outOfScope}

Domande da valutare:
${list}

Rispondi SOLO con un array JSON di esattamente ${candidates.length} valori booleani, nello stesso ordine delle domande (true = appartiene davvero alla materia "${subject}", false = appartiene a un'altra materia). Nessun altro testo, nessun markdown. Esempio di formato: [true,false,true]`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Rispondi esclusivamente con un array JSON di booleani, senza testo aggiuntivo, senza markdown.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
    })
    const raw = completion.choices[0]?.message?.content ?? '[]'
    const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '')
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed) && parsed.length === candidates.length) {
      return parsed.map((v) => v === true)
    }
    console.error('quiz generate: subject-purity validation returned unexpected shape', parsed)
  } catch (err) {
    console.error('quiz generate: subject-purity validation failed', err)
  }
  return candidates.map(() => false)
}

export async function POST(req: NextRequest) {
  const { unauthorized } = await requireQuizUser()
  if (unauthorized) return unauthorized

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const { subject, difficulty, language } = body ?? {}
  if (typeof subject !== 'string' || !isQuizSubject(subject)) {
    return NextResponse.json({ error: 'invalid_subject' }, { status: 400 })
  }
  if (typeof difficulty !== 'string' || !isQuizDifficulty(difficulty)) {
    return NextResponse.json({ error: 'invalid_difficulty' }, { status: 400 })
  }
  // Default to 'it' for any caller that doesn't send a language yet, rather
  // than rejecting the request outright.
  const lang: QuizLanguage = typeof language === 'string' && isQuizLanguage(language) ? language : 'it'

  const { count: poolSize } = await adminSupabase
    .from('quiz_questions')
    .select('id', { count: 'exact', head: true })
    .eq('subject', subject)
    .eq('difficulty', difficulty)
    .eq('language', lang)

  if ((poolSize ?? 0) < TARGET_POOL_SIZE) {
    try {
      const [content, existingRows] = await Promise.all([
        fetchContentForSubject(subject),
        adminSupabase
          .from('quiz_questions')
          .select('question')
          .eq('subject', subject)
          .eq('difficulty', difficulty)
          .eq('language', lang)
          .limit(EXISTING_QUESTIONS_SAMPLE),
      ])
      const existingQuestions = (existingRows.data ?? []).map((r) => r.question).filter(Boolean)

      if (content.length > 0) {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Rispondi esclusivamente con un array JSON valido, senza testo aggiuntivo, senza markdown.' },
            { role: 'user', content: buildPrompt(subject, difficulty, lang, content, GENERATE_BATCH, existingQuestions) },
          ],
          temperature: 0.7,
        })
        const raw = completion.choices[0]?.message?.content ?? '[]'
        const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '')
        const parsed = JSON.parse(cleaned)
        if (Array.isArray(parsed)) {
          const rows = parsed
            .filter(
              (q: any) =>
                typeof q?.question === 'string' &&
                Array.isArray(q?.options) &&
                q.options.length === 4 &&
                q.options.every((o: any) => typeof o === 'string') &&
                Number.isInteger(q?.correct_index) &&
                q.correct_index >= 0 &&
                q.correct_index <= 3 &&
                typeof q?.explanation === 'string' &&
                q.explanation.trim().length > 0
            )
            .map((q: any) => ({
              subject,
              difficulty,
              language: lang,
              question: q.question,
              options: q.options,
              correct_index: q.correct_index,
              explanation: q.explanation,
              source_table: subject,
            }))

          // SUBJECT SCOPE CHECK — see validateSubjectPurity() above. Runs
          // even when `rows.length` is 0 → 0 (no-op), so this is always the
          // gate a question passes through before ever reaching the table.
          const purityMatches = await validateSubjectPurity(subject, rows)
          const pureRows = rows.filter((_, i) => purityMatches[i])
          if (pureRows.length < rows.length) {
            console.warn(
              `quiz generate: subject-purity check rejected ${rows.length - pureRows.length}/${rows.length} generated question(s) for subject="${subject}" difficulty="${difficulty}"`
            )
          }
          if (pureRows.length > 0) {
            await adminSupabase.from('quiz_questions').insert(pureRows)
          }
        }
      }
    } catch (err) {
      // Generation failing is not fatal — we still serve whatever is already
      // cached below; if the pool is empty too, the response will just say so.
      console.error('quiz generate: OpenAI/generation step failed', err)
    }
  }

  const { data: pool, error } = await adminSupabase
    .from('quiz_questions')
    .select('id, question, options')
    .eq('subject', subject)
    .eq('difficulty', difficulty)
    .eq('language', lang)
    .limit(200)

  if (error) {
    return NextResponse.json({ error: 'fetch_failed' }, { status: 500 })
  }
  if (!pool || pool.length === 0) {
    return NextResponse.json({ subject, difficulty, language: lang, questions: [] })
  }

  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  const questions = shuffled.slice(0, Math.min(QUESTIONS_PER_QUIZ, shuffled.length))

  return NextResponse.json({ subject, difficulty, language: lang, questions })
}
