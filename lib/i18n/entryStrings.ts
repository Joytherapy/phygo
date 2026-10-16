// Strings for the entry pages reached from the public site: /login (log in
// and sign up), /onboarding (name step; the role step uses roleStrings.ts),
// /my-phygo/login and /my-phygo/join/[code]. Language comes from
// useEntryLang(). Additive file, like agendaStrings.ts.

import type { AppLang } from '@/lib/i18n/uiStrings';
import { frenchTypography } from '@/lib/i18n/landingStrings';

type EntryDict = {
  login: {
    loginTitle: string;
    signupTitle: string;
    loginSub: string;
    signupSub: string;
    email: string;
    password: string;
    wait: string;
    loginCta: string;
    signupCta: string;
    noAccount: string;
    signUp: string;
    haveAccount: string;
    logIn: string;
    invalidCredentials: string;
    alreadyRegistered: string;
    weakPassword: string;
    patientHint: string;
    patientLink: string;
    terms: string;
    privacy: string;
  };
  onboarding: {
    welcome: string;
    askName: string;
    namePlaceholder: string;
    saving: string;
    roleSub: string;
    sessionExpired: string;
  };
  portal: {
    loginTitle: string;
    loginSub: string;
    email: string;
    password: string;
    loginError: string;
    signingIn: string;
    signIn: string;
    joinTitle: string;
    joinSub: string;
    creating: string;
    create: string;
    inviteInvalid: string;
    inviteConfirmEmail: string;
    haveAccount: string;
    noAccountHint: string;
    professionalLink: string;
  };
};

const en: EntryDict = {
  login: {
    loginTitle: 'Welcome back',
    signupTitle: 'Create your account',
    loginSub: 'Log in to your PHYGO account',
    signupSub: 'Start your free PHYGO account — for physiotherapists and physiotherapy students',
    email: 'Email',
    password: 'Password',
    wait: 'Please wait…',
    loginCta: 'Log in',
    signupCta: 'Create account',
    noAccount: "Don't have an account?",
    signUp: 'Sign up',
    haveAccount: 'Already have an account?',
    logIn: 'Log in',
    invalidCredentials: 'Incorrect email or password. Please try again.',
    alreadyRegistered: 'An account with this email already exists. Log in instead.',
    weakPassword: 'The password must be at least 6 characters long.',
    patientHint: 'Are you a patient?',
    patientLink: 'Go to My Phygo',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
  },
  onboarding: {
    welcome: 'Welcome to PHYGO',
    askName: 'What should we call you?',
    namePlaceholder: 'e.g. Andrea',
    saving: 'Saving…',
    roleSub: 'this shapes your PHYGO home — you can change it anytime from your profile.',
    sessionExpired: 'Session expired — please sign in again.',
  },
  portal: {
    loginTitle: 'Welcome back',
    loginSub: 'Sign in to access your My Phygo portal.',
    email: 'Email',
    password: 'Password',
    loginError: 'Incorrect email or password. Please try again.',
    signingIn: 'Signing in…',
    signIn: 'Sign in',
    joinTitle: 'Welcome to My Phygo',
    joinSub:
      'Your physiotherapist has invited you. Create your account to access your treatment plan, session history, and more.',
    creating: 'Creating your account…',
    create: 'Create account',
    inviteInvalid:
      'Your account was created, but this invite link is invalid or expired. Please ask your physiotherapist for a new one.',
    inviteConfirmEmail:
      'Your account was created. Confirm your email with the message we sent you, then open this invite link again and enter the same email and password.',
    haveAccount: 'Already have an account?',
    noAccountHint: 'New to My Phygo? Your physiotherapist sends you a personal invitation link to create your account.',
    professionalLink: 'Physiotherapist or student? Log in here',
  },
};

