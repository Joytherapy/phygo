// Copy for professional verification (profile card, admin review, and the
// messages shown when a clinician-only feature needs verification).
import type { AppLang } from '@/lib/i18n/uiStrings';
import { useLanguage } from '@/contexts/LanguageContext';

export type VerificationStatusKey = 'not_applicable' | 'pending' | 'needs_info' | 'verified' | 'rejected';

type Dict = {
  title: string;
  intro: string;
  status: Record<VerificationStatusKey, string>;
  statusHelp: Record<VerificationStatusKey, string>;
  countryLabel: string;
  countryHint: string;
  registryNameLabel: string;
  registryNamePlaceholder: string;
  numberLabel: string;
  numberPlaceholder: string;
  submit: string;
  resubmit: string;
  saving: string;
  saved: string;
  invalid: string;
  unavailable: string;
  reviewerMessage: string;
  privacy: string;
  studentNote: string;
  unlocks: string;
  required: string;
  rateLimited: string;
  serviceUnavailable: string;
  transition: string;
  videoFailed: string;
  videoSaveFailed: string;
  patientsLocked: string;
  patientsLockedLink: string;
};

const en: Dict = {
  title: 'Professional verification',
  intro: 'Anyone can explore PHYGO. Features that process real patient information with AI, and video consultations, are reserved for physiotherapists whose registration PHYGO has checked.',
  status: { not_applicable: 'Not requested', pending: 'Under review', needs_info: 'More information needed', verified: 'Verified', rejected: 'Not approved' },
  statusHelp: {
    not_applicable: 'Add the details of your professional registration below to request verification.',
    pending: 'A PHYGO administrator will check your registration against the official public register. You can keep using the library, anatomy, exercises and study tools meanwhile.',
    needs_info: 'The reviewer needs more information. Read the message below, update your details and send them again.',
    verified: 'Your registration has been verified. Clinical AI features and video consultations are available.',
    rejected: 'Your request was not approved. Read the message below; you can send corrected details.',
  },
  countryLabel: 'Country of registration',
  countryHint: 'Two-letter country code, for example IT, ES, FR, GB.',
  registryNameLabel: 'Professional register',
  registryNamePlaceholder: 'Name of the register or regulatory body',
  numberLabel: 'Registration number',
  numberPlaceholder: 'Your number in that register',
  submit: 'Request verification',
  resubmit: 'Send updated details',
  saving: 'Sending…',
  saved: 'Details sent for review.',
  invalid: 'Please check the highlighted fields.',
  unavailable: 'Verification is temporarily unavailable. Please try again later.',
  reviewerMessage: 'Message from the reviewer',
  privacy: 'We only ask for what the check needs: country, register and registration number. Changing them later sends your request back for review.',
  studentNote: 'Verification is for qualified physiotherapists. As a student you keep full access to the learning resources.',
  unlocks: 'Unlocks AI session notes, scan summaries, AI exercise suggestions and video consultations.',
  required: 'This feature is available to verified physiotherapists. Request verification from your profile.',
  rateLimited: 'You have reached the hourly limit for this feature. Please try again later.',
  serviceUnavailable: 'This feature is temporarily unavailable. Please try again later.',
  transition: 'Your account has temporary access to these features until {date}, while your verification is completed. Request verification before then to keep it.',
  videoFailed: 'Could not start the video call. Please try again.',
  videoSaveFailed: 'Could not save the call. Please try again.',
  patientsLocked: 'Managing real patients (adding patients, notes, appointments, invitations, video calls and clinical links) is reserved for verified physiotherapists. You can still view what you already created and explore every educational resource.',
  patientsLockedLink: 'Request verification',
};

