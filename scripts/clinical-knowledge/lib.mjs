// Shared rules for clinical-knowledge imports: the condition and protocol
// templates, duplicate detection and validation. No dependencies, so the
// scripts run with plain `node` (>= 18). See docs/clinical-knowledge/README.md.

/** Statuses an import file may carry. Clinical review and approval happen in the database, never in a file. */
export const IMPORT_STATUSES = ['draft', 'source_checked', 'clinical_review_pending'];
export const EVIDENCE_LEVELS = ['high', 'moderate', 'low-moderate', 'low', 'very-low', 'expert-opinion'];
export const SOURCE_TYPES = ['guideline', 'systematic_review', 'meta_analysis', 'rct', 'cohort', 'consensus', 'textbook', 'expert_opinion', 'other'];

/**
 * Condition template (17 points), mapped to knowledge_base columns.
 * `safety: true` fields can never be marked not applicable.
 */
export const CONDITION_FIELDS = [
  { key: 'clinical_presentation', point: 3, label: 'Overview, presentation, symptoms, functional limitations' },
  { key: 'assessment_considerations', point: 4, label: 'History and assessment considerations' },
  { key: 'clinical_tests', point: 5, label: 'Clinical tests (purpose and limits)' },
  { key: 'red_flags', point: 6, label: 'Red flags, referral and urgent escalation', safety: true },
  { key: 'differential_diagnosis', point: 7, label: 'Differential diagnoses' },
  { key: 'contraindications', point: 8, label: 'Contraindications, precautions, safety', safety: true },
  { key: 'goals', point: 9, label: 'Rehabilitation goals' },
  { key: 'typical_exercises', point: 10, label: 'Typical interventions and exercises' },
  { key: 'progression_criteria', point: 13, label: 'Progression and regression considerations' },
  { key: 'outcome_measures', point: 14, label: 'Outcome measures' },
  { key: 'return_to_activity_criteria', point: 15, label: 'Return-to-activity criteria' },
];

/** Protocol fields (protocol template points 3-6, 12-13). Phases are checked separately. */
export const PROTOCOL_FIELDS = [
  { key: 'population', label: 'Intended population' },
  { key: 'inclusion_criteria', label: 'Inclusion considerations' },
  { key: 'exclusion_criteria', label: 'Exclusion considerations' },
  { key: 'baseline_assessment', label: 'Baseline assessment' },
  { key: 'precautions', label: 'Contraindications and safety precautions', safety: true },
  { key: 'outcome_measures', label: 'Outcome measures' },
  { key: 'reassessment_points', label: 'Reassessment points' },
  { key: 'return_criteria', label: 'Return-to-activity or sport criteria' },
];

// Markers that mean "not finished yet"; fine in a draft, never beyond it.
const PLACEHOLDER = /\b(TODO|TBD|DA VERIFICARE|DA COMPLETARE|PLACEHOLDER|LOREM)\b|\?\?\?|\[(?:citation|fonte|source)[^\]]*\]/i;

const STOP = new Set([
  'di', 'del', 'della', 'dello', 'dei', 'degli', 'delle', 'e', 'o', 'la', 'il', 'lo', 'le', 'gli', 'da', 'in', 'con', 'per', 'a', 'al', 'alla',
  'sindrome', 'malattia', 'the', 'of', 'and', 'syndrome', 'disease', 'gestione', 'riabilitazione', 'esercizio', 'fisico', 'terapeutico',
]);