const it: EntryDict = {
  login: {
    loginTitle: 'Bentornato',
    signupTitle: 'Crea il tuo account',
    loginSub: 'Accedi al tuo account PHYGO',
    signupSub: 'Crea il tuo account PHYGO gratuito — per fisioterapisti e studenti di fisioterapia',
    email: 'Email',
    password: 'Password',
    wait: 'Attendi…',
    loginCta: 'Accedi',
    signupCta: 'Crea account',
    noAccount: 'Non hai un account?',
    signUp: 'Registrati',
    haveAccount: 'Hai già un account?',
    logIn: 'Accedi',
    invalidCredentials: 'Email o password non corrette. Riprova.',
    alreadyRegistered: 'Esiste già un account con questa email. Accedi.',
    weakPassword: 'La password deve contenere almeno 6 caratteri.',
    patientHint: 'Sei un paziente?',
    patientLink: 'Vai a My Phygo',
    terms: 'Termini di servizio',
    privacy: 'Informativa sulla privacy',
  },
  onboarding: {
    welcome: 'Benvenuto in PHYGO',
    askName: 'Come vuoi che ti chiamiamo?',
    namePlaceholder: 'es. Andrea',
    saving: 'Salvataggio…',
    roleSub: 'questa scelta definisce la tua home di PHYGO — puoi cambiarla quando vuoi dal tuo profilo.',
    sessionExpired: 'Sessione scaduta: accedi di nuovo.',
  },
  portal: {
    loginTitle: 'Bentornato',
    loginSub: 'Accedi al tuo portale My Phygo.',
    email: 'Email',
    password: 'Password',
    loginError: 'Email o password non corrette. Riprova.',
    signingIn: 'Accesso in corso…',
    signIn: 'Accedi',
    joinTitle: 'Benvenuto in My Phygo',
    joinSub:
      'Il tuo fisioterapista ti ha invitato. Crea il tuo account per accedere al tuo piano di trattamento, allo storico delle sedute e altro ancora.',
    creating: 'Creazione dell’account…',
    create: 'Crea account',
    inviteInvalid:
      'Il tuo account è stato creato, ma questo link di invito non è valido o è scaduto. Chiedi al tuo fisioterapista di inviartene uno nuovo.',
    inviteConfirmEmail:
      'Il tuo account è stato creato. Conferma la tua email con il messaggio che ti abbiamo inviato, poi riapri questo link di invito e inserisci la stessa email e la stessa password.',
    haveAccount: 'Hai già un account?',
    noAccountHint: 'Prima volta su My Phygo? Il tuo fisioterapista ti invia un link di invito personale per creare l’account.',
    professionalLink: 'Sei un fisioterapista o uno studente? Accedi qui',
  },
};

const es: EntryDict = {
  login: {
    loginTitle: 'Te damos la bienvenida de nuevo',
    signupTitle: 'Crea tu cuenta',
    loginSub: 'Inicia sesión en tu cuenta de PHYGO',
    signupSub: 'Crea tu cuenta gratuita de PHYGO — para fisioterapeutas y estudiantes de fisioterapia',
    email: 'Correo electrónico',
    password: 'Contraseña',
    wait: 'Un momento…',
    loginCta: 'Iniciar sesión',
    signupCta: 'Crear cuenta',
    noAccount: '¿No tienes cuenta?',
    signUp: 'Regístrate',
    haveAccount: '¿Ya tienes cuenta?',
    logIn: 'Inicia sesión',
    invalidCredentials: 'Correo electrónico o contraseña incorrectos. Inténtalo de nuevo.',
    alreadyRegistered: 'Ya existe una cuenta con este correo. Inicia sesión.',
    weakPassword: 'La contraseña debe tener al menos 6 caracteres.',
    patientHint: '¿Eres paciente?',
    patientLink: 'Ir a My Phygo',
    terms: 'Condiciones del servicio',
    privacy: 'Política de privacidad',
  },
  onboarding: {
    welcome: 'Te damos la bienvenida a PHYGO',
    askName: '¿Cómo quieres que te llamemos?',
    namePlaceholder: 'p. ej., Andrea',
    saving: 'Guardando…',
    roleSub: 'esto define tu inicio en PHYGO — puedes cambiarlo cuando quieras desde tu perfil.',
    sessionExpired: 'La sesión ha caducado: vuelve a iniciar sesión.',
  },
  portal: {
    loginTitle: 'Te damos la bienvenida de nuevo',
    loginSub: 'Inicia sesión para acceder a tu portal My Phygo.',
    email: 'Correo electrónico',
    password: 'Contraseña',
    loginError: 'Correo electrónico o contraseña incorrectos. Inténtalo de nuevo.',
    signingIn: 'Iniciando sesión…',
    signIn: 'Iniciar sesión',
    joinTitle: 'Te damos la bienvenida a My Phygo',
    joinSub:
      'Tu fisioterapeuta te ha invitado. Crea tu cuenta para acceder a tu plan de tratamiento, al historial de sesiones y mucho más.',
    creating: 'Creando tu cuenta…',
    create: 'Crear cuenta',
    inviteInvalid:
      'Tu cuenta se ha creado, pero este enlace de invitación no es válido o ha caducado. Pide a tu fisioterapeuta uno nuevo.',
    inviteConfirmEmail:
      'Tu cuenta se ha creado. Confirma tu correo con el mensaje que te hemos enviado, luego vuelve a abrir este enlace de invitación e introduce el mismo correo y la misma contraseña.',
    haveAccount: '¿Ya tienes cuenta?',
    noAccountHint: '¿Es tu primera vez en My Phygo? Tu fisioterapeuta te envía un enlace de invitación personal para crear tu cuenta.',
    professionalLink: '¿Eres fisioterapeuta o estudiante? Inicia sesión aquí',
  },
};

