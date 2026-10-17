// My Phygo (patient portal) strings: app/my-phygo/home, app/my-phygo/shop,
// components/VideoCallPanel.tsx (shared with the clinician's patient page) and
// the appointment status labels of components/AppointmentScheduler.tsx.
// Kept as its own additive file for the same reason as agendaStrings.ts:
// editing the 320KB shared uiStrings.ts directly is avoided.
// The shop's catalogue labels (heading, categories, "View on Amazon") reuse
// UI_STRINGS.shop and lib/products.ts getProducts(lang), already translated.
// Names, notes and product names written by the clinician are data and are
// never translated.
'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import type { AppLang } from '@/lib/i18n/uiStrings'

type AppointmentStatus = 'requested' | 'confirmed' | 'cancelled' | 'completed'

interface MyPhygoDict {
  home: {
    loading: string
    notLinked: string
    welcomeBack: string
    yearsOld: (years: number) => string
    metabolicTitle: string
    metabolicSubtitle: string
    shopTitle: string
    shopSubtitle: string
    recommendedForYou: string
    nothingYet: string
    fromLastSession: string
    yourExercises: string
    exerciseFallback: (n: number) => string
    sets: (value: string | number) => string
    reps: (value: string | number) => string
    sessionHistory: string
    sessionRecorded: string
  }
  shop: {
    back: string
    subtitle: string
  }
  video: {
    joinCall: string
    endCall: string
    leaveCall: string
    noActiveCall: string
    startCall: string
    starting: string
    callEnded: string
    roomNotClosed: string
    closeRoom: string
  }
  scheduler: {
    status: Record<AppointmentStatus, string>
    acceptRequest: string
    declineRequest: string
  }
}

// Dosing values come from the clinician's note and may be a number ("3") or a
// range ("8-12"): only an exact 1 takes the singular.
const isOne = (value: string | number) => Number(value) === 1

const it: MyPhygoDict = {
  home: {
    loading: 'Caricamento...',
    notLinked: 'Il tuo account non è ancora collegato a una scheda paziente. Contatta il tuo fisioterapista.',
    welcomeBack: 'Bentornato/a',
    yearsOld: (years) => (years === 1 ? '1 anno' : `${years} anni`),
    metabolicTitle: 'Profilo metabolico',
    metabolicSubtitle: 'Il tuo obiettivo calorico e i macronutrienti di oggi',
    shopTitle: 'Scopri le attrezzature',
    shopSubtitle: 'Prodotti che supportano il tuo recupero',
    recommendedForYou: 'Consigliati per te',
    nothingYet: 'Il tuo fisioterapista non ha ancora aggiunto nulla.',
    fromLastSession: "Dall'ultima seduta",
    yourExercises: 'I tuoi esercizi',
    exerciseFallback: (n) => `Esercizio ${n}`,
    sets: (v) => `${v} serie`,
    reps: (v) => `${v} ${isOne(v) ? 'ripetizione' : 'ripetizioni'}`,
    sessionHistory: 'Storico delle sedute',
    sessionRecorded: 'Seduta registrata',
  },
  shop: {
    back: 'Indietro',
    subtitle: 'Attrezzature selezionate per supportare il tuo recupero.',
  },
  video: {
    joinCall: 'Partecipa alla videochiamata',
    endCall: 'Termina chiamata',
    leaveCall: 'Esci dalla chiamata',
    noActiveCall: 'Nessuna chiamata attiva al momento.',
    startCall: 'Avvia videochiamata',
    starting: 'Avvio in corso...',
    callEnded: 'Questa chiamata è terminata.',
    roomNotClosed: 'La chiamata è terminata, ma non è stato possibile chiudere la stanza video.',
    closeRoom: 'Chiudi la stanza video',
  },
  scheduler: {
    status: { requested: 'Richiesto', confirmed: 'Confermato', cancelled: 'Annullato', completed: 'Completato' },
    acceptRequest: 'Conferma la richiesta',
    declineRequest: 'Rifiuta la richiesta',
  },
}

const en: MyPhygoDict = {
  home: {
    loading: 'Loading...',
    notLinked: "Your account isn't linked to a patient record yet. Please contact your physiotherapist.",
    welcomeBack: 'Welcome back',
    yearsOld: (years) => (years === 1 ? '1 year old' : `${years} years old`),
    metabolicTitle: 'Metabolic profile',
    metabolicSubtitle: 'Your calorie target and macros for today',
    shopTitle: 'Browse equipment',
    shopSubtitle: 'Explore products that support your recovery',
    recommendedForYou: 'Recommended for you',
    nothingYet: "Your physiotherapist hasn't added anything yet.",
    fromLastSession: 'From your last session',
    yourExercises: 'Your exercises',
    exerciseFallback: (n) => `Exercise ${n}`,
    sets: (v) => `${v} ${isOne(v) ? 'set' : 'sets'}`,
    reps: (v) => `${v} ${isOne(v) ? 'rep' : 'reps'}`,
    sessionHistory: 'Session history',
    sessionRecorded: 'Session recorded',
  },
  shop: {
    back: 'Back',
    subtitle: 'Equipment picks that support your recovery.',
  },
  video: {
    joinCall: 'Join video call',
    endCall: 'End call',
    leaveCall: 'Leave call',
    noActiveCall: 'No active call right now.',
    startCall: 'Start Video Call',
    starting: 'Starting...',
    callEnded: 'This call has ended.',
    roomNotClosed: 'The call has ended, but the video room could not be closed.',
    closeRoom: 'Close video room',
  },
  scheduler: {
    status: { requested: 'Requested', confirmed: 'Confirmed', cancelled: 'Cancelled', completed: 'Completed' },
    acceptRequest: 'Confirm request',
    declineRequest: 'Decline request',
  },
}

