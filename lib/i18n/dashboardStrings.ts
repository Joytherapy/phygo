// Dashboard states and accessibility labels (loading/error/empty states,
// icon-button labels) shared by the dashboard home, Navbar, Agenda, Workspace
// and library pages. Kept as its own additive file, like agendaStrings.ts and
// workspaceStrings.ts, so these strings do not touch the large shared
// uiStrings.ts. Same AppLang type, same 4 languages, same LanguageContext.
'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import type { AppLang } from '@/lib/i18n/uiStrings'

interface DashboardDict {
  common: {
    retry: string
    close: string
    unavailable: string
    networkError: string
  }
  nav: {
    search: string
    toggleTheme: string
    openMenu: string
    closeMenu: string
    changeLanguage: string
    account: string
    clearPatient: string
  }
  home: {
    statAppointmentsToday: string
    loadErrorTitle: string
    loadErrorBody: string
    createError: string
    createDenied: string
    addFirstPatient: string
  }
  agenda: {
    loadError: string
    statusError: string
    confirmRequest: string
    declineRequest: string
    previousWeek: string
    nextWeek: string
    backToThisWeek: string
    addOnDay: string
    noAppointmentsDay: string
    removePatient: string
    searchError: string
  }
  workspace: {
    actionFailed: string
    loadError: string
    folderNotFound: string
    moreActions: string
  }
  library: {
    loadError: string
  }
}

const it: DashboardDict = {
  common: {
    retry: 'Riprova',
    close: 'Chiudi',
    unavailable: 'Dato non disponibile',
    networkError: 'Errore di rete. Controlla la connessione e riprova.',
  },
  nav: {
    search: 'Cerca',
    toggleTheme: 'Cambia tema chiaro/scuro',
    openMenu: 'Apri menu',
    closeMenu: 'Chiudi menu',
    changeLanguage: 'Cambia lingua',
    account: 'Account',
    clearPatient: 'Deseleziona paziente attuale',
  },
  home: {
    statAppointmentsToday: 'Appuntamenti oggi',
    loadErrorTitle: 'Impossibile caricare i pazienti',
    loadErrorBody: 'Controlla la connessione e riprova. Nessun dato è stato modificato.',
    createError: 'Il paziente non è stato salvato. Riprova.',
    createDenied: 'Il paziente non è stato salvato: il tuo account non può ancora aggiungere pazienti. Controlla lo stato della verifica nel Profilo.',
    addFirstPatient: 'Aggiungi il primo paziente',
  },
  agenda: {
    loadError: 'Impossibile caricare gli appuntamenti. Controlla la connessione e riprova.',
    statusError: "Impossibile aggiornare la richiesta. Riprova.",
    confirmRequest: 'Conferma richiesta',
    declineRequest: 'Rifiuta richiesta',
    previousWeek: 'Settimana precedente',
    nextWeek: 'Settimana successiva',
    backToThisWeek: 'Torna a questa settimana',
    addOnDay: 'Aggiungi appuntamento il {day}',
    noAppointmentsDay: 'Nessun appuntamento',
    removePatient: 'Rimuovi paziente selezionato',
    searchError: 'Ricerca non riuscita. Riprova.',
  },
  workspace: {
    actionFailed: "L'operazione non è riuscita: l'elenco è stato ricaricato. Riprova.",
    loadError: 'Impossibile caricare il Workspace. Controlla la connessione e riprova.',
    folderNotFound: 'Cartella non trovata: potrebbe essere stata spostata nel Cestino.',
    moreActions: 'Altre azioni',
  },
  library: {
    loadError: 'Impossibile caricare i contenuti. Controlla la connessione e riprova.',
  },
}

const en: DashboardDict = {
  common: {
    retry: 'Retry',
    close: 'Close',
    unavailable: 'Not available',
    networkError: 'Network error. Check your connection and try again.',
  },
  nav: {
    search: 'Search',
    toggleTheme: 'Toggle light/dark theme',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    changeLanguage: 'Change language',
    account: 'Account',
    clearPatient: 'Clear current patient',
  },
  home: {
    statAppointmentsToday: 'Appointments today',
    loadErrorTitle: "Couldn't load your patients",
    loadErrorBody: 'Check your connection and try again. No data has been changed.',
    createError: 'The patient was not saved. Please try again.',
    createDenied: "The patient was not saved: your account can't add patients yet. Check your verification status in your Profile.",
    addFirstPatient: 'Add your first patient',
  },
  agenda: {
    loadError: "Couldn't load your appointments. Check your connection and try again.",
    statusError: "Couldn't update the request. Please try again.",
    confirmRequest: 'Confirm request',
    declineRequest: 'Decline request',
    previousWeek: 'Previous week',
    nextWeek: 'Next week',
    backToThisWeek: 'Back to this week',
    addOnDay: 'Add appointment on {day}',
    noAppointmentsDay: 'No appointments',
    removePatient: 'Remove selected patient',
    searchError: 'Search failed. Please try again.',
  },
  workspace: {
    actionFailed: "That action didn't go through, so the list was reloaded. Please try again.",
    loadError: "Couldn't load your Workspace. Check your connection and try again.",
    folderNotFound: 'Folder not found: it may have been moved to the Trash.',
    moreActions: 'More actions',
  },
  library: {
    loadError: "Couldn't load this content. Check your connection and try again.",
  },
}

