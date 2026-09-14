import { NextResponse } from 'next/server';
import { translateContent, type AppLang } from '@/lib/contentTranslation';
import {
  PATHWAYS,
  GAIT_TYPES,
  LOCALIZATION_PRINCIPLES,
  NERVE_INJURY_TYPES,
  CONDUCTION_FIBER_TYPES,
} from '@/lib/brainMapContent';
import {
  PATHWAY_FIELD_ORDER,
  GAIT_FIELD_ORDER,
  LOCALIZATION_FIELD_ORDER,
  NERVE_INJURY_FIELD_ORDER,
  CONDUCTION_FIELD_ORDER,
} from '@/lib/brainMapFields';

function parseLang(value: string | null): AppLang {
  return value === 'en' || value === 'es' || value === 'fr' ? value : 'it';
}

export const dynamic = 'force-dynamic';

// Serves the hardcoded reference datasets used across app/dashboard/brain-map/page.tsx
// (Neural Circuits / Gait Patterns / Localization / Seddon classification / Nerve
// conduction) translated and cached via lib/contentTranslation.ts. Nothing here is
// tied to a specific zone or nerve, so it's served from a single endpoint rather than
// duplicated across the per-slug routes.
export async function GET(req: Request) {
  try {
    const lang = parseLang(new URL(req.url).searchParams.get('lang'));

    if (lang === 'it') {
      return NextResponse.json({
        pathways: PATHWAYS,
        gaitTypes: GAIT_TYPES,
        localizationPrinciples: LOCALIZATION_PRINCIPLES,
        nerveInjuryTypes: NERVE_INJURY_TYPES,
        conductionFiberTypes: CONDUCTION_FIBER_TYPES,
      });
    }

    const [pathways, gaitTypes, localizationPrinciples, nerveInjuryTypes, conductionFiberTypes] = await Promise.all([
      Promise.all(
        PATHWAYS.map(async (p) => {
          const { fields } = await translateContent('brain_map_pathway', p.slug, p, PATHWAY_FIELD_ORDER, lang);
          return { ...p, ...fields };
        })
      ),
      Promise.all(
        GAIT_TYPES.map(async (g) => {
          const { fields } = await translateContent('brain_map_gait_type', g.slug, g, GAIT_FIELD_ORDER, lang);
          return { ...g, ...fields };
        })
      ),
      Promise.all(
        LOCALIZATION_PRINCIPLES.map(async (lp) => {
          const { fields } = await translateContent(
            'brain_map_localization_principle',
            lp.slug,
            lp,
            LOCALIZATION_FIELD_ORDER,
            lang
          );
          return { ...lp, ...fields };
        })
      ),
      Promise.all(
        NERVE_INJURY_TYPES.map(async (t) => {
          const { fields } = await translateContent('brain_map_nerve_injury_type', t.slug, t, NERVE_INJURY_FIELD_ORDER, lang);
          return { ...t, ...fields };
        })
      ),
      Promise.all(
        CONDUCTION_FIBER_TYPES.map(async (f) => {
          const { fields } = await translateContent('brain_map_conduction_fiber', f.slug, f, CONDUCTION_FIELD_ORDER, lang);
          return { ...f, ...fields };
        })
      ),
    ]);

    return NextResponse.json({ pathways, gaitTypes, localizationPrinciples, nerveInjuryTypes, conductionFiberTypes });
  } catch (err) {
    console.error('brain-map reference-content error:', err);
    return NextResponse.json({ error: 'Failed to load reference content' }, { status: 500 });
  }
}
