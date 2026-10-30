// What the clinician said of the diagnosis of the case's main condition
// sheet, computed the same way wherever it is needed: /api/knowledge-lookup
// reports it, /api/refine-exercises decides from it, on the server, how the
// sheet's protocol may be used (lib/knowledge/conditionMatch.ts protocolUse).

import { diagnosisStatus, type DiagnosisStatus, type KbRow } from './conditionMatch'
import { textCertainty } from '../clinical/facts'
import { REGION_WORDS, regionFit, regionsOf, type Fit } from '../clinical/region'
import { caseOf } from '../clinical/coherence'

/** The body regions a sheet names, in every language. */
export const sheetRegions = (r: KbRow) =>
  regionsOf([r.condition_name, r.condition_keywords, ...Object.values(r.translations ?? {}).flatMap((t) => [t?.condition_name, t?.condition_keywords])].filter(Boolean).join(' '))

/** The diagnosis status of the main sheet for what was said (null: nothing said). */
export function mainSheetStatus(row: KbRow, transcript: string, note: { primaryCondition?: string; assessment?: string }): DiagnosisStatus | null {
  if (!transcript) return null
  const view = caseOf(transcript, { primaryCondition: note.primaryCondition ?? '', assessment: note.assessment ?? '' })
  return diagnosisStatus(row, transcript, REGION_WORDS, regionFit(sheetRegions(row), view.profile.active) === 'compatible', textCertainty)
}

/**
 * Whether the sheet's body region fits today's problem as the clinician
 * described it: 'incompatible' only when both name a region and they differ
 * (a sheet or a case naming none is 'unknown', never proven incompatible).
 */
export function mainSheetRegionFit(row: KbRow, transcript: string, note: { primaryCondition?: string; assessment?: string }): Fit {
  const view = caseOf(transcript, { primaryCondition: note.primaryCondition ?? '', assessment: note.assessment ?? '' })
  return regionFit(sheetRegions(row), view.profile.active)
}
