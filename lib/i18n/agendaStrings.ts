// PHYGO Agenda strings (app/dashboard/agenda/page.tsx + components/AppointmentScheduler.tsx)
// — kept as its own additive file for the same reason as lib/i18n/workspaceStrings.ts
// and lib/i18n/roleStrings.ts: these strings belong to one feature, so editing the
// 320KB shared uiStrings.ts directly is avoided for the same fragility reason
// documented there.
'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import type { AppLang } from '@/lib/i18n/uiStrings'

interface AgendaDict {
  common: {
    videoCall: string
    inPerson: string
    video: string
    inPersonShort: string
    cancel: string
    confirm: string
    patientFallback: string
    saveError: string
    today: string
    tomorrow: string
  }
  page: {
    backToPatients: string
    eyebrow: string
    title: string
    newAppointment: string
    pendingRequests: string
    legendHint: string
  }
  modal: {
    newAppointmentEyebrow: string
    timeLabel: string
    patientLabel: string
    searchPlaceholder: string
    searching: string
    noPatientsFound: string
    noteLabel: string
    notePlaceholder: string
  }
  scheduler: {
    nextAppointment: string
    requestedPrefix: string
    scheduleAnother: string
    requestAnother: string
    scheduleAppointment: string
    requestAppointment: string
    appointmentScheduled: string
    requestSent: string
    chooseADay: string
    morning: string
    afternoon: string
    fromAnywhere: string
    atTheClinic: string
    sendRequest: string
    history: string
  }
}

const it: AgendaDict = {
  common: {
    videoCall: 'Videochiamata',
    inPerson: 'In sede',
    video: 'Video',
    inPersonShort: 'In sede',
    cancel: 'Annulla',
    confirm: 'Conferma',
    patientFallback: 'Paziente',
    saveError: "Impossibile salvare l'appuntamento. Riprova.",
    today: 'Oggi',
    tomorrow: 'Domani',
  },
  page: {
    backToPatients: 'Torna ai pazienti',
    eyebrow: 'La tua agenda',
    title: 'Agenda',
    newAppointment: 'Nuovo appuntamento',
    pendingRequests: 'Richieste in sospeso',
    legendHint: '· Clicca su uno slot libero per aggiungere un appuntamento',
  },
  modal: {
    newAppointmentEyebrow: 'Nuovo appuntamento',
    timeLabel: 'Orario',
    patientLabel: 'Paziente',
    searchPlaceholder: 'Cerca paziente...',
    searching: 'Ricerca in corso...',
    noPatientsFound: 'Nessun paziente trovato.',
    noteLabel: 'Nota (opzionale)',
    notePlaceholder: 'Qualcosa da ricordare su questa seduta...',
  },
  scheduler: {
    nextAppointment: 'Prossimo appuntamento',
    requestedPrefix: 'Richiesto:',
    scheduleAnother: 'Fissa un altro appuntamento',
    requestAnother: 'Richiedi un altro appuntamento',
    scheduleAppointment: 'Fissa appuntamento',
    requestAppointment: 'Richiedi appuntamento',
    appointmentScheduled: 'Appuntamento fissato',
    requestSent: 'Richiesta inviata',
    chooseADay: 'Scegli un giorno',
    morning: 'Mattina',
    afternoon: 'Pomeriggio',
    fromAnywhere: 'Da qualsiasi luogo',
    atTheClinic: 'In clinica',
    sendRequest: 'Invia richiesta',
    history: 'Storico',
  },
}

const en: AgendaDict = {
  common: {
    videoCall: 'Video call',
    inPerson: 'In person',
    video: 'Video',
    inPersonShort: 'In Person',
    cancel: 'Cancel',
    confirm: 'Confirm',
    patientFallback: 'Patient',
    saveError: 'Could not save the appointment. Please try again.',
    today: 'Today',
    tomorrow: 'Tomorrow',
  },
  page: {
    backToPatients: 'Back to patients',
    eyebrow: 'Your schedule',
    title: 'Schedule',
    newAppointment: 'New appointment',
    pendingRequests: 'Pending requests',
    legendHint: '· Click an empty slot to add an appointment',
  },
  modal: {
    newAppointmentEyebrow: 'New appointment',
    timeLabel: 'Time',
    patientLabel: 'Patient',
    searchPlaceholder: 'Search patient...',
    searching: 'Searching...',
    noPatientsFound: 'No patients found.',
    noteLabel: 'Note (optional)',
    notePlaceholder: 'Anything to remember about this session...',
  },
  scheduler: {
    nextAppointment: 'Next appointment',
    requestedPrefix: 'Requested:',
    scheduleAnother: 'Schedule another appointment',
    requestAnother: 'Request another appointment',
    scheduleAppointment: 'Schedule Appointment',
    requestAppointment: 'Request Appointment',
    appointmentScheduled: 'Appointment scheduled',
    requestSent: 'Request sent',
    chooseADay: 'Choose a day',
    morning: 'Morning',
    afternoon: 'Afternoon',
    fromAnywhere: 'From anywhere',
    atTheClinic: 'At the clinic',
    sendRequest: 'Send Request',
    history: 'History',
  },
}

