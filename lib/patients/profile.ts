// Patient record: identity, contacts and clinical background
// (sql/2026-10-17_patient_profile_PROPOSED.sql). Pure helpers shared by the
// patient page: dates in the Italian format, the age from the date of birth,
// and the validation the form applies before saving (the database applies the
// same rules again with CHECK constraints and a trigger).

export type PatientIdentity = {
  name: string
  first_name: string | null
  last_name: string | null
  birth_date: string | null // YYYY-MM-DD
  age: number | null // the old field: kept for records without a date of birth
  gender: string | null
  main_condition: string | null
  phone: string | null
  contact_email: string | null
  address_street: string | null
  address_number: string | null
  postal_code: string | null
  city: string | null
  province: string | null
  country: string | null
}

export type PatientDetails = {
  emergency_contact_name: string | null
  emergency_contact_relation: string | null
  emergency_contact_phone: string | null
  medical_history: string | null
  past_surgeries: string | null
  medications: string | null
  allergies: string | null
  rehab_precautions: string | null
}

export const DETAIL_FIELDS: (keyof PatientDetails)[] = [
  'emergency_contact_name', 'emergency_contact_relation', 'emergency_contact_phone',
  'medical_history', 'past_surgeries', 'medications', 'allergies', 'rehab_precautions',
]

export type DateError = 'format' | 'invalid' | 'future' | 'too_old'

const pad = (n: number) => String(n).padStart(2, '0')
const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** "14/03/1979" -> "1979-03-14"; refuses impossible dates (31/02), future dates and dates before 1900. */
export function parseItalianDate(input: string, today = new Date()): { ok: true; iso: string } | { ok: false; error: DateError } {
  const m = input.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)
  if (!m) return { ok: false, error: 'format' }
  const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const d = new Date(year, month - 1, day)
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return { ok: false, error: 'invalid' }
  const iso = `${year}-${pad(month)}-${pad(day)}`
  if (iso > isoOf(today)) return { ok: false, error: 'future' }
  if (year < 1900) return { ok: false, error: 'too_old' }
  return { ok: true, iso }
}

/** "1979-03-14" -> "14/03/1979"; anything else -> "". */
export function formatItalianDate(iso: string | null | undefined): string {
  const m = (iso ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ''
}

/** Completed years on `today` (the day of the birthday counts as completed). */
export function ageFromBirthDate(iso: string, today = new Date()): number | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  let age = today.getFullYear() - y
  if (today.getMonth() + 1 < mo || (today.getMonth() + 1 === mo && today.getDate() < d)) age -= 1
  return age >= 0 ? age : null
}

/** The age to show: from the date of birth when there is one, otherwise the old age field. */
export function displayAge(p: Pick<PatientIdentity, 'birth_date' | 'age'>, today = new Date()):
  { years: number; source: 'birth_date' | 'recorded' } | null {
  if (p.birth_date) {
    const years = ageFromBirthDate(p.birth_date, today)
    if (years !== null) return { years, source: 'birth_date' }
  }
  return typeof p.age === 'number' && p.age >= 0 ? { years: p.age, source: 'recorded' } : null
}

export const isValidEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) && v.length <= 254
/** International or national numbers: digits with spaces, dots, dashes, brackets, an optional leading +; 6–15 digits. */
export const isValidPhone = (v: string) => /^\+?[0-9 ().-]{6,25}$/.test(v) && (v.match(/\d/g)?.length ?? 0) >= 6 && (v.match(/\d/g)?.length ?? 0) <= 15

/** The display name used everywhere else in the app. */
export const composeName = (first: string, last: string) => `${first.trim()} ${last.trim()}`.trim().replace(/\s+/g, ' ')

export type ProfileForm = {
  first_name: string
  last_name: string
  birth_date: string // GG/MM/AAAA or empty
  gender: string
  main_condition: string
  phone: string
  contact_email: string
  address_street: string
  address_number: string
  postal_code: string
  city: string
  province: string
  country: string
} & { [K in keyof PatientDetails]: string }

export type FieldError = 'required' | DateError | 'email' | 'phone' | 'postal_code' | 'province' | 'too_long'

