import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { requireQuizUser } from '@/lib/quiz/authServer'
import { isQuizSubject, isQuizDifficulty, isQuizLanguage, type QuizLanguage } from '@/lib/quiz/subjects'

// One-off maintenance tool, added per user request ("ricontrolla tutte le
// domande") after a live spot-check of generated content turned up one
// factual error (a muscle insertion pointing to the wrong bone) among the
// anatomy questions. Not a student-facing feature — processes ONE small
// batch of not-yet-verified cached questions per call, so it can be driven
// by many small requests (same pattern as /api/quiz/generate's lazy
// top-up) instead of one long-running request that could time out.
//
// SECURITY NOTE: gated the same way as every other quiz route (any logged-in
// user, via requireQuizUser) rather than an admin-only check, because this
// app has no admin-role concept yet. Acceptable while PHYGO has a single
// real user (the founder, testing); flag for a real admin check before
// wider launch, since a malicious authenticated user could otherwise burn
// OpenAI budget by hitting this repeatedly.
const adminSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const BATCH_LIMIT = 10 // kept small (vs. generate/route.ts's 15-question GENERATE_BATCH) — each
// item here asks for a verdict PLUS a reason, which is a heavier per-item output than plain
// generation, so a larger batch risks the model's JSON response getting truncated mid-array

type Row = { id: string; question: string; options: string[]; correct_index: number; explanation: string | null }