const it: Dict = {
  title: 'Verifica professionale',
  intro: 'Chiunque può esplorare PHYGO. Le funzioni che elaborano con l’AI informazioni reali dei pazienti, e le videoconsulenze, sono riservate ai fisioterapisti di cui PHYGO ha verificato l’iscrizione.',
  status: { not_applicable: 'Non richiesta', pending: 'In verifica', needs_info: 'Servono altre informazioni', verified: 'Verificato', rejected: 'Non approvata' },
  statusHelp: {
    not_applicable: 'Inserisci qui sotto i dati della tua iscrizione professionale per richiedere la verifica.',
    pending: 'Un amministratore di PHYGO controllerà la tua iscrizione sul registro pubblico ufficiale. Nel frattempo puoi continuare a usare libreria, anatomia, esercizi e strumenti di studio.',
    needs_info: 'Chi verifica ha bisogno di altre informazioni. Leggi il messaggio qui sotto, aggiorna i dati e inviali di nuovo.',
    verified: 'La tua iscrizione è stata verificata. Funzioni AI cliniche e videoconsulenze sono disponibili.',
    rejected: 'La richiesta non è stata approvata. Leggi il messaggio qui sotto; puoi inviare dati corretti.',
  },
  countryLabel: 'Paese di iscrizione',
  countryHint: 'Codice del Paese di due lettere, per esempio IT, ES, FR, GB.',
  registryNameLabel: 'Albo o registro professionale',
  registryNamePlaceholder: 'Nome dell’albo o dell’ente',
  numberLabel: 'Numero di iscrizione',
  numberPlaceholder: 'Il tuo numero in quell’albo',
  submit: 'Richiedi la verifica',
  resubmit: 'Invia i dati aggiornati',
  saving: 'Invio…',
  saved: 'Dati inviati per la verifica.',
  invalid: 'Controlla i campi evidenziati.',
  unavailable: 'La verifica non è disponibile al momento. Riprova più tardi.',
  reviewerMessage: 'Messaggio di chi verifica',
  privacy: 'Chiediamo solo ciò che serve al controllo: Paese, albo e numero di iscrizione. Se li modifichi in seguito, la richiesta torna in verifica.',
  studentNote: 'La verifica è per i fisioterapisti abilitati. Come studente mantieni l’accesso completo alle risorse di studio.',
  unlocks: 'Sblocca note di seduta con l’AI, sintesi dei referti, suggerimenti di esercizi con l’AI e videoconsulenze.',
  required: 'Questa funzione è disponibile per i fisioterapisti verificati. Richiedi la verifica dal tuo profilo.',
  rateLimited: 'Hai raggiunto il limite orario per questa funzione. Riprova più tardi.',
  serviceUnavailable: 'Questa funzione non è disponibile al momento. Riprova più tardi.',
  transition: 'Il tuo account ha un accesso temporaneo a queste funzioni fino al {date}, in attesa della verifica. Richiedi la verifica entro quella data per mantenerlo.',
  videoFailed: 'Impossibile avviare la videochiamata. Riprova.',
  videoSaveFailed: 'Impossibile salvare la chiamata. Riprova.',
  patientsLocked: 'La gestione di pazienti reali (nuovi pazienti, note, appuntamenti, inviti, videochiamate e collegamenti clinici) è riservata ai fisioterapisti verificati. Puoi comunque vedere ciò che hai già creato ed esplorare tutte le risorse di studio.',
  patientsLockedLink: 'Richiedi la verifica',
};

const es: Dict = {
  title: 'Verificación profesional',
  intro: 'Cualquiera puede explorar PHYGO. Las funciones que procesan con IA información real de pacientes, y las videoconsultas, están reservadas a fisioterapeutas cuya colegiación PHYGO ha comprobado.',
  status: { not_applicable: 'No solicitada', pending: 'En revisión', needs_info: 'Se necesita más información', verified: 'Verificado', rejected: 'No aprobada' },
  statusHelp: {
    not_applicable: 'Añade abajo los datos de tu colegiación profesional para solicitar la verificación.',
    pending: 'Un administrador de PHYGO comprobará tu colegiación en el registro público oficial. Mientras tanto puedes seguir usando la biblioteca, la anatomía, los ejercicios y las herramientas de estudio.',
    needs_info: 'Quien revisa necesita más información. Lee el mensaje de abajo, actualiza tus datos y envíalos de nuevo.',
    verified: 'Tu colegiación ha sido verificada. Las funciones clínicas con IA y las videoconsultas están disponibles.',
    rejected: 'Tu solicitud no ha sido aprobada. Lee el mensaje de abajo; puedes enviar datos corregidos.',
  },
  countryLabel: 'País de colegiación',
  countryHint: 'Código de país de dos letras, por ejemplo IT, ES, FR, GB.',
  registryNameLabel: 'Colegio o registro profesional',
  registryNamePlaceholder: 'Nombre del colegio o del organismo',
  numberLabel: 'Número de colegiado',
  numberPlaceholder: 'Tu número en ese registro',
  submit: 'Solicitar verificación',
  resubmit: 'Enviar datos actualizados',
  saving: 'Enviando…',
  saved: 'Datos enviados para su revisión.',
  invalid: 'Revisa los campos marcados.',
  unavailable: 'La verificación no está disponible ahora. Inténtalo más tarde.',
  reviewerMessage: 'Mensaje de quien revisa',
  privacy: 'Solo pedimos lo que la comprobación necesita: país, registro y número de colegiado. Si los cambias más adelante, la solicitud vuelve a revisión.',
  studentNote: 'La verificación es para fisioterapeutas habilitados. Como estudiante mantienes el acceso completo a los recursos de estudio.',
  unlocks: 'Desbloquea notas de sesión con IA, resúmenes de informes, sugerencias de ejercicios con IA y videoconsultas.',
  required: 'Esta función está disponible para fisioterapeutas verificados. Solicita la verificación desde tu perfil.',
  rateLimited: 'Has alcanzado el límite por hora de esta función. Inténtalo más tarde.',
  serviceUnavailable: 'Esta función no está disponible ahora. Inténtalo más tarde.',
  transition: 'Tu cuenta tiene acceso temporal a estas funciones hasta el {date}, mientras se completa tu verificación. Solicita la verificación antes de esa fecha para mantenerlo.',
  videoFailed: 'No se pudo iniciar la videollamada. Inténtalo de nuevo.',
  videoSaveFailed: 'No se pudo guardar la llamada. Inténtalo de nuevo.',
  patientsLocked: 'La gestión de pacientes reales (nuevos pacientes, notas, citas, invitaciones, videollamadas y vínculos clínicos) está reservada a fisioterapeutas verificados. Puedes seguir viendo lo que ya creaste y explorar todos los recursos de estudio.',
  patientsLockedLink: 'Solicitar verificación',
};

