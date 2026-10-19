// Dashboard home ("what do I do now?"): the next patient, today's brief, the
// to-do list, the counters and the patient cards, in the four app languages.
// Kept as its own file, like dashboardStrings.ts and agendaStrings.ts.
'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import type { AppLang } from '@/lib/i18n/uiStrings'

type Plural = (n: number) => string

interface HomeDict {
  briefAppointments: Plural
  briefRequests: Plural
  briefNoAppointments: string
  nextPatient: string
  nextAppointment: string
  inProgress: string
  startsIn: (minutes: number) => string
  today: string
  tomorrow: string
  inPerson: string
  video: string
  minutes: (n: number) => string
  openRecord: string
  startSession: string
  lastSession: string
  nextSession: string
  noSessionsYet: string
  laterToday: string
  openAgenda: string
  noUpcomingTitle: string
  noUpcomingBody: string
  appointmentsError: string
  todo: string
  todoEmpty: string
  requestInPerson: (when: string) => string
  requestVideo: (when: string) => string
  followUp: (days: number) => string
  accept: string
  decline: string
  requestError: string
  statPatients: string
  statNewThisMonth: Plural
  statNotesThisMonth: string
  statWeekAppointments: string
  statOnMyPhygo: string
  statOfTotal: (n: number) => string
  patientsHeading: string
  myPhygoOn: string
  myPhygoOff: string
  daysAgo: (n: number) => string
  newPatientTitle: string
  newPatientHint: string
  videoCall: string
  startVideoCall: string
  videoCallWith: (name: string) => string
  videoNeedsPortal: string
  callNotes: string
  callNotesHint: string
  showNotes: string
  hideNotes: string
  privateRoom: string
  sessionNote: string
  patientRecord: string
}

const it: HomeDict = {
  briefAppointments: (n) => (n === 1 ? '1 appuntamento oggi' : `${n} appuntamenti oggi`),
  briefRequests: (n) => (n === 1 ? '1 richiesta da confermare' : `${n} richieste da confermare`),
  briefNoAppointments: 'Nessun appuntamento oggi',
  nextPatient: 'Prossimo paziente',
  nextAppointment: 'Prossimo appuntamento',
  inProgress: 'In corso',
  startsIn: (m) => (m < 60 ? `Tra ${m} min` : `Tra ${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`),
  today: 'Oggi',
  tomorrow: 'Domani',
  inPerson: 'In studio',
  video: 'Videochiamata',
  minutes: (n) => `${n} min`,
  openRecord: 'Apri scheda',
  startSession: 'Inizia seduta',
  lastSession: 'Ultima seduta',
  nextSession: 'Prossima',
  noSessionsYet: 'Nessuna ancora',
  laterToday: 'Poi oggi',
  openAgenda: 'Apri agenda',
  noUpcomingTitle: 'Nessun appuntamento in programma',
  noUpcomingBody: "Pianifica le prossime sedute dall'agenda: compariranno qui.",
  appointmentsError: 'Non è stato possibile caricare gli appuntamenti.',
  todo: 'Da fare',
  todoEmpty: 'Tutto in ordine: nessuna richiesta in attesa.',
  requestInPerson: (when) => `Chiede un appuntamento · ${when}`,
  requestVideo: (when) => `Chiede una videochiamata · ${when}`,
  followUp: (d) => `Ultima seduta ${d} giorni fa`,
  accept: 'Conferma',
  decline: 'Rifiuta',
  requestError: 'Non è stato possibile aggiornare la richiesta. Riprova.',
  statPatients: 'Pazienti',
  statNewThisMonth: (n) => `+${n} questo mese`,
  statNotesThisMonth: 'Note questo mese',
  statWeekAppointments: 'Appuntamenti questa settimana',
  statOnMyPhygo: 'Pazienti su My Phygo',
  statOfTotal: (n) => `di ${n}`,
  patientsHeading: 'I tuoi pazienti',
  myPhygoOn: 'Su My Phygo',
  myPhygoOff: 'Non ancora su My Phygo',
  daysAgo: (n) => (n === 0 ? 'Oggi' : n === 1 ? 'Ieri' : `${n} giorni fa`),
  newPatientTitle: 'Nuovo paziente',
  newPatientHint: "Indirizzo, contatto d'emergenza e informazioni cliniche si completano nella scheda del paziente.",
  videoCall: 'Videochiamata',
  startVideoCall: 'Avvia videochiamata',
  videoCallWith: (name) => `Videochiamata con ${name}`,
  videoNeedsPortal: 'Per la videochiamata il paziente deve prima entrare in My Phygo: invialo dal pulsante qui sotto.',
  callNotes: 'Appunti della seduta',
  callNotesHint: 'Detta o scrivi mentre parli con il paziente: la nota viene strutturata e salvata nella sua scheda.',
  showNotes: 'Mostra appunti',
  hideNotes: 'Nascondi appunti',
  privateRoom: 'Stanza privata',
  sessionNote: 'Nota di sessione',
  patientRecord: 'Scheda paziente',
}

