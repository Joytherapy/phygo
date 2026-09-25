import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireQuizUser } from '@/lib/quiz/authServer'
import { isQuizSubject, isQuizDifficulty } from '@/lib/quiz/subjects'

// Same service-role client as generate/route.ts — needed here because
// quiz_questions has no RLS read policy at all, so correct_index/explanation
// can only be looked up server-side, never by the signed-in user's own client.
const adminSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

type SubmittedAnswer = { questionId: string; selectedIndex: number }

export async function POST(req: NextRequest) {
  const { user, unauthorized, supabase } = await requireQuizUser()
  if (unauthorized) return unauthorized

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const { subject, difficulty, answers } = body ?? {}
  if (typeof subject !== 'string' || !isQuizSubject(subject)) {
    return NextResponse.json({ error: 'invalid_subject' }, { status: 400 })
  }
  if (typeof difficulty !== 'string' || !isQuizDifficulty(difficulty)) {
    return NextResponse.json({ error: 'invalid_difficulty' }, { status: 400 })
  }
  if (!Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: 'invalid_answers' }, { status: 400 })
  }
  const clean: SubmittedAnswer[] = answers.filter(
    (a: any) => typeof a?.questionId === 'string' && Number.isInteger(a?.selectedIndex) && a.selectedIndex >= 0 && a.selectedIndex <= 3
  )
  if (clean.length === 0) {
    return NextResponse.json({ error: 'invalid_answers' }, { status: 400 })
  }

  const ids = clean.map((a) => a.questionId)
  const { data: questions, error } = await adminSupabase
    .from('quiz_questions')
    .select('id, question, options, correct_index, explanation')
    .in('id', ids)

  if (error || !questions) {
    return NextResponse.json({ error: 'lookup_failed' }, { status: 500 })
  }

  const byId = new Map(questions.map((q) => [q.id, q]))
  let correctCount = 0
  const results = clean
    .map((a) => {
      const q = byId.get(a.questionId)
      if (!q) return null
      const isCorrect = a.selectedIndex === q.correct_index
      if (isCorrect) correctCount += 1
      return {
        questionId: q.id,
        question: q.question,
        options: q.options,
        selectedIndex: a.selectedIndex,
        correctIndex: q.correct_index,
        isCorrect,
        explanation: q.explanation,
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  // Attempt row is written through the user's own session-cookie client so
  // the quiz_attempts_owner RLS policy applies normally — this table IS
  // user-owned, unlike quiz_questions.
  await supabase.from('quiz_attempts').insert({
    owner_id: user!.id,
    subject,
    difficulty,
    total_questions: results.length,
    correct_count: correctCount,
  })

  return NextResponse.json({
    subject,
    difficulty,
    totalQuestions: results.length,
    correctCount,
    results,
  })
}
