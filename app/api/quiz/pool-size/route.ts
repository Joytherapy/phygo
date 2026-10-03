import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireQuizUser } from '@/lib/quiz/authServer'
import { isQuizSubject, isQuizLanguage, QUIZ_DIFFICULTIES, type QuizLanguage } from '@/lib/quiz/subjects'

// Lightweight companion to /api/quiz/generate — added per user request
// ("andrebbe esplicitato quante sono le domande totali... che cambiano
// spesso") so the Quiz page can show how many questions actually exist per
// difficulty before the student commits to a level, instead of that only
// being discoverable by noticing the question set is different each replay.
//
// Same service-role reasoning as generate/route.ts: quiz_questions has RLS
// enabled with zero policies, so counting rows needs the admin client even
// though this only ever returns a number, never row content.
const adminSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(req: NextRequest) {
  const { unauthorized } = await requireQuizUser()
  if (unauthorized) return unauthorized

  const { searchParams } = new URL(req.url)
  const subject = searchParams.get('subject')
  const language = searchParams.get('language')

  if (typeof subject !== 'string' || !isQuizSubject(subject)) {
    return NextResponse.json({ error: 'invalid_subject' }, { status: 400 })
  }
  const lang: QuizLanguage = typeof language === 'string' && isQuizLanguage(language) ? language : 'it'

  const counts: Record<string, number> = {}
  await Promise.all(
    QUIZ_DIFFICULTIES.map(async (difficulty) => {
      const { count } = await adminSupabase
        .from('quiz_questions')
        .select('id', { count: 'exact', head: true })
        .eq('subject', subject)
        .eq('difficulty', difficulty)
        .eq('language', lang)
      counts[difficulty] = count ?? 0
    })
  )

  return NextResponse.json({ subject, language: lang, counts })
}
