// Patient record (identity, contacts, clinical background) on the patient page:
// labels, hints and errors in the four app languages.
import type { AppLang } from '@/lib/i18n/uiStrings'
import type { FieldError, ProfileForm } from '@/lib/patients/profile'

type Dict = {
  heading: string
  subtitle: string
  edit: string
  save: string
  saving: string
  cancel: string
  saved: string
  saveError: string
  saveDetailsError: string
  detailsLocked: string
  loadError: string
  retry: string
  notProvided: string
  required: string
  optional: string
  requiredHint: string
  sections: { identity: string; contacts: string; emergency: string; clinical: string }
  clinicalHint: string
  accountNote: string
  accountLinked: string
  accountNotLinked: string
  ageFromBirth: string // {age}
  ageRecorded: string // {age}
  birthDateFormat: string
  genderOptions: { male: string; female: string; none: string }
  labels: Record<keyof ProfileForm | 'age', string>
  errors: Record<FieldError, string>
}

const it: Dict = {
  heading: 'Anagrafica',
  subtitle: 'Dati personali, contatti e informazioni cliniche del paziente.',
  edit: 'Modifica',
  save: 'Salva',
  saving: 'Salvataggio…',
  cancel: 'Annulla',
  saved: 'Dati del paziente salvati.',
  saveError: 'Non è stato possibile salvare. I dati precedenti non sono stati modificati. Riprova.',
  saveDetailsError: "Dati anagrafici e contatti salvati, ma le informazioni cliniche e il contatto d'emergenza non sono stati salvati. Riprova.",
  detailsLocked: 'Queste informazioni non sono state caricate, quindi non si possono modificare ora: così non vengono sovrascritte.',
  loadError: "Non è stato possibile caricare le informazioni cliniche e il contatto d'emergenza.",
  retry: 'Riprova',
  notProvided: 'Non indicato',
  required: 'obbligatorio',
  optional: 'facoltativo',
  requiredHint: 'I campi con * sono obbligatori. Gli altri si possono lasciare vuoti se non li conosci.',
  sections: { identity: 'Dati anagrafici', contacts: 'Contatti', emergency: "Contatto d'emergenza", clinical: 'Informazioni cliniche' },
  clinicalHint: 'Visibili solo a te: non compaiono in My PHYGO. I risultati delle sedute restano nelle note.',
  accountNote: "L'email di contatto è solo un recapito: non è l'account con cui il paziente accede a My PHYGO.",
  accountLinked: 'Accesso a My PHYGO: collegato',
  accountNotLinked: 'Accesso a My PHYGO: non collegato',
  ageFromBirth: '{age} anni',
  ageRecorded: '{age} anni (età indicata, senza data di nascita)',
  birthDateFormat: 'GG/MM/AAAA',
  genderOptions: { male: 'Maschio', female: 'Femmina', none: 'Non specificato' },
  labels: {
    first_name: 'Nome', last_name: 'Cognome', birth_date: 'Data di nascita', age: 'Età', gender: 'Sesso',
    main_condition: 'Patologia principale', phone: 'Telefono', contact_email: 'Email di contatto',
    address_street: 'Via', address_number: 'Numero civico', postal_code: 'CAP', city: 'Città', province: 'Provincia', country: 'Paese',
    emergency_contact_name: 'Nome', emergency_contact_relation: 'Relazione', emergency_contact_phone: 'Telefono',
    medical_history: 'Anamnesi rilevante', past_surgeries: 'Interventi precedenti', medications: 'Farmaci', allergies: 'Allergie',
    rehab_precautions: 'Precauzioni riabilitative',
  },
  errors: {
    required: 'Campo obbligatorio.',
    format: 'Usa il formato GG/MM/AAAA.',
    invalid: 'Questa data non esiste.',
    future: 'La data di nascita non può essere nel futuro.',
    too_old: 'Inserisci una data dal 1900 in poi.',
    email: 'Inserisci un indirizzo email valido.',
    phone: 'Inserisci un numero di telefono valido (6–15 cifre, con prefisso facoltativo).',
    postal_code: 'Il CAP italiano ha 5 cifre.',
    province: 'Usa la sigla di 2 lettere (es. MI).',
    too_long: 'Testo troppo lungo.',
  },
}

