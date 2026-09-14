import { NextResponse } from 'next/server';
import { translateContent, type AppLang } from '@/lib/contentTranslation';
import {
  SF36_ITEMS,
  SF36_SECTIONS,
  PFDI_POPDI,
  PFDI_CRADI,
  PFDI_UDI,
  ICIQ_QUESTIONS,
  ICIQ_CIRCUMSTANCES,
  OPTION_SETS,
  type QOption,
} from '@/lib/pelvicFloorQuestionnaires';

function parseLang(value: string | null): AppLang {
  return value === 'en' || value === 'es' || value === 'fr' ? value : 'it';
}

export const dynamic = 'force-dynamic';

// Serves the 3 interactive questionnaires embedded in the "Pelvic Floor"
// tab of app/dashboard/clinical-tools/page.tsx (SF-36, PFDI-20, ICIQ-UI
// Short Form), translated and cached via lib/contentTranslation.ts. All
// scoring logic (option `v` values, recode tables, thresholds) stays in the
// frontend and is untouched here — only display text is translated.
export async function GET(req: Request) {
  try {
    const lang = parseLang(new URL(req.url).searchParams.get('lang'));

    if (lang === 'it') {
      return NextResponse.json({
        sf36Items: SF36_ITEMS,
        sf36Sections: SF36_SECTIONS,
        pfdiPopdi: PFDI_POPDI,
        pfdiCradi: PFDI_CRADI,
        pfdiUdi: PFDI_UDI,
        iciqQuestions: ICIQ_QUESTIONS,
        iciqCircumstances: ICIQ_CIRCUMSTANCES,
        optionSets: OPTION_SETS,
      }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
    }

    const translateItems = <T extends { slug: string; text: string }>(items: T[]) =>
      Promise.all(
        items.map(async (item) => {
          const { fields } = await translateContent('pf_questionnaire_item', item.slug, { text: item.text }, ['text'] as const, lang);
          return { ...item, ...fields };
        })
      );

    const translateOptions = (options: QOption[]) =>
      Promise.all(
        options.map(async (opt) => {
          const { fields } = await translateContent('pf_questionnaire_option', opt.slug, { l: opt.l }, ['l'] as const, lang);
          return { ...opt, ...fields };
        })
      );

    const [sf36Items, sf36Sections, pfdiPopdi, pfdiCradi, pfdiUdi, iciqCircumstances] = await Promise.all([
      translateItems(SF36_ITEMS),
      Promise.all(
        SF36_SECTIONS.map(async (sec) => {
          const { fields } = await translateContent('pf_questionnaire_item', sec.slug, { text: sec.title }, ['text'] as const, lang);
          return { ...sec, title: fields.text };
        })
      ),
      translateItems(PFDI_POPDI),
      translateItems(PFDI_CRADI),
      translateItems(PFDI_UDI),
      translateItems(ICIQ_CIRCUMSTANCES),
    ]);

    const iciqQuestionEntries = await Promise.all(
      (Object.entries(ICIQ_QUESTIONS) as [string, { slug: string; text: string }][]).map(async ([key, q]) => {
        const { fields } = await translateContent('pf_questionnaire_item', q.slug, { text: q.text }, ['text'] as const, lang);
        return [key, { ...q, ...fields }] as const;
      })
    );
    const iciqQuestions = Object.fromEntries(iciqQuestionEntries) as typeof ICIQ_QUESTIONS;

    const optionSetEntries = await Promise.all(
      (Object.entries(OPTION_SETS) as [string, QOption[]][]).map(async ([key, options]) => [key, await translateOptions(options)] as const)
    );
    const optionSets = Object.fromEntries(optionSetEntries) as typeof OPTION_SETS;

    return NextResponse.json({
      sf36Items,
      sf36Sections,
      pfdiPopdi,
      pfdiCradi,
      pfdiUdi,
      iciqQuestions,
      iciqCircumstances,
      optionSets,
    }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (err) {
    console.error('pelvic floor questionnaires error:', err);
    return NextResponse.json({ error: 'Failed to load questionnaires' }, { status: 500 });
  }
}
