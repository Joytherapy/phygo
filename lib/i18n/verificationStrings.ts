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
  badgeVerified: string;
  badgeNotVerified: string;
  badgeStudent: string;
  showDetails: string;
  hideDetails: string;
  legalFirstNameLabel: string;
  legalLastNameLabel: string;
  orderLabel: string;
  orderPlaceholder: string;
  documentLabel: string;
  documentHint: string;
  documentWarning: string;
  declarationTitle: string;
  declarationText: string;
  declarationAccept: string;
  privacyLink: string;
  continue: string;
  reviewTitle: string;
  reviewHint: string;
  edit: string;
  sendRequest: string;
  documentMissing: string;
  documentTooLarge: string;
  documentType: string;
  declarationRequired: string;
  viewDocument: string;
  documentRemoved: string;
  fileLabel: string;
  newRequest: string;
  aTitle: string;
  aIntro: string;
  aDeclaration: string;
  aDocument: string;
  aRegistry: string;
  aDecision: string;
  aOpenDocument: string;
  aNoDocument: string;
  aOpenRegister: string;
  aMatch: string;
  aMismatch: string;
  aNotFound: string;
  aNotChecked: string;
  aApprove: string;
  aAskInfo: string;
  aReject: string;
  aRevoke: string;
  aMessage: string;
  aNote: string;
  aCategory: string;
  aHistory: string;
  aNoRequests: string;
  aAdminRequired: string;
  aLegacy: string;
  aCategories: Record<'not_in_register' | 'data_mismatch' | 'document_unreadable' | 'document_not_valid' | 'other', string>;
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
  badgeVerified: "Verified physiotherapist",
  badgeNotVerified: "Not verified",
  badgeStudent: "Student",
  showDetails: "Verification details",
  hideDetails: "Hide details",
  legalFirstNameLabel: "Legal first name",
  legalLastNameLabel: "Legal last name",
  orderLabel: "Territorial Order or register",
  orderPlaceholder: "e.g. OFI Lombardia",
  documentLabel: "Proof of registration",
  documentHint: "An official proof that shows your name and registration number, such as a certificate of registration or a legible copy of the official register entry. PDF, JPEG or PNG, up to 4 MB.",
  documentWarning: "Do not upload identity documents, medical records, documents with patient data, or unnecessary information about other people. You may black out anything not needed for the check, as long as your name and registration number stay readable.",
  declarationTitle: "Declaration",
  declarationText: "I declare that the first name, last name, registration number and other information provided are true, up to date and refer to me. I confirm that I am authorised to submit the attached document for professional verification and that I have not included patient data or irrelevant information about other people. I understand that false statements, altered documents or the unauthorised use of other people's data or credentials may lead to the refusal or revocation of the verification and to the suspension of the account, within the limits of the Terms of Service, in addition to any consequences provided for by law.",
  declarationAccept: "I have read and accept this declaration",
  privacyLink: "How we handle verification data (privacy notice)",
  continue: "Review before sending",
  reviewTitle: "Check your details",
  reviewHint: "Nothing has been sent yet. Correct anything that is wrong, then send the request.",
  edit: "Edit",
  sendRequest: "Send for verification",
  documentMissing: "Attach the proof of registration.",
  documentTooLarge: "The file is larger than 4 MB.",
  documentType: "Only PDF, JPEG or PNG files are accepted.",
  declarationRequired: "Accept the declaration to continue.",
  viewDocument: "View the document you sent",
  documentRemoved: "The document was deleted after the decision, as planned.",
  fileLabel: "File",
  newRequest: "Send a new request",
  aTitle: "Professional verification requests",
  aIntro: "Compare the declaration, the document and the official register yourself. Nothing is checked automatically. Approval needs a document and a recorded match on the official register.",
  aDeclaration: "1. User's declaration",
  aDocument: "2. Document received",
  aRegistry: "3. Check on the official register",
  aDecision: "4. Final decision",
  aOpenDocument: "Open document (60 s link)",
  aNoDocument: "No document",
  aOpenRegister: "Open the official register",
  aMatch: "Matches",
  aMismatch: "Does not match",
  aNotFound: "Not found",
  aNotChecked: "Not checked yet",
  aApprove: "Approve",
  aAskInfo: "Ask for information",
  aReject: "Reject",
  aRevoke: "Revoke verification",
  aMessage: "Message to the user (required to reject or ask for information; no third-party details)",
  aNote: "Internal note (not shown to the user)",
  aCategory: "Reason category",
  aHistory: "History",
  aNoRequests: "No requests.",
  aAdminRequired: "Admin access required.",
  aLegacy: "No request with a document (account reviewed before documents were required).",
  aCategories: {not_in_register: "Not in the register", data_mismatch: "Data do not match", document_unreadable: "Document unreadable", document_not_valid: "Document not suitable", other: "Other"},
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
  badgeVerified: "Fisioterapista verificato",
  badgeNotVerified: "Non verificato",
  badgeStudent: "Studente",
  showDetails: "Dati di verifica",
  hideDetails: "Nascondi dati",
  legalFirstNameLabel: "Nome legale",
  legalLastNameLabel: "Cognome legale",
  orderLabel: "Ordine territoriale o registro",
  orderPlaceholder: "es. OFI Lombardia",
  documentLabel: "Documento probatorio dell'iscrizione",
  documentHint: "Una prova ufficiale che mostri il tuo nome e il numero d'iscrizione, come un certificato d'iscrizione o una copia leggibile della registrazione ufficiale. PDF, JPEG o PNG, massimo 4 MB.",
  documentWarning: "Non caricare documenti d'identità, cartelle cliniche, documenti con dati di pazienti o informazioni non necessarie su altre persone. Puoi oscurare ciò che non serve alla verifica, purché nome e numero d'iscrizione restino leggibili.",
  declarationTitle: "Dichiarazione",
  declarationText: "Dichiaro che il nome, il cognome, il numero d'iscrizione e le altre informazioni fornite sono veritieri, aggiornati e riferiti alla mia persona. Confermo di essere autorizzato a presentare il documento allegato ai fini della verifica professionale e di non aver inserito dati di pazienti o informazioni di terzi non pertinenti. Sono consapevole che dichiarazioni false, documenti alterati o l'uso non autorizzato dei dati o delle credenziali di altre persone possono comportare il rifiuto o la revoca della verifica e la sospensione dell'account, nei limiti dei Termini di servizio, oltre alle eventuali conseguenze previste dalla legge.",
  declarationAccept: "Ho letto e accetto questa dichiarazione",
  privacyLink: "Come trattiamo i dati della verifica (informativa privacy)",
  continue: "Rivedi prima di inviare",
  reviewTitle: "Controlla i tuoi dati",
  reviewHint: "Non è ancora stato inviato nulla. Correggi ciò che non va, poi invia la richiesta.",
  edit: "Modifica",
  sendRequest: "Invia per la verifica",
  documentMissing: "Allega il documento probatorio dell'iscrizione.",
  documentTooLarge: "Il file supera i 4 MB.",
  documentType: "Sono accettati solo file PDF, JPEG o PNG.",
  declarationRequired: "Accetta la dichiarazione per continuare.",
  viewDocument: "Vedi il documento inviato",
  documentRemoved: "Il documento è stato cancellato dopo la decisione, come previsto.",
  fileLabel: "File",
  newRequest: "Invia una nuova richiesta",
  aTitle: "Richieste di verifica professionale",
  aIntro: "Confronta tu dichiarazione, documento e registro ufficiale. Nulla viene verificato automaticamente. Per approvare servono il documento e un esito «corrisponde» registrato sul registro ufficiale.",
  aDeclaration: "1. Dichiarazione dell'utente",
  aDocument: "2. Documento ricevuto",
  aRegistry: "3. Controllo sul registro ufficiale",
  aDecision: "4. Decisione finale",
  aOpenDocument: "Apri documento (link di 60 s)",
  aNoDocument: "Nessun documento",
  aOpenRegister: "Apri il registro ufficiale",
  aMatch: "Corrisponde",
  aMismatch: "Non corrisponde",
  aNotFound: "Non trovato",
  aNotChecked: "Non ancora controllato",
  aApprove: "Approva",
  aAskInfo: "Chiedi informazioni",
  aReject: "Respingi",
  aRevoke: "Revoca la verifica",
  aMessage: "Messaggio all'utente (obbligatorio per respingere o chiedere informazioni; nessun dato di terzi)",
  aNote: "Nota interna (non visibile all'utente)",
  aCategory: "Categoria del motivo",
  aHistory: "Storico",
  aNoRequests: "Nessuna richiesta.",
  aAdminRequired: "Accesso riservato agli amministratori.",
  aLegacy: "Nessuna richiesta con documento (account esaminato prima che il documento fosse richiesto).",
  aCategories: {not_in_register: "Non presente nel registro", data_mismatch: "Dati non corrispondenti", document_unreadable: "Documento illeggibile", document_not_valid: "Documento non idoneo", other: "Altro"},
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
  badgeVerified: "Fisioterapeuta verificado",
  badgeNotVerified: "No verificado",
  badgeStudent: "Estudiante",
  showDetails: "Datos de verificación",
  hideDetails: "Ocultar datos",
  legalFirstNameLabel: "Nombre legal",
  legalLastNameLabel: "Apellidos legales",
  orderLabel: "Colegio territorial o registro",
  orderPlaceholder: "p. ej. Colegio de Madrid",
  documentLabel: "Documento acreditativo de la colegiación",
  documentHint: "Una prueba oficial que muestre tu nombre y número de colegiado, como un certificado de colegiación o una copia legible del registro oficial. PDF, JPEG o PNG, máximo 4 MB.",
  documentWarning: "No subas documentos de identidad, historias clínicas, documentos con datos de pacientes ni información innecesaria sobre otras personas. Puedes tapar lo que no sea necesario para la verificación, siempre que tu nombre y número de colegiado sigan legibles.",
  declarationTitle: "Declaración",
  declarationText: "Declaro que el nombre, los apellidos, el número de colegiado y el resto de la información facilitada son verídicos, están actualizados y se refieren a mi persona. Confirmo que estoy autorizado a presentar el documento adjunto a efectos de la verificación profesional y que no he incluido datos de pacientes ni información no pertinente de terceros. Soy consciente de que las declaraciones falsas, los documentos alterados o el uso no autorizado de datos o credenciales de otras personas pueden suponer la denegación o revocación de la verificación y la suspensión de la cuenta, dentro de los límites de los Términos del servicio, además de las consecuencias previstas por la ley.",
  declarationAccept: "He leído y acepto esta declaración",
  privacyLink: "Cómo tratamos los datos de la verificación (aviso de privacidad)",
  continue: "Revisar antes de enviar",
  reviewTitle: "Revisa tus datos",
  reviewHint: "Todavía no se ha enviado nada. Corrige lo que no esté bien y después envía la solicitud.",
  edit: "Editar",
  sendRequest: "Enviar para verificación",
  documentMissing: "Adjunta el documento acreditativo.",
  documentTooLarge: "El archivo supera los 4 MB.",
  documentType: "Solo se aceptan archivos PDF, JPEG o PNG.",
  declarationRequired: "Acepta la declaración para continuar.",
  viewDocument: "Ver el documento enviado",
  documentRemoved: "El documento se eliminó tras la decisión, como estaba previsto.",
  fileLabel: "Archivo",
  newRequest: "Enviar una nueva solicitud",
  aTitle: "Solicitudes de verificación profesional",
  aIntro: "Compara tú la declaración, el documento y el registro oficial. Nada se verifica automáticamente. Para aprobar hacen falta el documento y un resultado «coincide» registrado en el registro oficial.",
  aDeclaration: "1. Declaración del usuario",
  aDocument: "2. Documento recibido",
  aRegistry: "3. Comprobación en el registro oficial",
  aDecision: "4. Decisión final",
  aOpenDocument: "Abrir documento (enlace de 60 s)",
  aNoDocument: "Sin documento",
  aOpenRegister: "Abrir el registro oficial",
  aMatch: "Coincide",
  aMismatch: "No coincide",
  aNotFound: "No encontrado",
  aNotChecked: "Aún no comprobado",
  aApprove: "Aprobar",
  aAskInfo: "Pedir información",
  aReject: "Rechazar",
  aRevoke: "Revocar la verificación",
  aMessage: "Mensaje al usuario (obligatorio para rechazar o pedir información; sin datos de terceros)",
  aNote: "Nota interna (no visible para el usuario)",
  aCategory: "Categoría del motivo",
  aHistory: "Historial",
  aNoRequests: "No hay solicitudes.",
  aAdminRequired: "Acceso reservado a administradores.",
  aLegacy: "Ninguna solicitud con documento (cuenta revisada antes de exigir documento).",
  aCategories: {not_in_register: "No figura en el registro", data_mismatch: "Los datos no coinciden", document_unreadable: "Documento ilegible", document_not_valid: "Documento no válido", other: "Otro"},
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
  badgeVerified: "Kinésithérapeute vérifié",
  badgeNotVerified: "Non vérifié",
  badgeStudent: "Étudiant",
  showDetails: "Données de vérification",
  hideDetails: "Masquer les données",
  legalFirstNameLabel: "Prénom légal",
  legalLastNameLabel: "Nom légal",
  orderLabel: "Ordre territorial ou registre",
  orderPlaceholder: "ex. Ordre régional",
  documentLabel: "Justificatif d'inscription",
  documentHint: "Une preuve officielle indiquant votre nom et votre numéro d'inscription, comme une attestation d'inscription ou une copie lisible du registre officiel. PDF, JPEG ou PNG, 4 Mo maximum.",
  documentWarning: "Ne téléversez pas de pièces d'identité, de dossiers médicaux, de documents contenant des données de patients ni d'informations inutiles sur d'autres personnes. Vous pouvez masquer ce qui n'est pas nécessaire à la vérification, à condition que votre nom et votre numéro d'inscription restent lisibles.",
  declarationTitle: "Déclaration",
  declarationText: "Je déclare que le prénom, le nom, le numéro d'inscription et les autres informations fournies sont exacts, à jour et me concernent. Je confirme être autorisé à présenter le document joint aux fins de la vérification professionnelle et ne pas avoir inclus de données de patients ni d'informations non pertinentes concernant des tiers. Je suis conscient que de fausses déclarations, des documents altérés ou l'utilisation non autorisée des données ou des identifiants d'autres personnes peuvent entraîner le refus ou la révocation de la vérification et la suspension du compte, dans les limites des Conditions d'utilisation, en plus des éventuelles conséquences prévues par la loi.",
  declarationAccept: "J'ai lu et j'accepte cette déclaration",
  privacyLink: "Comment nous traitons les données de vérification (politique de confidentialité)",
  continue: "Vérifier avant d'envoyer",
  reviewTitle: "Vérifiez vos informations",
  reviewHint: "Rien n'a encore été envoyé. Corrigez ce qui ne va pas, puis envoyez la demande.",
  edit: "Modifier",
  sendRequest: "Envoyer pour vérification",
  documentMissing: "Joignez le justificatif d'inscription.",
  documentTooLarge: "Le fichier dépasse 4 Mo.",
  documentType: "Seuls les fichiers PDF, JPEG ou PNG sont acceptés.",
  declarationRequired: "Acceptez la déclaration pour continuer.",
  viewDocument: "Voir le document envoyé",
  documentRemoved: "Le document a été supprimé après la décision, comme prévu.",
  fileLabel: "Fichier",
  newRequest: "Envoyer une nouvelle demande",
  aTitle: "Demandes de vérification professionnelle",
  aIntro: "Comparez vous-même la déclaration, le document et le registre officiel. Rien n'est vérifié automatiquement. L'approbation exige le document et un résultat « correspond » enregistré sur le registre officiel.",
  aDeclaration: "1. Déclaration de l'utilisateur",
  aDocument: "2. Document reçu",
  aRegistry: "3. Vérification sur le registre officiel",
  aDecision: "4. Décision finale",
  aOpenDocument: "Ouvrir le document (lien de 60 s)",
  aNoDocument: "Aucun document",
  aOpenRegister: "Ouvrir le registre officiel",
  aMatch: "Correspond",
  aMismatch: "Ne correspond pas",
  aNotFound: "Introuvable",
  aNotChecked: "Pas encore vérifié",
  aApprove: "Approuver",
  aAskInfo: "Demander des informations",
  aReject: "Refuser",
  aRevoke: "Révoquer la vérification",
  aMessage: "Message à l'utilisateur (obligatoire pour refuser ou demander des informations ; aucune donnée de tiers)",
  aNote: "Note interne (non visible par l'utilisateur)",
  aCategory: "Catégorie du motif",
  aHistory: "Historique",
  aNoRequests: "Aucune demande.",
  aAdminRequired: "Accès réservé aux administrateurs.",
  aLegacy: "Aucune demande avec document (compte examiné avant l'exigence du document).",
  aCategories: {not_in_register: "Absent du registre", data_mismatch: "Données non concordantes", document_unreadable: "Document illisible", document_not_valid: "Document non valable", other: "Autre"},
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