/** Lowercase, strip accents, parentheses and punctuation. */
export function normalizeName(s) {
  return String(s ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/\s[—–-]\s.*$/, ' ') // "X — esercizio fisico" describes the angle, not the condition; "Guillain-Barré" stays whole
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokens(s) {
  return new Set(normalizeName(s).split(' ').filter((w) => w && !STOP.has(w)));
}

export function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

/**
 * Builds the lookup used for duplicate detection from the existing library
 * (id, condition_name, condition_keywords as exported by export-index.sql).
 */
export function buildIndex(existing) {
  const names = new Map(); // normalized term -> [{id, name}]
  const entries = [];
  for (const c of existing) {
    const terms = [c.condition_name, ...String(c.condition_keywords ?? '').split(','), ...(c.synonyms ?? [])]
      .map(normalizeName)
      .filter((t) => t.length > 2);
    for (const t of terms) {
      if (!names.has(t)) names.set(t, []);
      names.get(t).push({ id: c.id, name: c.condition_name });
    }
    entries.push({ id: c.id, name: c.condition_name, tokens: tokens(c.condition_name) });
  }
  return { names, entries };
}

/** Exact name/synonym hits are duplicates; similar names are flagged for a human decision. */
export function findDuplicates(item, index, { threshold = 0.5 } = {}) {
  const exact = new Map();
  for (const term of [item.condition_name, ...(item.synonyms ?? [])].map(normalizeName)) {
    for (const hit of index.names.get(term) ?? []) exact.set(hit.id, hit);
  }
  const near = [];
  const own = tokens(item.condition_name);
  for (const e of index.entries) {
    if (exact.has(e.id)) continue;
    const score = jaccard(own, e.tokens);
    // Same words in a different order ("periferica diabetica" / "diabetica periferica") is the same name.
    if (score === 1) exact.set(e.id, { id: e.id, name: e.name });
    else if (score >= threshold) near.push({ id: e.id, name: e.name, score: Math.round(score * 100) / 100 });
  }
  return { exact: [...exact.values()], near: near.sort((a, b) => b.score - a.score) };
}

const present = (v) => typeof v === 'string' && v.trim().length > 0;

function checkSources(item, out, path) {
  const sources = Array.isArray(item.sources) ? item.sources : [];
  sources.forEach((s, i) => {
    const at = `${path}.sources[${i}]`;
    if (!present(s.citation)) out.error(at, 'citation is required');
    if (!SOURCE_TYPES.includes(s.source_type)) out.error(at, `source_type must be one of ${SOURCE_TYPES.join(', ')}`);
    if (!present(s.pmid) && !present(s.doi) && !present(s.url)) out.error(at, 'a pmid, doi or url is required so the source can be checked');
    if (present(s.pmid) && !/^\d{1,9}$/.test(s.pmid)) out.error(at, `pmid "${s.pmid}" is not a PubMed id`);
    if (present(s.doi) && !/^10\.\d{4,9}\/\S+$/.test(s.doi)) out.error(at, `doi "${s.doi}" is not a DOI`);
    if (!Array.isArray(s.supports) || s.supports.length === 0) out.error(at, 'supports must list the template fields this source backs');
  });
  return sources;
}

/** Fields must be present, explicitly not applicable (with a reason), or - only in drafts - missing. */
function checkFields(item, fields, out, path, strict) {
  const fieldStatus = item.field_status ?? {};
  for (const f of fields) {
    const v = item[f.key];
    const na = fieldStatus[f.key];
    if (present(v)) {
      if (strict && PLACEHOLDER.test(v)) out.error(`${path}.${f.key}`, 'contains a placeholder marker; finish it or keep the record as a draft');
      if (na) out.error(`${path}.${f.key}`, 'has content but is also marked not applicable');
      continue;
    }
    if (na) {
      if (f.safety) out.error(`${path}.${f.key}`, 'safety fields cannot be marked not applicable');
      else if (!present(na.reason)) out.error(`${path}.field_status.${f.key}`, 'not_applicable needs a reason');
      continue;
    }
    if (strict) out.error(`${path}.${f.key}`, `missing (${f.label}); fill it, mark it not applicable with a reason, or keep the record as a draft`);
    else out.warn(`${path}.${f.key}`, 'missing (allowed in a draft)');
  }
}

/** Every filled field must be backed by at least one source once a record leaves draft. */
function checkTraceability(item, fields, sources, out, path) {
  const supported = new Set(sources.flatMap((s) => s.supports ?? []));
  for (const f of fields) {
    if (present(item[f.key]) && !supported.has(f.key)) out.error(`${path}.${f.key}`, 'no source lists this field in "supports"');
  }
  for (const key of supported) {
    if (!fields.some((f) => f.key === key) && !['phases', 'evidence_level', 'specialty'].includes(key)) {
      out.warn(`${path}.sources`, `"${key}" in supports is not a template field`);
    }
  }
}

function reporter() {
  const errors = [];
  const warnings = [];
  return {
    errors,
    warnings,
    error: (at, msg) => errors.push({ at, msg }),
    warn: (at, msg) => warnings.push({ at, msg }),
  };
}

function checkCommon(item, out, path) {
  if (!present(item.slug) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)) out.error(`${path}.slug`, 'lowercase words joined by hyphens are required');
  const status = item.review_status ?? 'draft';
  if (!IMPORT_STATUSES.includes(status)) {
    out.error(`${path}.review_status`, `"${status}" cannot be set by an import; clinical review and approval are recorded in the database by the reviewer`);
  }
  if (item.evidence_level !== undefined && !EVIDENCE_LEVELS.includes(item.evidence_level)) {
    out.error(`${path}.evidence_level`, `must be one of ${EVIDENCE_LEVELS.join(', ')}`);
  }
  return status !== 'draft';
}

export function validateCondition(item, index, path = 'condition') {
  const out = reporter();
  const strict = checkCommon(item, out, path);
  if (!present(item.condition_name)) out.error(`${path}.condition_name`, 'required');
  if (!present(item.specialty)) out.error(`${path}.specialty`, 'required (clinical classification)');
  if (strict && !present(item.body_region) && !item.field_status?.body_region) out.error(`${path}.body_region`, 'required, or mark it not applicable with a reason');
  if (strict && !present(item.evidence_level)) out.error(`${path}.evidence_level`, 'required once the record leaves draft');
  if (item.synonyms !== undefined && !Array.isArray(item.synonyms)) out.error(`${path}.synonyms`, 'must be a list');

  checkFields(item, CONDITION_FIELDS, out, path, strict);
  const sources = checkSources(item, out, path);
  if (strict) {
    if (sources.length === 0) out.error(`${path}.sources`, 'at least one checkable source is required once the record leaves draft');
    checkTraceability(item, CONDITION_FIELDS, sources, out, path);
  }

  if (index && present(item.condition_name)) {
    const { exact, near } = findDuplicates(item, index);
    for (const d of exact) out.error(`${path}.condition_name`, `duplicate of existing condition #${d.id} "${d.name}" (same name or synonym)`);
    for (const d of near) out.warn(`${path}.condition_name`, `similar to #${d.id} "${d.name}" (score ${d.score}); confirm it is a distinct condition`);
  }
  return out;
}

