import type { LandingDict } from '../landingStrings';

export const en: LandingDict = {
  meta: {
    title: 'PHYGO — The physiotherapy platform, from study to clinical practice',
    description:
      'For physiotherapy students and physiotherapists: 3D anatomy, {n}+ clinical conditions, quizzes and a study workspace — plus AI-drafted SOAP notes you review, exercise plans and patient follow-up. Free account.',
    descriptionNoCount:
      'For physiotherapy students and physiotherapists: 3D anatomy, a clinical conditions library, quizzes and a study workspace — plus AI-drafted SOAP notes you review, exercise plans and patient follow-up. Free account.',
    ogLocale: 'en_GB',
  },
  nav: {
    students: 'For students',
    physiotherapists: 'For physiotherapists',
    library: 'Library',
    trust: 'Privacy & AI',
    pricing: 'Pricing',
    faq: 'FAQ',
    login: 'Log in',
    startFree: 'Start free',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    language: 'Language',
    darkMode: 'Switch to dark mode',
    lightMode: 'Switch to light mode',
    home: 'PHYGO home',
    skip: 'Skip to content',
  },
  hero: {
    eyebrow: 'For physiotherapy students and physiotherapists',
    title: 'One physiotherapy platform, from your first anatomy exam to everyday clinical practice.',
    sub: 'Students learn with 3D anatomy, a clinical library, quizzes and a study workspace. Physiotherapists document sessions with AI-drafted SOAP notes they review, plan exercises and follow up with their patients.',
    cta: 'Start free',
    note: 'Free account · no credit card · choose Student or Physiotherapist when you set up',
    imageAlt:
      'PHYGO session screen: a SOAP draft for a demo patient with Findings, Assessment, Plan and Follow-up, and the buttons Download PDF and Save to Patient',
    secondImageAlt: 'PHYGO 3D body map: an anatomical model of the whole body',
    caption: 'Real PHYGO screens with a synthetic demo patient.',
    choose: 'Choose your path',
    paths: {
      students: {
        title: 'For students',
        text: 'Anatomy in 3D, clinical conditions, quizzes and your own study workspace.',
        link: 'See the student path',
      },
      physiotherapists: {
        title: 'For physiotherapists',
        text: 'Session notes, exercise plans, patient follow-up and the Agenda in one place.',
        link: 'See the physiotherapist path',
      },
    },
  },
  students: {
    eyebrow: 'For students',
    title: 'Study with the knowledge clinicians work with.',
    intro: 'From anatomy to clinical reasoning: explore, test yourself and keep your material in one place, at your own pace.',
    tablistLabel: 'Student tools',
    steps: [
      {
        label: 'Anatomy',
        title: 'Explore the body in 3D',
        text: 'Rotate and zoom an anatomical model, switch to X-ray to see the bones, and open the conditions, tests and protocols of each region.',
        alt: 'PHYGO 3D body map: an anatomical model of the whole body with a zone search field and an X-ray switch',
      },
      {
        label: 'Neuroanatomy',
        title: 'Brain, nerves and circuits',
        text: 'A 3D brain with its deep structures, plus peripheral nerves and neural circuits, linked to the neurological conditions in the library.',
        alt: 'PHYGO brain map: a rotating 3D model of the human brain',
      },
      {
        label: 'Quiz',
        title: 'Test yourself',
        text: 'Quizzes in 14 subjects at three levels, with questions generated from PHYGO content and progress tracked subject by subject.',
        alt: 'PHYGO quiz page with 14 subjects, from anatomy and biology to oncology and pelvic floor',
      },
      {
        label: 'Workspace',
        title: 'Your study space',
        text: 'Import and annotate PDFs, keep notebooks and folders, and pick up where you left off. Select text in a PDF to look it up in the PHYGO library.',
        alt: 'PHYGO workspace with a document to continue, three folders, two notebooks and two PDFs with reading progress',
      },
    ],
    extrasTitle: 'Also included',
    extras: [
      'Evidence Hub: new trials and reviews from PubMed, summarised in one clinical structure',
      'Specialty libraries: sports medicine, cardiopulmonary, pelvic floor, oncology, first aid and BLS',
      'Ask PHYGO, an assistant for your questions, with hourly limits',
    ],
    cta: 'Start free as a student',
    ctaNote: 'Choose “Student” when you set up your account. Patient tools and AI session notes are for professional accounts; you can switch once you are qualified.',
    caption: 'Real PHYGO screens; workspace items are sample content.',
    modelCredit: '3D models',
  },
  physiotherapists: {
    eyebrow: 'For physiotherapists',
    title: 'From the session to the follow-up, in one workflow.',
    intro: 'PHYGO prepares each draft; you decide what is saved and shared with your patient.',
    tablistLabel: 'Workflow steps',
    steps: [
      {
        label: 'Session',
        title: 'Dictate or type',
        text: 'Talk through the session or type your notes in English, Italian, Spanish or French. Dictation uses your browser’s speech recognition (in Chrome, audio is processed by the browser provider).',
        alt: 'PHYGO session screen while the draft is being prepared: the typed observations of a demo patient above empty Findings, Assessment, Plan and Follow-up fields',
      },
      {
        label: 'SOAP note',
        title: 'Review the draft and its reasoning',
        text: 'PHYGO drafts Subjective, Objective, Assessment and Plan, and shows its reasoning in cautious terms: hypotheses, differentials, red flags and missing information. Edit anything before you save.',
        alt: 'Clinical reasoning panel of a draft: hypotheses, differential considerations, supporting findings, missing information, suggested assessments and red flags',
      },
      {
        label: 'Exercises',
        title: 'Prescribe exercises and phases',
        text: 'Exercise suggestions come with sets, reps and frequency, refined against the condition’s phased protocol when the library has one. Keep, adjust or remove each one.',
        alt: 'Exercises with sets and repetitions, each with edit and delete buttons, above a three-phase rehab protocol with goals and progression criteria',
      },
      {
        label: 'Follow-up',
        title: 'Share it in My Phygo',
        text: 'When you save, the note joins the patient’s record. Your patient, invited by you, sees the summary, the exercises and the session history in My Phygo — only what you saved.',
        alt: 'My Phygo patient view: summary from the last session, three exercises with sets and repetitions, and the session history',
      },
    ],
    extrasTitle: 'Around the session',
    extras: [
      'Patient records with session history',
      'Agenda with appointment requests sent from My Phygo',
      'Orthopaedic tests, functional scales, neurological examination and pelvic-floor questionnaires',
      'PDF of the note with exercises, patient summary and rehab protocol',
      'Written summary of an uploaded report or scan, phrased with its uncertainty — not a diagnosis; the image is not stored',
      'Events: courses, congresses and certifications for continuing education',
    ],
    videoItem: 'Video calls with your patients, joined from My Phygo',
    cta: 'Start free as a physiotherapist',
    ctaNote: 'Choose “Physiotherapist” when you set up your account. Patient management and AI session notes unlock once PHYGO has verified your professional registration.',
    caption: 'Real PHYGO screens with a synthetic demo patient and sample content.',
    patients: {
      title: 'Are you a patient?',
      text: 'My Phygo is by invitation from your physiotherapist. After sign-in it is currently available in English.',
      cta: 'Sign in to My Phygo',
    },
  },
  figures: {
    conditions: '{n}+ clinical conditions with tests, red flags and evidence level',
    conditionsFallback: 'Clinical conditions library with tests, red flags and evidence level',
    protocols: '{n}+ phased rehab protocols',
    protocolsFallback: 'Phased rehab protocols',
    exercises: '{n}+ exercises with video',
    exercisesFallback: 'Exercise library with video',
    libraryCta: 'Browse the library without an account',
    translationNote: 'English, Spanish and French library entries are machine-translated from the Italian source and labelled as such.',
  },
  trust: {
    eyebrow: 'Privacy & AI',
    title: 'Clear about what the AI does — and what stays with you.',
    intro: 'PHYGO supports learning and documentation. It does not diagnose and does not act on its own.',
    columns: [
      {
        title: 'What the AI does',
        items: [
          'Drafts the note, the reasoning and exercise suggestions from what you dictate or type',
          'Summarises an image you upload in cautious language',
          'To do this, session text and images are processed by our AI provider (OpenAI, via its API)',
        ],
      },
      {
        title: 'What stays with you',
        items: [
          'Every draft is editable; nothing is saved to the record until you save it',
          'Nothing reaches the patient unless you save or share it',
          'Clinical AI features are for verified professionals: each registration is checked by hand against the public register',
        ],
      },
      {
        title: 'Safeguards in place',
        items: [
          'Data is stored in the EU (Supabase, Frankfurt); the application’s functions currently run in the USA (Vercel)',
          'Access is checked on the server for every clinical request',
          'Database rules keep each clinician’s patients separate',
          'Uploaded images are not stored',
        ],
      },
    ],
    privacy: 'Read the privacy policy (draft)',
  },
  pricing: {
    eyebrow: 'Pricing',
    title: 'Free to use today, for students and physiotherapists.',
    sub: 'A free account is the only offer available — no credit card, no payment.',
    free: {
      label: 'Available today',
      name: 'Free account',
      price: 'Free',
      items: [
        'Clinical library, 3D body and brain maps, exercises with video',
        'Quizzes, Workspace, Evidence Hub and Events',
        'For physiotherapists, after verification: patients, Agenda, AI-drafted SOAP notes and My Phygo',
      ],
      limits: 'Ask PHYGO has hourly limits, and the Pro Library is not included.',
      cta: 'Start free',
    },
    planned: {
      title: 'Paid plans later',
      text: 'Starter, Professional and Clinic plans are planned but not yet available for purchase. Nothing can be bought today.',
    },
  },
  faq: {
    eyebrow: 'FAQ',
    title: 'Frequently asked questions',
    items: [
      {
        q: 'What is the difference between a student and a physiotherapist account?',
        a: 'Both are free and include the libraries, 3D anatomy, quizzes, the workspace and PHYGO World. Physiotherapist accounts add patient records, the Agenda, AI-drafted session notes and My Phygo invitations once PHYGO has verified the professional registration.',
      },
      {
        q: 'Can I switch from a student to a physiotherapist account?',
        a: 'Yes. Once you are qualified, switch to the professional workspace from your profile and submit your registration details for verification.',
      },
      {
        q: 'Does PHYGO replace clinical judgement?',
        a: 'No. Every note, reasoning summary and exercise suggestion is a draft the physiotherapist reviews, edits and approves. The reasoning is written as cautious decision support, with red flags and missing information listed. PHYGO does not diagnose.',
      },
      {
        q: 'How is patient data handled?',
        a: 'Data is stored in a database in the EU (Frankfurt); the application’s functions currently run in the USA. Each clinician reaches only their own patients, and access is checked on the server. Session text and uploaded images are processed by our AI provider to create drafts; uploaded images are not stored by PHYGO. Dictation uses your browser’s speech recognition, which in Chrome processes audio through the browser provider. Details are in the privacy policy, currently a draft under legal review.',
      },
      {
        q: 'Which languages does PHYGO support?',
        a: 'Sessions can be dictated or typed in English, Italian, Spanish or French, and the draft follows that language. The website, sign-up and public clinical library are available in all four; English, Spanish and French library entries are machine-translated from the Italian source and labelled. My Phygo is currently in English after sign-in, except the metabolic profile.',
      },
      {
        q: 'Where does the library content come from?',
        a: 'Entries are compiled from published literature and clinical guidelines. Each shows its evidence level and cites sources where available. Coverage varies by condition, so treat the library as a starting point for your own reasoning.',
      },
    ],
  },
  final: {
    title: 'From study to practice, on one platform.',
    text: 'Create a free account and choose Student or Physiotherapist.',
    cta: 'Start free',
    note: 'No credit card required.',
  },
  footer: {
    tagline: 'The physiotherapy platform, from study to clinical practice.',
    product: 'Product',
    library: 'Library',
    pricing: 'Pricing',
    privacy: 'Privacy',
    terms: 'Terms',
    contact: 'Contact',
    rights: 'All rights reserved.',
    navLabel: 'Site',
    languageLabel: 'Language',
  },
};