const es: MyPhygoDict = {
  home: {
    loading: 'Cargando...',
    notLinked: 'Tu cuenta aún no está vinculada a una ficha de paciente. Ponte en contacto con tu fisioterapeuta.',
    welcomeBack: 'Bienvenido/a de nuevo',
    yearsOld: (years) => (years === 1 ? '1 año' : `${years} años`),
    metabolicTitle: 'Perfil metabólico',
    metabolicSubtitle: 'Tu objetivo calórico y tus macronutrientes de hoy',
    shopTitle: 'Explorar equipamiento',
    shopSubtitle: 'Descubre productos que apoyan tu recuperación',
    recommendedForYou: 'Recomendados para ti',
    nothingYet: 'Tu fisioterapeuta todavía no ha añadido nada.',
    fromLastSession: 'De tu última sesión',
    yourExercises: 'Tus ejercicios',
    exerciseFallback: (n) => `Ejercicio ${n}`,
    sets: (v) => `${v} ${isOne(v) ? 'serie' : 'series'}`,
    reps: (v) => `${v} ${isOne(v) ? 'repetición' : 'repeticiones'}`,
    sessionHistory: 'Historial de sesiones',
    sessionRecorded: 'Sesión registrada',
  },
  shop: {
    back: 'Volver',
    subtitle: 'Equipamiento seleccionado para apoyar tu recuperación.',
  },
  video: {
    joinCall: 'Unirse a la videollamada',
    endCall: 'Finalizar llamada',
    leaveCall: 'Salir de la llamada',
    noActiveCall: 'No hay ninguna llamada activa en este momento.',
    startCall: 'Iniciar videollamada',
    starting: 'Iniciando...',
    callEnded: 'Esta llamada ha finalizado.',
    roomNotClosed: 'La llamada ha finalizado, pero no se ha podido cerrar la sala de vídeo.',
    closeRoom: 'Cerrar la sala de vídeo',
  },
  scheduler: {
    status: { requested: 'Solicitada', confirmed: 'Confirmada', cancelled: 'Cancelada', completed: 'Completada' },
    acceptRequest: 'Confirmar la solicitud',
    declineRequest: 'Rechazar la solicitud',
  },
}

const fr: MyPhygoDict = {
  home: {
    loading: 'Chargement...',
    notLinked: "Votre compte n'est pas encore associé à un dossier patient. Veuillez contacter votre kinésithérapeute.",
    welcomeBack: 'Bon retour',
    yearsOld: (years) => (years === 1 ? '1 an' : `${years} ans`),
    metabolicTitle: 'Profil métabolique',
    metabolicSubtitle: "Votre objectif calorique et vos macronutriments d'aujourd'hui",
    shopTitle: 'Découvrir les équipements',
    shopSubtitle: 'Des produits qui accompagnent votre rétablissement',
    recommendedForYou: 'Recommandés pour vous',
    nothingYet: "Votre kinésithérapeute n'a encore rien ajouté.",
    fromLastSession: 'De votre dernière séance',
    yourExercises: 'Vos exercices',
    exerciseFallback: (n) => `Exercice ${n}`,
    sets: (v) => `${v} ${isOne(v) ? 'série' : 'séries'}`,
    reps: (v) => `${v} ${isOne(v) ? 'répétition' : 'répétitions'}`,
    sessionHistory: 'Historique des séances',
    sessionRecorded: 'Séance enregistrée',
  },
  shop: {
    back: 'Retour',
    subtitle: 'Une sélection d’équipements pour accompagner votre rétablissement.',
  },
  video: {
    joinCall: 'Rejoindre la visioconférence',
    endCall: "Terminer l'appel",
    leaveCall: "Quitter l'appel",
    noActiveCall: 'Aucun appel en cours pour le moment.',
    startCall: 'Démarrer la visioconférence',
    starting: 'Démarrage...',
    callEnded: 'Cet appel est terminé.',
    roomNotClosed: "L'appel est terminé, mais la salle vidéo n'a pas pu être fermée.",
    closeRoom: 'Fermer la salle vidéo',
  },
  scheduler: {
    status: { requested: 'Demandé', confirmed: 'Confirmé', cancelled: 'Annulé', completed: 'Terminé' },
    acceptRequest: 'Confirmer la demande',
    declineRequest: 'Refuser la demande',
  },
}

export const MY_PHYGO_STRINGS: Record<AppLang, MyPhygoDict> = { it, en, es, fr }

export function useMyPhygoStrings() {
  const { lang } = useLanguage()
  return MY_PHYGO_STRINGS[lang]
}
