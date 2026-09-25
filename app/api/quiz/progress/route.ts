import { NextResponse } from 'next/server'
import { requireQuizUser } from '@/lib/quiz/authServer'

export async function GET() {
  const { user, unauthorized, supabase } = await requireQuizUser()
  if (unauthorized) return unauthorized

  const { data: attempts, error } = await supabase
    .from('quiz_attempts')
    .select('id, subject, difficulty, total_questions, correct_count, created_at')
    .eq('owner_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return NextResponse.json({ error: 'fetch_failed' }, { status: 500 })
  }

  const bySubject: Record<
    string,
    { attempts: number; totalQuestions: number; totalCorrect: number; bestPercentage: number; lastAttemptAt: string }
  > = {}

  for (const a of attempts ?? []) {
    const pct = a.total_questions > 0 ? Math.round((a.correct_count / a.total_questions) * 100) : 0
    const existing = bySubject[a.subject]
    if (!existing) {
      bySubject[a.subject] = {
        attempts: 1,
        totalQuestions: a.total_questions,
        totalCorrect: a.correct_count,
        bestPercentage: pct,
        lastAttemptAt: a.created_at,
      }
    } else {
      existing.attempts += 1
      existing.totalQuestions += a.total_questions
      existing.totalCorrect += a.correct_count
      existing.bestPercentage = Math.max(existing.bestPercentage, pct)
      // attempts are already ordered desc, so the first one seen per subject is the latest
    }
  }

  return NextResponse.json({ attempts: attempts ?? [], bySubject })
}