const fr: Dict = {
  title: 'Vérification professionnelle',
  intro: 'Tout le monde peut explorer PHYGO. Les fonctions qui traitent avec l’IA des informations réelles de patients, et les téléconsultations, sont réservées aux kinésithérapeutes dont PHYGO a vérifié l’inscription.',
  status: { not_applicable: 'Non demandée', pending: 'En cours de vérification', needs_info: 'Informations complémentaires requises', verified: 'Vérifié', rejected: 'Non approuvée' },
  statusHelp: {
    not_applicable: 'Indiquez ci-dessous les données de votre inscription professionnelle pour demander la vérification.',
    pending: 'Un administrateur PHYGO vérifiera votre inscription dans le registre public officiel. En attendant, vous pouvez continuer à utiliser la bibliothèque, l’anatomie, les exercices et les outils d’étude.',
    needs_info: 'La personne qui vérifie a besoin d’informations complémentaires. Lisez le message ci-dessous, mettez à jour vos données et renvoyez-les.',
    verified: 'Votre inscription a été vérifiée. Les fonctions cliniques avec IA et les téléconsultations sont disponibles.',
    rejected: 'Votre demande n’a pas été approuvée. Lisez le message ci-dessous ; vous pouvez envoyer des données corrigées.',
  },
  countryLabel: 'Pays d’inscription',
  countryHint: 'Code pays à deux lettres, par exemple IT, ES, FR, GB.',
  registryNameLabel: 'Ordre ou registre professionnel',
  registryNamePlaceholder: 'Nom de l’ordre ou de l’organisme',
  numberLabel: 'Numéro d’inscription',
  numberPlaceholder: 'Votre numéro dans ce registre',
  submit: 'Demander la vérification',
  resubmit: 'Envoyer les données mises à jour',
  saving: 'Envoi…',
  saved: 'Données envoyées pour vérification.',
  invalid: 'Vérifiez les champs signalés.',
  unavailable: 'La vérification est momentanément indisponible. Réessayez plus tard.',
  reviewerMessage: 'Message de la personne qui vérifie',
  privacy: 'Nous ne demandons que ce dont la vérification a besoin : pays, registre et numéro d’inscription. Si vous les modifiez plus tard, la demande repasse en vérification.',
  studentNote: 'La vérification est destinée aux kinésithérapeutes diplômés. En tant qu’étudiant, vous gardez un accès complet aux ressources d’étude.',
  unlocks: 'Débloque les notes de séance avec l’IA, les synthèses de comptes rendus, les suggestions d’exercices avec l’IA et les téléconsultations.',
  required: 'Cette fonction est disponible pour les kinésithérapeutes vérifiés. Demandez la vérification depuis votre profil.',
  rateLimited: 'Vous avez atteint la limite horaire de cette fonction. Réessayez plus tard.',
  serviceUnavailable: 'Cette fonction est momentanément indisponible. Réessayez plus tard.',
  transition: 'Votre compte a un accès temporaire à ces fonctions jusqu’au {date}, le temps de finaliser votre vérification. Demandez la vérification avant cette date pour le conserver.',
  videoFailed: 'Impossible de démarrer l’appel vidéo. Réessayez.',
  videoSaveFailed: 'Impossible d’enregistrer l’appel. Réessayez.',
  patientsLocked: 'La gestion de patients réels (nouveaux patients, notes, rendez-vous, invitations, appels vidéo et liens cliniques) est réservée aux kinésithérapeutes vérifiés. Vous pouvez toujours consulter ce que vous avez déjà créé et explorer toutes les ressources d’étude.',
  patientsLockedLink: 'Demander la vérification',
};

export const VERIFICATION_STRINGS: Record<AppLang, Dict> = { en, it, es, fr };

export function useVerificationStrings(): Dict {
  const { lang } = useLanguage();
  return VERIFICATION_STRINGS[lang] ?? VERIFICATION_STRINGS.en;
}

/** User-facing text for an API refusal (verification, rate limit, unavailable), or null. */
export function refusalMessage(t: Dict, status: number, body: { code?: string } | null): string | null {
  if (status === 403 && body?.code === 'verification_required') return t.required;
  if (status === 429) return t.rateLimited;
  if (status === 503) return t.serviceUnavailable;
  return null;
}
