import { NextResponse } from 'next/server';
import { translateContent, type AppLang } from '@/lib/contentTranslation';
import * as C from '@/lib/functionalScalesContent';
import type { ScaleKey, ScaleOption, ScaleItem } from '@/lib/functionalScalesContent';

function parseLang(value: string | null): AppLang {
  return value === 'en' || value === 'es' || value === 'fr' ? value : 'it';
}

export const dynamic = 'force-dynamic';

// Serves all 27 Functional Scales (Katz through DRS; SF-36 is served by
// /api/clinical-tools/pelvic-floor-questionnaires since it's shared with the
// Pelvic Floor tab) translated and cached via lib/contentTranslation.ts.
// Numeric scoring values (v, max) are language-independent and returned
// unchanged; only display text (label/l/desc) is translated.

async function translateTextObject<T extends Record<string, string>>(
  scaleKey: string,
  obj: T,
  lang: AppLang
): Promise<T> {
  const entries = await Promise.all(
    (Object.entries(obj) as [string, string][]).map(async ([key, text]) => {
      const { fields } = await translateContent('functional_scale_text', `${scaleKey}-${key}`, { text }, ['text'] as const, lang);
      return [key, fields.text] as const;
    })
  );
  return Object.fromEntries(entries) as T;
}

async function translateOptions(setKey: string, options: ScaleOption[], lang: AppLang): Promise<ScaleOption[]> {
  return Promise.all(
    options.map(async (opt) => {
      const { fields } = await translateContent('functional_scale_option', `${setKey}-${opt.v}`, { l: opt.l }, ['l'] as const, lang);
      return { ...opt, l: fields.l };
    })
  );
}

async function translateItems(scaleKey: string, items: ScaleItem[], lang: AppLang): Promise<ScaleItem[]> {
  return Promise.all(
    items.map(async (item) => {
      const { fields } = await translateContent('functional_scale_item', `${scaleKey}-${item.id}`, { label: item.label }, ['label'] as const, lang);
      return { ...item, label: fields.label };
    })
  );
}

async function translateKeyedItems<T extends { key: string; label: string }>(
  scaleKey: string,
  items: T[],
  lang: AppLang
): Promise<T[]> {
  return Promise.all(
    items.map(async (item) => {
      const { fields } = await translateContent('functional_scale_item', `${scaleKey}-${item.key}`, { label: item.label }, ['label'] as const, lang);
      return { ...item, label: fields.label };
    })
  );
}

async function translateKeyedItemsWithOptions<T extends { key: string; label: string; options: ScaleOption[] }>(
  scaleKey: string,
  items: T[],
  lang: AppLang
): Promise<T[]> {
  return Promise.all(
    items.map(async (item) => {
      const { fields } = await translateContent('functional_scale_item', `${scaleKey}-${item.key}`, { label: item.label }, ['label'] as const, lang);
      const options = await translateOptions(`${scaleKey}-${item.key}`, item.options, lang);
      return { ...item, label: fields.label, options };
    })
  );
}

async function translateStringArray(scaleKey: string, items: string[], lang: AppLang): Promise<string[]> {
  return Promise.all(
    items.map(async (text, i) => {
      const { fields } = await translateContent('functional_scale_item', `${scaleKey}-${i}`, { text }, ['text'] as const, lang);
      return fields.text;
    })
  );
}

async function translateAshworthLevels(lang: AppLang) {
  return Promise.all(
    C.ASHWORTH_LEVELS.map(async (lvl) => {
      const { fields } = await translateContent('functional_scale_option', `ashworth-${lvl.v}`, { desc: lvl.desc }, ['desc'] as const, lang);
      return { ...lvl, desc: fields.desc };
    })
  );
}

async function translateEdssSteps(lang: AppLang) {
  return Promise.all(
    C.EDSS_STEPS.map(async (step) => {
      const { fields } = await translateContent('functional_scale_option', `edss-step-${step.v}`, { l: step.l }, ['l'] as const, lang);
      return { ...step, l: fields.l };
    })
  );
}

async function translateHyStages(lang: AppLang) {
  return Promise.all(
    C.HY_STAGES.map(async (stage) => {
      const { fields } = await translateContent('functional_scale_option', `hy-${stage.v}`, { l: stage.l, desc: stage.desc }, ['l', 'desc'] as const, lang);
      return { ...stage, l: fields.l, desc: fields.desc };
    })
  );
}