const fr: EntryDict = {
  login: {
    loginTitle: 'Bon retour parmi nous',
    signupTitle: 'Créez votre compte',
    loginSub: 'Connectez-vous à votre compte PHYGO',
    signupSub: 'Créez votre compte PHYGO gratuit — pour les kinésithérapeutes et les étudiants en kinésithérapie',
    email: 'E-mail',
    password: 'Mot de passe',
    wait: 'Patientez…',
    loginCta: 'Se connecter',
    signupCta: 'Créer un compte',
    noAccount: 'Pas encore de compte ?',
    signUp: 'Inscrivez-vous',
    haveAccount: 'Vous avez déjà un compte ?',
    logIn: 'Connectez-vous',
    invalidCredentials: 'E-mail ou mot de passe incorrect. Veuillez réessayer.',
    alreadyRegistered: 'Un compte existe déjà avec cet e-mail. Connectez-vous.',
    weakPassword: 'Le mot de passe doit comporter au moins 6 caractères.',
    patientHint: 'Vous êtes patient ?',
    patientLink: 'Aller sur My Phygo',
    terms: 'Conditions d’utilisation',
    privacy: 'Politique de confidentialité',
  },
  onboarding: {
    welcome: 'Bienvenue sur PHYGO',
    askName: 'Comment souhaitez-vous que l’on vous appelle ?',
    namePlaceholder: 'ex. Andrea',
    saving: 'Enregistrement…',
    roleSub: 'ce choix définit votre accueil PHYGO — vous pouvez le modifier à tout moment depuis votre profil.',
    sessionExpired: 'Session expirée : veuillez vous reconnecter.',
  },
  portal: {
    loginTitle: 'Bon retour parmi nous',
    loginSub: 'Connectez-vous pour accéder à votre portail My Phygo.',
    email: 'E-mail',
    password: 'Mot de passe',
    loginError: 'E-mail ou mot de passe incorrect. Veuillez réessayer.',
    signingIn: 'Connexion…',
    signIn: 'Se connecter',
    joinTitle: 'Bienvenue sur My Phygo',
    joinSub:
      'Votre kinésithérapeute vous a invité. Créez votre compte pour accéder à votre plan de traitement, à l’historique de vos séances et plus encore.',
    creating: 'Création du compte…',
    create: 'Créer un compte',
    inviteInvalid:
      'Votre compte a été créé, mais ce lien d’invitation n’est pas valide ou a expiré. Demandez-en un nouveau à votre kinésithérapeute.',
    inviteConfirmEmail:
      'Votre compte a été créé. Confirmez votre e-mail avec le message que nous vous avons envoyé, puis rouvrez ce lien d’invitation et saisissez le même e-mail et le même mot de passe.',
    haveAccount: 'Vous avez déjà un compte ?',
    noAccountHint: 'Première visite sur My Phygo ? Votre kinésithérapeute vous envoie un lien d’invitation personnel pour créer votre compte.',
    professionalLink: 'Kinésithérapeute ou étudiant ? Connectez-vous ici',
  },
};

export const ENTRY_STRINGS: Record<AppLang, EntryDict> = { en, it, es, fr: frenchTypography(fr) };

/** Maps the most common Supabase auth errors to localized text; anything else is shown as returned. */
export function localizeAuthError(message: string, t: EntryDict['login']): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return t.invalidCredentials;
  if (m.includes('already registered') || m.includes('already been registered')) return t.alreadyRegistered;
  if (m.includes('password should be at least')) return t.weakPassword;
  return message;
}