const LIMITS: Partial<Record<keyof ProfileForm, number>> = {
  first_name: 100, last_name: 100, contact_email: 254, address_street: 200, address_number: 20,
  postal_code: 12, city: 100, province: 60, country: 60, emergency_contact_name: 200, emergency_contact_relation: 100,
  medical_history: 5000, past_surgeries: 5000, medications: 5000, allergies: 5000, rehab_precautions: 5000,
}

/**
 * The form, filled from the record. Records created before this change have
 * only `name`: it is offered split at its last space (first name, surname), for
 * the clinician to check; a single word goes in the first-name field.
 */
export function formFromRecord(p: PatientIdentity, details: Partial<PatientDetails> | null): ProfileForm {
  const s = (v: string | null | undefined) => v ?? ''
  const hasParts = !!(p.first_name || p.last_name)
  const legacy = p.name.trim().replace(/\s+/g, ' ')
  const cut = legacy.lastIndexOf(' ')
  return {
    first_name: hasParts ? s(p.first_name) : cut > 0 ? legacy.slice(0, cut) : legacy,
    last_name: hasParts ? s(p.last_name) : cut > 0 ? legacy.slice(cut + 1) : '',
    birth_date: formatItalianDate(p.birth_date),
    gender: s(p.gender),
    main_condition: s(p.main_condition),
    phone: s(p.phone), contact_email: s(p.contact_email),
    address_street: s(p.address_street), address_number: s(p.address_number), postal_code: s(p.postal_code),
    city: s(p.city), province: s(p.province), country: s(p.country),
    ...Object.fromEntries(DETAIL_FIELDS.map((k) => [k, s(details?.[k])])) as { [K in keyof PatientDetails]: string },
  }
}

/**
 * Checks the form and returns what to write. Empty optional fields become null
 * (the clinician cleared them or does not have them). The old age is replaced
 * only when a date of birth is given, so records without one keep it.
 */
export function validateProfile(form: ProfileForm, today = new Date()):
  | { ok: true; patient: Record<string, string | number | null>; details: PatientDetails }
  | { ok: false; errors: Partial<Record<keyof ProfileForm, FieldError>> } {
  const errors: Partial<Record<keyof ProfileForm, FieldError>> = {}
  const t = (k: keyof ProfileForm) => form[k].trim()
  const opt = (k: keyof ProfileForm) => t(k) || null
  for (const k of Object.keys(LIMITS) as (keyof ProfileForm)[]) if (t(k).length > (LIMITS[k] ?? Infinity)) errors[k] = 'too_long'
  if (!t('first_name')) errors.first_name = 'required'
  if (!t('last_name')) errors.last_name = 'required'
  let birth: string | null = null
  if (t('birth_date')) {
    const parsed = parseItalianDate(t('birth_date'), today)
    if (parsed.ok) birth = parsed.iso
    else errors.birth_date = parsed.error
  }
  if (t('contact_email') && !isValidEmail(t('contact_email'))) errors.contact_email = 'email'
  if (t('phone') && !isValidPhone(t('phone'))) errors.phone = 'phone'
  if (t('emergency_contact_phone') && !isValidPhone(t('emergency_contact_phone'))) errors.emergency_contact_phone = 'phone'
  const italy = !t('country') || /^(it|ita|italia|italy)$/i.test(t('country'))
  if (t('postal_code') && !(italy ? /^\d{5}$/ : /^[A-Za-z0-9 -]{3,12}$/).test(t('postal_code'))) errors.postal_code = 'postal_code'
  if (t('province') && italy && !/^[A-Za-z]{2}$/.test(t('province'))) errors.province = 'province'
  if (Object.keys(errors).length) return { ok: false, errors }

  const patient: Record<string, string | number | null> = {
    first_name: t('first_name'),
    last_name: t('last_name'),
    name: composeName(t('first_name'), t('last_name')),
    birth_date: birth,
    gender: opt('gender'),
    main_condition: opt('main_condition'),
    phone: opt('phone'),
    contact_email: opt('contact_email'),
    address_street: opt('address_street'),
    address_number: opt('address_number'),
    postal_code: opt('postal_code'),
    city: opt('city'),
    province: italy && t('province') ? t('province').toUpperCase() : opt('province'),
    country: opt('country'),
  }
  if (birth) patient.age = ageFromBirthDate(birth, today)
  const details = Object.fromEntries(DETAIL_FIELDS.map((k) => [k, opt(k)])) as PatientDetails
  return { ok: true, patient, details }
}
