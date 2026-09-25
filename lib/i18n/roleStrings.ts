// PHYGO role-aware strings (Student vs Professional) — onboarding, navigation,
// and the future "Activate Professional Mode" transition. Kept as its own
// additive file for the same reason as lib/i18n/workspaceStrings.ts: these
// strings are used by Navbar.tsx and app/onboarding/page.tsx, which sit
// outside the Workspace feature, so bundling them into workspaceStrings.ts
// would be a confusing home for them; editing the 320KB shared uiStrings.ts
// directly is avoided for the same fragility reason documented there.
'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import type { AppLang } from '@/lib/i18n/uiStrings'

export type PracticeStage = 'student' | 'professional'
export type ProfessionalStatus = 'not_applicable' | 'pending' | 'verified'

interface RoleDict {
  nav: {
    workspace: string
  }
  onboarding: {
    roleQuestion: string
    studentTitle: string
    studentDescription: string
    professionalTitle: string
    professionalDescription: string
    continue: string
  }
  labels: {
    student: string
    professional: string
  }
  transition: {
    sectionTitle: string
    prompt: string
    cta: string
    confirmTitle: string
    confirmBody: string
    confirm: string
    cancel: string
    activated: string
  }
}

const it: RoleDict = {
  nav: { workspace: 'Workspace' },
  onboarding: {
    roleQuestion: 'Come userai PHYGO?',
    studentTitle: 'Studente',
    studentDescription: 'Studia fisioterapia, organizza i tuoi materiali e costruisci la tua conoscenza clinica.',
    professionalTitle: 'Fisioterapista',
    professionalDescription: 'Gestisci pazienti, lavoro clinico, valutazioni e riabilitazione.',
    continue: 'Continua',
  },
  labels: { student: 'Studente', professional: 'Fisioterapista' },
  transition: {
    sectionTitle: 'Stato professionale',
    prompt: 'Stai già esercitando come fisioterapista?',
    cta: 'Attiva modalità Professionista',
    confirmTitle: 'Attivare la modalità Professionista?',
    confirmBody: 'Il tuo Workspace, documenti, notebook e preferenze restano invariati. Sbloccherai Pazienti e Agenda nella navigazione principale.',
    confirm: 'Attiva',
    cancel: 'Annulla',
    activated: 'Modalità Professionista attiva',
  },
}

const en: RoleDict = {
  nav: { workspace: 'Workspace' },
  onboarding: {
    roleQuestion: 'How will you use PHYGO?',
    studentTitle: 'Student',
    studentDescription: 'Study physiotherapy, organize your materials and build your clinical knowledge.',
    professionalTitle: 'Physiotherapist',
    professionalDescription: 'Manage patients, clinical work, assessments and rehabilitation.',
    continue: 'Continue',
  },
  labels: { student: 'Student', professional: 'Physiotherapist' },
  transition: {
    sectionTitle: 'Professional status',
    prompt: 'Are you now practicing as a physiotherapist?',
    cta: 'Activate Professional Mode',
    confirmTitle: 'Activate Professional Mode?',
    confirmBody: 'Your Workspace, documents, notebooks and preferences stay exactly as they are. Patients and Agenda will unlock in the main navigation.',
    confirm: 'Activate',
    cancel: 'Cancel',
    activated: 'Professional Mode active',
  },
}

const es: RoleDict = {
  nav: { workspace: 'Workspace' },
  onboarding: {
    roleQuestion: '¿Cómo vas a usar PHYGO?',
    studentTitle: 'Estudiante',
    studentDescription: 'Estudia fisioterapia, organiza tus materiales y construye tu conocimiento clínico.',
    professionalTitle: 'Fisioterapeuta',
    professionalDescription: 'Gestiona pacientes, trabajo clínico, evaluaciones y rehabilitación.',
    continue: 'Continuar',
  },
  labels: { student: 'Estudiante', professional: 'Fisioterapeuta' },
  transition: {
    sectionTitle: 'Estado profesional',
    prompt: '¿Ya ejerces como fisioterapeuta?',
    cta: 'Activar modo Profesional',
    confirmTitle: '¿Activar el modo Profesional?',
    confirmBody: 'Tu Workspace, documentos, cuadernos y preferencias permanecen igual. Pacientes y Agenda se desbloquearán en la navegación principal.',
    confirm: 'Activar',
    cancel: 'Cancelar',
    activated: 'Modo Profesional activo',
  },
}

const fr: RoleDict = {
  nav: { workspace: 'Workspace' },
  onboarding: {
    roleQuestion: 'Comment allez-vous utiliser PHYGO ?',
    studentTitle: 'Étudiant',
    studentDescription: 'Étudiez la kinésithérapie, organisez vos supports et construisez vos connaissances cliniques.',
    professionalTitle: 'Kinésithérapeute',
    professionalDescription: 'Gérez vos patients, votre travail clinique, vos évaluations et la rééducation.',
    continue: 'Continuer',
  },
  labels: { student: 'Étudiant', professional: 'Kinésithérapeute' },
  transition: {
    sectionTitle: 'Statut professionnel',
    prompt: 'Exercez-vous désormais en tant que kinésithérapeute ?',
    cta: 'Activer le mode Professionnel',
    confirmTitle: 'Activer le mode Professionnel ?',
    confirmBody: 'Votre Workspace, vos documents, notebooks et préférences restent inchangés. Patients et Agenda seront débloqués dans la navigation principale.',
    confirm: 'Activer',
    cancel: 'Annuler',
    activated: 'Mode Professionnel actif',
  },
}

export const ROLE_STRINGS: Record<AppLang, RoleDict> = { it, en, es, fr }

export function useRoleUi() {
  const { lang } = useLanguage()
  return ROLE_STRINGS[lang]
}