const en: Dict = {
  heading: 'Patient record',
  subtitle: "The patient's personal details, contacts and clinical information.",
  edit: 'Edit',
  save: 'Save',
  saving: 'Saving…',
  cancel: 'Cancel',
  saved: 'Patient details saved.',
  saveError: "Couldn't save. The previous details have not been changed. Please try again.",
  saveDetailsError: 'Personal details and contacts were saved, but the clinical information and emergency contact were not. Please try again.',
  detailsLocked: "This information wasn't loaded, so it can't be edited now: that way it is never overwritten.",
  loadError: "The clinical information and emergency contact couldn't be loaded.",
  retry: 'Try again',
  notProvided: 'Not provided',
  required: 'required',
  optional: 'optional',
  requiredHint: "Fields marked * are required. Leave the others empty if you don't know them.",
  sections: { identity: 'Personal details', contacts: 'Contacts', emergency: 'Emergency contact', clinical: 'Clinical information' },
  clinicalHint: 'Visible only to you: not shown in My PHYGO. Session findings stay in the notes.',
  accountNote: "The contact e-mail is only for reaching the patient: it is not the account they use to sign in to My PHYGO.",
  accountLinked: 'My PHYGO access: linked',
  accountNotLinked: 'My PHYGO access: not linked',
  ageFromBirth: '{age} years old',
  ageRecorded: '{age} years old (recorded age, no date of birth)',
  birthDateFormat: 'DD/MM/YYYY',
  genderOptions: { male: 'Male', female: 'Female', none: 'Not specified' },
  labels: {
    first_name: 'First name', last_name: 'Last name', birth_date: 'Date of birth', age: 'Age', gender: 'Sex',
    main_condition: 'Main condition', phone: 'Phone', contact_email: 'Contact e-mail',
    address_street: 'Street', address_number: 'Number', postal_code: 'Postcode', city: 'City', province: 'Province', country: 'Country',
    emergency_contact_name: 'Name', emergency_contact_relation: 'Relationship', emergency_contact_phone: 'Phone',
    medical_history: 'Relevant medical history', past_surgeries: 'Previous surgery', medications: 'Medications', allergies: 'Allergies',
    rehab_precautions: 'Rehabilitation precautions',
  },
  errors: {
    required: 'Required.',
    format: 'Use the format DD/MM/YYYY.',
    invalid: 'This date does not exist.',
    future: 'The date of birth cannot be in the future.',
    too_old: 'Enter a date from 1900 onwards.',
    email: 'Enter a valid e-mail address.',
    phone: 'Enter a valid phone number (6–15 digits, optional country code).',
    postal_code: 'An Italian postcode has 5 digits.',
    province: 'Use the 2-letter code (e.g. MI).',
    too_long: 'Too long.',
  },
}

const es: Dict = {
  heading: 'Ficha del paciente',
  subtitle: 'Datos personales, contactos e información clínica del paciente.',
  edit: 'Editar',
  save: 'Guardar',
  saving: 'Guardando…',
  cancel: 'Cancelar',
  saved: 'Datos del paciente guardados.',
  saveError: 'No se pudo guardar. Los datos anteriores no se han modificado. Inténtalo de nuevo.',
  saveDetailsError: 'Se guardaron los datos personales y los contactos, pero no la información clínica ni el contacto de emergencia. Inténtalo de nuevo.',
  detailsLocked: 'Esta información no se ha cargado, así que ahora no se puede editar: así nunca se sobrescribe.',
  loadError: 'No se pudo cargar la información clínica ni el contacto de emergencia.',
  retry: 'Reintentar',
  notProvided: 'No indicado',
  required: 'obligatorio',
  optional: 'opcional',
  requiredHint: 'Los campos con * son obligatorios. Deja vacíos los demás si no los conoces.',
  sections: { identity: 'Datos personales', contacts: 'Contactos', emergency: 'Contacto de emergencia', clinical: 'Información clínica' },
  clinicalHint: 'Solo visible para ti: no aparece en My PHYGO. Los hallazgos de las sesiones siguen en las notas.',
  accountNote: 'El email de contacto es solo para comunicarse: no es la cuenta con la que el paciente entra en My PHYGO.',
  accountLinked: 'Acceso a My PHYGO: vinculado',
  accountNotLinked: 'Acceso a My PHYGO: no vinculado',
  ageFromBirth: '{age} años',
  ageRecorded: '{age} años (edad indicada, sin fecha de nacimiento)',
  birthDateFormat: 'DD/MM/AAAA',
  genderOptions: { male: 'Hombre', female: 'Mujer', none: 'No especificado' },
  labels: {
    first_name: 'Nombre', last_name: 'Apellidos', birth_date: 'Fecha de nacimiento', age: 'Edad', gender: 'Sexo',
    main_condition: 'Patología principal', phone: 'Teléfono', contact_email: 'Email de contacto',
    address_street: 'Calle', address_number: 'Número', postal_code: 'Código postal', city: 'Ciudad', province: 'Provincia', country: 'País',
    emergency_contact_name: 'Nombre', emergency_contact_relation: 'Relación', emergency_contact_phone: 'Teléfono',
    medical_history: 'Antecedentes relevantes', past_surgeries: 'Intervenciones previas', medications: 'Medicamentos', allergies: 'Alergias',
    rehab_precautions: 'Precauciones de rehabilitación',
  },
  errors: {
    required: 'Campo obligatorio.',
    format: 'Usa el formato DD/MM/AAAA.',
    invalid: 'Esta fecha no existe.',
    future: 'La fecha de nacimiento no puede ser futura.',
    too_old: 'Introduce una fecha desde 1900.',
    email: 'Introduce un email válido.',
    phone: 'Introduce un teléfono válido (6–15 cifras, prefijo opcional).',
    postal_code: 'El código postal italiano tiene 5 cifras.',
    province: 'Usa la sigla de 2 letras (p. ej. MI).',
    too_long: 'Texto demasiado largo.',
  },
}

