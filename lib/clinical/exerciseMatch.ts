// Whether a database exercise found by keyword is really the exercise the
// note wrote. A shared word is not enough: "shoulder" matches every shoulder
// exercise, and the keywords the model extracts can name another exercise
// (a pendulum and a prone arm raise both came back as "shoulder external
// rotation"). The match is trusted only when the movement agrees (a known
// movement of the note's text is the movement of the candidate) or, when the
// note's text names no known movement, when every specific word of a keyword
// is in the candidate's name. Otherwise the note's exercise is kept as
// written and the match is "not verified".
import { normalize, REGION_WORDS } from './region'

// Movements, by canonical name, in it/en/es/fr ("word*" matches any ending).
const MOVES: Record<string, string[]> = {
  pendulum: ['pendol*', 'pendulum', 'pendular', 'codman', 'pendule'],
  external_rotation: ['rotazione esterna', 'rotazioni esterne', 'extrarotazion*', 'external rotation', 'rotacion externa', 'rotation externe'],
  internal_rotation: ['rotazione interna', 'rotazioni interne', 'intrarotazion*', 'internal rotation', 'rotacion interna', 'rotation interne'],
  abduction: ['abduzion*', 'abduction*', 'abduccion*'],
  adduction: ['adduzion*', 'adduction*', 'aduccion*'],
  flexion: ['flession*', 'flexion*'],
  extension: ['estension*', 'extension*'],
  raise: ['sollevament*', 'elevazion*', 'alzat*', 'raise', 'raises', 'elevation', 'lift', 'lifts', 'elevacion*', 'elevaci*'],
  press: ['spint*', 'press', 'presses', 'pressa'],
  row: ['rematore', 'row', 'rows', 'remo', 'tirage'],
  bridge: ['ponte', 'bridge', 'bridges', 'puente', 'pont'],
  squat: ['squat*', 'accosciat*', 'sentadilla*'],
  lunge: ['affond*', 'lunge*', 'zancada*', 'fente*'],
  plank: ['plank*', 'plancia', 'tavola', 'plancha', 'planche'],
  stretch: ['stretching', 'allungament*', 'stretch*', 'estiramiento*', 'etirement*'],
  retraction: ['retrazion*', 'retraction*', 'retraccion*'],
  balance: ['equilibri*', 'balance', 'propriocezion*', 'proprioception*', 'monopodalic*', 'equilibre'],
  curl: ['curl*'],
  circles: ['circonduzion*', 'circles', 'circumduction', 'circulos'],
  isometric: ['isometri*'],
  bike: ['cyclette', 'bike', 'cycling', 'bicicletta', 'cicloergometro', 'velo', 'bicicleta'],
  walk: ['camminat*', 'walking', 'walk', 'caminata', 'marche'],
  chin_tuck: ['chin tuck*', 'retrazione del mento', 'retrazione cervicale'],
  slide: ['scivolament*', 'glide*', 'gliding', 'slide*', 'deslizamiento*', 'glissement*'],
  eccentric: ['eccentric*', 'excentric*', 'excentrique*'],
  mobility: ['mobilita', 'mobility', 'movilidad', 'mobilite'],
}

// Words that say how, not what (shared with lib/exerciseLibrary/search.ts's generic words).
const NOT_SPECIFIC = new Set(['with', 'band', 'the', 'of', 'and', 'for', 'a', 'an', 'on', 'in', 'to', 'exercise', 'exercises', 'light', 'gentle', 'standing', 'seated', 'lying', 'supine', 'prone', 'side', 'resisted', 'resistance', 'assisted', 'active', 'passive', 'dumbbell', 'cable', 'machine', 'bodyweight'])

const words = (s: string) => normalize(s).trim().split(' ').filter(Boolean)
const hitsPhrase = (ws: string[], phrase: string) => {
  const pw = phrase.split(' ')
  for (let i = 0; i + pw.length <= ws.length; i++) if (pw.every((p, k) => (p.endsWith('*') ? ws[i + k].startsWith(p.slice(0, -1)) : ws[i + k] === p))) return true
  return false
}

/** The known movements a text names. */
export function movesOf(text: string | null | undefined): Set<string> {
  const ws = words(text ?? '')
  return new Set(Object.entries(MOVES).filter(([, terms]) => terms.some((t) => hitsPhrase(ws, t))).map(([k]) => k))
}

/** The words of a keyword that say which exercise it is (not a region, not a manner). */
export const specificWords = (keyword: string) => words(keyword).filter((w) => !REGION_WORDS.has(w) && !NOT_SPECIFIC.has(w))

/** A keyword that names only a region or a manner ("shoulder", "shoulder exercises"). */
export const isRegionOnlyKeyword = (keyword: string) => specificWords(keyword).length === 0

export type MatchCheck = 'verified' | 'unverified' | 'conflict'

/**
 * How far a candidate found by `keywords` is the exercise the note wrote as
 * `draft`: 'verified' (same movement, or all specific words of a keyword in
 * its name when the draft names no known movement), 'conflict' (it moves
 * differently), 'unverified' (something in common, nothing confirmed).
 */
export function checkMatch(draft: string, keywords: string[], candidateName: string): MatchCheck {
  const draftMoves = movesOf(draft)
  const candidateMoves = movesOf(candidateName)
  // "Mobility" is too broad to confirm anything on its own.
  const specific = (m: Set<string>) => new Set(Array.from(m).filter((x) => x !== 'mobility'))
  const dm = specific(draftMoves)
  const cm = specific(candidateMoves)
  if (dm.size && cm.size) return Array.from(dm).some((m) => cm.has(m)) ? 'verified' : 'conflict'
  const name = new Set(words(candidateName))
  const covered = keywords.some((k) => {
    const sw = specificWords(k)
    return sw.length > 0 && sw.every((w) => name.has(w))
  })
  if (dm.size && !cm.size) return covered ? 'unverified' : 'conflict'
  return covered ? 'verified' : 'unverified'
}
