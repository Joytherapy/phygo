import type { LandingDict } from '../landingStrings';

// Plain spaces before ; : ! ? — frenchTypography() in landingStrings.ts
// turns them into narrow no-break spaces.
export const fr: LandingDict = {
  meta: {
    title: 'PHYGO — La plateforme de kinésithérapie, des études à la pratique clinique',
    description:
      'Pour les étudiants en kinésithérapie et les kinésithérapeutes : anatomie 3D, plus de {n} pathologies, quiz et espace d’étude — et des notes SOAP préparées par l’IA que vous relisez, des programmes d’exercices et le suivi des patients. Compte gratuit.',
    descriptionNoCount:
      'Pour les étudiants en kinésithérapie et les kinésithérapeutes : anatomie 3D, une bibliothèque de pathologies, quiz et espace d’étude — et des notes SOAP préparées par l’IA que vous relisez, des programmes d’exercices et le suivi des patients. Compte gratuit.',
    ogLocale: 'fr_FR',
  },
  nav: {
    students: 'Étudiants',
    physiotherapists: 'Kinésithérapeutes',
    library: 'Bibliothèque',
    trust: 'IA et données',
    pricing: 'Tarifs',
    faq: 'FAQ',
    login: 'Se connecter',
    startFree: 'Créer un compte',
    openMenu: 'Ouvrir le menu',
    closeMenu: 'Fermer le menu',
    language: 'Langue',
    darkMode: 'Passer au thème sombre',
    lightMode: 'Passer au thème clair',
    home: 'Accueil PHYGO',
    skip: 'Aller au contenu',
  },
  hero: {
    eyebrow: 'Pour les étudiants en kinésithérapie et les kinésithérapeutes',
    title: 'Une seule plateforme de kinésithérapie, du premier examen d’anatomie à la pratique clinique au quotidien.',
    sub: 'Les étudiants apprennent avec l’anatomie 3D, une bibliothèque clinique, des quiz et un espace d’étude. Les kinésithérapeutes documentent leurs séances avec des notes SOAP préparées par l’IA et relues par eux, planifient les exercices et suivent leurs patients.',
    cta: 'Commencer gratuitement',
    note: 'Compte gratuit · sans carte bancaire · choisissez Étudiant ou Kinésithérapeute lors de la configuration',
    imageAlt:
      'Écran de séance de PHYGO : un brouillon SOAP pour un patient de démonstration avec Findings, Assessment, Plan et Follow-up, et les boutons Download PDF et Save to Patient',
    secondImageAlt: 'Carte du corps 3D de PHYGO : un modèle anatomique du corps entier',
    caption: 'Écrans réels de PHYGO avec un patient de démonstration fictif.',
    choose: 'Choisissez votre parcours',
    paths: {
      students: {
        title: 'Pour les étudiants',
        text: 'Anatomie en 3D, pathologies, quiz et votre propre espace d’étude.',
        link: 'Voir le parcours étudiant',
      },
      physiotherapists: {
        title: 'Pour les kinésithérapeutes',
        text: 'Notes de séance, programmes d’exercices, suivi des patients et Agenda au même endroit.',
        link: 'Voir le parcours kinésithérapeute',
      },
    },
  },
  students: {
    eyebrow: 'Pour les étudiants',
    title: 'Étudiez avec les connaissances qu’utilisent les cliniciens.',
    intro: 'De l’anatomie au raisonnement clinique : explorez, testez-vous et gardez vos documents au même endroit, à votre rythme.',
    tablistLabel: 'Outils pour les étudiants',
    steps: [
      {
        label: 'Anatomie',
        title: 'Explorez le corps en 3D',
        text: 'Faites pivoter et zoomez sur un modèle anatomique, passez en mode rayons X pour voir les os et ouvrez les pathologies, tests et protocoles de chaque région.',
        alt: 'Carte du corps 3D de PHYGO : un modèle anatomique du corps entier avec une recherche par zone et un bouton rayons X',
      },
      {
        label: 'Neuroanatomie',
        title: 'Cerveau, nerfs et circuits',
        text: 'Un cerveau en 3D avec ses structures profondes, ainsi que les nerfs périphériques et les circuits neuronaux, reliés aux pathologies neurologiques de la bibliothèque.',
        alt: 'Carte du cerveau de PHYGO : un modèle 3D rotatif du cerveau humain',
      },
      {
        label: 'Quiz',
        title: 'Testez-vous',
        text: 'Des quiz dans 14 matières sur trois niveaux, avec des questions générées à partir des contenus de PHYGO et une progression suivie matière par matière.',
        alt: 'Page des quiz de PHYGO avec 14 matières, de l’anatomie et la biologie jusqu’à l’oncologie et au périnée',
      },
      {
        label: 'Workspace',
        title: 'Votre espace d’étude',
        text: 'Importez et annotez vos PDF, organisez carnets et dossiers et reprenez là où vous vous étiez arrêté. Sélectionnez un passage d’un PDF pour le chercher dans la bibliothèque PHYGO.',
        alt: 'Workspace de PHYGO avec un document à reprendre, trois dossiers, deux carnets et deux PDF avec leur progression de lecture',
      },
    ],
    extrasTitle: 'Également inclus',
    extras: [
      'Evidence Hub : nouveaux essais et revues issus de PubMed, résumés selon la même structure clinique',
      'Bibliothèques spécialisées : médecine du sport, cardiorespiratoire, périnée, oncologie, premiers secours et BLS',
      'Ask PHYGO, un assistant pour vos questions, avec des limites horaires',
    ],
    cta: 'Commencer en tant qu’étudiant',
    ctaNote: 'Choisissez « Étudiant » lors de la configuration du compte. Les outils patients et les notes de séance avec IA sont réservés aux comptes professionnels ; vous pourrez basculer une fois diplômé.',
    caption: 'Écrans réels de PHYGO ; les contenus du workspace sont des exemples.',
    modelCredit: 'Modèles 3D',
  },
  physiotherapists: {
    eyebrow: 'Pour les kinésithérapeutes',
    title: 'De la séance au suivi, en un seul parcours.',
    intro: 'PHYGO prépare chaque brouillon ; vous décidez de ce qui est enregistré et partagé avec votre patient.',
    tablistLabel: 'Étapes du parcours',
    steps: [
      {
        label: 'Séance',
        title: 'Dictez ou écrivez',
        text: 'Racontez la séance à voix haute ou saisissez vos notes en français, anglais, italien ou espagnol. La dictée utilise la reconnaissance vocale du navigateur (dans Chrome, l’audio est traité par le fournisseur du navigateur).',
        alt: 'Écran de séance de PHYGO pendant la préparation du brouillon : les observations saisies pour un patient de démonstration au-dessus des champs vides Findings, Assessment, Plan et Follow-up',
      },
      {
        label: 'Note SOAP',
        title: 'Relisez le brouillon et son raisonnement',
        text: 'PHYGO prépare Subjectif, Objectif, Évaluation et Plan, et montre son raisonnement avec prudence : hypothèses, diagnostics différentiels, drapeaux rouges et informations manquantes. Tout est modifiable avant l’enregistrement.',
        alt: 'Panneau de raisonnement clinique d’un brouillon : hypothèses, diagnostics différentiels, éléments en faveur, informations manquantes, examens suggérés et drapeaux rouges',
      },
      {
        label: 'Exercices',
        title: 'Prescrivez exercices et phases',
        text: 'Les exercices proposés précisent séries, répétitions et fréquence, et sont ajustés au protocole par phases de la pathologie quand la bibliothèque en a un. Vous gardez, modifiez ou retirez chacun d’eux.',
        alt: 'Exercices avec séries et répétitions, chacun avec des boutons modifier et supprimer, au-dessus d’un protocole de rééducation en trois phases avec objectifs et critères de progression',
      },
      {
        label: 'Suivi',
        title: 'Partagez-le dans My Phygo',
        text: 'À l’enregistrement, la note rejoint le dossier du patient. Votre patient, invité par vous, retrouve dans My Phygo le résumé, les exercices et l’historique des séances : uniquement ce que vous avez enregistré.',
        alt: 'Vue patient de My Phygo : résumé de la dernière séance, trois exercices avec séries et répétitions et l’historique des séances',
      },
    ],
    extrasTitle: 'Autour de la séance',
    extras: [
      'Dossiers patients avec l’historique des séances',
      'Agenda avec les demandes de rendez-vous envoyées depuis My Phygo',
      'Tests orthopédiques, échelles fonctionnelles, examen neurologique et questionnaires périnéaux',
      'PDF de la note avec exercices, résumé pour le patient et protocole de rééducation',
      'Résumé écrit d’un compte rendu ou d’une image importée, avec ses incertitudes : ce n’est pas un diagnostic et l’image n’est pas conservée',
      'Événements : formations, congrès et certifications pour la formation continue',
    ],
    videoItem: 'Visioconférences avec vos patients, qui se connectent depuis My Phygo',
    cta: 'Commencer en tant que kinésithérapeute',
    ctaNote: 'Choisissez « Kinésithérapeute » lors de la configuration du compte. La gestion des patients et les notes de séance avec IA sont débloquées une fois votre inscription professionnelle vérifiée par PHYGO.',
    caption: 'Écrans réels de PHYGO avec un patient de démonstration fictif et des contenus d’exemple.',
    patients: {
      title: 'Vous êtes patient ?',
      text: 'My Phygo est accessible sur invitation de votre kinésithérapeute. Après connexion, il est pour l’instant disponible en anglais.',
      cta: 'Se connecter à My Phygo',
    },
  },
  figures: {
    conditions: 'Plus de {n} pathologies avec tests, drapeaux rouges et niveau de preuve',
    conditionsFallback: 'Bibliothèque de pathologies avec tests, drapeaux rouges et niveau de preuve',
    protocols: 'Plus de {n} protocoles de rééducation par phases',
    protocolsFallback: 'Protocoles de rééducation par phases',
    exercises: 'Plus de {n} exercices en vidéo',
    exercisesFallback: 'Bibliothèque d’exercices en vidéo',
    libraryCta: 'Parcourir la bibliothèque sans compte',
    translationNote: 'Les fiches en anglais, espagnol et français sont traduites automatiquement depuis la source italienne et signalées comme telles.',
  },
  trust: {
    eyebrow: 'IA et données',
    title: 'Clairs sur ce que fait l’IA — et sur ce qui reste entre vos mains.',
    intro: 'PHYGO accompagne l’apprentissage et la documentation. Il ne pose pas de diagnostic et n’agit pas seul.',
    columns: [
      {
        title: 'Ce que fait l’IA',
        items: [
          'Prépare la note, le raisonnement et des propositions d’exercices à partir de ce que vous dictez ou saisissez',
          'Résume avec prudence une image que vous importez',
          'Pour cela, le texte de la séance et les images sont traités par notre fournisseur d’IA (OpenAI, via son API)',
        ],
      },
      {
        title: 'Ce qui reste entre vos mains',
        items: [
          'Chaque brouillon est modifiable ; rien n’entre dans le dossier avant que vous l’enregistriez',
          'Rien ne parvient au patient sans que vous l’enregistriez ou le partagiez',
          'Les fonctions cliniques avec IA sont réservées aux professionnels vérifiés : chaque inscription est contrôlée à la main dans le registre public',
        ],
      },
      {
        title: 'Mesures en place',
        items: [
          'Les données sont stockées dans l’UE (Supabase, Francfort) ; les fonctions de l’application s’exécutent actuellement aux États-Unis (Vercel)',
          'L’accès est vérifié côté serveur pour chaque requête clinique',
          'Des règles de base de données séparent les patients de chaque praticien',
          'Les images importées ne sont pas conservées',
        ],
      },
    ],
    privacy: 'Lire la politique de confidentialité (projet)',
  },
  pricing: {
    eyebrow: 'Tarifs',
    title: 'Gratuit aujourd’hui, pour les étudiants et les kinésithérapeutes.',
    sub: 'Le compte gratuit est la seule offre disponible : sans carte bancaire, sans paiement.',
    free: {
      label: 'Disponible aujourd’hui',
      name: 'Compte gratuit',
      price: 'Gratuit',
      items: [
        'Bibliothèque clinique, cartes 3D du corps et du cerveau, exercices en vidéo',
        'Quiz, Workspace, Evidence Hub et Événements',
        'Pour les kinésithérapeutes, après vérification : patients, Agenda, notes SOAP préparées par l’IA et My Phygo',
      ],
      limits: 'Ask PHYGO a des limites horaires et la Pro Library n’est pas incluse.',
      cta: 'Commencer gratuitement',
    },
    planned: {
      title: 'Offres payantes plus tard',
      text: 'Les offres Starter, Professional et Clinic sont prévues mais pas encore disponibles à l’achat. Rien ne peut être acheté aujourd’hui.',
    },
  },
  faq: {
    eyebrow: 'FAQ',
    title: 'Questions fréquentes',
    items: [
      {
        q: 'Quelle différence entre un compte étudiant et un compte kinésithérapeute ?',
        a: 'Les deux sont gratuits et comprennent les bibliothèques, l’anatomie 3D, les quiz, le workspace et PHYGO World. Le compte kinésithérapeute ajoute les dossiers patients, l’Agenda, les notes de séance préparées par l’IA et les invitations My Phygo, une fois l’inscription professionnelle vérifiée par PHYGO.',
      },
      {
        q: 'Puis-je passer d’un compte étudiant à un compte kinésithérapeute ?',
        a: 'Oui. Une fois diplômé, passez à l’espace professionnel depuis votre profil et envoyez les informations de votre inscription pour vérification.',
      },
      {
        q: 'PHYGO remplace-t-il le jugement clinique ?',
        a: 'Non. Chaque note, synthèse du raisonnement et proposition d’exercices est un brouillon que le kinésithérapeute relit, modifie et valide. Le raisonnement est rédigé comme une aide prudente à la décision, avec les drapeaux rouges et les informations manquantes en évidence. PHYGO ne pose pas de diagnostic.',
      },
      {
        q: 'Comment les données des patients sont-elles traitées ?',
        a: 'Les données sont stockées dans une base de données dans l’UE (Francfort) ; les fonctions de l’application s’exécutent actuellement aux États-Unis. Chaque praticien n’accède qu’à ses propres patients et l’accès est vérifié côté serveur. Le texte de la séance et les images importées sont traités par notre fournisseur d’IA pour créer les brouillons ; PHYGO ne conserve pas les images importées. La dictée utilise la reconnaissance vocale du navigateur, qui dans Chrome traite l’audio via le fournisseur du navigateur. Les détails figurent dans la politique de confidentialité, actuellement un projet en cours de relecture juridique.',
      },
      {
        q: 'Quelles langues PHYGO prend-il en charge ?',
        a: 'Les séances peuvent être dictées ou saisies en français, anglais, italien ou espagnol, et le brouillon suit cette langue. Le site, l’inscription et la bibliothèque clinique publique existent dans les quatre langues ; les fiches en anglais, espagnol et français sont traduites automatiquement depuis la source italienne et signalées comme telles. Après connexion, My Phygo est pour l’instant en anglais, sauf le profil métabolique.',
      },
      {
        q: 'D’où vient le contenu de la bibliothèque ?',
        a: 'Les fiches sont rédigées à partir de la littérature publiée et des recommandations cliniques. Chacune indique son niveau de preuve et cite ses sources lorsqu’elles existent. La couverture varie selon la pathologie : utilisez la bibliothèque comme point de départ de votre propre raisonnement.',
      },
    ],
  },
  final: {
    title: 'Des études à la pratique, sur une seule plateforme.',
    text: 'Créez un compte gratuit et choisissez Étudiant ou Kinésithérapeute.',
    cta: 'Commencer gratuitement',
    note: 'Sans carte bancaire.',
  },
  footer: {
    tagline: 'La plateforme de kinésithérapie, des études à la pratique clinique.',
    product: 'Produit',
    library: 'Bibliothèque',
    pricing: 'Tarifs',
    privacy: 'Confidentialité',
    terms: 'Conditions',
    contact: 'Contact',
    rights: 'Tous droits réservés.',
    navLabel: 'Site',
    languageLabel: 'Langue',
  },
};