const fr: Dict = {
  heading: 'Fiche patient',
  subtitle: 'Données personnelles, coordonnées et informations cliniques du patient.',
  edit: 'Modifier',
  save: 'Enregistrer',
  saving: 'Enregistrement…',
  cancel: 'Annuler',
  saved: 'Données du patient enregistrées.',
  saveError: "L'enregistrement a échoué. Les données précédentes n'ont pas été modifiées. Réessayez.",
  saveDetailsError: "L'état civil et les coordonnées ont été enregistrés, mais pas les informations cliniques ni le contact d'urgence. Réessayez.",
  detailsLocked: "Ces informations n'ont pas été chargées : elles ne peuvent pas être modifiées maintenant, pour ne jamais les écraser.",
  loadError: "Les informations cliniques et le contact d'urgence n'ont pas pu être chargés.",
  retry: 'Réessayer',
  notProvided: 'Non renseigné',
  required: 'obligatoire',
  optional: 'facultatif',
  requiredHint: 'Les champs marqués * sont obligatoires. Laissez les autres vides si vous ne les connaissez pas.',
  sections: { identity: 'État civil', contacts: 'Coordonnées', emergency: "Contact d'urgence", clinical: 'Informations cliniques' },
  clinicalHint: "Visibles uniquement par vous : elles n'apparaissent pas dans My PHYGO. Les constats des séances restent dans les notes.",
  accountNote: "L'e-mail de contact sert seulement à joindre le patient : ce n'est pas le compte avec lequel il se connecte à My PHYGO.",
  accountLinked: 'Accès à My PHYGO : lié',
  accountNotLinked: 'Accès à My PHYGO : non lié',
  ageFromBirth: '{age} ans',
  ageRecorded: '{age} ans (âge indiqué, sans date de naissance)',
  birthDateFormat: 'JJ/MM/AAAA',
  genderOptions: { male: 'Homme', female: 'Femme', none: 'Non précisé' },
  labels: {
    first_name: 'Prénom', last_name: 'Nom', birth_date: 'Date de naissance', age: 'Âge', gender: 'Sexe',
    main_condition: 'Pathologie principale', phone: 'Téléphone', contact_email: 'E-mail de contact',
    address_street: 'Rue', address_number: 'Numéro', postal_code: 'Code postal', city: 'Ville', province: 'Province', country: 'Pays',
    emergency_contact_name: 'Nom', emergency_contact_relation: 'Lien', emergency_contact_phone: 'Téléphone',
    medical_history: 'Antécédents pertinents', past_surgeries: 'Interventions antérieures', medications: 'Médicaments', allergies: 'Allergies',
    rehab_precautions: 'Précautions de rééducation',
  },
  errors: {
    required: 'Champ obligatoire.',
    format: 'Utilisez le format JJ/MM/AAAA.',
    invalid: "Cette date n'existe pas.",
    future: 'La date de naissance ne peut pas être dans le futur.',
    too_old: 'Saisissez une date à partir de 1900.',
    email: 'Saisissez une adresse e-mail valide.',
    phone: 'Saisissez un numéro valide (6 à 15 chiffres, indicatif facultatif).',
    postal_code: 'Un code postal italien comporte 5 chiffres.',
    province: 'Utilisez le sigle de 2 lettres (ex. MI).',
    too_long: 'Texte trop long.',
  },
}

export const PATIENT_PROFILE_STRINGS: Record<AppLang, Dict> = { it, en, es, fr }