const es: AgendaDict = {
  common: {
    videoCall: 'Videollamada',
    inPerson: 'Presencial',
    video: 'Video',
    inPersonShort: 'Presencial',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    patientFallback: 'Paciente',
    saveError: 'No se pudo guardar la cita. Inténtalo de nuevo.',
    today: 'Hoy',
    tomorrow: 'Mañana',
  },
  page: {
    backToPatients: 'Volver a pacientes',
    eyebrow: 'Tu agenda',
    title: 'Agenda',
    newAppointment: 'Nueva cita',
    pendingRequests: 'Solicitudes pendientes',
    legendHint: '· Haz clic en un hueco libre para añadir una cita',
  },
  modal: {
    newAppointmentEyebrow: 'Nueva cita',
    timeLabel: 'Hora',
    patientLabel: 'Paciente',
    searchPlaceholder: 'Buscar paciente...',
    searching: 'Buscando...',
    noPatientsFound: 'No se encontraron pacientes.',
    noteLabel: 'Nota (opcional)',
    notePlaceholder: 'Algo que recordar sobre esta sesión...',
  },
  scheduler: {
    nextAppointment: 'Próxima cita',
    requestedPrefix: 'Solicitado:',
    scheduleAnother: 'Programar otra cita',
    requestAnother: 'Solicitar otra cita',
    scheduleAppointment: 'Programar cita',
    requestAppointment: 'Solicitar cita',
    appointmentScheduled: 'Cita programada',
    requestSent: 'Solicitud enviada',
    chooseADay: 'Elige un día',
    morning: 'Mañana',
    afternoon: 'Tarde',
    fromAnywhere: 'Desde cualquier lugar',
    atTheClinic: 'En la clínica',
    sendRequest: 'Enviar solicitud',
    history: 'Historial',
  },
}

const fr: AgendaDict = {
  common: {
    videoCall: 'Appel vidéo',
    inPerson: 'En personne',
    video: 'Vidéo',
    inPersonShort: 'En personne',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    patientFallback: 'Patient',
    saveError: "Impossible d'enregistrer le rendez-vous. Réessayez.",
    today: "Aujourd'hui",
    tomorrow: 'Demain',
  },
  page: {
    backToPatients: 'Retour aux patients',
    eyebrow: 'Votre agenda',
    title: 'Agenda',
    newAppointment: 'Nouveau rendez-vous',
    pendingRequests: 'Demandes en attente',
    legendHint: '· Cliquez sur un créneau libre pour ajouter un rendez-vous',
  },
  modal: {
    newAppointmentEyebrow: 'Nouveau rendez-vous',
    timeLabel: 'Horaire',
    patientLabel: 'Patient',
    searchPlaceholder: 'Rechercher un patient...',
    searching: 'Recherche en cours...',
    noPatientsFound: 'Aucun patient trouvé.',
    noteLabel: 'Note (facultatif)',
    notePlaceholder: 'Quelque chose à retenir de cette séance...',
  },
  scheduler: {
    nextAppointment: 'Prochain rendez-vous',
    requestedPrefix: 'Demandé :',
    scheduleAnother: 'Fixer un autre rendez-vous',
    requestAnother: 'Demander un autre rendez-vous',
    scheduleAppointment: 'Fixer un rendez-vous',
    requestAppointment: 'Demander un rendez-vous',
    appointmentScheduled: 'Rendez-vous fixé',
    requestSent: 'Demande envoyée',
    chooseADay: 'Choisissez un jour',
    morning: 'Matin',
    afternoon: 'Après-midi',
    fromAnywhere: "D'où que vous soyez",
    atTheClinic: 'À la clinique',
    sendRequest: 'Envoyer la demande',
    history: 'Historique',
  },
}

export const AGENDA_STRINGS: Record<AppLang, AgendaDict> = { it, en, es, fr }

export function useAgendaUi() {
  const { lang } = useLanguage()
  return AGENDA_STRINGS[lang]
}

/** BCP-47 locale tag for Date#toLocaleDateString/toLocaleTimeString, matching the
 * app's 4 supported languages — mirrors the inline mapping already used in
 * EventCard.tsx, centralized here so Agenda's date/time formatting actually
 * follows the account's chosen language instead of the browser's locale. */
export function localeForLang(lang: AppLang): string {
  return lang === 'it' ? 'it-IT' : lang === 'es' ? 'es-ES' : lang === 'fr' ? 'fr-FR' : 'en-US'
}
