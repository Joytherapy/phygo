import { useLanguage } from '@/contexts/LanguageContext'
import type { AppLang } from './uiStrings'

// Texts of the internal admin pages (verification requests, science review
// queue, Pro Library items, events). Only what is shown is translated: the
// values saved in the database (statuses, levels, practice stages) stay as
// they are and are mapped to a label here.

export type AdminDict = {
  common: {
    eyebrow: string
    adminOnly: string
    loading: string
    approve: string
    reject: string
    edit: string
    delete: string
    cancel: string
    nothingHere: string
  }
  verification: {
    title: string
    intro: string
    tabs: Record<'pending' | 'needs_info' | 'verified' | 'rejected', string>
    loadError: string
    decisionError: string
    none: string
    noName: string
    country: string
    register: string
    number: string
    role: string
    requested: string
    stages: Record<string, string>
    messageLabel: string
    askInfo: string
  }
  science: {
    title: string
    awaiting: (n: number) => string
    nothing: string
    score: (n: number) => string
    viewOriginal: string
    updateError: string
  }
  library: {
    title: string
    total: (n: number) => string
    newItem: string
    editItem: string
    close: string
    selectSubcategory: string
    titlePh: string
    goalPh: string
    positionPh: string
    equipmentPh: string
    repsPh: string
    steps: string
    stepLabelPh: string
    stepDescriptionPh: string
    easierPh: string
    harderPh: string
    tipPh: string
    safetyPh: string
    save: string
    saving: string
    saveError: string
    confirmDelete: string
    deleteLabel: string
    levels: Record<string, string>
  }
  events: {
    title: string
    addEvent: string
    editEvent: string
    titlePh: string
    descriptionPh: string
    cityPh: string
    countryPh: string
    officialUrlPh: string
    registrationUrlPh: string
    pricePh: string
    currencyPh: string
    saveChanges: string
    create: string
    pendingReview: (n: number) => string
    all: (n: number) => string
    moderation: Record<'pending_review' | 'approved' | 'rejected', string>
    featured: string
    feature: string
    unfeature: string
    markCancelled: string
    restore: string
    deleteError: string
  }
}