export async function GET(req: Request) {
  try {
    const lang = parseLang(new URL(req.url).searchParams.get('lang'));

    if (lang === 'it') {
      return NextResponse.json({
        scaleSubtitles: C.SCALE_SUBTITLES,
        scaleDescriptions: C.SCALE_DESCRIPTIONS,
        katz: { items: C.KATZ_ITEMS, options: C.KATZ_OPTIONS, text: C.KATZ_TEXT },
        barthel: { items: C.BARTHEL_ITEMS, text: C.BARTHEL_TEXT },
        tinetti: { balance: C.TINETTI_BALANCE, gait: C.TINETTI_GAIT, text: C.TINETTI_TEXT },
        conley: { items: C.CONLEY_ITEMS, text: C.CONLEY_TEXT },
        berg: { items: C.BERG_ITEMS, text: C.BERG_TEXT },
        morse: { items: C.MORSE_ITEMS, text: C.MORSE_TEXT },
        ashworth: { levels: C.ASHWORTH_LEVELS, text: C.ASHWORTH_TEXT },
        nrs: { text: C.NRS_TEXT },
        sppb: { balanceOptions: C.SPPB_BALANCE_OPTIONS, gaitOptions: C.SPPB_GAIT_OPTIONS, chairOptions: C.SPPB_CHAIR_OPTIONS, text: C.SPPB_TEXT },
        mmse: { text: C.MMSE_TEXT },
        gcs: { eyeOptions: C.GCS_EYE_OPTIONS, verbalOptions: C.GCS_VERBAL_OPTIONS, motorOptions: C.GCS_MOTOR_OPTIONS, text: C.GCS_TEXT },
        tug: { text: C.TUG_TEXT },
        sixmwt: { text: C.SIXMWT_TEXT },
        nihss: { items: C.NIHSS_ITEMS, text: C.NIHSS_TEXT },
        updrs3: { items: C.UPDRS_III_ITEMS, options: C.OPT_UPDRS5, text: C.UPDRS_TEXT },
        womac: { pain: C.WOMAC_PAIN, stiffness: C.WOMAC_STIFFNESS, function: C.WOMAC_FUNCTION, options: C.OPT_WOMAC, text: C.WOMAC_TEXT },
        dash: { items: C.DASH_ITEMS, options: C.OPT_DASH, text: C.DASH_TEXT },
        wmft: { items: C.WMFT_ITEMS, options: C.OPT_FAS, text: C.WMFT_TEXT },
        boxblock: { text: C.BOXBLOCK_TEXT },
        jebsen: { items: C.JEBSEN_ITEMS, text: C.JEBSEN_TEXT },
        tct: { items: C.TCT_ITEMS, options: C.OPT_TCT, text: C.TCT_TEXT },
        edss: { fsSystems: C.EDSS_FS_SYSTEMS, steps: C.EDSS_STEPS, options: C.OPT_FS0_5, text: C.EDSS_TEXT },
        hy: { stages: C.HY_STAGES, text: C.HY_TEXT },
        fss: { items: C.FSS_ITEMS, options: C.OPT_FSS, text: C.FSS_TEXT },
        hhs: {
          options: {
            pain: C.OPT_HHS_PAIN, limp: C.OPT_HHS_LIMP, support: C.OPT_HHS_SUPPORT, distance: C.OPT_HHS_DISTANCE,
            sitting: C.OPT_HHS_SITTING, transport: C.OPT_HHS_TRANSPORT, stairs: C.OPT_HHS_STAIRS, shoes: C.OPT_HHS_SHOES,
            deformity: C.OPT_HHS_DEFORMITY, rom: C.OPT_HHS_ROM,
          },
          text: C.HHS_TEXT,
        },
        ucla: {
          options: {
            pain: C.OPT_UCLA_PAIN, function: C.OPT_UCLA_FUNCTION, flexion: C.OPT_UCLA_FLEXION,
            strength: C.OPT_UCLA_STRENGTH, satisfaction: C.OPT_UCLA_SATISFACTION,
          },
          text: C.UCLA_TEXT,
        },
        drs: {
          options: {
            eye: C.OPT_DRS_EYE, comm: C.OPT_DRS_COMM, motor: C.OPT_DRS_MOTOR, selfcare: C.OPT_DRS_SELFCARE,
            level: C.OPT_DRS_LEVEL, employ: C.OPT_DRS_EMPLOY,
          },
          text: C.DRS_TEXT,
        },
      });
    }

    const [
      scaleSubtitlesEntries,
      scaleDescriptionsEntries,
      katzItems, katzOptions, katzText,
      barthelItems, barthelText,
      tinettiBalance, tinettiGait, tinettiText,
      conleyItems, conleyText,
      bergItems, bergText,
      morseItems, morseText,
      ashworthLevels, ashworthText,
      nrsText,
      sppbBalance, sppbGait, sppbChair, sppbText,
      mmseText,
      gcsEye, gcsVerbal, gcsMotor, gcsText,
      tugText,
      sixmwtText,
      nihssItems, nihssText,
      updrsItems, updrsOptions, updrsText,
      womacPain, womacStiffness, womacFunction, womacOptions, womacText,
      dashItems, dashOptions, dashText,
      wmftItems, wmftOptions, wmftText,
      boxblockText,
      jebsenItems, jebsenText,
      tctItems, tctOptions, tctText,
      edssFsSystems, edssSteps, edssOptions, edssText,
      hyStages, hyText,
      fssItems, fssOptions, fssText,
      hhsOptPain, hhsOptLimp, hhsOptSupport, hhsOptDistance, hhsOptSitting, hhsOptTransport, hhsOptStairs, hhsOptShoes, hhsOptDeformity, hhsOptRom, hhsText,
      uclaOptPain, uclaOptFunction, uclaOptFlexion, uclaOptStrength, uclaOptSatisfaction, uclaText,
      drsOptEye, drsOptComm, drsOptMotor, drsOptSelfcare, drsOptLevel, drsOptEmploy, drsText,
    ] = await Promise.all([
      Promise.all((Object.entries(C.SCALE_SUBTITLES) as [ScaleKey, string][]).map(async ([key, text]) => {
        const { fields } = await translateContent('functional_scale_meta', `${key}-subtitle`, { text }, ['text'] as const, lang);
        return [key, fields.text] as const;
      })),
      Promise.all((Object.entries(C.SCALE_DESCRIPTIONS) as [ScaleKey, string][]).map(async ([key, text]) => {
        const { fields } = await translateContent('functional_scale_meta', `${key}-description`, { text }, ['text'] as const, lang);
        return [key, fields.text] as const;
      })),
      translateKeyedItems('katz', C.KATZ_ITEMS, lang), translateOptions('katz', C.KATZ_OPTIONS, lang), translateTextObject('katz', C.KATZ_TEXT, lang),
      translateKeyedItemsWithOptions('barthel', C.BARTHEL_ITEMS, lang), translateTextObject('barthel', C.BARTHEL_TEXT, lang),
      translateKeyedItems('tinetti-bal', C.TINETTI_BALANCE, lang), translateKeyedItems('tinetti-gait', C.TINETTI_GAIT, lang), translateTextObject('tinetti', C.TINETTI_TEXT, lang),
      translateKeyedItems('conley', C.CONLEY_ITEMS, lang), translateTextObject('conley', C.CONLEY_TEXT, lang),
      translateStringArray('berg', C.BERG_ITEMS, lang), translateTextObject('berg', C.BERG_TEXT, lang),
      translateKeyedItemsWithOptions('morse', C.MORSE_ITEMS, lang), translateTextObject('morse', C.MORSE_TEXT, lang),
      translateAshworthLevels(lang), translateTextObject('ashworth', C.ASHWORTH_TEXT, lang),
      translateTextObject('nrs', C.NRS_TEXT, lang),
      translateOptions('sppb-balance', C.SPPB_BALANCE_OPTIONS, lang), translateOptions('sppb-gait', C.SPPB_GAIT_OPTIONS, lang), translateOptions('sppb-chair', C.SPPB_CHAIR_OPTIONS, lang), translateTextObject('sppb', C.SPPB_TEXT, lang),
      translateTextObject('mmse', C.MMSE_TEXT, lang),
      translateOptions('gcs-eye', C.GCS_EYE_OPTIONS, lang), translateOptions('gcs-verbal', C.GCS_VERBAL_OPTIONS, lang), translateOptions('gcs-motor', C.GCS_MOTOR_OPTIONS, lang), translateTextObject('gcs', C.GCS_TEXT, lang),
      translateTextObject('tug', C.TUG_TEXT, lang),
      translateTextObject('sixmwt', C.SIXMWT_TEXT, lang),
      translateItems('nihss', C.NIHSS_ITEMS, lang).then(async (items) => {
        // NIHSS items reference shared option sets; translate those separately and re-attach.
        const optSets: Record<string, ScaleOption[]> = {
          OPT_NIHSS_1A: C.OPT_NIHSS_1A, OPT_NIHSS_1B: C.OPT_NIHSS_1B, OPT_NIHSS_1C: C.OPT_NIHSS_1C,
          OPT_NIHSS_GAZE: C.OPT_NIHSS_GAZE, OPT_NIHSS_VISUAL: C.OPT_NIHSS_VISUAL, OPT_NIHSS_FACIAL: C.OPT_NIHSS_FACIAL,
          OPT_NIHSS_LIMB: C.OPT_NIHSS_LIMB, OPT_NIHSS_ATAXIA: C.OPT_NIHSS_ATAXIA, OPT_NIHSS_SENSORY: C.OPT_NIHSS_SENSORY,
          OPT_NIHSS_LANGUAGE: C.OPT_NIHSS_LANGUAGE, OPT_NIHSS_DYSARTHRIA: C.OPT_NIHSS_DYSARTHRIA, OPT_NIHSS_NEGLECT: C.OPT_NIHSS_NEGLECT,
        };
        const translatedSets: Record<string, ScaleOption[]> = {};
        await Promise.all(
          Object.entries(optSets).map(async ([setName, options]) => {
            translatedSets[setName] = await translateOptions(setName, options, lang);
          })
        );
        return items.map((item) => ({ ...item, options: translatedSets[findOptSetName(item, optSets)] }));
      }),
      translateTextObject('nihss', C.NIHSS_TEXT, lang),
      translateItems('updrs3', C.UPDRS_III_ITEMS, lang), translateOptions('updrs3', C.OPT_UPDRS5, lang), translateTextObject('updrs3', C.UPDRS_TEXT, lang),
      translateItems('womac-pain', C.WOMAC_PAIN, lang), translateItems('womac-stiff', C.WOMAC_STIFFNESS, lang), translateItems('womac-func', C.WOMAC_FUNCTION, lang), translateOptions('womac', C.OPT_WOMAC, lang), translateTextObject('womac', C.WOMAC_TEXT, lang),
      translateItems('dash', C.DASH_ITEMS, lang), translateOptions('dash', C.OPT_DASH, lang), translateTextObject('dash', C.DASH_TEXT, lang),
      translateItems('wmft', C.WMFT_ITEMS, lang), translateOptions('wmft', C.OPT_FAS, lang), translateTextObject('wmft', C.WMFT_TEXT, lang),
      translateTextObject('boxblock', C.BOXBLOCK_TEXT, lang),
      translateItems('jebsen', C.JEBSEN_ITEMS, lang), translateTextObject('jebsen', C.JEBSEN_TEXT, lang),
      translateItems('tct', C.TCT_ITEMS, lang), translateOptions('tct', C.OPT_TCT, lang), translateTextObject('tct', C.TCT_TEXT, lang),
      translateItems('edss-fs', C.EDSS_FS_SYSTEMS, lang), translateEdssSteps(lang), translateOptions('edss', C.OPT_FS0_5, lang), translateTextObject('edss', C.EDSS_TEXT, lang),
      translateHyStages(lang), translateTextObject('hy', C.HY_TEXT, lang),
      translateItems('fss', C.FSS_ITEMS, lang), translateOptions('fss', C.OPT_FSS, lang), translateTextObject('fss', C.FSS_TEXT, lang),
      translateOptions('hhs-pain', C.OPT_HHS_PAIN, lang), translateOptions('hhs-limp', C.OPT_HHS_LIMP, lang), translateOptions('hhs-support', C.OPT_HHS_SUPPORT, lang), translateOptions('hhs-distance', C.OPT_HHS_DISTANCE, lang), translateOptions('hhs-sitting', C.OPT_HHS_SITTING, lang), translateOptions('hhs-transport', C.OPT_HHS_TRANSPORT, lang), translateOptions('hhs-stairs', C.OPT_HHS_STAIRS, lang), translateOptions('hhs-shoes', C.OPT_HHS_SHOES, lang), translateOptions('hhs-deformity', C.OPT_HHS_DEFORMITY, lang), translateOptions('hhs-rom', C.OPT_HHS_ROM, lang), translateTextObject('hhs', C.HHS_TEXT, lang),
      translateOptions('ucla-pain', C.OPT_UCLA_PAIN, lang), translateOptions('ucla-function', C.OPT_UCLA_FUNCTION, lang), translateOptions('ucla-flexion', C.OPT_UCLA_FLEXION, lang), translateOptions('ucla-strength', C.OPT_UCLA_STRENGTH, lang), translateOptions('ucla-satisfaction', C.OPT_UCLA_SATISFACTION, lang), translateTextObject('ucla', C.UCLA_TEXT, lang),
      translateOptions('drs-eye', C.OPT_DRS_EYE, lang), translateOptions('drs-comm', C.OPT_DRS_COMM, lang), translateOptions('drs-motor', C.OPT_DRS_MOTOR, lang), translateOptions('drs-selfcare', C.OPT_DRS_SELFCARE, lang), translateOptions('drs-level', C.OPT_DRS_LEVEL, lang), translateOptions('drs-employ', C.OPT_DRS_EMPLOY, lang), translateTextObject('drs', C.DRS_TEXT, lang),
    ]);

    return NextResponse.json({
      scaleSubtitles: Object.fromEntries(scaleSubtitlesEntries),
      scaleDescriptions: Object.fromEntries(scaleDescriptionsEntries),
      katz: { items: katzItems, options: katzOptions, text: katzText },
      barthel: { items: barthelItems, text: barthelText },
      tinetti: { balance: tinettiBalance, gait: tinettiGait, text: tinettiText },
      conley: { items: conleyItems, text: conleyText },
      berg: { items: bergItems, text: bergText },
      morse: { items: morseItems, text: morseText },
      ashworth: { levels: ashworthLevels, text: ashworthText },
      nrs: { text: nrsText },
      sppb: { balanceOptions: sppbBalance, gaitOptions: sppbGait, chairOptions: sppbChair, text: sppbText },
      mmse: { text: mmseText },
      gcs: { eyeOptions: gcsEye, verbalOptions: gcsVerbal, motorOptions: gcsMotor, text: gcsText },
      tug: { text: tugText },
      sixmwt: { text: sixmwtText },
      nihss: { items: nihssItems, text: nihssText },
      updrs3: { items: updrsItems, options: updrsOptions, text: updrsText },
      womac: { pain: womacPain, stiffness: womacStiffness, function: womacFunction, options: womacOptions, text: womacText },
      dash: { items: dashItems, options: dashOptions, text: dashText },
      wmft: { items: wmftItems, options: wmftOptions, text: wmftText },
      boxblock: { text: boxblockText },
      jebsen: { items: jebsenItems, text: jebsenText },
      tct: { items: tctItems, options: tctOptions, text: tctText },
      edss: { fsSystems: edssFsSystems, steps: edssSteps, options: edssOptions, text: edssText },
      hy: { stages: hyStages, text: hyText },
      fss: { items: fssItems, options: fssOptions, text: fssText },
      hhs: {
        options: {
          pain: hhsOptPain, limp: hhsOptLimp, support: hhsOptSupport, distance: hhsOptDistance,
          sitting: hhsOptSitting, transport: hhsOptTransport, stairs: hhsOptStairs, shoes: hhsOptShoes,
          deformity: hhsOptDeformity, rom: hhsOptRom,
        },
        text: hhsText,
      },
      ucla: {
        options: {
          pain: uclaOptPain, function: uclaOptFunction, flexion: uclaOptFlexion,
          strength: uclaOptStrength, satisfaction: uclaOptSatisfaction,
        },
        text: uclaText,
      },
      drs: {
        options: {
          eye: drsOptEye, comm: drsOptComm, motor: drsOptMotor, selfcare: drsOptSelfcare,
          level: drsOptLevel, employ: drsOptEmploy,
        },
        text: drsText,
      },
    });
  } catch (err) {
    console.error('functional scales content error:', err);
    return NextResponse.json({ error: 'Failed to load functional scales content' }, { status: 500 });
  }
}

function findOptSetName(item: { id: string }, _optSets: Record<string, ScaleOption[]>): string {
  const map: Record<string, string> = {
    '1a': 'OPT_NIHSS_1A', '1b': 'OPT_NIHSS_1B', '1c': 'OPT_NIHSS_1C',
    '2': 'OPT_NIHSS_GAZE', '3': 'OPT_NIHSS_VISUAL', '4': 'OPT_NIHSS_FACIAL',
    '5a': 'OPT_NIHSS_LIMB', '5b': 'OPT_NIHSS_LIMB', '6a': 'OPT_NIHSS_LIMB', '6b': 'OPT_NIHSS_LIMB',
    '7': 'OPT_NIHSS_ATAXIA', '8': 'OPT_NIHSS_SENSORY', '9': 'OPT_NIHSS_LANGUAGE',
    '10': 'OPT_NIHSS_DYSARTHRIA', '11': 'OPT_NIHSS_NEGLECT',
  };
  return map[item.id];
}
