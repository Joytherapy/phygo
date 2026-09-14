import { NextResponse } from 'next/server';
import { translateContent, type AppLang } from '@/lib/contentTranslation';
import { NEURO_EXAM_QUESTIONS, NEURO_EXAM_SECTIONS, OPTION_SETS, type NeuroExamOption } from '@/lib/neuroExamContent';

function parseLang(value: string | null): AppLang {
  return value === 'en' || value === 'es' || value === 'fr' ? value : 'it';
}

export const dynamic = 'force-dynamic';

// Serves the standalone Neurological Exam questionnaire content
// (app/dashboard/clinical-tools/neuro-exam/page.tsx), translated and
// cached via lib/contentTranslation.ts. Option `value`s are stable,
// language-independent slugs (see lib/neuroExamContent.ts) — only the
// `label` shown to the user is translated, so in-progress answers survive
// a language switch.
export async function GET(req: Request) {
  try {
    const lang = parseLang(new URL(req.url).searchParams.get('lang'));

    if (lang === 'it') {
      return NextResponse.json({
        questions: NEURO_EXAM_QUESTIONS,
        sections: NEURO_EXAM_SECTIONS,
        optionSets: OPTION_SETS,
      });
    }

    const questions = await Promise.all(
      NEURO_EXAM_QUESTIONS.map(async (q) => {
        const { fields } = await translateContent('neuro_exam_item', q.id, { text: q.text }, ['text'] as const, lang);
        return { ...q, text: fields.text };
      })
    );

    const sections = await Promise.all(
      NEURO_EXAM_SECTIONS.map(async (sec) => {
        const { fields } = await translateContent('neuro_exam_item', `section-${sec.key}`, { text: sec.title }, ['text'] as const, lang);
        return { ...sec, title: fields.text };
      })
    );

    const translateOptions = (options: NeuroExamOption[]) =>
      Promise.all(
        options.map(async (opt) => {
          const { fields } = await translateContent('neuro_exam_option', opt.value, { l: opt.label }, ['l'] as const, lang);
          return { ...opt, label: fields.l };
        })
      );

    const optionSetEntries = await Promise.all(
      (Object.entries(OPTION_SETS) as [string, NeuroExamOption[]][]).map(async ([key, options]) => [key, await translateOptions(options)] as const)
    );
    const optionSets = Object.fromEntries(optionSetEntries) as typeof OPTION_SETS;

    return NextResponse.json({ questions, sections, optionSets });
  } catch (err) {
    console.error('neuro exam content error:', err);
    return NextResponse.json({ error: 'Failed to load neuro exam content' }, { status: 500 });
  }
}