export const ADMIN_STRINGS: Record<AppLang, AdminDict> = {
  it: {
    common: {
      eyebrow: 'Admin',
      adminOnly: 'Accesso riservato agli amministratori.',
      loading: 'Caricamento…',
      approve: 'Approva',
      reject: 'Rifiuta',
      edit: 'Modifica',
      delete: 'Elimina',
      cancel: 'Annulla',
      nothingHere: 'Niente da mostrare al momento.',
    },
    verification: {
      title: 'Richieste di verifica professionale',
      intro: 'Controlla ogni numero nell’albo ufficiale pubblico del Paese indicato. Per rifiutare o chiedere informazioni serve un messaggio per l’utente.',
      tabs: { pending: 'In attesa', needs_info: 'Info richieste', verified: 'Verificati', rejected: 'Rifiutati' },
      loadError: 'Non è stato possibile caricare le richieste.',
      decisionError: 'Decisione non salvata.',
      none: 'Nessuna richiesta.',
      noName: 'Nessun nome visualizzato',
      country: 'Paese',
      register: 'Albo',
      number: 'Numero',
      role: 'Ruolo dichiarato',
      requested: 'Richiesta il',
      stages: { professional: 'Fisioterapista', student: 'Studente', patient: 'Paziente' },
      messageLabel: 'Messaggio per l’utente (obbligatorio per rifiutare o chiedere informazioni)',
      askInfo: 'Chiedi informazioni',
    },
    science: {
      title: 'Coda di revisione Science',
      awaiting: (n) => (n === 1 ? '1 studio in attesa di revisione.' : `${n} studi in attesa di revisione.`),
      nothing: 'Nessuno studio da revisionare al momento.',
      score: (n) => `Punteggio: ${n}`,
      viewOriginal: 'Apri l’originale',
      updateError: 'Aggiornamento non riuscito.',
    },
    library: {
      title: 'Pro Library — Gestione contenuti',
      total: (n) => (n === 1 ? '1 contenuto in totale.' : `${n} contenuti in totale.`),
      newItem: 'Nuovo contenuto',
      editItem: 'Modifica contenuto',
      close: 'Chiudi',
      selectSubcategory: 'Scegli la sottocategoria…',
      titlePh: 'Titolo',
      goalPh: 'Obiettivo (una frase breve)',
      positionPh: 'Posizione (es. Seduto)',
      equipmentPh: 'Attrezzatura',
      repsPh: 'Ripetizioni / durata',
      steps: 'Passaggi (3)',
      stepLabelPh: 'Etichetta',
      stepDescriptionPh: 'Descrizione',
      easierPh: 'Variante più facile',
      harderPh: 'Variante più difficile',
      tipPh: 'Consiglio pratico',
      safetyPh: 'Nota di sicurezza (facoltativa)',
      save: 'Salva contenuto',
      saving: 'Salvataggio…',
      saveError: 'Salvataggio non riuscito.',
      confirmDelete: 'Eliminare questo contenuto?',
      deleteLabel: 'Elimina contenuto',
      levels: { Gentle: 'Dolce', Active: 'Attivo', Challenge: 'Impegnativo' },
    },
    events: {
      title: 'Gestione eventi',
      addEvent: 'Aggiungi evento',
      editEvent: 'Modifica evento',
      titlePh: 'Titolo',
      descriptionPh: 'Descrizione',
      cityPh: 'Città',
      countryPh: 'Paese',
      officialUrlPh: 'URL del sito ufficiale',
      registrationUrlPh: 'URL di iscrizione',
      pricePh: 'Prezzo',
      currencyPh: 'Valuta',
      saveChanges: 'Salva modifiche',
      create: 'Crea evento',
      pendingReview: (n) => `Da revisionare · ${n}`,
      all: (n) => `Tutti · ${n}`,
      moderation: { pending_review: 'Da revisionare', approved: 'Approvato', rejected: 'Rifiutato' },
      featured: 'In evidenza',
      feature: 'Metti in evidenza',
      unfeature: 'Togli dall’evidenza',
      markCancelled: 'Segna come annullato',
      restore: 'Ripristina',
      deleteError: 'Eliminazione non riuscita.',
    },
  },
  en: {
    common: {
      eyebrow: 'Admin',
      adminOnly: 'Admin access required.',
      loading: 'Loading…',
      approve: 'Approve',
      reject: 'Reject',
      edit: 'Edit',
      delete: 'Delete',
      cancel: 'Cancel',
      nothingHere: 'Nothing here right now.',
    },
    verification: {
      title: 'Professional verification requests',
      intro: 'Check each number against the official public register of the stated country. Rejections and requests for more information need a message for the user.',
      tabs: { pending: 'Pending', needs_info: 'Info requested', verified: 'Verified', rejected: 'Rejected' },
      loadError: 'Could not load requests.',
      decisionError: 'Decision not saved.',
      none: 'No requests.',
      noName: 'No display name',
      country: 'Country',
      register: 'Register',
      number: 'Number',
      role: 'Declared role',
      requested: 'Requested',
      stages: { professional: 'Physiotherapist', student: 'Student', patient: 'Patient' },
      messageLabel: 'Message to the user (required to reject or ask for information)',
      askInfo: 'Ask for information',
    },
    science: {
      title: 'Science review queue',
      awaiting: (n) => (n === 1 ? '1 study awaiting review.' : `${n} studies awaiting review.`),
      nothing: 'Nothing to review right now.',
      score: (n) => `Score: ${n}`,
      viewOriginal: 'View original',
      updateError: 'Update failed.',
    },
    library: {
      title: 'Pro Library — Manage items',
      total: (n) => (n === 1 ? '1 item total.' : `${n} items total.`),
      newItem: 'New item',
      editItem: 'Edit item',
      close: 'Close',
      selectSubcategory: 'Select subcategory…',
      titlePh: 'Title',
      goalPh: 'Goal (short sentence)',
      positionPh: 'Position (e.g. Seated)',
      equipmentPh: 'Equipment',
      repsPh: 'Reps / duration',
      steps: 'Steps (3)',
      stepLabelPh: 'Label',
      stepDescriptionPh: 'Description',
      easierPh: 'Easier option',
      harderPh: 'Harder option',
      tipPh: 'Practical tip',
      safetyPh: 'Safety note (optional)',
      save: 'Save item',
      saving: 'Saving…',
      saveError: 'Save failed.',
      confirmDelete: 'Delete this item?',
      deleteLabel: 'Delete item',
      levels: { Gentle: 'Gentle', Active: 'Active', Challenge: 'Challenge' },
    },
    events: {
      title: 'Manage events',
      addEvent: 'Add event',
      editEvent: 'Edit event',
      titlePh: 'Title',
      descriptionPh: 'Description',
      cityPh: 'City',
      countryPh: 'Country',
      officialUrlPh: 'Official website URL',
      registrationUrlPh: 'Registration URL',
      pricePh: 'Price',
      currencyPh: 'Currency',
      saveChanges: 'Save changes',
      create: 'Create event',
      pendingReview: (n) => `Pending review · ${n}`,
      all: (n) => `All · ${n}`,
      moderation: { pending_review: 'Pending review', approved: 'Approved', rejected: 'Rejected' },
      featured: 'Featured',
      feature: 'Feature',
      unfeature: 'Unfeature',
      markCancelled: 'Mark as cancelled',
      restore: 'Restore',
      deleteError: 'Delete failed.',
    },
  },
  es: {
    common: {
      eyebrow: 'Admin',
      adminOnly: 'Acceso reservado a los administradores.',
      loading: 'Cargando…',
      approve: 'Aprobar',
      reject: 'Rechazar',
      edit: 'Editar',
      delete: 'Eliminar',
      cancel: 'Cancelar',
      nothingHere: 'No hay nada que mostrar por ahora.',
    },
    verification: {
      title: 'Solicitudes de verificación profesional',
      intro: 'Comprueba cada número en el registro oficial público del país indicado. Para rechazar o pedir información hace falta un mensaje para el usuario.',
      tabs: { pending: 'Pendientes', needs_info: 'Info solicitada', verified: 'Verificados', rejected: 'Rechazados' },
      loadError: 'No se pudieron cargar las solicitudes.',
      decisionError: 'La decisión no se ha guardado.',
      none: 'No hay solicitudes.',
      noName: 'Sin nombre visible',
      country: 'País',
      register: 'Registro',
      number: 'Número',
      role: 'Rol declarado',
      requested: 'Solicitada el',
      stages: { professional: 'Fisioterapeuta', student: 'Estudiante', patient: 'Paciente' },
      messageLabel: 'Mensaje para el usuario (obligatorio para rechazar o pedir información)',
      askInfo: 'Pedir información',
    },
    science: {
      title: 'Cola de revisión de Science',
      awaiting: (n) => (n === 1 ? '1 estudio pendiente de revisión.' : `${n} estudios pendientes de revisión.`),
      nothing: 'No hay nada que revisar por ahora.',
      score: (n) => `Puntuación: ${n}`,
      viewOriginal: 'Ver el original',
      updateError: 'No se pudo actualizar.',
    },
    library: {
      title: 'Pro Library — Gestión de contenidos',
      total: (n) => (n === 1 ? '1 contenido en total.' : `${n} contenidos en total.`),
      newItem: 'Nuevo contenido',
      editItem: 'Editar contenido',
      close: 'Cerrar',
      selectSubcategory: 'Elige la subcategoría…',
      titlePh: 'Título',
      goalPh: 'Objetivo (una frase corta)',
      positionPh: 'Posición (p. ej. Sentado)',
      equipmentPh: 'Material',
      repsPh: 'Repeticiones / duración',
      steps: 'Pasos (3)',
      stepLabelPh: 'Etiqueta',
      stepDescriptionPh: 'Descripción',
      easierPh: 'Variante más fácil',
      harderPh: 'Variante más difícil',
      tipPh: 'Consejo práctico',
      safetyPh: 'Nota de seguridad (opcional)',
      save: 'Guardar contenido',
      saving: 'Guardando…',
      saveError: 'No se pudo guardar.',
      confirmDelete: '¿Eliminar este contenido?',
      deleteLabel: 'Eliminar contenido',
      levels: { Gentle: 'Suave', Active: 'Activo', Challenge: 'Exigente' },
    },
    events: {
      title: 'Gestión de eventos',
      addEvent: 'Añadir evento',
      editEvent: 'Editar evento',
      titlePh: 'Título',
      descriptionPh: 'Descripción',
      cityPh: 'Ciudad',
      countryPh: 'País',
      officialUrlPh: 'URL del sitio oficial',
      registrationUrlPh: 'URL de inscripción',
      pricePh: 'Precio',
      currencyPh: 'Moneda',
      saveChanges: 'Guardar cambios',
      create: 'Crear evento',
      pendingReview: (n) => `Por revisar · ${n}`,
      all: (n) => `Todos · ${n}`,
      moderation: { pending_review: 'Por revisar', approved: 'Aprobado', rejected: 'Rechazado' },
      featured: 'Destacado',
      feature: 'Destacar',
      unfeature: 'Quitar de destacados',
      markCancelled: 'Marcar como cancelado',
      restore: 'Restablecer',
      deleteError: 'No se pudo eliminar.',
    },
  },
  fr: {
    common: {
      eyebrow: 'Admin',
      adminOnly: 'Accès réservé aux administrateurs.',
      loading: 'Chargement…',
      approve: 'Approuver',
      reject: 'Refuser',
      edit: 'Modifier',
      delete: 'Supprimer',
      cancel: 'Annuler',
      nothingHere: 'Rien à afficher pour le moment.',
    },
    verification: {
      title: 'Demandes de vérification professionnelle',
      intro: 'Vérifiez chaque numéro dans le registre officiel public du pays indiqué. Pour refuser ou demander des informations, un message à l’utilisateur est nécessaire.',
      tabs: { pending: 'En attente', needs_info: 'Infos demandées', verified: 'Vérifiés', rejected: 'Refusés' },
      loadError: 'Impossible de charger les demandes.',
      decisionError: 'Décision non enregistrée.',
      none: 'Aucune demande.',
      noName: 'Aucun nom affiché',
      country: 'Pays',
      register: 'Registre',
      number: 'Numéro',
      role: 'Rôle déclaré',
      requested: 'Demandée le',
      stages: { professional: 'Kinésithérapeute', student: 'Étudiant', patient: 'Patient' },
      messageLabel: 'Message à l’utilisateur (obligatoire pour refuser ou demander des informations)',
      askInfo: 'Demander des informations',
    },
    science: {
      title: 'File de revue Science',
      awaiting: (n) => (n === 1 ? '1 étude en attente de revue.' : `${n} études en attente de revue.`),
      nothing: 'Rien à examiner pour le moment.',
      score: (n) => `Score : ${n}`,
      viewOriginal: 'Voir l’original',
      updateError: 'La mise à jour a échoué.',
    },
    library: {
      title: 'Pro Library — Gestion des contenus',
      total: (n) => (n === 1 ? '1 contenu au total.' : `${n} contenus au total.`),
      newItem: 'Nouveau contenu',
      editItem: 'Modifier le contenu',
      close: 'Fermer',
      selectSubcategory: 'Choisir la sous-catégorie…',
      titlePh: 'Titre',
      goalPh: 'Objectif (une phrase courte)',
      positionPh: 'Position (ex. Assis)',
      equipmentPh: 'Matériel',
      repsPh: 'Répétitions / durée',
      steps: 'Étapes (3)',
      stepLabelPh: 'Libellé',
      stepDescriptionPh: 'Description',
      easierPh: 'Variante plus facile',
      harderPh: 'Variante plus difficile',
      tipPh: 'Conseil pratique',
      safetyPh: 'Note de sécurité (facultative)',
      save: 'Enregistrer le contenu',
      saving: 'Enregistrement…',
      saveError: 'L’enregistrement a échoué.',
      confirmDelete: 'Supprimer ce contenu ?',
      deleteLabel: 'Supprimer le contenu',
      levels: { Gentle: 'Doux', Active: 'Actif', Challenge: 'Exigeant' },
    },
    events: {
      title: 'Gestion des événements',
      addEvent: 'Ajouter un événement',
      editEvent: 'Modifier l’événement',
      titlePh: 'Titre',
      descriptionPh: 'Description',
      cityPh: 'Ville',
      countryPh: 'Pays',
      officialUrlPh: 'URL du site officiel',
      registrationUrlPh: 'URL d’inscription',
      pricePh: 'Prix',
      currencyPh: 'Devise',
      saveChanges: 'Enregistrer les modifications',
      create: 'Créer l’événement',
      pendingReview: (n) => `À examiner · ${n}`,
      all: (n) => `Tous · ${n}`,
      moderation: { pending_review: 'À examiner', approved: 'Approuvé', rejected: 'Refusé' },
      featured: 'À la une',
      feature: 'Mettre à la une',
      unfeature: 'Retirer de la une',
      markCancelled: 'Marquer comme annulé',
      restore: 'Rétablir',
      deleteError: 'La suppression a échoué.',
    },
  },
}

export function useAdminStrings() {
  const { lang } = useLanguage()
  return ADMIN_STRINGS[lang]
}