// Returns one verdict per row that the model actually answered — NOT
// necessarily all of them. See the "index" field below: gpt-4o-mini
// intermittently drops one item from the array even when the JSON it
// returns is otherwise well-formed (observed during the bulk sweep — the
// SAME stuck batch would fail call after call, since a failure used to
// leave the whole batch unverified and the next call just re-fetched the
// identical rows and re-triggered the same glitch). Tagging each verdict
// with the row's own index lets us match by index instead of by array
// position, so one dropped item just leaves that ONE row unverified
// (picked up in a later batch once other rows clear out) instead of
// discarding the other 9 perfectly good verdicts too.
async function checkAccuracy(subject: string, rows: Row[]): Promise<Array<{ id: string; keep: boolean; reason?: string }>> {
  const list = rows
    .map(
      (r, i) =>
        `${i}. DOMANDA: ${r.question}\n   OPZIONI: ${r.options.map((o, j) => `(${j}) ${o}`).join(' | ')}\n   SEGNATA COME CORRETTA: (${r.correct_index}) ${r.options[r.correct_index]}\n   SPIEGAZIONE FORNITA: ${r.explanation ?? '(nessuna)'}`
    )
    .join('\n\n')

  const prompt = `Sei un docente universitario esperto di "${subject}" (materia di un corso di fisioterapia) e stai correggendo un banco di domande a risposta multipla generate da un'IA, PRIMA che vengano mostrate a studenti reali. Per ciascuna domanda numerata sotto, verifica con rigore:
1) Il fatto affermato dall'opzione segnata come corretta è VERAMENTE corretto (non solo plausibile).
2) Le altre opzioni sono davvero sbagliate/distinguibili (nessun'altra opzione sarebbe accettabile come corretta).
3) La domanda non è ambigua, vaga o priva di senso.

Domande da valutare:
${list}

Rispondi SOLO con un array JSON di ESATTAMENTE ${rows.length} oggetti — uno per OGNI domanda numerata sopra, da 0 a ${rows.length - 1}, NESSUNA esclusa — di questa forma:
{"index": <numero della domanda, 0-${rows.length - 1}>, "keep": true|false, "reason": "..."}
Includi il campo "index" per permettere l'abbinamento anche se l'ordine cambia. "keep": false SOLO se hai un dubbio fondato che il fatto affermato sia sbagliato, o la domanda sia ambigua/inutilizzabile. In caso di semplice incertezza su un dettaglio minore ma la sostanza sia corretta, "keep": true. "reason" è una frase breve (obbligatoria solo se keep è false, altrimenti stringa vuota). Prima di rispondere, ricontrolla di aver incluso un oggetto per ciascuno dei ${rows.length} indici, nessuno saltato. Nessun testo fuori dall'array, nessun markdown.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Rispondi esclusivamente con un array JSON valido, senza testo aggiuntivo, senza markdown.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0,
  })
  const raw = completion.choices[0]?.message?.content ?? '[]'
  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '')
  let parsed: any
  try {
    parsed = JSON.parse(cleaned)
  } catch (e) {
    throw new Error(`verify-batch JSON.parse failed: ${e instanceof Error ? e.message : e} — raw (first 500 chars): ${cleaned.slice(0, 500)}`)
  }
  // The model sometimes wraps the array in an object (e.g. {"results": [...]})
  // despite the instruction not to — unwrap the first array-valued property
  // if the top level itself isn't already an array.
  if (!Array.isArray(parsed) && parsed && typeof parsed === 'object') {
    const arrProp = Object.values(parsed).find((v) => Array.isArray(v))
    if (arrProp) parsed = arrProp
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`unexpected verify-batch shape: got ${typeof parsed}, expected an array — raw (first 500 chars): ${cleaned.slice(0, 500)}`)
  }
  // Match by the model-supplied "index" field rather than array position —
  // tolerates a dropped item without discarding everything else. A row with
  // no matching verdict is simply left out (caller leaves it unverified).
  const byIndex = new Map<number, any>()
  for (const item of parsed) {
    if (item && typeof item.index === 'number') byIndex.set(item.index, item)
  }
  const out: Array<{ id: string; keep: boolean; reason?: string }> = []
  rows.forEach((r, i) => {
    const item = byIndex.get(i)
    if (item) out.push({ id: r.id, keep: item.keep !== false, reason: item.reason })
  })
  return out
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
  const lang: QuizLanguage = typeof language === 'string' && isQuizLanguage(language) ? language : 'it'

  const { data: rows, error } = await adminSupabase
    .from('quiz_questions')
    .select('id, question, options, correct_index, explanation')
    .eq('subject', subject)
    .eq('difficulty', difficulty)
    .eq('language', lang)
    .is('verified_at', null)
    .limit(BATCH_LIMIT)

  if (error) return NextResponse.json({ error: 'fetch_failed' }, { status: 500 })
  if (!rows || rows.length === 0) {
    return NextResponse.json({ subject, difficulty, language: lang, checked: 0, removed: 0, done: true })
  }

  let verdicts: Array<{ id: string; keep: boolean; reason?: string }>
  try {
    verdicts = await checkAccuracy(subject, rows as Row[])
  } catch (err) {
    console.error('quiz verify-batch: accuracy check failed', err)
    // FAILS OPEN here (unlike generation's purity check, which fails closed):
    // this is a one-off cull of ALREADY-CACHED, already-purity-checked content,
    // not a gate gating new content into the table — an API hiccup shouldn't
    // delete a whole batch of otherwise-fine questions. Leave verified_at null
    // so a later call retries this same batch.
    return NextResponse.json({ error: 'verify_failed' }, { status: 502 })
  }

  const badIds = verdicts.filter((v) => !v.keep).map((v) => v.id)
  const goodIds = verdicts.filter((v) => v.keep).map((v) => v.id)

  if (badIds.length > 0) {
    await adminSupabase.from('quiz_questions').delete().in('id', badIds)
  }
  if (goodIds.length > 0) {
    await adminSupabase.from('quiz_questions').update({ verified_at: new Date().toISOString() }).in('id', goodIds)
  }

  const removedDetail = verdicts.filter((v) => !v.keep).map((v) => ({ id: v.id, reason: v.reason }))

  return NextResponse.json({
    subject,
    difficulty,
    language: lang,
    checked: rows.length,
    removed: badIds.length,
    removedDetail,
    done: false,
  })
}