const en: HomeDict = {
  briefAppointments: (n) => (n === 1 ? '1 appointment today' : `${n} appointments today`),
  briefRequests: (n) => (n === 1 ? '1 request to confirm' : `${n} requests to confirm`),
  briefNoAppointments: 'No appointments today',
  nextPatient: 'Next patient',
  nextAppointment: 'Next appointment',
  inProgress: 'In progress',
  startsIn: (m) => (m < 60 ? `In ${m} min` : `In ${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`),
  today: 'Today',
  tomorrow: 'Tomorrow',
  inPerson: 'In person',
  video: 'Video call',
  minutes: (n) => `${n} min`,
  openRecord: 'Open record',
  startSession: 'Start session',
  lastSession: 'Last session',
  nextSession: 'Next',
  noSessionsYet: 'None yet',
  laterToday: 'Later today',
  openAgenda: 'Open agenda',
  noUpcomingTitle: 'No appointments scheduled',
  noUpcomingBody: 'Plan your next sessions in the agenda: they will show up here.',
  appointmentsError: 'Appointments could not be loaded.',
  todo: 'To do',
  todoEmpty: 'All clear: no requests waiting.',
  requestInPerson: (when) => `Requests an appointment · ${when}`,
  requestVideo: (when) => `Requests a video call · ${when}`,
  followUp: (d) => `Last session ${d} days ago`,
  accept: 'Confirm',
  decline: 'Decline',
  requestError: 'The request could not be updated. Please try again.',
  statPatients: 'Patients',
  statNewThisMonth: (n) => `+${n} this month`,
  statNotesThisMonth: 'Notes this month',
  statWeekAppointments: 'Appointments this week',
  statOnMyPhygo: 'Patients on My Phygo',
  statOfTotal: (n) => `of ${n}`,
  patientsHeading: 'Your patients',
  myPhygoOn: 'On My Phygo',
  myPhygoOff: 'Not on My Phygo yet',
  daysAgo: (n) => (n === 0 ? 'Today' : n === 1 ? 'Yesterday' : `${n} days ago`),
  newPatientTitle: 'New patient',
  newPatientHint: 'Address, emergency contact and clinical information are completed on the patient record.',
  videoCall: 'Video call',
  startVideoCall: 'Start video call',
  videoCallWith: (name) => `Video call with ${name}`,
  videoNeedsPortal: 'For a video call the patient must first join My Phygo: invite them with the button below.',
  callNotes: 'Session notes',
  callNotesHint: "Dictate or type while you talk with the patient: the note is structured and saved to their record.",
  showNotes: 'Show notes',
  hideNotes: 'Hide notes',
  privateRoom: 'Private room',
  sessionNote: 'Session note',
  patientRecord: 'Patient record',
}

const es: HomeDict = {
  briefAppointments: (n) => (n === 1 ? '1 cita hoy' : `${n} citas hoy`),
  briefRequests: (n) => (n === 1 ? '1 solicitud por confirmar' : `${n} solicitudes por confirmar`),
  briefNoAppointments: 'No hay citas hoy',
  nextPatient: 'Próximo paciente',
  nextAppointment: 'Próxima cita',
  inProgress: 'En curso',
  startsIn: (m) => (m < 60 ? `En ${m} min` : `En ${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`),
  today: 'Hoy',
  tomorrow: 'Mañana',
  inPerson: 'Presencial',
  video: 'Videollamada',
  minutes: (n) => `${n} min`,
  openRecord: 'Abrir ficha',
  startSession: 'Iniciar sesión',
  lastSession: 'Última sesión',
  nextSession: 'Próxima',
  noSessionsYet: 'Ninguna aún',
  laterToday: 'Después hoy',
  openAgenda: 'Abrir agenda',
  noUpcomingTitle: 'No hay citas programadas',
  noUpcomingBody: 'Planifica las próximas sesiones en la agenda: aparecerán aquí.',
  appointmentsError: 'No se han podido cargar las citas.',
  todo: 'Pendientes',
  todoEmpty: 'Todo en orden: no hay solicitudes pendientes.',
  requestInPerson: (when) => `Solicita una cita · ${when}`,
  requestVideo: (when) => `Solicita una videollamada · ${when}`,
  followUp: (d) => `Última sesión hace ${d} días`,
  accept: 'Confirmar',
  decline: 'Rechazar',
  requestError: 'No se ha podido actualizar la solicitud. Inténtalo de nuevo.',
  statPatients: 'Pacientes',
  statNewThisMonth: (n) => `+${n} este mes`,
  statNotesThisMonth: 'Notas este mes',
  statWeekAppointments: 'Citas esta semana',
  statOnMyPhygo: 'Pacientes en My Phygo',
  statOfTotal: (n) => `de ${n}`,
  patientsHeading: 'Tus pacientes',
  myPhygoOn: 'En My Phygo',
  myPhygoOff: 'Aún no está en My Phygo',
  daysAgo: (n) => (n === 0 ? 'Hoy' : n === 1 ? 'Ayer' : `Hace ${n} días`),
  newPatientTitle: 'Nuevo paciente',
  newPatientHint: 'La dirección, el contacto de emergencia y la información clínica se completan en la ficha del paciente.',
  videoCall: 'Videollamada',
  startVideoCall: 'Iniciar videollamada',
  videoCallWith: (name) => `Videollamada con ${name}`,
  videoNeedsPortal: 'Para la videollamada, el paciente debe unirse primero a My Phygo: invítalo con el botón de abajo.',
  callNotes: 'Notas de la sesión',
  callNotesHint: 'Dicta o escribe mientras hablas con el paciente: la nota se estructura y se guarda en su ficha.',
  showNotes: 'Mostrar notas',
  hideNotes: 'Ocultar notas',
  privateRoom: 'Sala privada',
  sessionNote: 'Nota de sesión',
  patientRecord: 'Ficha del paciente',
}

