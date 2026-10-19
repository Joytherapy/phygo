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
  profile: {
    navLabel: string
    eyebrow: string
    title: string
    subtitle: string
    photo: string
    photoHint: string
    changePhoto: string
    addPhoto: string
    removePhoto: string
    uploading: string
    photoTooBig: string
    photoUnsupported: string
    photoUnavailable: string
    photoError: string
    nameLabel: string
    nameHint: string
    goalLabel: string
    goalPlaceholder: string
    goalHint: string
    languageLabel: string
    emailLabel: string
    save: string
    saving: string
    saved: string
    saveError: string
    yourGoal: string
    editGoal: string
    backHome: string
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
  profile: {
    navLabel: 'Il mio profilo',
    eyebrow: 'Il mio profilo',
    title: 'Personalizza il tuo profilo',
    subtitle: 'Scegli come vuoi essere chiamato/a, la tua foto e il tuo obiettivo.',
    photo: 'Foto profilo',
    photoHint: 'JPG, PNG o WebP, fino a 10 MB. È visibile solo a te nel tuo portale.',
    changePhoto: 'Cambia foto',
    addPhoto: 'Aggiungi una foto',
    removePhoto: 'Rimuovi',
    uploading: 'Caricamento…',
    photoTooBig: 'La foto supera i 10 MB: scegline una più leggera.',
    photoUnsupported: 'Formato non supportato: usa una foto JPG, PNG o WebP.',
    photoUnavailable: 'Il caricamento delle foto non è ancora attivo. Riprova più tardi.',
    photoError: 'Non è stato possibile caricare la foto. Riprova.',
    nameLabel: 'Come vuoi essere chiamato/a',
    nameHint: 'Il nome che vedi nella tua home. Il tuo fisioterapista continua a vedere il nome della tua scheda.',
    goalLabel: 'Il mio obiettivo',
    goalPlaceholder: 'Es. tornare a correre 5 km senza dolore',
    goalHint: 'Lo ritrovi nella tua home, per ricordarti perché ti alleni.',
    languageLabel: 'Lingua',
    emailLabel: 'Email di accesso',
    save: 'Salva',
    saving: 'Salvataggio…',
    saved: 'Profilo salvato',
    saveError: 'Non è stato possibile salvare. Riprova.',
    yourGoal: 'Il tuo obiettivo',
    editGoal: 'Modifica',
    backHome: 'Torna alla Home',
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
  profile: {
    navLabel: 'My profile',
    eyebrow: 'My profile',
    title: 'Personalize your profile',
    subtitle: 'Choose what you want to be called, your photo and your goal.',
    photo: 'Profile photo',
    photoHint: 'JPG, PNG or WebP, up to 10 MB. Only you see it in your portal.',
    changePhoto: 'Change photo',
    addPhoto: 'Add a photo',
    removePhoto: 'Remove',
    uploading: 'Uploading…',
    photoTooBig: 'The photo is over 10 MB: choose a lighter one.',
    photoUnsupported: 'Unsupported format: use a JPG, PNG or WebP photo.',
    photoUnavailable: 'Photo upload is not available yet. Please try again later.',
    photoError: 'The photo could not be uploaded. Please try again.',
    nameLabel: 'What should we call you',
    nameHint: 'The name you see on your home. Your physiotherapist keeps seeing the name on your record.',
    goalLabel: 'My goal',
    goalPlaceholder: 'e.g. run 5 km again without pain',
    goalHint: 'You will find it on your home, to remind you why you train.',
    languageLabel: 'Language',
    emailLabel: 'Sign-in email',
    save: 'Save',
    saving: 'Saving…',
    saved: 'Profile saved',
    saveError: 'Could not save. Please try again.',
    yourGoal: 'Your goal',
    editGoal: 'Edit',
    backHome: 'Back to Home',
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
  profile: {
    navLabel: 'Mi perfil',
    eyebrow: 'Mi perfil',
    title: 'Personaliza tu perfil',
    subtitle: 'Elige cómo quieres que te llamemos, tu foto y tu objetivo.',
    photo: 'Foto de perfil',
    photoHint: 'JPG, PNG o WebP, hasta 10 MB. Solo la ves tú en tu portal.',
    changePhoto: 'Cambiar foto',
    addPhoto: 'Añadir una foto',
    removePhoto: 'Quitar',
    uploading: 'Subiendo…',
    photoTooBig: 'La foto supera los 10 MB: elige una más ligera.',
    photoUnsupported: 'Formato no compatible: usa una foto JPG, PNG o WebP.',
    photoUnavailable: 'La subida de fotos aún no está activa. Inténtalo más tarde.',
    photoError: 'No se pudo subir la foto. Inténtalo de nuevo.',
    nameLabel: 'Cómo quieres que te llamemos',
    nameHint: 'El nombre que ves en tu inicio. Tu fisioterapeuta sigue viendo el nombre de tu ficha.',
    goalLabel: 'Mi objetivo',
    goalPlaceholder: 'P. ej. volver a correr 5 km sin dolor',
    goalHint: 'Lo verás en tu inicio, para recordarte por qué entrenas.',
    languageLabel: 'Idioma',
    emailLabel: 'Correo de acceso',
    save: 'Guardar',
    saving: 'Guardando…',
    saved: 'Perfil guardado',
    saveError: 'No se pudo guardar. Inténtalo de nuevo.',
    yourGoal: 'Tu objetivo',
    editGoal: 'Editar',
    backHome: 'Volver al inicio',
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
  profile: {
    navLabel: 'Mon profil',
    eyebrow: 'Mon profil',
    title: 'Personnalisez votre profil',
    subtitle: 'Choisissez comment vous voulez être appelé·e, votre photo et votre objectif.',
    photo: 'Photo de profil',
    photoHint: 'JPG, PNG ou WebP, jusqu’à 10 Mo. Vous seul·e la voyez dans votre portail.',
    changePhoto: 'Changer la photo',
    addPhoto: 'Ajouter une photo',
    removePhoto: 'Retirer',
    uploading: 'Envoi…',
    photoTooBig: 'La photo dépasse 10 Mo : choisissez-en une plus légère.',
    photoUnsupported: 'Format non pris en charge : utilisez une photo JPG, PNG ou WebP.',
    photoUnavailable: "L'envoi de photos n'est pas encore disponible. Réessayez plus tard.",
    photoError: "La photo n'a pas pu être envoyée. Réessayez.",
    nameLabel: 'Comment voulez-vous être appelé·e',
    nameHint: "Le nom affiché sur votre accueil. Votre kinésithérapeute continue de voir le nom de votre dossier.",
    goalLabel: 'Mon objectif',
    goalPlaceholder: 'Ex. recourir 5 km sans douleur',
    goalHint: 'Vous le retrouverez sur votre accueil, pour vous rappeler pourquoi vous vous entraînez.',
    languageLabel: 'Langue',
    emailLabel: 'E-mail de connexion',
    save: 'Enregistrer',
    saving: 'Enregistrement…',
    saved: 'Profil enregistré',
    saveError: "Impossible d'enregistrer. Réessayez.",
    yourGoal: 'Votre objectif',
    editGoal: 'Modifier',
    backHome: 'Retour à l’accueil',
  },
}

export const MY_PHYGO_STRINGS: Record<AppLang, MyPhygoDict> = { it, en, es, fr }

export function useMyPhygoStrings() {
  const { lang } = useLanguage()
  return MY_PHYGO_STRINGS[lang]
}