export function validateProtocol(item, conditionIds, path = 'protocol') {
  const out = reporter();
  const strict = checkCommon(item, out, path);
  if (!present(item.title)) out.error(`${path}.title`, 'required');
  const linked = Array.isArray(item.condition_ids) ? item.condition_ids : [];
  if (linked.length === 0) out.error(`${path}.condition_ids`, 'a protocol must link at least one condition');
  if (conditionIds) for (const id of linked) if (!conditionIds.has(id)) out.error(`${path}.condition_ids`, `condition #${id} does not exist`);

  checkFields(item, PROTOCOL_FIELDS, out, path, strict);
  const phases = Array.isArray(item.phases) ? item.phases : [];
  if (phases.length === 0) out.error(`${path}.phases`, 'at least one phase is required');
  phases.forEach((ph, i) => {
    const at = `${path}.phases[${i}]`;
    if (ph.phase_number !== i + 1) out.error(at, `phase_number must be ${i + 1} (phases are numbered 1..n in order)`);
    if (!present(ph.phase_name)) out.error(`${at}.phase_name`, 'required');
    if (!present(ph.phase_goals)) (strict ? out.error : out.warn)(`${at}.phase_goals`, 'each phase needs a clear clinical purpose');
    const last = i === phases.length - 1;
    if (!last && !present(ph.criteria_to_progress)) (strict ? out.error : out.warn)(`${at}.criteria_to_progress`, 'needed to move to the next phase');
    if (strict && i > 0 && !present(ph.phase_criteria_to_start)) out.error(`${at}.phase_criteria_to_start`, 'required after the first phase');
    for (const [j, ex] of (ph.exercises ?? []).entries()) {
      if (!/^[0-9a-f-]{36}$/i.test(ex.exercise_id ?? '')) out.error(`${at}.exercises[${j}]`, 'exercise_id must be an id from the PHYGO exercise library');
    }
  });
  // The same dosage pasted into every phase is a sign it was not adapted to the phase.
  const dosages = phases.flatMap((ph) => (ph.exercises ?? []).map((e) => e.dosage).filter(present));
  if (phases.length > 1 && dosages.length > 1 && new Set(dosages).size === 1) {
    out.warn(`${path}.phases`, 'every exercise in every phase has the same dosage; check it reflects each phase');
  }

  const sources = checkSources(item, out, path);
  if (strict) {
    if (sources.length === 0) out.error(`${path}.sources`, 'at least one checkable source is required once the protocol leaves draft');
    checkTraceability(item, PROTOCOL_FIELDS, sources, out, path);
    if (!sources.some((s) => (s.supports ?? []).includes('phases'))) out.error(`${path}.sources`, 'no source supports the phases');
  }
  return out;
}

/** Title similarity between a citation and the title a registry returns. */
export function titleMatches(citation, title) {
  const a = tokens(citation);
  const b = tokens(title);
  if (!b.size) return false;
  let inter = 0;
  for (const t of b) if (a.has(t)) inter++;
  return inter / b.size >= 0.6;
}

/** Checks PMIDs (PubMed E-utilities) and DOIs (Crossref) actually exist and match the citation. */
export async function verifySourceOnline(source, fetchImpl = fetch) {
  if (source.pmid) {
    const res = await fetchImpl(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${source.pmid}`);
    if (!res.ok) return { ok: false, reason: `PubMed answered ${res.status}` };
    const doc = (await res.json())?.result?.[source.pmid];
    if (!doc || doc.error) return { ok: false, reason: `PMID ${source.pmid} not found` };
    return titleMatches(source.citation, doc.title)
      ? { ok: true, method: 'pubmed-esummary', title: doc.title }
      : { ok: false, reason: `PMID ${source.pmid} is "${doc.title}", which does not match the citation` };
  }
  if (source.doi) {
    const res = await fetchImpl(`https://api.crossref.org/works/${encodeURIComponent(source.doi)}`);
    if (res.status === 404) return { ok: false, reason: `DOI ${source.doi} not found` };
    if (!res.ok) return { ok: false, reason: `Crossref answered ${res.status}` };
    const title = (await res.json())?.message?.title?.[0] ?? '';
    return titleMatches(source.citation, title)
      ? { ok: true, method: 'crossref', title }
      : { ok: false, reason: `DOI ${source.doi} is "${title}", which does not match the citation` };
  }
  return { ok: null, reason: 'URL-only source: check it by hand' };
}