const es: DashboardDict = {
  common: {
    retry: 'Reintentar',
    close: 'Cerrar',
    unavailable: 'Dato no disponible',
    networkError: 'Error de red. Comprueba tu conexión e inténtalo de nuevo.',
  },
  nav: {
    search: 'Buscar',
    toggleTheme: 'Cambiar tema claro/oscuro',
    openMenu: 'Abrir menú',
    closeMenu: 'Cerrar menú',
    changeLanguage: 'Cambiar idioma',
    account: 'Cuenta',
    clearPatient: 'Quitar paciente actual',
  },
  home: {
    statAppointmentsToday: 'Citas de hoy',
    loadErrorTitle: 'No se pudieron cargar los pacientes',
    loadErrorBody: 'Comprueba tu conexión e inténtalo de nuevo. No se ha modificado ningún dato.',
    createError: 'El paciente no se ha guardado. Inténtalo de nuevo.',
    createDenied: 'El paciente no se ha guardado: tu cuenta todavía no puede añadir pacientes. Revisa el estado de la verificación en tu Perfil.',
    addFirstPatient: 'Añade tu primer paciente',
  },
  agenda: {
    loadError: 'No se pudieron cargar las citas. Comprueba tu conexión e inténtalo de nuevo.',
    statusError: 'No se pudo actualizar la solicitud. Inténtalo de nuevo.',
    confirmRequest: 'Confirmar solicitud',
    declineRequest: 'Rechazar solicitud',
    previousWeek: 'Semana anterior',
    nextWeek: 'Semana siguiente',
    backToThisWeek: 'Volver a esta semana',
    addOnDay: 'Añadir cita el {day}',
    noAppointmentsDay: 'Sin citas',
    removePatient: 'Quitar paciente seleccionado',
    searchError: 'La búsqueda ha fallado. Inténtalo de nuevo.',
  },
  workspace: {
    actionFailed: 'La operación no se ha completado y la lista se ha recargado. Inténtalo de nuevo.',
    loadError: 'No se pudo cargar el Workspace. Comprueba tu conexión e inténtalo de nuevo.',
    folderNotFound: 'Carpeta no encontrada: puede que se haya movido a la Papelera.',
    moreActions: 'Más acciones',
  },
  library: {
    loadError: 'No se pudo cargar el contenido. Comprueba tu conexión e inténtalo de nuevo.',
  },
}

const fr: DashboardDict = {
  common: {
    retry: 'Réessayer',
    close: 'Fermer',
    unavailable: 'Donnée indisponible',
    networkError: 'Erreur réseau. Vérifiez votre connexion et réessayez.',
  },
  nav: {
    search: 'Rechercher',
    toggleTheme: 'Basculer thème clair/sombre',
    openMenu: 'Ouvrir le menu',
    closeMenu: 'Fermer le menu',
    changeLanguage: 'Changer de langue',
    account: 'Compte',
    clearPatient: 'Désélectionner le patient actuel',
  },
  home: {
    statAppointmentsToday: "Rendez-vous aujourd'hui",
    loadErrorTitle: 'Impossible de charger vos patients',
    loadErrorBody: "Vérifiez votre connexion et réessayez. Aucune donnée n'a été modifiée.",
    createError: "Le patient n'a pas été enregistré. Réessayez.",
    createDenied: "Le patient n'a pas été enregistré : votre compte ne peut pas encore ajouter de patients. Vérifiez le statut de votre vérification dans votre Profil.",
    addFirstPatient: 'Ajouter votre premier patient',
  },
  agenda: {
    loadError: 'Impossible de charger les rendez-vous. Vérifiez votre connexion et réessayez.',
    statusError: 'Impossible de mettre à jour la demande. Réessayez.',
    confirmRequest: 'Confirmer la demande',
    declineRequest: 'Refuser la demande',
    previousWeek: 'Semaine précédente',
    nextWeek: 'Semaine suivante',
    backToThisWeek: 'Revenir à cette semaine',
    addOnDay: 'Ajouter un rendez-vous le {day}',
    noAppointmentsDay: 'Aucun rendez-vous',
    removePatient: 'Retirer le patient sélectionné',
    searchError: 'La recherche a échoué. Réessayez.',
  },
  workspace: {
    actionFailed: "L'opération n'a pas abouti, la liste a été rechargée. Réessayez.",
    loadError: 'Impossible de charger le Workspace. Vérifiez votre connexion et réessayez.',
    folderNotFound: 'Dossier introuvable : il a peut-être été placé dans la Corbeille.',
    moreActions: 'Plus d’actions',
  },
  library: {
    loadError: 'Impossible de charger ce contenu. Vérifiez votre connexion et réessayez.',
  },
}

export const DASHBOARD_STRINGS: Record<AppLang, DashboardDict> = { it, en, es, fr }

export function useDashboardUi() {
  const { lang } = useLanguage()
  return DASHBOARD_STRINGS[lang]
}
