import type { LandingDict } from '../landingStrings';

// Written with plain spaces before ; : ! ? — frenchTypography() in
// landingStrings.ts converts them to narrow no-break spaces at load time.
export const fr: LandingDict = {
  meta: {
    title: 'PHYGO — L’espace de travail clinique de la kinésithérapie',
    description:
      'Des notes SOAP préparées par l’IA que vous relisez et validez, plus de {n} pathologies, l’anatomie en 3D et la prescription d’exercices : un seul espace de travail pour les kinésithérapeutes.',
    descriptionNoCount:
      'Des notes SOAP préparées par l’IA que vous relisez et validez, une bibliothèque de pathologies, l’anatomie en 3D et la prescription d’exercices : un seul espace de travail pour les kinésithérapeutes.',
    ogLocale: 'fr_FR',
  },
  nav: {
    tour: 'Produit',
    library: 'Bibliothèque',
    pricing: 'Tarifs',
    faq: 'FAQ',
    login: 'Se connecter',
    startFree: 'Essai gratuit',
    openMenu: 'Ouvrir le menu',
    closeMenu: 'Fermer le menu',
    language: 'Langue',
    darkMode: 'Passer au thème sombre',
    lightMode: 'Passer au thème clair',
    home: 'Accueil PHYGO',
    skip: 'Aller au contenu',
  },
  hero: {
    eyebrow: 'L’espace de travail clinique de la kinésithérapie',
    title: 'Du premier mot\nau *plan de rééducation.*',
    sub: 'PHYGO transforme ce que vous observez en séance en un brouillon SOAP structuré, le relie à {conditions}, à l’anatomie en 3D et à {exercises} — et vous laisse chaque décision clinique.',
    conditionsPhrase: 'plus de {n} pathologies',
    conditionsFallback: 'une bibliothèque de pathologies',
    exercisesPhrase: 'plus de {n} exercices en vidéo',
    exercisesFallback: 'une bibliothèque d’exercices en vidéo',
    ctaPrimary: 'Commencer gratuitement',
    ctaSecondary: 'Découvrir le produit',
    assurances: ['Gratuit pour commencer', 'Sans carte bancaire', 'FR · EN · IT · ES'],
    caption: 'Interface illustrative avec un cas fictif. Chaque brouillon attend votre relecture.',
    stage: {
      windowTitle: 'Séance · Patient fictif',
      draft: 'Brouillon · non enregistré',
      sidebar: ['Patients', 'Copilote', 'Pathologies', 'Carte du corps', 'Exercices', 'Données probantes'],
      voiceLabel: 'Dictée',
      voiceText: '« …arc douloureux entre 70 et 120 degrés, plus faible en rotation externe… »',
      linkedLabel: 'Pathologie associée',
      evidence: 'Niveau de preuve : élevé',
      exerciseLabel: 'Brouillon d’exercices',
      phasesLabel: 'Phases de rééducation',
      reviewSave: 'Relire et enregistrer',
      ariaLabel:
        'Interface illustrative de PHYGO : un brouillon de séance relié à la bibliothèque clinique, aux exercices et aux phases de rééducation',
    },
  },
  proof: {
    conditions: 'pathologies',
    exercises: 'exercices en vidéo',
    protocols: 'protocoles de rééducation par phases',
    languages: 'langues',
    mapsValue: '3D',
    maps: 'cartes du corps et du cerveau',
  },
  story: {
    eyebrow: 'Le produit',
    title: 'Un patient. *Un seul flux de travail.*',
    intro:
      'Suivez un cas fictif dans PHYGO : de ce que vous entendez en séance à un plan de rééducation prêt à être validé.',
    caseLabel: 'Cas fictif · épaule droite, 3 semaines',
    chapters: [
      {
        kicker: 'Comprendre',
        title: 'Notez la séance comme vous la pensez.',
        text: 'Dictez ou tapez vos notes naturellement, en français, anglais, italien ou espagnol. La transcription se fait dans le navigateur, sans modèle rigide à suivre.',
      },
      {
        kicker: 'Organiser',
        title: 'Un brouillon SOAP structuré, raisonnement à l’appui.',
        text: 'Subjectif, objectif, évaluation et plan — avec hypothèses, diagnostics différentiels, drapeaux rouges et informations encore manquantes, rédigés comme une aide à la décision.',
      },
      {
        kicker: 'Explorer',
        title: 'Les connaissances utiles, déjà reliées.',
        text: 'L’évaluation est associée à la bibliothèque clinique : objectifs, tests cliniques, drapeaux rouges et exercices types de la pathologie, à un clic.',
      },
      {
        kicker: 'Prescrire',
        title: 'Des exercices dosés, pas seulement nommés.',
        text: 'Des propositions d’exercices avec séries, répétitions et fréquence, ajustées au protocole par phases de la pathologie lorsqu’il existe. Dans la bibliothèque d’exercices, chaque exercice est accompagné d’une vidéo de démonstration.',
      },
      {
        kicker: 'Planifier et valider',
        title: 'Vous décidez de ce qui entre au dossier.',
        text: 'Modifiez ou écartez ce que vous voulez. À l’enregistrement, le plan et un résumé en langage simple deviennent accessibles à votre patient dans My Phygo — et vous pouvez exporter un PDF à tout moment.',
      },
    ],
    listening: 'À l’écoute',
    languagesPill: 'FR · EN · IT · ES',
    transcript:
      '42 ans, douleur à l’épaule droite depuis trois semaines, depuis le début d’un entraînement au-dessus de la tête. Arc douloureux entre 70 et 120 degrés, plus faible en rotation externe contre résistance. Pas de traumatisme, pas de douleur nocturne.',
    soapLabels: ['Subjectif', 'Objectif', 'Évaluation', 'Plan'],
    soap: [
      'Douleur à l’épaule droite depuis 3 semaines, apparue avec l’entraînement au-dessus de la tête. Pas de traumatisme, pas de douleur nocturne.',
      'Arc douloureux 70–120°. Force diminuée en rotation externe contre résistance.',
      'Le tableau pourrait être compatible avec une douleur d’épaule liée à la coiffe des rotateurs.',
      'Mise en charge progressive de la coiffe des rotateurs et des muscles scapulaires ; réévaluation dans 2 semaines.',
    ],
    reasoning: [
      { label: 'Hypothèse', text: 'Douleur d’épaule possiblement liée à la coiffe des rotateurs' },
      { label: 'Diagnostics différentiels', text: 'Envisager une douleur projetée cervicale ou une capsulite rétractile débutante' },
      { label: 'Drapeaux rouges', text: 'Aucun apparent d’après les informations fournies' },
      { label: 'Informations manquantes', text: 'Intensité de la douleur et une mesure de résultat initiale (ex. SPADI)' },
    ],
    linkedLabel: 'Reliée depuis la bibliothèque',
    region: 'Carte du corps · Épaule',
    exercises: [
      { name: 'Rotation externe isométrique', dose: '5 × 30 s · tous les jours' },
      { name: 'Rotation externe en décubitus latéral', dose: '3 × 12 · un jour sur deux' },
      { name: 'Rétraction scapulaire avec élastique', dose: '3 × 15 · tous les jours' },
    ],
    videoLabel: 'Vidéo',
    fromLibrary: 'Depuis la bibliothèque d’exercices',
    phasesLabel: 'Phases de rééducation',
    current: 'En cours',
    review: 'Relire et enregistrer',
    savedTo: 'Partagé avec le patient après enregistrement',
    portalTitle: 'My Phygo · vue patient',
    portalText:
      'En ce moment, votre épaule est sensible aux charges au-dessus de la tête. Faites vos trois exercices chaque jour et gardez les levers au-dessus de la tête sans douleur.',
    pdf: 'Exporter en PDF',
    caption:
      'Cas fictif à titre d’illustration. Le nom de la pathologie et les phases de rééducation proviennent de la véritable bibliothèque PHYGO.',
    chapterNav: 'Chapitres de la présentation du produit',
  },
  library: {
    eyebrow: 'Bibliothèque clinique',
    title: 'Plus de {n} pathologies.\n*Une seule structure clinique.*',
    titleNoCount: 'Une bibliothèque clinique pensée\n*comme votre raisonnement.*',
    intro:
      'Tableaux orthopédiques, neurologiques, cardio-respiratoires, oncologiques, pelvi-périnéaux et bien d’autres — chaque fiche s’organise autour des questions que vous vous posez en cabinet, et se consulte librement, sans compte.',
    countLabel: 'pathologies et affections, en direct depuis la bibliothèque',
    namesLabel: 'Une sélection des pathologies de la bibliothèque',
    coverageTitle: 'Ce que contient chaque fiche',
    coverageLive: 'Couverture en direct · {n} fiches',
    fields: {
      goals: 'Objectifs de rééducation',
      clinical_tests: 'Tests cliniques',
      red_flags: 'Drapeaux rouges',
      contraindications: 'Contre-indications',
      typical_exercises: 'Exercices types',
      progression_criteria: 'Critères de progression',
      return_to_activity_criteria: 'Critères de reprise d’activité',
      outcome_measures: 'Mesures de résultat',
      source: 'Sources citées',
      phased: 'Protocoles de rééducation par phases',
    },
    coverageNote:
      'Toutes les fiches ne comportent pas encore chaque rubrique. Chaque pathologie indique son niveau de preuve et, lorsqu’elles existent, ses sources. La bibliothèque soutient le jugement clinique ; elle ne le remplace pas.',
    featuredKicker: 'Une vraie fiche de la bibliothèque',
    evidence: 'Niveau de preuve',
    levels: { high: 'Élevé', moderate: 'Modéré', low: 'Faible', strong: 'Fort' },
    tabs: {
      goals: 'Objectifs',
      clinical_tests: 'Tests cliniques',
      red_flags: 'Drapeaux rouges',
      typical_exercises: 'Exercices',
    },
    phasesLabel: 'Phases de rééducation',
    excerptTranslated: 'Extrait · traduit de la source italienne',
    excerptSource: 'Extrait de la fiche originale',
    openEntry: 'Ouvrir la fiche complète',
    cta: 'Explorer la bibliothèque',
    languages: 'Consultable en français, anglais, italien ou espagnol',
    tablistLabel: 'Rubriques de la fiche {name}',
  },
  anatomy: {
    eyebrow: 'Anatomie et neuroanatomie',
    title: 'Partez du corps.\n*Arrivez à la pathologie.*',
    intro:
      'Explorez des modèles 3D interactifs, sélectionnez une région et accédez directement aux pathologies associées — et, pour les régions du corps, aux programmes d’exercices.',
    body: {
      title: 'Carte du corps',
      text: 'Un modèle musculo-squelettique en 3D avec des régions sélectionnables. Chaque région ouvre ses pathologies et programmes d’exercices associés.',
      regions: ['Épaule', 'Rachis lombaire', 'Genou', 'Cheville'],
      caption: 'Illustration simplifiée — l’application utilise un modèle 3D interactif.',
      svgLabel: 'Silhouette illustrative du corps avec des régions sélectionnables',
    },
    brain: {
      title: 'Carte du cerveau',
      text: 'La neuroanatomie en 3D : aires cérébrales et nerfs périphériques reliés aux pathologies neurologiques que vous prenez en charge, avec des vues de référence comme celle-ci.',
      alt: 'Référence de neuroanatomie PHYGO : vue latérale du cerveau avec les lobes, le cervelet et le tronc cérébral, leurs fonctions et les syndromes lésionnels',
      caption: 'Vue de référence de la carte du cerveau PHYGO (légendes en anglais)',
    },
    systemsLabel: 'Et aussi, des explorateurs par système',
    systems: [
      'Plancher pelvien',
      'Cardio-respiratoire',
      'Endocrinien',
      'Gastro-intestinal',
      'Urinaire',
      'Immunitaire',
      'Hématologie',
      'Oncologie',
      'Fascias',
      'Physiologie',
    ],
  },
  tools: {
    eyebrow: 'Données probantes et outils professionnels',
    title: 'La bibliothèque de référence\n*d’un cabinet moderne.*',
    intro:
      'Recherche, outils d’évaluation et connaissances spécialisées — à côté du patient que vous prenez en charge, pas dans un autre onglet.',
    columns: [
      {
        title: 'Des données probantes, filtrées',
        text: 'Les nouvelles études PubMed sont vérifiées chaque jour. Seuls les essais contrôlés randomisés, les revues systématiques et les méta-analyses en kinésithérapie sont importés, puis résumés selon une structure fixe.',
        items: [
          'Question clinique, population et intervention',
          'Principaux résultats et interprétation clinique',
          'Publication automatique seulement au-dessus d’un seuil de qualité',
          'Études associées affichées à côté des brouillons du copilote',
        ],
      },
      {
        title: 'Outils d’évaluation',
        text: 'Les tests et échelles que vous utilisez chaque semaine, à portée de main pendant la rédaction.',
        items: [
          'Tests orthopédiques spécifiques',
          'Échelles fonctionnelles et mesures de résultat',
          'Examen neurologique',
          'Questionnaires pelvi-périnéaux',
          'Calculateur métabolique et des besoins énergétiques',
        ],
      },
      {
        title: 'Bibliothèques spécialisées',
        text: 'De la profondeur au-delà du musculo-squelettique.',
        items: [
          'Médecine du sport et retour au jeu',
          'Réadaptation cardio-respiratoire et désencombrement bronchique',
          'Rééducation pelvi-périnéale',
          'Rééducation en oncologie',
          'Premiers secours et BLS par pays',
        ],
      },
    ],
  },
  workspace: {
    eyebrow: 'L’espace de travail',
    title: 'Votre cabinet,\n*connecté.*',
    intro:
      'La documentation et les connaissances ne sont que la moitié du travail. PHYGO réunit aussi vos patients, votre agenda et vos supports d’étude au même endroit.',
    items: [
      {
        title: 'Patients et séances',
        text: 'Les notes enregistrées, les plans et les références cliniques de chaque patient dans un seul dossier : la séance suivante reprend là où la précédente s’est arrêtée.',
      },
      {
        title: 'My Phygo pour les patients',
        text: 'Invitez vos patients avec un code. Ils voient le plan, les exercices et le résumé que vous avez enregistrés — rien que vous n’ayez validé.',
      },
      {
        title: 'Agenda',
        text: 'Planifiez vos séances et laissez les patients associés demander des rendez-vous que vous confirmez.',
      },
      {
        title: 'Documents et carnets',
        text: 'Importez des PDF, surlignez et annotez-les, tenez des carnets et interrogez PHYGO sur ce que vous lisez.',
      },
      {
        title: 'Mode étudiant',
        text: 'Pour les étudiants en kinésithérapie : l’espace de travail, les bibliothèques de connaissances et des quiz par matière et par niveau.',
      },
    ],
  },
  trust: {
    eyebrow: 'Responsabilité clinique',
    title: 'Conçu pour soutenir votre jugement,\n*jamais pour le remplacer.*',
    intro:
      'PHYGO est un outil de documentation et de connaissances destiné aux professionnels qualifiés. Il ne pose pas de diagnostic et n’agit jamais auprès des patients sans vous.',
    items: [
      {
        title: 'Des brouillons, pas des décisions',
        text: 'Ce que produit l’IA est une proposition. Le raisonnement est formulé comme une aide à la décision, et rien n’entre dans le dossier du patient avant que vous ne l’enregistriez.',
      },
      {
        title: 'Des données à accès contrôlé',
        text: 'Stockées dans une base de données hébergée dans l’UE (Francfort), chiffrées en transit et au repos, avec une sécurité au niveau des lignes : chaque compte n’accède qu’à ses propres patients.',
      },
      {
        title: 'Un traitement par l’IA transparent',
        text: 'Pour créer un brouillon, le texte de la séance — et toute image importée — est traité par notre fournisseur d’IA. Les données cliniques ne servent pas à entraîner des modèles tiers.',
      },
      {
        title: 'Des preuves à pondérer',
        text: 'Les fiches de la bibliothèque indiquent leur niveau de preuve et citent leurs sources lorsqu’elles existent : c’est vous qui décidez du poids à leur accorder.',
      },
    ],
    privacy: 'Lire la politique de confidentialité',
  },
  pricing: {
    eyebrow: 'Tarifs',
    title: 'Des offres qui évoluent\n*avec votre cabinet.*',
    sub: 'Créez votre compte gratuitement, sans carte bancaire.',
    monthly: 'Mensuel',
    annual: 'Annuel',
    save: '20 % d’économie',
    perMonth: '/mois',
    custom: 'Sur mesure',
    popular: 'Le plus choisi',
    billingLabel: 'Facturation annuelle',
    tiers: [
      {
        description: 'Pour les praticiens indépendants qui démarrent.',
        features: ['50 séances par mois', 'Notes cliniques avec l’IA', 'Export PDF', 'Assistance par e-mail'],
        cta: 'Commencer gratuitement',
      },
      {
        description: 'Pour les cabinets à temps plein, au quotidien.',
        features: [
          'Séances illimitées',
          'Notes cliniques avec l’IA + résumés pour le patient',
          'Bibliothèque d’exercices',
          'Assistance prioritaire',
        ],
        cta: 'Commencer gratuitement',
      },
      {
        description:
          'Pour les cabinets de groupe. Les fonctions d’équipe sont en développement : dites-nous ce dont votre cabinet a besoin.',
        features: [
          'Tout ce que comprend Professional',
          'Comptes multi-praticiens (en développement)',
          'Historique patient partagé (en développement)',
          'Prise en main personnalisée',
        ],
        cta: 'Nous contacter',
      },
    ],
  },
  faq: {
    eyebrow: 'Questions',
    title: 'Ce que les kinés\n*nous demandent.*',
    items: [
      {
        q: 'PHYGO remplace-t-il mon jugement clinique ?',
        a: 'Non. PHYGO prépare la documentation et met à portée de main les connaissances utiles. Chaque note, synthèse du raisonnement et proposition d’exercices est un brouillon que vous relisez, modifiez et validez. PHYGO ne pose pas de diagnostic et ne contacte pas les patients de lui-même.',
      },
      {
        q: 'Et si l’IA se trompe ?',
        a: 'Cela peut arriver : c’est pourquoi rien n’entre dans le dossier du patient avant que vous ne l’enregistriez. Le raisonnement est rédigé comme une aide prudente à la décision, avec les drapeaux rouges et les informations manquantes bien en vue, pour le confronter facilement à votre propre évaluation.',
      },
      {
        q: 'Comment les données des patients sont-elles traitées ?',
        a: 'Les données cliniques sont stockées dans une base de données hébergée dans l’UE (Francfort), chiffrées en transit et au repos, avec une sécurité au niveau des lignes : chaque compte n’accède qu’à ses propres patients. Le texte des séances et les images importées sont traités par notre fournisseur d’IA pour créer les brouillons et ne servent pas à entraîner des modèles tiers. Tous les détails figurent dans la politique de confidentialité.',
      },
      {
        q: 'D’où vient le contenu de la bibliothèque ?',
        a: 'Les fiches sont rédigées à partir de la littérature publiée et des recommandations cliniques. Chacune indique son niveau de preuve et cite ses sources lorsqu’elles existent. La couverture varie selon les pathologies : considérez la bibliothèque comme un point de départ pour votre propre raisonnement.',
      },
      {
        q: 'Quelles langues PHYGO prend-il en charge ?',
        a: 'Vous pouvez dicter ou saisir vos séances en français, anglais, italien ou espagnol. La bibliothèque publique de pathologies et la bibliothèque d’exercices sont disponibles dans ces quatre mêmes langues.',
      },
      {
        q: 'Puis-je d’abord l’essayer sur un cas fictif ?',
        a: 'Oui. Créez un compte gratuit et lancez le copilote sur un cas inventé pour voir les brouillons qu’il produit avant de l’utiliser en pratique.',
      },
      {
        q: 'Combien coûte le démarrage ?',
        a: 'La création d’un compte est gratuite et ne nécessite pas de carte bancaire.',
      },
    ],
  },
  final: {
    title: 'Consacrez votre attention au patient,\n*pas à la paperasse.*',
    text: 'Créez un compte gratuit et essayez le copilote, la bibliothèque clinique et les outils d’exercices lors de votre prochaine séance.',
    cta: 'Commencer gratuitement',
    secondary: 'Parcourir d’abord la bibliothèque',
    note: 'Sans carte bancaire.',
  },
  footer: {
    tagline: 'L’espace de travail clinique de la kinésithérapie.',
    product: 'Produit',
    library: 'Bibliothèque',
    pricing: 'Tarifs',
    privacy: 'Confidentialité',
    terms: 'Conditions',
    contact: 'Contact',
    rights: 'Tous droits réservés.',
    languageLabel: 'Langue',
  },
  common: { illustrative: 'Illustratif' },
};