const fr: HomeDict = {
  briefAppointments: (n) => (n === 1 ? "1 rendez-vous aujourd'hui" : `${n} rendez-vous aujourd'hui`),
  briefRequests: (n) => (n === 1 ? '1 demande à confirmer' : `${n} demandes à confirmer`),
  briefNoAppointments: "Aucun rendez-vous aujourd'hui",
  nextPatient: 'Prochain patient',
  nextAppointment: 'Prochain rendez-vous',
  inProgress: 'En cours',
  startsIn: (m) => (m < 60 ? `Dans ${m} min` : `Dans ${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`),
  today: "Aujourd'hui",
  tomorrow: 'Demain',
  inPerson: 'Au cabinet',
  video: 'Visioconférence',
  minutes: (n) => `${n} min`,
  openRecord: 'Ouvrir la fiche',
  startSession: 'Démarrer la séance',
  lastSession: 'Dernière séance',
  nextSession: 'Prochaine',
  noSessionsYet: 'Aucune pour le moment',
  laterToday: "Plus tard aujourd'hui",
  openAgenda: "Ouvrir l'agenda",
  noUpcomingTitle: 'Aucun rendez-vous prévu',
  noUpcomingBody: "Planifiez vos prochaines séances dans l'agenda : elles apparaîtront ici.",
  appointmentsError: "Impossible de charger les rendez-vous.",
  todo: 'À faire',
  todoEmpty: 'Tout est en ordre : aucune demande en attente.',
  requestInPerson: (when) => `Demande un rendez-vous · ${when}`,
  requestVideo: (when) => `Demande une visio · ${when}`,
  followUp: (d) => `Dernière séance il y a ${d} jours`,
  accept: 'Confirmer',
  decline: 'Refuser',
  requestError: "Impossible de mettre à jour la demande. Réessayez.",
  statPatients: 'Patients',
  statNewThisMonth: (n) => `+${n} ce mois-ci`,
  statNotesThisMonth: 'Notes ce mois-ci',
  statWeekAppointments: 'Rendez-vous cette semaine',
  statOnMyPhygo: 'Patients sur My Phygo',
  statOfTotal: (n) => `sur ${n}`,
  patientsHeading: 'Vos patients',
  myPhygoOn: 'Sur My Phygo',
  myPhygoOff: 'Pas encore sur My Phygo',
  daysAgo: (n) => (n === 0 ? "Aujourd'hui" : n === 1 ? 'Hier' : `Il y a ${n} jours`),
  newPatientTitle: 'Nouveau patient',
  newPatientHint: "L'adresse, le contact d'urgence et les informations cliniques se complètent dans la fiche du patient.",
  videoCall: 'Visioconférence',
  startVideoCall: 'Démarrer la visio',
  videoCallWith: (name) => `Visioconférence avec ${name}`,
  videoNeedsPortal: "Pour la visio, le patient doit d'abord rejoindre My Phygo : invitez-le avec le bouton ci-dessous.",
  callNotes: 'Notes de séance',
  callNotesHint: 'Dictez ou écrivez pendant que vous parlez au patient : la note est structurée et enregistrée dans sa fiche.',
  showNotes: 'Afficher les notes',
  hideNotes: 'Masquer les notes',
  privateRoom: 'Salle privée',
  sessionNote: 'Note de séance',
  patientRecord: 'Dossier patient',
}

export const HOME_STRINGS: Record<AppLang, HomeDict> = { it, en, es, fr }

export function useHomeUi() {
  const { lang } = useLanguage()
  return HOME_STRINGS[lang]
}
