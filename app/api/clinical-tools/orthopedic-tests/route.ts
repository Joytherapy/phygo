import { NextResponse } from 'next/server';
import { translateContent, type AppLang } from '@/lib/contentTranslation';
import {
  KNEE_TESTS,
  SHOULDER_TESTS,
  SPINE_TESTS,
  HIP_TESTS,
  ANKLE_TESTS,
  ELBOW_WRIST_TESTS,
  CERVICAL_TESTS,
  type OrthoTestContent,
} from '@/lib/orthopedicTestsContent';
import { TEST_FIELD_ORDER } from '@/lib/orthopedicTestsFields';

function parseLang(value: string | null): AppLang {
  return value === 'en' || value === 'es' || value === 'fr' ? value : 'it';
}

export const dynamic = 'force-dynamic';

// Serves the hardcoded Orthopedic Tests dataset used by the "orthopedic"
// tab of app/dashboard/clinical-tools/page.tsx, translated and cached via
// lib/contentTranslation.ts. All 7 regions are returned together from a
// single endpoint (mirroring app/api/brain-map/reference-content/route.ts)
// since none of this content is tied to a per-region backing table.
export async function GET(req: Request) {
  try {
    const lang = parseLang(new URL(req.url).searchParams.get('lang'));

    if (lang === 'it') {
      return NextResponse.json({
        knee: KNEE_TESTS,
        shoulder: SHOULDER_TESTS,
        hip: HIP_TESTS,
        spine: SPINE_TESTS,
        ankle: ANKLE_TESTS,
        'elbow-wrist': ELBOW_WRIST_TESTS,
        cervical: CERVICAL_TESTS,
      });
    }

    const translateList = (tests: OrthoTestContent[]) =>
      Promise.all(
        tests.map(async (t) => {
          const { fields } = await translateContent('orthopedic_test', t.slug, t, TEST_FIELD_ORDER, lang);
          return { ...t, ...fields };
        })
      );

    const [knee, shoulder, hip, spine, ankle, elbowWrist, cervical] = await Promise.all([
      translateList(KNEE_TESTS),
      translateList(SHOULDER_TESTS),
      translateList(HIP_TESTS),
      translateList(SPINE_TESTS),
      translateList(ANKLE_TESTS),
      translateList(ELBOW_WRIST_TESTS),
      translateList(CERVICAL_TESTS),
    ]);

    return NextResponse.json({
      knee,
      shoulder,
      hip,
      spine,
      ankle,
      'elbow-wrist': elbowWrist,
      cervical,
    });
  } catch (err) {
    console.error('orthopedic tests list error:', err);
    return NextResponse.json({ error: 'Failed to load orthopedic tests' }, { status: 500 });
  }
}
