// Shared dictionary of DASHBOARD UI CHROME strings — the small set of
// labels reused across many pages (nav items, section field headers like
// "Goals" / "Clinical Tests", common buttons). Most of Phygo's dashboard
// chrome was already written in English rather than Italian, so this file
// is short: it's the actual per-condition clinical CONTENT (goals, tests,
// exercises...) that is Italian and needs the lazy-translate-and-cache
// engines in lib/conditionTranslation.ts and lib/contentTranslation.ts —
// this file is only for the UI labels wrapped around that content.
//
// Add new keys here as more of the dashboard is wired up to be
// language-aware; nothing here requires a database migration or an
// OpenAI call, it's plain static strings written once per language.

export type AppLang = 'it' | 'en' | 'es' | 'fr';

export const APP_LANGS: AppLang[] = ['it', 'en', 'es', 'fr'];

export const APP_LANG_LABELS: Record<AppLang, string> = {
  it: 'Italiano',
  en: 'English',
  es: 'Español',
  fr: 'Français',
};

interface UiDict {
  clinicalActionBar: {
    addToTreatmentPlan: string;
    useWithPatient: string;
    startForPatient: string;
    useAsClinicalReference: string;
    recommendToPatient: string;
    selectPatient: string;
    addedFor: string;
    added: string;
    searchPlaceholder: string;
    searching: string;
    noPatientsFound: string;
  };
  nav: {
    patients: string;
    library: string;
    world: string;
    schedule: string;
    profile: string;
    signOut: string;
    startFree: string;
    search: string;
    liveDemo: string;
    features: string;
    trust: string;
    pricing: string;
    faq: string;
    currentPatient: string;
  };
  libraryLinks: {
    bodyMap: { label: string; description: string };
    neurology: { label: string; description: string };
    pelvicFloor: { label: string; description: string };
    cardiopulmonary: { label: string; description: string };
    endocrine: { label: string; description: string };
    fascia: { label: string; description: string };
    urinary: { label: string; description: string };
    physiology: { label: string; description: string };
    sportsMedicine: { label: string; description: string };
    gastrointestinal: { label: string; description: string };
    immune: { label: string; description: string };
    hematology: { label: string; description: string };
    oncology: { label: string; description: string };
    firstAid: { label: string; description: string };
    blsd: { label: string; description: string };
    clinicalTools: { label: string; description: string };
  };
  physiologyCrossLink: { question: string; cta: string };
  worldLinks: {
    science: { label: string; description: string };
    events: { label: string; description: string };
    shop: { label: string; description: string };
  };
  events: {
    badge: string;
    heading: string;
    subtitle: string;
    searchPlaceholder: string;
    filtersLabel: string;
    categoryLabel: string;
    typeLabel: string;
    dateLabel: string;
    locationLabel: string;
    audienceLabel: string;
    levelLabel: string;
    allLabel: string;
    onlineLabel: string;
    inPersonLabel: string;
    hybridLabel: string;
    freeLabel: string;
    paidLabel: string;
    datePresets: { today: string; thisWeek: string; thisMonth: string; next3Months: string; custom: string };
    featuredHeading: string;
    upcomingHeading: string;
    onlineHeading: string;
    nearYouHeading: string;
    viewEventCta: string;
    noEventsFound: string;
    loadingEvents: string;
    categoryLabels: Record<'physiotherapy' | 'rehabilitation' | 'sportsRehabilitation' | 'sportsMedicine' | 'orthopaedics' | 'neurology' | 'neurorehabilitation' | 'exerciseScience' | 'strengthConditioning' | 'manualTherapy' | 'painScience' | 'pelvicFloor' | 'cardiopulmonary' | 'oncology' | 'nutrition' | 'psychology' | 'yoga' | 'pilates' | 'mobility' | 'wellness' | 'longevity' | 'healthyAging' | 'prevention' | 'healthcareTechnology' | 'aiHealthcare' | 'digitalHealth' | 'research', string>;
    typeLabels: Record<'congress' | 'conference' | 'course' | 'workshop' | 'webinar' | 'masterclass' | 'seminar' | 'symposium' | 'certification', string>;
    audienceLabels: Record<'professionals' | 'students' | 'public' | 'both', string>;
    levelLabels: Record<'student' | 'beginner' | 'intermediate' | 'advanced' | 'expert', string>;
    statusLabels: Record<'upcoming' | 'updated' | 'dateChanged' | 'locationChanged' | 'cancelled' | 'soldOut' | 'registrationOpen' | 'registrationClosed' | 'completed', string>;
    verificationLabels: Record<'unverified' | 'source_verified' | 'organizer_verified' | 'phygo_verified', string>;
    verificationExplainer: string;
    organizerLabel: string;
    timeLabel: string;
    timezoneLabel: string;
    descriptionLabel: string;
    topicsLabel: string;
    speakersLabel: string;
    priceLabel: string;
    registrationDeadlineLabel: string;
    registerCta: string;
    officialWebsiteCta: string;
    saveEventCta: string;
    savedCta: string;
    backToEvents: string;
    eventNotFound: string;
    myEventsHeading: string;
    savedTab: string;
    upcomingTab: string;
    pastTab: string;
    noSavedEvents: string;
    signInToSave: string;
    providersHeading: string;
    providersSubtitle: string;
    visitProviderCta: string;
  };
  science: {
    badge: string;
    headingLead: string;
    headingAccent: string;
    subtitle: string;
    searchPlaceholder: string;
    loadingText: string;
    noResultsText: string;
    clinicalQuestionLabel: string;
    whyItMattersLabel: string;
    resultsCountSuffix: string;
    originalStudyCta: string;
  };
  shop: {
    eyebrow: string;
    heading: string;
    subtitle: string;
    curatedPicksSuffix: string;
    allLabel: string;
    viewOnAmazonCta: string;
    categoryLabels: Record<'Pelvic Floor' | 'Low Back' | 'Posture' | 'Mobility' | 'Recovery' | 'Body Composition' | 'Nutrition', string>;
  };
  fields: {
    goals: string;
    clinicalTests: string;
    typicalExercises: string;
    progressionCriteria: string;
    returnToActivityCriteria: string;
    outcomeMeasures: string;
    contraindications: string;
    redFlags: string;
    featuredExercises: string;
    source: string;
    evidence: string;
  };
  anatomy: {
    anatomy: string;
    innervation: string;
    biomechanics: string;
    clinicalRelevance: string;
    connections: string;
    vascularSupply: string;
    function: string;
  };
  evidenceLevels: {
    high: string;
    strong: string;
    moderate: string;
    low: string;
    limited: string;
  };
  common: {
    loading: string;
    save: string;
    saving: string;
    saved: string;
    backToPatients: string;
    machineTranslatedNotice: string;
  };
  brainMap: {
    atlasBadge: string;
    heading: string;
    subtitle: string;
    viewLabels: { brain: string; nerves: string; pathways: string };
    brainSubTabs: { atlas: string; conditions: string };
    deepStructuresHint: string;
    referenceViewsHint: string;
    nerveViewerHint: string;
    loading3DModel: string;
    dragRotateZoom: string;
    modelCreditPrefix: string;
    zoneNames: Record<
      | 'frontal-lobe'
      | 'parietal-lobe'
      | 'temporal-lobe'
      | 'occipital-lobe'
      | 'cerebellum'
      | 'brainstem'
      | 'basal-ganglia'
      | 'insula'
      | 'corpus-callosum'
      | 'thalamus'
      | 'hypothalamus'
      | 'amygdala'
      | 'hippocampus',
      string
    >;
    brainConditionsHeading: string;
    brainConditionsHint: string;
    searchConditionsPlaceholder: string;
    loadingConditions: string;
    errorLoadingConditions: string;
    noConditionsFound: string;
    relatedConditionsHeading: string;
    nervesSubTabs: {
      atlas: string;
      seddon: string;
      conduction: string;
      conditions: string;
      diffuse: string;
    };
    peripheralAtlasHeading: string;
    peripheralAtlasHint: string;
    regionAll: string;
    regionLabels: { plexus: string; upper_limb: string; lower_limb: string; cranial: string };
    askPhygoPrompt: string;
    askPhygoPlaceholder: string;
    askButton: string;
    loadingNerves: string;
    errorLoadingNerves: string;
    nerveInjuryHeading: string;
    nerveInjuryHint: string;
    nerveConductionHeading: string;
    nerveConductionHint: string;
    fiberDiameter: string;
    fiberMyelination: string;
    fiberVelocity: string;
    fiberFunction: string;
    snpConditionsHint: string;
    diffuseHeading: string;
    diffuseHint: string;
    loadingDiffuse: string;
    errorLoadingDiffuse: string;
    pathwaySubTabs: { circuits: string; gait: string; localization: string };
    pathwayCategoryLabels: { longTracts: string; brainCircuits: string };
    gaitHint: string;
    localizationHint: string;
    zone: {
      badge: string;
      geriatricHeading: string;
      noConditionsLinked: string;
      backToBrainMap: string;
      zoneNotFound: string;
    };
    nerve: {
      backToNeuroMap: string;
      errorLoadingNerve: string;
      anatomyAndCourse: string;
      motorFunction: string;
      sensoryFunction: string;
      compressionSite: string;
      clinicalSign: string;
      linkedConditions: string;
      noConditionsLinkedToNerve: string;
    };
  };
  oncology: {
    atlasBadge: string;
    heading: string;
    subTabs: { anatomy: string; conditions: string; treatments: string; assessment: string; rehab: string };
    anatomyHeading: string;
    anatomyHint: string;
    anatomyIntro: string;
    conditionsHeading: string;
    conditionsHint: string;
    treatmentsHeading: string;
    treatmentsHint: string;
    assessmentHeading: string;
    assessmentHint: string;
    rehabHeading: string;
    rehabHint: string;
    loading: string;
    errorLoadingStructures: string;
    errorLoadingConditions: string;
    errorLoadingTests: string;
    errorLoadingRehab: string;
    errorLoadingTreatments: string;
    procedureLabel: string;
    interpretationLabel: string;
    protocolLabel: string;
    ptImplicationsLabel: string;
    askPhygoPrompt: string;
    askPhygoPlaceholder: string;
    askButton: string;
    regionLabels: Record<
      | 'tumor-biology'
      | 'lymphatic-general'
      | 'breast'
      | 'gynecological'
      | 'prostate'
      | 'bladder'
      | 'lung'
      | 'brain'
      | 'head-neck'
      | 'colorectal'
      | 'systemic',
      string
    >;
    systemLabels: Record<
      | 'mammario'
      | 'ginecologico'
      | 'prostatico'
      | 'vescicale'
      | 'neuro-oncologico'
      | 'colon-retto'
      | 'polmonare'
      | 'testa-collo'
      | 'sarcoma'
      | 'ematologico'
      | 'sistemico',
      string
    >;
    testCategoryLabels: Record<'performance_status' | 'lymphedema_assessment' | 'red_flag_screening', string>;
    rehabCategoryLabels: Record<'linfedema' | 'complicanze_specifiche' | 'esercizio', string>;
    treatmentCategoryLabels: Record<
      'per_tipo_tumore' | 'diagnostica' | 'chirurgia' | 'farmacologico' | 'fisico',
      string
    >;
  };
  cardiopulmonary: {
    atlasBadge: string;
    heading: string;
    subTabs: { anatomy: string; conditions: string; assessment: string; rehab: string; airwayClearance: string };
    anatomyHeading: string;
    anatomyHint: string;
    anatomyIntro: string;
    conditionsHeading: string;
    conditionsHint: string;
    assessmentHeading: string;
    assessmentHint: string;
    rehabHeading: string;
    rehabHint: string;
    airwayHeading: string;
    airwayHint: string;
    loading: string;
    errorLoadingStructures: string;
    errorLoadingConditions: string;
    errorLoadingTests: string;
    errorLoadingRehab: string;
    errorLoadingAirway: string;
    procedureLabel: string;
    interpretationLabel: string;
    protocolLabel: string;
    patientPositionLabel: string;
    indicationsLabel: string;
    contraindicationsPrecautionsLabel: string;
    categoryLabels: Record<'cardiac' | 'circulatory' | 'respiratory' | 'thoracic_mechanics' | 'concept', string>;
    systemLabels: Record<'cardiac' | 'respiratory' | 'mixed_systemic', string>;
    testCategoryLabels: Record<'functional_capacity' | 'dyspnea_scale' | 'strength' | 'vital_signs' | 'consciousness', string>;
    rehabCategoryLabels: Record<
      'aerobic_training' | 'resistance_training' | 'post_surgical' | 'heart_failure' | 'respiratory_specific',
      string
    >;
    airwayCategoryLabels: Record<
      | 'postural_drainage'
      | 'manual'
      | 'active_breathing'
      | 'device_dependent'
      | 'machine_dependent'
      | 'ventilation_support'
      | 'dyspnoea_technique',
      string
    >;
    ageGroupLabels: Record<'adult' | 'paediatric' | 'both', string>;
  };
  endocrine: {
    atlasBadge: string;
    heading: string;
    subTabs: { anatomy: string; conditions: string; assessment: string; rehab: string };
    anatomyHeading: string;
    anatomyHint: string;
    anatomyIntro: string;
    conditionsHeading: string;
    conditionsHint: string;
    assessmentHeading: string;
    assessmentHint: string;
    rehabHeading: string;
    rehabHint: string;
    loading: string;
    errorLoadingStructures: string;
    errorLoadingConditions: string;
    errorLoadingTests: string;
    errorLoadingRehab: string;
    procedureLabel: string;
    interpretationLabel: string;
    protocolLabel: string;
    categoryLabels: Record<'axis' | 'concept' | 'gland', string>;
    testCategoryLabels: Record<'hormonal' | 'metabolic' | 'structural', string>;
    rehabCategoryLabels: Record<
      'bone_health' | 'fall_prevention' | 'hormone_replacement' | 'metabolic_training' | 'nutritional_support',
      string
    >;
  };
  fascia: {
    atlasBadge: string;
    heading: string;
    subTabs: { structures: string; function: string; treatments: string; rehab: string };
    structuresHeading: string;
    structuresHint: string;
    structuresIntro: string;
    functionHeading: string;
    functionHint: string;
    treatmentsHeading: string;
    treatmentsHint: string;
    rehabHeading: string;
    rehabHint: string;
    loading: string;
    errorLoadingStructures: string;
    errorLoadingFunction: string;
    errorLoadingTreatments: string;
    errorLoadingRehab: string;
    ptImplicationsLabel: string;
    protocolLabel: string;
    askPhygoPrompt: string;
    askPhygoPlaceholder: string;
    askButton: string;
    structureCategoryLabels: Record<
      | 'anatomia_generale'
      | 'istologia'
      | 'innervazione'
      | 'vascolarizzazione'
      | 'regolazione_ormonale'
      | 'contrattilita_miofibroblasti'
      | 'metodi_di_studio',
      string
    >;
    functionCategoryLabels: Record<
      'biotensegrita' | 'carico_e_nutrizione' | 'capacita_di_allungamento' | 'cammino_e_locomozione' | 'valutazione_posturale',
      string
    >;
    treatmentCategoryLabels: Record<
      | 'integrazione_strutturale'
      | 'terapia_dei_punti_trigger'
      | 'manipolazione_fasciale'
      | 'fascial_stretch_therapy'
      | 'gestione_delle_cicatrici'
      | 'riabilitazione_oncologica_fasciale'
      | 'auto_trattamento_miofasciale'
      | 'movimento_e_rieducazione_fasciale',
      string
    >;
    rehabCategoryLabels: Record<
      | 'post_surgical_scar_management'
      | 'progressive_loading'
      | 'movement_reeducation'
      | 'sports_performance'
      | 'chronic_pain_management',
      string
    >;
  };
  urinary: {
    atlasBadge: string;
    heading: string;
    subTabs: { anatomy: string; conditions: string; assessment: string; rehab: string };
    anatomyHeading: string;
    anatomyHint: string;
    anatomyIntro: string;
    conditionsHeading: string;
    conditionsHint: string;
    assessmentHeading: string;
    assessmentHint: string;
    rehabHeading: string;
    rehabHint: string;
    loading: string;
    errorLoadingStructures: string;
    errorLoadingConditions: string;
    errorLoadingTests: string;
    errorLoadingRehab: string;
    procedureLabel: string;
    interpretationLabel: string;
    protocolLabel: string;
    categoryLabels: Record<'organ' | 'physiology', string>;
    testCategoryLabels: Record<'imaging' | 'metabolic' | 'renal_function' | 'urinalysis', string>;
    rehabCategoryLabels: Record<'renal_training' | 'sports_nephrology', string>;
  };
  physiology: {
    atlasBadge: string;
    heading: string;
    systemTabs: { muscular: string; neurological: string; cellular: string };
    sectionHint: string;
    loading: string;
    errorLoading: string;
    clinicalRelevanceLabel: string;
    categoryLabels: Record<'contraction_mechanics' | 'fiber_types' | 'mechanics' | 'motor_control' | 'exercise_adaptation' | 'neuromuscular' | 'smooth_cardiac' | 'cellular_basics' | 'reflexes' | 'sensory' | 'plasticity' | 'autonomic' | 'membrane_transport' | 'chemical_messengers' | 'homeostasis' | 'energy_metabolism', string>;
  };
  sportsMedicine: {
    atlasBadge: string;
    heading: string;
    sectionHint: string;
    loading: string;
    errorLoading: string;
    clinicalRelevanceLabel: string;
    categoryLabels: Record<'injury_classification' | 'tissue_healing' | 'clinical_reasoning' | 'therapeutic_modalities' | 'on_field_emergency_rtp' | 'rehabilitation_programming', string>;
  };
  librarySearchPlaceholder: string;
  librarySearchNoResults: string;
  gastrointestinal: {
    atlasBadge: string;
    heading: string;
    subTabs: { anatomy: string; conditions: string; assessment: string; rehab: string };
    anatomyHeading: string;
    anatomyHint: string;
    anatomyIntro: string;
    conditionsHeading: string;
    conditionsHint: string;
    assessmentHeading: string;
    assessmentHint: string;
    rehabHeading: string;
    rehabHint: string;
    loading: string;
    errorLoadingStructures: string;
    errorLoadingConditions: string;
    errorLoadingTests: string;
    errorLoadingRehab: string;
    procedureLabel: string;
    interpretationLabel: string;
    protocolLabel: string;
    categoryLabels: Record<'organ' | 'system_overview', string>;
    testCategoryLabels: Record<
      'blood_panel' | 'endoscopy' | 'functional_test' | 'imaging' | 'serology' | 'stool_marker',
      string
    >;
    rehabCategoryLabels: Record<
      'chronic_disease_management' | 'gi_disease_management' | 'post_surgical' | 'sports_nutrition',
      string
    >;
  };
  immune: {
    atlasBadge: string;
    heading: string;
    subTabs: { anatomy: string; conditions: string; assessment: string; rehab: string };
    anatomyHeading: string;
    anatomyHint: string;
    anatomyIntro: string;
    conditionsHeading: string;
    conditionsHint: string;
    assessmentHeading: string;
    assessmentHint: string;
    rehabHeading: string;
    rehabHint: string;
    loading: string;
    errorLoadingStructures: string;
    errorLoadingConditions: string;
    errorLoadingTests: string;
    errorLoadingRehab: string;
    procedureLabel: string;
    interpretationLabel: string;
    protocolLabel: string;
    categoryLabels: Record<
      | 'cell_mediated_immunity'
      | 'humoral_immunity'
      | 'innate_immunity'
      | 'lymphatic_drainage'
      | 'primary_lymphoid_organ'
      | 'secondary_lymphoid_organ',
      string
    >;
    testCategoryLabels: Record<'functional' | 'hematologic' | 'immunologic' | 'inflammatory_marker', string>;
    rehabCategoryLabels: Record<
      | 'exercise_immunology'
      | 'immunosuppression_precautions'
      | 'inflammatory_arthritis_training'
      | 'lymphedema_management'
      | 'post_viral_rehabilitation',
      string
    >;
  };
  hematology: {
    atlasBadge: string;
    heading: string;
    subTabs: { anatomy: string; conditions: string; assessment: string; rehab: string };
    anatomyHeading: string;
    anatomyHint: string;
    anatomyIntro: string;
    conditionsHeading: string;
    conditionsHint: string;
    assessmentHeading: string;
    assessmentHint: string;
    rehabHeading: string;
    rehabHint: string;
    loading: string;
    errorLoadingStructures: string;
    errorLoadingConditions: string;
    errorLoadingTests: string;
    errorLoadingRehab: string;
    procedureLabel: string;
    interpretationLabel: string;
    protocolLabel: string;
    categoryLabels: Record<'cell_line' | 'fluid' | 'molecule' | 'process', string>;
    testCategoryLabels: Record<'coagulation' | 'diagnostic' | 'general' | 'metabolic', string>;
    rehabCategoryLabels: Record<
      'condition_specific' | 'exercise_prescription' | 'post_surgical' | 'precaution_protocol',
      string
    >;
  };
  clinicalToolkit: {
    badge: string;
    headingAccent: string;
    headingRest: string;
    subtitle: string;
    tabLabels: {
      functional: string;
      orthopedic: string;
      pelvicFloor: string;
      neuro: string;
      manualTherapy: string;
      metabolic: string;
    };
    manualTherapy: {
      mulliganPrinciplesHeading: string;
      mulliganPrinciplesHint: string;
      closeLabel: string;
      readLabel: string;
      loadingTechniques: string;
      errorLoadingTechniques: string;
      noTechniquesFound: string;
      patientPositionLabel: string;
      directionLabel: string;
      indicationsLabel: string;
      procedureLabel: string;
      regionLabels: Record<
        | 'ATM'
        | 'Colonna Cervicale'
        | 'Colonna Toracica'
        | 'Colonna Lombare e Pelvi'
        | 'Spalla'
        | 'Gomito'
        | 'Polso e Mano'
        | 'Anca'
        | 'Ginocchio'
        | 'Caviglia'
        | 'Piede',
        string
      >;
      typeLabels: Record<'all' | 'mobilization' | 'manipulation' | 'thrust' | 'nonthrust' | 'mwm' | 'prp', string>;
    };
    orthopedic: {
      regionLabels: Record<'knee' | 'shoulder' | 'hip' | 'spine' | 'ankle' | 'elbow-wrist' | 'cervical', string>;
      procedureLabel: string;
      positiveLabel: string;
      loading: string;
      errorLoadingTests: string;
    };
    pelvicFloor: {
      questionnaireCalloutHeading: string;
      questionnaireCalloutDescription: string;
      startQuestionnaireLabel: string;
      loading: string;
      errorLoadingTests: string;
      categoryLabels: Record<'neuropathy' | 'manual_assessment' | 'urodynamic' | 'questionnaire' | 'symptom_questionnaire', string>;
      procedureLabel: string;
      interpretationLabel: string;
      fillQuestionnaireLabel: string;
      hideQuestionnaireLabel: string;
      fillableBadge: string;
      loadingQuestionnaireContent: string;
      sf36: {
        domainLabels: Record<'PF' | 'RP' | 'RE' | 'VT' | 'MH' | 'SF' | 'BP' | 'GH', string>;
        scoreHeader: string;
        responsesLabel: string;
      };
      pfdi: {
        subscaleLabels: Record<'POPDI' | 'CRADI' | 'UDI', string>;
        scoreHeader: string;
        responsesLabel: string;
        severityLabels: { minimal: string; moderate: string; severe: string };
      };
      iciq: {
        severityPrefix: string;
        severityLabels: { mild: string; moderate: string; severe: string; verySevere: string };
      };
    };
    neuro: {
      calloutHeading: string;
      calloutDescription: string;
      startExamLabel: string;
      loading: string;
      errorLoadingTests: string;
      categoryLabels: Record<'cranial_nerves' | 'reflexes' | 'sensation' | 'strength' | 'coordination' | 'balance_gait', string>;
      procedureLabel: string;
      interpretationLabel: string;
    };
    functional: {
      loading: string;
      errorLoadingScales: string;
      yesLabel: string;
      noLabel: string;
      secondsUnit: string;
      secondsMax120Unit: string;
      metersUnit: string;
      groupLabels: Record<
        | 'balanceFalls'
        | 'adl'
        | 'cognitiveConsciousness'
        | 'painTone'
        | 'aerobicQol'
        | 'strokeNeurodegenerative'
        | 'upperLimb'
        | 'orthopedics'
        | 'trunkGlobalDisability',
        string
      >;
    };
  };
  metabolicCalculator: {
    badge: string;
    heading: string;
    subtitle: string;
    disclaimer: string;
    sexLabel: string;
    sexOptions: { male: string; female: string };
    ageLabel: string;
    weightLabel: string;
    heightLabel: string;
    activityLabel: string;
    activityLevels: { sedentary: string; light: string; moderate: string; very: string; extreme: string };
    bodyFatLabel: string;
    bodyFatOptionalHint: string;
    goalLabel: string;
    goals: { maintain: string; fat_loss: string; muscle_gain: string; performance: string };
    macroStrategyLabel: string;
    macroStrategies: { balanced: string; high_protein: string; high_carb: string; low_carb: string; custom: string };
    calculateCta: string;
    recalculateCta: string;
    invalidInputWarning: string;
    resultsHeading: string;
    bmrLabel: string;
    tdeeLabel: string;
    bmiLabel: string;
    bmiCategories: { underweight: string; normal: string; overweight: string; obese: string };
    leanBodyMassLabel: string;
    fatMassLabel: string;
    estimateNote: string;
    calorieTargetLabel: string;
    calorieScenariosHeading: string;
    kcalPerDaySuffix: string;
    macronutrientsHeading: string;
    proteinLabel: string;
    carbsLabel: string;
    fatLabel: string;
    perKgSuffix: string;
    editMacrosCta: string;
    doneEditingCta: string;
    saveCta: string;
    saveToPatientCta: string;
    selectPatientPrompt: string;
    savedConfirmation: string;
    historyHeading: string;
    noHistoryYet: string;
    todaysTargetHeading: string;
    activityLevelLabel: string;
    printCta: string;
    printedForLabel: string;
    printedOnLabel: string;
    adaptiveBadge: string;
    adaptiveHeading: string;
    adaptiveExplain: string;
    adaptiveDeltaAbove: string;
    adaptiveDeltaBelow: string;
    adaptiveDeltaMatch: string;
    adaptiveBasedOn: string;
    adaptiveNotEnoughData: string;
    goalWeightLabel: string;
    goalWeightPlaceholder: string;
    goalWeightHint: string;
    projectionHeading: string;
    projectionAchievable: string;
    projectionWrongDirection: string;
    projectionNoProgress: string;
    weightTrendHeading: string;
    foodExamplesCta: string;
    hideFoodExamplesCta: string;
    foodExamplesDisclaimer: string;
    perHundredGramsSuffix: string;
  };
  myPhygoLife: {
    badge: string;
    heading: string;
    subtitle: string;
    metabolicCardTitle: string;
    metabolicCardSubtitle: string;
    backToHome: string;
    noProfileYet: string;
    startCalculatorCta: string;
    recalculatePrompt: string;
    scaleReminderHeading: string;
    scaleReminderCta: string;
  };
  neuroExam: {
    backToClinicalToolkit: string;
    badge: string;
    heading: string;
    sectionCounterSeparator: string;
    backButton: string;
    nextButton: string;
    viewSummaryButton: string;
    editAnswersButton: string;
    finishButton: string;
    summaryHeading: string;
    loading: string;
    errorLoading: string;
    sections: Record<
      'consciousness' | 'cortical_functions' | 'stance_gait' | 'strength_tone' | 'reflexes' | 'sensation' | 'cerebellar' | 'cranial_nerves' | 'involuntary_movements' | 'meningeal_signs',
      string
    >;
  };
  patients: {
    eyebrow: string;
    greetingMorning: string;
    greetingAfternoon: string;
    greetingEvening: string;
    greetingDefault: string;
    subtitle: string;
    newPatient: string;
    cancel: string;
    statPatients: string;
    statNotesThisMonth: string;
    statActivePlans: string;
    searchPlaceholder: string;
    formNameLabel: string;
    formGenderLabel: string;
    genderMale: string;
    genderFemale: string;
    genderNotSpecified: string;
    formAgeLabel: string;
    formConditionLabel: string;
    savingButton: string;
    savePatientButton: string;
    noPatientsYet: string;
    noPatientsMatch: string;
    yearsOld: string;
    patientNotFound: string;
    portalActive: string;
    scheduleButton: string;
    generateNewNoteButton: string;
    generatingInvite: string;
    inviteToPortalButton: string;
    resetPortalAccess: string;
    resetPortalConfirm: string;
    inviteReadyHeading: string;
    inviteShareText: string;
    copied: string;
    copyButton: string;
    inviteError: string;
    statSessions: string;
    statLastSession: string;
    statPatientSince: string;
    statLinkedItems: string;
    noteHistoryHeading: string;
    noNotesYet: string;
    generateFirstNote: string;
    noAssessmentRecorded: string;
    treatmentPlanHeading: string;
    nothingLinkedYet: string;
    treatmentPlanHint: string;
    noteHistorySubtitle: string;
    treatmentPlanSubtitle: string;
    openReferenceHint: string;
    removeTitle: string;
    refTypeExercise: string;
    refTypeClinicalTest: string;
    refTypeQuestionnaire: string;
    refTypeCondition: string;
    refTypeBodyZone: string;
    refTypeProduct: string;
    refTypeMetabolicProfile: string;
    sinceToday: string;
    since1Day: string;
    sinceDays: string;
    since1Month: string;
    sinceMonths: string;
    since1Year: string;
    sinceYears: string;
    backToPatientName: string;
    sessionNoteTab: string;
    videoCallTab: string;
    noteSavedMessage: string;
    nutritionHeading: string;
    nutritionSubtitle: string;
    nutritionEmpty: string;
    nutritionEmptyHint: string;
    weightTrendHeading: string;
    latestProfileLabel: string;
    newCalculationCta: string;
    viewFullCalculatorCta: string;
  };
  pelvicFloorAnamnesis: {
    backToPelvicFloor: string;
    badge: string;
    heading: string;
    sectionCounterSeparator: string;
    backButton: string;
    nextButton: string;
    viewSummaryButton: string;
    editAnswersButton: string;
    finishButton: string;
    summaryHeading: string;
    loading: string;
    errorLoading: string;
  };
  firstAid: {
    badge: string;
    heading: string;
    subtitle: string;
    infoBox: string;
    allFilter: string;
    loadingTopics: string;
    errorLoadingTopics: string;
    backToTopics: string;
    errorLoadingTopic: string;
    emergencyNumberLabel: string;
    governingBodyLabel: string;
    protocolLabel: string;
    notesLabel: string;
    sourceLabel: string;
    categoryLabels: Record<
      'rianimazione' | 'neurologico' | 'cardiovascolare' | 'allergologico' | 'trauma' | 'ambientale' | 'tossicologico' | 'organizzazione',
      string
    >;
    countryLabels: Record<'Italia' | 'Francia' | 'Regno Unito' | 'Spagna' | 'USA', string>;
  };
  bls: {
    badge: string;
    heading: string;
    subtitle: string;
    infoBox: string;
    errorLoading: string;
    positionLabel: string;
    procedureLabel: string;
    keyParametersLabel: string;
    precautionsLabel: string;
    evidenceLabel: string;
    categoryLabels: Record<'adult_cpr' | 'child_cpr' | 'infant_cpr' | 'choking' | 'aed' | 'team_dynamics', string>;
  };
  bodyMap: {
    badge: string;
    calibrationBadge: string;
    heading: string;
    subtitle: string;
    legendMuscleZones: string;
    legendBoneZones: string;
    legendDragScroll: string;
    howItWorks: {
      clickZone: { label: string; text: string };
      xray: { label: string; text: string };
      search: { label: string; text: string };
    };
    clinicalFooter: string;
    ctaWholeBody: string;
    loadingModel: string;
    searchPlaceholder: string;
    noZoneFound: string;
    dragRotateZoom: string;
    xrayLabel: string;
    modelCreditPrefix: string;
    zoneNotFound: string;
    backToBodyMap: string;
    zoneTypeSkeletal: string;
    zoneTypeAnatomical: string;
    relatedZonesLabel: string;
    askPhygoButton: string;
    askPhygoHeadingPrefix: string;
    askPlaceholder: string;
    askGenericError: string;
    askGenericErrorRetry: string;
    noExercisesLinked: string;
    seeAllExercises: string;
    relatedConditionsHeading: string;
    noConditionsLinked: string;
    sourceCitedAriaLabel: string;
    zoneNames: Record<
      | 'cervical-spine'
      | 'trapezius'
      | 'shoulder'
      | 'chest'
      | 'biceps'
      | 'triceps'
      | 'elbow'
      | 'forearm'
      | 'wrist-hand'
      | 'core-abdomen'
      | 'thoracic-spine'
      | 'lumbar-spine'
      | 'hip'
      | 'glutes'
      | 'quadriceps'
      | 'hamstrings'
      | 'knee'
      | 'calf'
      | 'ankle-foot',
      string
    >;
    boneNames: Record<
      | 'bone-cranio'
      | 'bone-clavicola-scapola'
      | 'bone-coste-sterno'
      | 'bone-omero'
      | 'bone-radio-ulna'
      | 'bone-mano'
      | 'bone-bacino'
      | 'bone-sacro'
      | 'bone-femore'
      | 'bone-tibia-perone'
      | 'bone-piede'
      | 'bone-cervicale'
      | 'bone-dorsale'
      | 'bone-lombare',
      string
    >;
  };
  pelvicFloorAtlas: {
    badge: string;
    heading: string;
    subTabs: { anatomy: string; conditions: string; assessment: string; rehab: string };
    anatomyHeading: string;
    anatomyIntro: string;
    overviewIntro: string;
    conditionsHeading: string;
    conditionsIntro: string;
    assessmentHeading: string;
    assessmentIntro: string;
    rehabHeading: string;
    rehabIntro: string;
    loading: string;
    errorStructures: string;
    errorConditions: string;
    errorTests: string;
    errorRehab: string;
    structureCategoryLabels: Record<'muscle' | 'fascia_ligament' | 'concept' | 'nerve', string>;
    structureCategoryLabelsSingular: Record<'muscle' | 'fascia_ligament' | 'concept' | 'nerve', string>;
    compartmentLabels: Record<'anterior' | 'central' | 'posterior' | 'systemic', string>;
    rehabCategoryLabels: Record<
      'kegel' | 'biofeedback_electrostim' | 'bladder_training' | 'postpartum' | 'special_population',
      string
    >;
    imageLabels: {
      femaleSagittal: string;
      maleSagittal: string;
      inferiorView: string;
      inferiorViewFull: string;
    };
    protocolLabel: string;
    relatedConditionsHeading: string;
    noConditionsLinked: string;
    backToAtlas: string;
    structureNotFound: string;
    errorLoadingStructure: string;
    anatomySectionLabel: string;
    functionSectionLabel: string;
    clinicalRelevanceLabel: string;
  };
  profilePage: {
    eyebrow: string;
    heading: string;
    subtitle: string;
    photoLabel: string;
    photoHint: string;
    displayNameLabel: string;
    displayNamePlaceholder: string;
    bioLabel: string;
    bioPlaceholder: string;
    registrationNumberLabel: string;
    registrationNumberPlaceholder: string;
    registrationNumberHint: string;
    credentialsLabel: string;
    credentialPlaceholder: string;
    add: string;
    saveProfile: string;
  };
}

export const UI_STRINGS: Record<AppLang, UiDict> = {
  it: {
    clinicalActionBar: {
      addToTreatmentPlan: 'Aggiungi al Piano di Trattamento',
      useWithPatient: 'Aggiungi al Paziente',
      startForPatient: 'Assegna al Paziente',
      useAsClinicalReference: 'Usa come Riferimento Clinico',
      recommendToPatient: 'Consiglia al Paziente',
      selectPatient: 'Seleziona paziente',
      addedFor: 'Aggiunto per {name}',
      added: 'Aggiunto',
      searchPlaceholder: 'Cerca paziente...',
      searching: 'Ricerca in corso...',
      noPatientsFound: 'Nessun paziente trovato.',
    },
    nav: {
      patients: 'Pazienti',
      library: 'Libreria',
      world: 'Phygo World',
      schedule: 'Agenda',
      profile: 'Profilo',
      signOut: 'Esci',
      startFree: 'Inizia gratis',
      search: 'Cerca',
      liveDemo: 'Demo live',
      features: 'Funzionalità',
      trust: 'Affidabilità',
      pricing: 'Prezzi',
      faq: 'FAQ',
      currentPatient: 'Paziente attuale',
    },
    libraryLinks: {
      bodyMap: { label: 'Mappa del Corpo', description: 'Esploratore anatomico interattivo' },
      neurology: { label: 'Neurologia', description: 'Encefalo, nervi e vie nervose' },
      physiology: { label: 'Fisiologia', description: 'Meccanismi muscolari e neurologici di base' },
      sportsMedicine: { label: 'Medicina dello Sport', description: 'Scienza della lesione sportiva e ritorno allo sport' },
      pelvicFloor: { label: 'Pavimento Pelvico', description: 'Anatomia, condizioni e riabilitazione' },
      cardiopulmonary: { label: 'Cardiopolmonare', description: 'Anatomia, condizioni e riabilitazione' },
      endocrine: { label: 'Endocrino', description: 'Anatomia, condizioni e riabilitazione' },
      fascia: { label: 'Fascia', description: 'Anatomia, funzione e applicazioni cliniche' },
      urinary: { label: 'Urinario', description: 'Anatomia, condizioni e riabilitazione' },
      gastrointestinal: { label: 'Gastrointestinale', description: 'Anatomia, condizioni e riabilitazione' },
      immune: { label: 'Immunitario', description: 'Anatomia, condizioni e riabilitazione' },
      hematology: { label: 'Ematologia', description: 'Anatomia, condizioni e riabilitazione' },
      oncology: { label: 'Oncologia', description: 'Anatomia, condizioni e riabilitazione' },
      firstAid: { label: 'Primo Soccorso', description: 'Protocolli per paese' },
      blsd: { label: 'BLSD', description: 'RCP, DAE e disostruzione vie aeree' },
      clinicalTools: { label: 'Strumenti Clinici', description: 'Scale di valutazione e test' },
    },
    physiologyCrossLink: { question: 'Vuoi capire come funziona?', cta: 'Vai a Fisiologia' },
    worldLinks: {
      science: { label: 'Evidence Hub', description: 'Sintesi delle ultime ricerche' },
      events: { label: 'Eventi', description: 'Congressi, corsi e webinar nel mondo della salute' },
      shop: { label: 'Negozio', description: 'Attrezzature consigliate' },
    },
    events: {
      badge: 'Phygo World',
      heading: 'Eventi',
      subtitle: 'Scopri congressi, corsi ed esperienze che stanno plasmando la fisioterapia, la sanità e la performance umana.',
      searchPlaceholder: 'Cerca per nome, argomento, città o paese...',
      filtersLabel: 'Filtri',
      categoryLabel: 'Categoria',
      typeLabel: 'Tipo di evento',
      dateLabel: 'Data',
      locationLabel: 'Luogo',
      audienceLabel: 'Pubblico',
      levelLabel: 'Livello professionale',
      allLabel: 'Tutti',
      onlineLabel: 'Online',
      inPersonLabel: 'In presenza',
      hybridLabel: 'Ibrido',
      freeLabel: 'Gratuito',
      paidLabel: 'A pagamento',
      datePresets: { today: 'Oggi', thisWeek: 'Questa Settimana', thisMonth: 'Questo Mese', next3Months: 'Prossimi 3 Mesi', custom: 'Personalizzato' },
      featuredHeading: 'In Evidenza',
      upcomingHeading: 'Prossimi Eventi',
      onlineHeading: 'Eventi Online',
      nearYouHeading: 'Vicino a Te',
      viewEventCta: 'Vedi Evento',
      noEventsFound: 'Nessun evento trovato con questi filtri.',
      loadingEvents: 'Caricamento eventi...',
      categoryLabels: { physiotherapy: 'Fisioterapia', rehabilitation: 'Riabilitazione', sportsRehabilitation: 'Riabilitazione Sportiva', sportsMedicine: 'Medicina dello Sport', orthopaedics: 'Ortopedia', neurology: 'Neurologia', neurorehabilitation: 'Neuroriabilitazione', exerciseScience: 'Scienze Motorie', strengthConditioning: 'Preparazione Atletica', manualTherapy: 'Terapia Manuale', painScience: 'Scienza del Dolore', pelvicFloor: 'Pavimento Pelvico', cardiopulmonary: 'Cardiopolmonare', oncology: 'Oncologia', nutrition: 'Nutrizione', psychology: 'Psicologia', yoga: 'Yoga', pilates: 'Pilates', mobility: 'Mobilità', wellness: 'Benessere', longevity: 'Longevità', healthyAging: 'Invecchiamento in Salute', prevention: 'Prevenzione', healthcareTechnology: 'Tecnologia Sanitaria', aiHealthcare: 'IA e Sanità', digitalHealth: 'Salute Digitale', research: 'Ricerca' },
      typeLabels: { congress: 'Congresso', conference: 'Conferenza', course: 'Corso', workshop: 'Workshop', webinar: 'Webinar', masterclass: 'Masterclass', seminar: 'Seminario', symposium: 'Simposio', certification: 'Corso di Certificazione' },
      audienceLabels: { professionals: 'Professionisti', students: 'Studenti', public: 'Pazienti / Pubblico', both: 'Tutti' },
      levelLabels: { student: 'Studente', beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzato', expert: 'Esperto' },
      statusLabels: { upcoming: 'In Programma', updated: 'Aggiornato', dateChanged: 'Data Modificata', locationChanged: 'Sede Modificata', cancelled: 'Annullato', soldOut: 'Esaurito', registrationOpen: 'Iscrizioni Aperte', registrationClosed: 'Iscrizioni Chiuse', completed: 'Concluso' },
      verificationLabels: { unverified: 'Non Verificato', source_verified: 'Fonte Verificata', organizer_verified: 'Organizzatore Verificato', phygo_verified: 'Verificato da Phygo' },
      verificationExplainer: 'La verifica riguarda l\'accuratezza della fonte, non un giudizio di Phygo sulla qualità scientifica dell\'evento.',
      organizerLabel: 'Organizzatore',
      timeLabel: 'Orario',
      timezoneLabel: 'Fuso orario',
      descriptionLabel: 'Descrizione',
      topicsLabel: 'Argomenti',
      speakersLabel: 'Relatori',
      priceLabel: 'Prezzo',
      registrationDeadlineLabel: 'Scadenza iscrizioni',
      registerCta: 'Iscriviti / Sito Ufficiale',
      officialWebsiteCta: 'Sito Ufficiale',
      saveEventCta: 'Salva Evento',
      savedCta: 'Salvato',
      backToEvents: 'Torna a Eventi',
      eventNotFound: 'Evento non trovato.',
      myEventsHeading: 'I Miei Eventi',
      savedTab: 'Salvati',
      upcomingTab: 'Prossimi',
      pastTab: 'Passati',
      noSavedEvents: 'Non hai ancora salvato nessun evento.',
      signInToSave: 'Accedi per salvare gli eventi.',
      providersHeading: 'Altre Risorse di Formazione',
      providersSubtitle: 'Enti che pubblicano corsi continuamente: visita il loro sito per il calendario sempre aggiornato.',
      visitProviderCta: 'Visita il Sito',
    },
    science: {
      badge: 'Phygo Evidence Hub',
      headingLead: 'Le Ultime',
      headingAccent: 'Evidenze',
      subtitle: 'Ricerca scientifica basata sull\'evidenza per fisioterapisti.',
      searchPlaceholder: 'Cerca studi per titolo...',
      loadingText: 'Caricamento ricerche…',
      noResultsText: 'Nessuno studio corrisponde alla tua ricerca.',
      clinicalQuestionLabel: 'Domanda clinica',
      whyItMattersLabel: 'Perché conta',
      resultsCountSuffix: 'studi trovati',
      originalStudyCta: 'Studio Originale',
    },
    shop: {
      eyebrow: 'Attrezzatura',
      heading: 'Negozio',
      subtitle: 'Attrezzatura consigliata da suggerire direttamente durante una seduta.',
      curatedPicksSuffix: 'prodotti selezionati',
      allLabel: 'Tutti',
      viewOnAmazonCta: 'Vedi su Amazon',
      categoryLabels: {
        'Pelvic Floor': 'Pavimento Pelvico',
        'Low Back': 'Zona Lombare',
        Posture: 'Postura',
        Mobility: 'Mobilità',
        Recovery: 'Recupero',
        'Body Composition': 'Composizione Corporea',
        Nutrition: 'Nutrizione',
      },
    },
    fields: {
      goals: 'Obiettivi',
      clinicalTests: 'Test Clinici',
      typicalExercises: 'Esercizi Tipici',
      progressionCriteria: 'Criteri di Progressione',
      returnToActivityCriteria: "Criteri di Ritorno all'Attività",
      outcomeMeasures: 'Misure di Esito',
      contraindications: 'Controindicazioni',
      redFlags: 'Red Flags',
      featuredExercises: 'Esercizi in Evidenza',
      source: 'Fonte',
      evidence: 'Evidenza',
    },
    anatomy: {
      anatomy: 'Anatomia',
      innervation: 'Innervazione',
      biomechanics: 'Biomeccanica',
      clinicalRelevance: 'Rilevanza Clinica',
      connections: 'Connessioni',
      vascularSupply: 'Vascolarizzazione',
      function: 'Funzione',
    },
    evidenceLevels: {
      high: 'Alta',
      strong: 'Alta',
      moderate: 'Moderata',
      low: 'Bassa',
      limited: 'Bassa',
    },
    common: {
      loading: 'Caricamento...',
      save: 'Salva',
      saving: 'Salvataggio...',
      saved: 'Salvato',
      backToPatients: 'Torna ai pazienti',
      machineTranslatedNotice:
        'Traduzione automatica dall’italiano — per decisioni cliniche, verifica Red Flags e Controindicazioni sul testo originale.',
    },
    brainMap: {
      atlasBadge: 'Atlante Neurologico',
      heading: 'Neurologia',
      subtitle:
        'Anatomia, vie nervose e ragionamento clinico di localizzazione — un atlante interattivo pensato per la pratica quotidiana.',
      viewLabels: { brain: 'Encefalo', nerves: 'Nervi Periferici', pathways: 'Circuiti Neurali' },
      brainSubTabs: { atlas: 'Atlante', conditions: 'Patologie' },
      deepStructuresHint: 'Strutture profonde — non visibili sulla superficie del modello 3D, ma consultabili qui.',
      referenceViewsHint: 'Viste di riferimento — laterale, sagittale e coronale, con le strutture principali etichettate.',
      nerveViewerHint: "Muovi il cursore sull'immagine per esplorarla in prospettiva",
      loading3DModel: 'Caricamento modello 3D...',
      dragRotateZoom: 'Trascina per ruotare · scorri per zoom',
      modelCreditPrefix: 'Modello 3D:',
      zoneNames: {
        'frontal-lobe': 'Lobo Frontale',
        'parietal-lobe': 'Lobo Parietale',
        'temporal-lobe': 'Lobo Temporale',
        'occipital-lobe': 'Lobo Occipitale',
        cerebellum: 'Cervelletto',
        brainstem: 'Tronco Encefalico',
        'basal-ganglia': 'Gangli della Base',
        insula: 'Insula',
        'corpus-callosum': 'Corpo Calloso',
        thalamus: 'Talamo',
        hypothalamus: 'Ipotalamo',
        amygdala: 'Amigdala',
        hippocampus: 'Ippocampo',
      },
      brainConditionsHeading: 'Patologie Cerebrali',
      brainConditionsHint:
        'Tutte le patologie collegate alle zone cerebrali, in un unico elenco cercabile — tocca una card per i dettagli clinici.',
      searchConditionsPlaceholder: 'Cerca per nome patologia...',
      loadingConditions: 'Caricamento patologie...',
      errorLoadingConditions: 'Impossibile caricare le patologie collegate.',
      noConditionsFound: 'Nessuna patologia trovata.',
      relatedConditionsHeading: 'Patologie Collegate',
      nervesSubTabs: {
        atlas: 'Atlante Nervi',
        seddon: 'Classificazione Seddon',
        conduction: 'Conduzione Nervosa',
        conditions: 'Patologie Collegate',
        diffuse: 'Disturbi Diffusi',
      },
      peripheralAtlasHeading: 'Atlante dei Nervi Periferici',
      peripheralAtlasHint:
        'Tocca un nervo per anatomia, funzione motoria/sensitiva, sede di compressione tipica e patologie collegate.',
      regionAll: 'Tutti',
      regionLabels: {
        plexus: 'Plesso',
        upper_limb: 'Arto Superiore',
        lower_limb: 'Arto Inferiore',
        cranial: 'Nervi Cranici',
      },
      askPhygoPrompt: 'Non trovi il nervo che cerchi? Chiedi a Phygo',
      askPhygoPlaceholder: 'es. nervo ileoipogastrico, nervo genitofemorale...',
      askButton: 'Chiedi',
      loadingNerves: 'Caricamento nervi...',
      errorLoadingNerves: 'Impossibile caricare i nervi.',
      nerveInjuryHeading: 'Classificazione delle Lesioni Nervose',
      nerveInjuryHint:
        'Classificazione di Seddon, dalla più lieve alla più severa — utile per orientare prognosi e tempistiche di recupero.',
      nerveConductionHeading: 'Conduzione Nervosa',
      nerveConductionHint: 'Tipi di fibre nervose e relative velocità di conduzione.',
      fiberDiameter: 'Diametro',
      fiberMyelination: 'Mielinizzazione',
      fiberVelocity: 'Velocità',
      fiberFunction: 'Funzione',
      snpConditionsHint:
        'Patologie del sistema nervoso periferico presenti nella Knowledge Base di Phygo. Tocca una card per i dettagli clinici.',
      diffuseHeading: 'Disturbi Diffusi del SNP',
      diffuseHint:
        'Condizioni che colpiscono il sistema nervoso periferico in modo diffuso o sistemico, non un singolo nervo nominato. Tocca una card per i dettagli clinici.',
      loadingDiffuse: 'Caricamento disturbi diffusi...',
      errorLoadingDiffuse: 'Impossibile caricare i disturbi diffusi del SNP.',
      pathwaySubTabs: { circuits: 'Vie Nervose', gait: 'Pattern del Cammino', localization: 'Localizzazione' },
      pathwayCategoryLabels: { longTracts: 'Vie Lunghe', brainCircuits: 'Circuiti Cerebrali' },
      gaitHint: 'Il riconoscimento del pattern del cammino orienta la localizzazione della lesione neurologica sottostante.',
      localizationHint:
        "Sei principi di ragionamento clinico per orientare la localizzazione della lesione neurologica a partire dai reperti dell'esame obiettivo.",
      zone: {
        badge: 'Zona Neurologica',
        geriatricHeading: 'Principi di Neurologia Geriatrica',
        noConditionsLinked: 'Nessuna patologia ancora collegata a questa zona.',
        backToBrainMap: 'Mappa Cerebrale',
        zoneNotFound: 'Zona non trovata.',
      },
      nerve: {
        backToNeuroMap: 'Torna alla mappa neurologica',
        errorLoadingNerve: 'Impossibile caricare i dati del nervo.',
        anatomyAndCourse: 'Anatomia e decorso',
        motorFunction: 'Funzione motoria',
        sensoryFunction: 'Funzione sensitiva',
        compressionSite: 'Sede tipica di compressione/lesione',
        clinicalSign: 'Segno clinico caratteristico',
        linkedConditions: 'Patologie collegate',
        noConditionsLinkedToNerve: 'Nessuna patologia ancora collegata a questo nervo.',
      },
    },
    oncology: {
      atlasBadge: 'Atlante Oncologico',
      heading: 'Oncologia',
      subTabs: {
        anatomy: 'Anatomia',
        conditions: 'Patologie',
        treatments: 'Trattamenti',
        assessment: 'Valutazione',
        rehab: 'Riabilitazione',
      },
      anatomyHeading: 'Anatomia Oncologica',
      anatomyHint:
        'Anatomia e drenaggio linfatico rilevanti per la comprensione delle principali neoplasie e delle loro complicanze riabilitative.',
      anatomyIntro:
        "Questa sezione parte dai meccanismi biologici e molecolari con cui una cellula normale si trasforma in cellula tumorale — un passaggio spesso trascurato ma utile per capire perché un tumore si comporta come si comporta. Segue poi l'anatomia del drenaggio linfatico regionale, organo per organo: è la mappa più rilevante per la pratica fisioterapica, perché gran parte delle complicanze riabilitative post-chirurgiche (in primis il linfedema) dipende da quali vie linfatiche sono state interrotte.",
      conditionsHeading: 'Patologie Collegate',
      conditionsHint: 'Patologie oncologiche organizzate per sistema. Tocca una card per obiettivi, test clinici, red flag ed esercizi tipici.',
      treatmentsHeading: 'Trattamenti Oncologici',
      treatmentsHint: 'Percorsi diagnostico-terapeutici per tipo di tumore e modalità di trattamento generali, con le relative implicazioni fisioterapiche.',
      assessmentHeading: 'Valutazione Clinica',
      assessmentHint: 'Scale di performance status e strumenti di valutazione specifici per il paziente oncologico.',
      rehabHeading: 'Riabilitazione',
      rehabHint: 'Protocolli di gestione del linfedema (incluso il linfodrenaggio manuale passo-passo), esercizio in oncologia e gestione delle complicanze specifiche.',
      loading: 'Caricamento...',
      errorLoadingStructures: 'Impossibile caricare le strutture anatomiche.',
      errorLoadingConditions: 'Impossibile caricare le patologie.',
      errorLoadingTests: 'Impossibile caricare i test di valutazione.',
      errorLoadingRehab: 'Impossibile caricare i contenuti riabilitativi.',
      errorLoadingTreatments: 'Impossibile caricare i trattamenti.',
      procedureLabel: 'Procedura',
      interpretationLabel: 'Interpretazione',
      protocolLabel: 'Protocollo',
      ptImplicationsLabel: 'Implicazioni Fisioterapiche',
      askPhygoPrompt: 'Non trovi la patologia che cerchi? Chiedi a Phygo',
      askPhygoPlaceholder: 'es. linfoma, melanoma, sarcoma dei tessuti molli...',
      askButton: 'Chiedi',
      regionLabels: {
        'tumor-biology': 'Biologia del Tumore',
        'lymphatic-general': 'Sistema Linfatico Generale',
        breast: 'Mammella',
        gynecological: 'Ginecologico',
        prostate: 'Prostata',
        bladder: 'Vescica',
        lung: 'Polmone',
        brain: 'Cervello',
        'head-neck': 'Testa-Collo',
        colorectal: 'Colon-Retto',
        systemic: 'Sistemico',
      },
      systemLabels: {
        mammario: 'Carcinoma Mammario',
        ginecologico: 'Tumori Ginecologici',
        prostatico: 'Carcinoma Prostatico',
        vescicale: 'Carcinoma della Vescica',
        'neuro-oncologico': 'Tumori Cerebrali',
        'colon-retto': 'Carcinoma del Colon-Retto',
        polmonare: 'Carcinoma del Polmone',
        'testa-collo': 'Tumori Testa-Collo',
        sarcoma: 'Sarcomi',
        ematologico: 'Neoplasie Ematologiche',
        sistemico: 'Complicanze Sistemiche',
      },
      testCategoryLabels: {
        performance_status: 'Performance Status',
        lymphedema_assessment: 'Valutazione del Linfedema',
        red_flag_screening: 'Screening Pre-Esercizio',
      },
      rehabCategoryLabels: {
        linfedema: 'Gestione del Linfedema',
        complicanze_specifiche: 'Complicanze Specifiche',
        esercizio: 'Esercizio in Oncologia',
      },
      treatmentCategoryLabels: {
        per_tipo_tumore: 'Percorsi per Tipo di Tumore',
        diagnostica: 'Diagnostica e Stadiazione',
        chirurgia: 'Chirurgia',
        farmacologico: 'Trattamenti Farmacologici',
        fisico: 'Trattamenti Fisici',
      },
    },
    cardiopulmonary: {
      atlasBadge: 'Atlante Cardiopolmonare',
      heading: 'Cardiopolmonare',
      subTabs: {
        anatomy: 'Anatomia',
        conditions: 'Patologie',
        assessment: 'Valutazione',
        rehab: 'Riabilitazione',
        airwayClearance: 'Disostruzione',
      },
      anatomyHeading: 'Anatomia Cardiopolmonare',
      anatomyHint: 'Cuore, circolo, apparato respiratorio e meccanica toracica: come funzionano come sistema integrato.',
      anatomyIntro:
        "Il sistema cardiorespiratorio integra funzione cardiaca, circolatoria e polmonare: una compromissione in uno di questi ambiti si ripercuote quasi sempre sugli altri. La valutazione fisioterapica considera insieme meccanica toracica, capacità di esercizio e parametri vitali, poiché sono strettamente interdipendenti. Le sezioni sottostanti approfondiscono anatomia cardiaca, sistema vascolare, apparato respiratorio, meccanica/cinematica toracica e il concetto chiave di VO2max/riserva cardiaca, che orienta la prescrizione dell'esercizio.",
      conditionsHeading: 'Patologie Collegate',
      conditionsHint: 'Patologie organizzate per sistema. Tocca una card per obiettivi, test clinici ed esercizi.',
      assessmentHeading: 'Valutazione Clinica',
      assessmentHint: 'Test clinici e scale di valutazione cardiorespiratoria.',
      rehabHeading: 'Riabilitazione',
      rehabHint: 'Protocolli FITT, gestione post-chirurgica e specifici per scompenso cardiaco e patologie respiratorie.',
      airwayHeading: 'Tecniche di Disostruzione Bronchiale',
      airwayHint: 'Drenaggio posturale, tecniche manuali, PEP, respirazione attiva, supporto ventilatorio. Tocca una card per la procedura completa.',
      loading: 'Caricamento...',
      errorLoadingStructures: 'Impossibile caricare le strutture anatomiche.',
      errorLoadingConditions: 'Impossibile caricare le patologie.',
      errorLoadingTests: 'Impossibile caricare i test di valutazione.',
      errorLoadingRehab: 'Impossibile caricare i contenuti riabilitativi.',
      errorLoadingAirway: 'Impossibile caricare le tecniche di disostruzione.',
      procedureLabel: 'Procedura',
      interpretationLabel: 'Interpretazione',
      protocolLabel: 'Protocollo',
      patientPositionLabel: 'Posizione paziente',
      indicationsLabel: 'Indicazioni',
      contraindicationsPrecautionsLabel: 'Controindicazioni/Precauzioni',
      categoryLabels: {
        cardiac: 'Cardiaco',
        circulatory: 'Circolatorio',
        respiratory: 'Respiratorio',
        thoracic_mechanics: 'Meccanica Toracica',
        concept: 'Concetti Chiave',
      },
      systemLabels: {
        cardiac: 'Condizioni Cardiache',
        respiratory: 'Condizioni Respiratorie',
        mixed_systemic: 'Condizioni Sistemiche/Miste',
      },
      testCategoryLabels: {
        functional_capacity: 'Capacità Funzionale',
        dyspnea_scale: 'Scale della Dispnea',
        strength: 'Forza',
        vital_signs: 'Parametri Vitali',
        consciousness: 'Stato di Coscienza',
      },
      rehabCategoryLabels: {
        aerobic_training: 'Allenamento Aerobico',
        resistance_training: 'Allenamento alla Forza',
        post_surgical: 'Post-Chirurgico',
        heart_failure: 'Scompenso Cardiaco',
        respiratory_specific: 'Specifico Respiratorio',
      },
      airwayCategoryLabels: {
        postural_drainage: 'Drenaggio Posturale',
        manual: 'Tecniche Manuali',
        active_breathing: 'Respirazione Attiva',
        device_dependent: 'Dispositivi (PEP)',
        machine_dependent: 'Dispositivi Meccanici',
        ventilation_support: 'Supporto Ventilatorio',
        dyspnoea_technique: 'Tecniche per la Dispnea',
      },
      ageGroupLabels: {
        adult: 'Adulti',
        paediatric: 'Pediatrico',
        both: 'Adulti e bambini',
      },
    },
    endocrine: {
      atlasBadge: 'Atlante Endocrino',
      heading: 'Sistema Endocrino',
      subTabs: {
        anatomy: 'Anatomia',
        conditions: 'Patologie',
        assessment: 'Valutazione',
        rehab: 'Riabilitazione',
      },
      anatomyHeading: 'Anatomia Endocrina',
      anatomyHint: 'Ghiandole, assi ormonali e concetti chiave: come il sistema endocrino regola metabolismo, crescita e omeostasi.',
      anatomyIntro:
        "Il sistema endocrino coordina la comunicazione ormonale tra ghiandole e organi bersaglio, regolando metabolismo, crescita, composizione corporea, densità ossea e funzione riproduttiva. Una disfunzione endocrina si ripercuote spesso su tolleranza all'esercizio, forza muscolare, salute ossea ed equilibrio, rendendo la valutazione fisioterapica interdipendente dal quadro ormonale del paziente. Le sezioni sottostanti approfondiscono le principali ghiandole (tiroide, surrene, paratiroidi, pancreas endocrino), gli assi ormonali chiave (ipotalamo-ipofisario, GH/IGF-1, gonadico) e il ruolo dell'osso come organo bersaglio ed endocrino.",
      conditionsHeading: 'Patologie Collegate',
      conditionsHint: 'Le principali endocrinopatie di interesse fisioterapico. Tocca una card per obiettivi, test clinici ed esercizi.',
      assessmentHeading: 'Valutazione Clinica',
      assessmentHint: 'Esami ormonali, metabolici e strutturali rilevanti per l\'inquadramento fisioterapico del paziente endocrino.',
      rehabHeading: 'Riabilitazione',
      rehabHint: 'Protocolli per salute ossea, prevenzione delle cadute, terapia ormonale sostitutiva, allenamento metabolico e supporto nutrizionale.',
      loading: 'Caricamento...',
      errorLoadingStructures: 'Impossibile caricare le strutture anatomiche.',
      errorLoadingConditions: 'Impossibile caricare le patologie.',
      errorLoadingTests: 'Impossibile caricare i test di valutazione.',
      errorLoadingRehab: 'Impossibile caricare i contenuti riabilitativi.',
      procedureLabel: 'Procedura',
      interpretationLabel: 'Interpretazione',
      protocolLabel: 'Protocollo',
      categoryLabels: {
        axis: 'Assi Ormonali',
        concept: 'Concetti Chiave',
        gland: 'Ghiandole',
      },
      testCategoryLabels: {
        hormonal: 'Ormonale',
        metabolic: 'Metabolico',
        structural: 'Strutturale',
      },
      rehabCategoryLabels: {
        bone_health: 'Salute Ossea',
        fall_prevention: 'Prevenzione delle Cadute',
        hormone_replacement: 'Terapia Ormonale Sostitutiva',
        metabolic_training: 'Allenamento Metabolico',
        nutritional_support: 'Supporto Nutrizionale',
      },
    },
    fascia: {
      atlasBadge: 'Atlante della Fascia',
      heading: 'Fascia',
      subTabs: {
        structures: 'Anatomia',
        function: 'Funzione',
        treatments: 'Applicazioni Cliniche',
        rehab: 'Riabilitazione',
      },
      structuresHeading: 'Anatomia e Fisiologia della Fascia',
      structuresHint: 'Struttura, istologia, innervazione e regolazione del sistema fasciale — la base per comprendere il suo ruolo clinico.',
      structuresIntro: 'Questa sezione descrive la fascia come organo di senso e di trasmissione di forza a sé stante: dalla sua composizione istologica alla ricca innervazione meccanocettiva e nocicettiva, fino ai meccanismi ormonali e cellulari che ne regolano le proprietà nel tempo.',
      functionHeading: 'Funzione Fasciale',
      functionHint: 'Biotensegrità, risposta al carico, proprietà viscoelastiche e ruolo della fascia nel movimento e nella postura.',
      treatmentsHeading: 'Applicazioni Cliniche',
      treatmentsHint: 'Approcci manuali e programmi di esercizio orientati alla fascia, con le relative implicazioni fisioterapiche e il livello di evidenza disponibile.',
      rehabHeading: 'Riabilitazione',
      rehabHint: 'Protocolli di riabilitazione strutturati per il sistema fasciale, con il livello di evidenza scientifica disponibile per ciascun approccio.',
      loading: 'Caricamento...',
      errorLoadingStructures: 'Impossibile caricare i contenuti di anatomia e fisiologia.',
      errorLoadingFunction: 'Impossibile caricare i contenuti sulla funzione fasciale.',
      errorLoadingTreatments: 'Impossibile caricare le applicazioni cliniche.',
      errorLoadingRehab: 'Impossibile caricare i contenuti riabilitativi.',
      ptImplicationsLabel: 'Implicazioni Fisioterapiche',
      protocolLabel: 'Protocollo',
      askPhygoPrompt: 'Non trovi quello che cerchi sulla fascia? Chiedi a Phygo',
      askPhygoPlaceholder: 'es. fascia toraco-lombare, cupping, densificazione fasciale...',
      askButton: 'Chiedi',
      structureCategoryLabels: {
        anatomia_generale: 'Anatomia Generale',
        istologia: 'Istologia',
        innervazione: 'Innervazione',
        vascolarizzazione: 'Vascolarizzazione',
        regolazione_ormonale: 'Regolazione Ormonale',
        contrattilita_miofibroblasti: 'Contrattilità e Miofibroblasti',
        metodi_di_studio: 'Metodi di Studio',
      },
      functionCategoryLabels: {
        biotensegrita: 'Biotensegrità',
        carico_e_nutrizione: 'Carico e Nutrizione',
        capacita_di_allungamento: 'Capacità di Allungamento',
        cammino_e_locomozione: 'Cammino e Locomozione',
        valutazione_posturale: 'Valutazione Posturale',
      },
      treatmentCategoryLabels: {
        integrazione_strutturale: 'Integrazione Strutturale',
        terapia_dei_punti_trigger: 'Terapia dei Punti Trigger',
        manipolazione_fasciale: 'Manipolazione Fasciale',
        fascial_stretch_therapy: 'Fascial Stretch Therapy',
        gestione_delle_cicatrici: 'Gestione delle Cicatrici',
        riabilitazione_oncologica_fasciale: 'Riabilitazione Oncologica',
        auto_trattamento_miofasciale: 'Auto-Trattamento Miofasciale',
        movimento_e_rieducazione_fasciale: 'Movimento e Rieducazione',
      },
      rehabCategoryLabels: {
        post_surgical_scar_management: 'Gestione Cicatrici Post-Chirurgiche',
        progressive_loading: 'Carico Progressivo',
        movement_reeducation: 'Rieducazione del Movimento',
        sports_performance: 'Performance Sportiva',
        chronic_pain_management: 'Gestione del Dolore Cronico',
      },
    },
    urinary: {
      atlasBadge: 'Atlante Urinario',
      heading: 'Sistema Urinario/Renale',
      subTabs: {
        anatomy: 'Anatomia',
        conditions: 'Patologie',
        assessment: 'Valutazione',
        rehab: 'Riabilitazione',
      },
      anatomyHeading: 'Anatomia Renale e Urinaria',
      anatomyHint: 'Rene, nefrone e basso tratto urinario: struttura e fisiologia della filtrazione, del riassorbimento e dell\'equilibrio idro-elettrolitico.',
      anatomyIntro:
        "Il rene regola volume e composizione dei liquidi corporei attraverso filtrazione glomerulare, riassorbimento e secrezione tubulare, il sistema renina-angiotensina-aldosterone e il controllo dell'equilibrio acido-base. Una compromissione della funzione renale si ripercuote su elettroliti, pressione arteriosa, stato di idratazione e tolleranza all'esercizio, rendendo la valutazione fisioterapica interdipendente dai parametri metabolici e cardiovascolari del paziente. Le sezioni sottostanti approfondiscono l'anatomia del rene e della vescica e i principali processi fisiologici — filtrazione glomerulare, funzione tubulare, RAAS, bilancio idrico ed elettrolitico, equilibrio acido-base — che orientano la gestione clinica e la prescrizione dell'esercizio.",
      conditionsHeading: 'Patologie Collegate',
      conditionsHint: 'Patologie nefrologiche e urologiche rilevanti per la pratica fisioterapica. Tocca una card per obiettivi, test clinici ed esercizi.',
      assessmentHeading: 'Valutazione Clinica',
      assessmentHint: 'Esami di funzione renale, analisi delle urine, parametri metabolici e diagnostica per immagini.',
      rehabHeading: 'Riabilitazione',
      rehabHint: 'Prescrizione dell\'esercizio nella malattia renale cronica, in dialisi, post-trapianto e nella nefrologia dello sport.',
      loading: 'Caricamento...',
      errorLoadingStructures: 'Impossibile caricare le strutture anatomiche.',
      errorLoadingConditions: 'Impossibile caricare le patologie.',
      errorLoadingTests: 'Impossibile caricare i test di valutazione.',
      errorLoadingRehab: 'Impossibile caricare i contenuti riabilitativi.',
      procedureLabel: 'Procedura',
      interpretationLabel: 'Interpretazione',
      protocolLabel: 'Protocollo',
      categoryLabels: {
        organ: 'Organo',
        physiology: 'Fisiologia',
      },
      testCategoryLabels: {
        imaging: 'Diagnostica per Immagini',
        metabolic: 'Metabolico',
        renal_function: 'Funzione Renale',
        urinalysis: 'Analisi delle Urine',
      },
      rehabCategoryLabels: {
        renal_training: 'Allenamento in Nefropatia',
        sports_nephrology: 'Nefrologia dello Sport',
      },
    },
    physiology: {
      atlasBadge: 'Atlante Fisiologia',
      heading: 'Fisiologia di Base',
      systemTabs: { muscular: 'Muscolare', neurological: 'Neurologico', cellular: 'Cellulare' },
      sectionHint: 'I meccanismi fisiologici alla base del movimento e del sistema nervoso — non l\'anatomia di una zona specifica, ma come funzionano davvero i tessuti e i circuiti che la sostengono, con la rilevanza clinica per la pratica fisioterapica.',
      loading: 'Caricamento...',
      errorLoading: 'Impossibile caricare i contenuti di fisiologia.',
      clinicalRelevanceLabel: 'Rilevanza Clinica',
      categoryLabels: {
        contraction_mechanics: 'Meccanismi della Contrazione',
        fiber_types: 'Tipi di Fibre',
        mechanics: 'Meccanica Muscolare',
        motor_control: 'Controllo Motorio',
        exercise_adaptation: 'Adattamento all\'Esercizio',
        neuromuscular: 'Giunzione Neuromuscolare',
        smooth_cardiac: 'Muscolo Liscio e Cardiaco',
        cellular_basics: 'Fisiologia Cellulare',
        reflexes: 'Riflessi',
        sensory: 'Sistemi Sensoriali',
        plasticity: 'Plasticità e Apprendimento',
        autonomic: 'Sistema Nervoso Autonomo',
        membrane_transport: 'Trasporto di Membrana',
        chemical_messengers: 'Messaggeri Chimici',
        homeostasis: 'Omeostasi e Controllo',
        energy_metabolism: 'Metabolismo Energetico',
      },
    },
    sportsMedicine: {
      atlasBadge: 'Atlante Medicina dello Sport',
      heading: 'Medicina dello Sport',
      sectionHint: 'La scienza di base della lesione sportiva e del recupero — classificazione, guarigione tissutale, ragionamento clinico e modalità terapeutiche, con le linee guida più aggiornate per un ritorno allo sport sicuro ed efficace.',
      loading: 'Caricamento...',
      errorLoading: 'Impossibile caricare i contenuti di medicina dello sport.',
      clinicalRelevanceLabel: 'Rilevanza Clinica',
      categoryLabels: {
        injury_classification: 'Classificazione delle Lesioni',
        tissue_healing: 'Guarigione Tissutale',
        clinical_reasoning: 'Ragionamento Clinico',
        therapeutic_modalities: 'Modalità Terapeutiche',
        on_field_emergency_rtp: 'Trauma sul Campo e Ritorno allo Sport',
        rehabilitation_programming: 'Riabilitazione e Ricondizionamento',
      },
    },
    librarySearchPlaceholder: 'Cerca in questa sezione...',
    librarySearchNoResults: 'Nessun risultato per la tua ricerca.',
    gastrointestinal: {
      atlasBadge: 'Atlante Gastrointestinale',
      heading: 'Sistema Gastrointestinale',
      subTabs: {
        anatomy: 'Anatomia',
        conditions: 'Patologie',
        assessment: 'Valutazione',
        rehab: 'Riabilitazione',
      },
      anatomyHeading: 'Anatomia Gastrointestinale',
      anatomyHint: 'Motilità del tratto digerente, stomaco, intestino tenue, fegato, pancreas esocrino, colon e microbiota: come funzionano come sistema integrato.',
      anatomyIntro:
        "Il sistema gastrointestinale integra motilità, secrezione, digestione e assorbimento lungo tutto il tratto digerente: una disfunzione in un tratto (ad esempio motoria a livello gastrico o infiammatoria a livello colico) si ripercuote spesso su nutrizione, energia disponibile per l'esercizio e tolleranza allo sforzo. La valutazione fisioterapica in ambito gastrointestinale considera la storia clinica digestiva, i test di laboratorio e funzionali disponibili e l'impatto della patologia sulla capacità di allenarsi e sulla qualità di vita. Le sezioni sottostanti approfondiscono il tratto digerente nel suo insieme, i singoli organi (stomaco, intestino tenue, fegato, pancreas, colon) e l'asse intestino-muscolo mediato dal microbiota, centrale per la prescrizione dell'esercizio in questi pazienti.",
      conditionsHeading: 'Patologie Collegate',
      conditionsHint: 'Le principali condizioni gastrointestinali rilevanti per la pratica fisioterapica. Tocca una card per obiettivi, test clinici ed esercizi.',
      assessmentHeading: 'Valutazione Clinica',
      assessmentHint: 'Esami ematochimici, marker fecali, sierologia, test funzionali, imaging ed endoscopia utili a inquadrare il paziente gastroenterologico.',
      rehabHeading: 'Riabilitazione',
      rehabHint: 'Protocolli di esercizio terapeutico per malattie infiammatorie intestinali, epatopatie croniche, chirurgia bariatrica, stomie e sport di endurance.',
      loading: 'Caricamento...',
      errorLoadingStructures: 'Impossibile caricare le strutture anatomiche.',
      errorLoadingConditions: 'Impossibile caricare le patologie.',
      errorLoadingTests: 'Impossibile caricare i test di valutazione.',
      errorLoadingRehab: 'Impossibile caricare i contenuti riabilitativi.',
      procedureLabel: 'Procedura',
      interpretationLabel: 'Interpretazione',
      protocolLabel: 'Protocollo',
      categoryLabels: {
        organ: 'Organi',
        system_overview: 'Panoramica di Sistema',
      },
      testCategoryLabels: {
        blood_panel: 'Pannello Ematico',
        endoscopy: 'Endoscopia',
        functional_test: 'Test Funzionali',
        imaging: 'Imaging',
        serology: 'Sierologia',
        stool_marker: 'Marker Fecali',
      },
      rehabCategoryLabels: {
        chronic_disease_management: 'Gestione Malattie Croniche',
        gi_disease_management: 'Gestione Patologie Gastrointestinali',
        post_surgical: 'Post-Chirurgico',
        sports_nutrition: 'Nutrizione Sportiva',
      },
    },
    immune: {
      atlasBadge: 'Atlante Immunitario',
      heading: 'Sistema Immunitario',
      subTabs: {
        anatomy: 'Anatomia',
        conditions: 'Patologie',
        assessment: 'Valutazione',
        rehab: 'Riabilitazione',
      },
      anatomyHeading: 'Anatomia del Sistema Immunitario',
      anatomyHint: 'Organi linfoidi primari e secondari, drenaggio linfatico periferico e le tre linee di difesa immunitaria.',
      anatomyIntro:
        "Il sistema immunitario integra organi linfoidi primari (midollo osseo e timo), dove le cellule immunitarie maturano, e organi linfoidi secondari (linfonodi, milza, MALT), dove viene innescata la risposta immunitaria. Il drenaggio linfatico periferico veicola liquidi, antigeni e cellule immunitarie verso questi organi, mentre immunità innata, umorale e cellulo-mediata rappresentano le tre modalità con cui l'organismo riconosce e neutralizza le minacce. Una compromissione di una qualsiasi di queste componenti — per patologia, farmaci immunosoppressori o overtraining — ha ricadute dirette sulla capacità dell'organismo di rispondere a infezioni, infiammazione cronica ed esercizio fisico.",
      conditionsHeading: 'Patologie Collegate',
      conditionsHint: 'Condizioni immunitarie, autoimmuni e post-infettive. Tocca una card per obiettivi, test clinici ed esercizi.',
      assessmentHeading: 'Valutazione Clinica',
      assessmentHint: 'Esami ematologici, immunologici e marker infiammatori utilizzati nella valutazione fisioterapica.',
      rehabHeading: 'Riabilitazione',
      rehabHint: 'Dosaggio dell\'esercizio, precauzioni in immunosoppressione, gestione del linfedema e riabilitazione post-virale.',
      loading: 'Caricamento...',
      errorLoadingStructures: 'Impossibile caricare le strutture anatomiche.',
      errorLoadingConditions: 'Impossibile caricare le patologie.',
      errorLoadingTests: 'Impossibile caricare i test di valutazione.',
      errorLoadingRehab: 'Impossibile caricare i contenuti riabilitativi.',
      procedureLabel: 'Procedura',
      interpretationLabel: 'Interpretazione',
      protocolLabel: 'Protocollo',
      categoryLabels: {
        cell_mediated_immunity: 'Immunità Cellulo-Mediata',
        humoral_immunity: 'Immunità Umorale',
        innate_immunity: 'Immunità Innata',
        lymphatic_drainage: 'Drenaggio Linfatico',
        primary_lymphoid_organ: 'Organi Linfoidi Primari',
        secondary_lymphoid_organ: 'Organi Linfoidi Secondari',
      },
      testCategoryLabels: {
        functional: 'Test Funzionali',
        hematologic: 'Ematologico',
        immunologic: 'Immunologico',
        inflammatory_marker: 'Marker Infiammatori',
      },
      rehabCategoryLabels: {
        exercise_immunology: 'Immunologia dell\'Esercizio',
        immunosuppression_precautions: 'Precauzioni in Immunosoppressione',
        inflammatory_arthritis_training: 'Allenamento nelle Artriti Infiammatorie',
        lymphedema_management: 'Gestione del Linfedema',
        post_viral_rehabilitation: 'Riabilitazione Post-Virale',
      },
    },
    hematology: {
      atlasBadge: 'Atlante Ematologico',
      heading: 'Sangue / Ematologia',
      subTabs: {
        anatomy: 'Anatomia',
        conditions: 'Patologie',
        assessment: 'Valutazione',
        rehab: 'Riabilitazione',
      },
      anatomyHeading: 'Anatomia e Fisiologia del Sangue',
      anatomyHint: 'Linee cellulari, plasma, emoglobina ed emostasi: i componenti e i processi che regolano trasporto di ossigeno, difesa immunitaria e coagulazione.',
      anatomyIntro:
        'Il sangue è un tessuto connettivo liquido che assolve funzioni di trasporto (ossigeno, nutrienti, ormoni), difesa immunitaria ed emostasi. La componente cellulare (eritrociti, leucociti, piastrine) e quella plasmatica lavorano in equilibrio dinamico: un\'alterazione della linea rossa, della cascata coagulativa o della composizione del plasma ha ricadute dirette sulla tolleranza allo sforzo e sulla sicurezza dell\'esercizio terapeutico. Le sezioni sottostanti approfondiscono eritrociti ed eritropoiesi, leucociti, plasma, emoglobina/trasporto dell\'ossigeno ed emostasi/coagulazione.',
      conditionsHeading: 'Patologie Collegate',
      conditionsHint: 'Patologie ematologiche di interesse fisioterapico. Tocca una card per obiettivi, test clinici ed esercizi.',
      assessmentHeading: 'Valutazione Clinica',
      assessmentHint: 'Esami di laboratorio e test ematologici rilevanti per la pratica fisioterapica.',
      rehabHeading: 'Riabilitazione',
      rehabHint: 'Prescrizione dell\'esercizio, prevenzione del tromboembolismo, precauzioni in terapia anticoagulante e protocolli condizione-specifici.',
      loading: 'Caricamento...',
      errorLoadingStructures: 'Impossibile caricare le strutture ematologiche.',
      errorLoadingConditions: 'Impossibile caricare le patologie.',
      errorLoadingTests: 'Impossibile caricare i test di valutazione.',
      errorLoadingRehab: 'Impossibile caricare i contenuti riabilitativi.',
      procedureLabel: 'Procedura',
      interpretationLabel: 'Interpretazione',
      protocolLabel: 'Protocollo',
      categoryLabels: {
        cell_line: 'Linee Cellulari',
        fluid: 'Componente Fluida',
        molecule: 'Molecole',
        process: 'Processi',
      },
      testCategoryLabels: {
        coagulation: 'Coagulazione',
        diagnostic: 'Diagnostica',
        general: 'Esami Generali',
        metabolic: 'Metabolico',
      },
      rehabCategoryLabels: {
        condition_specific: 'Condizione-Specifico',
        exercise_prescription: 'Prescrizione dell\'Esercizio',
        post_surgical: 'Post-Chirurgico',
        precaution_protocol: 'Protocolli di Precauzione',
      },
    },
    clinicalToolkit: {
      badge: 'Strumenti Clinici',
      headingAccent: 'Toolkit',
      headingRest: 'Clinico',
      subtitle: 'Scale validate, test clinici e protocolli di trattamento riuniti in un unico spazio di lavoro professionale.',
      tabLabels: {
        functional: 'Scale Funzionali',
        orthopedic: 'Test Ortopedici',
        pelvicFloor: 'Pavimento Pelvico',
        neuro: 'Neurologia',
        manualTherapy: 'Terapia Manuale',
        metabolic: 'Metabolico',
      },
      manualTherapy: {
        mulliganPrinciplesHeading: 'Principi Fondamentali del Mulligan Concept',
        mulliganPrinciplesHint: "Il framework teorico (PILL, CROCKS, Specifica Disfunzione) che guida l'applicazione di tutte le tecniche MWM presenti nelle regioni sottostanti.",
        closeLabel: 'Chiudi',
        readLabel: 'Leggi',
        loadingTechniques: 'Caricamento tecniche in corso...',
        errorLoadingTechniques: 'Impossibile caricare le tecniche di terapia manuale.',
        noTechniquesFound: 'Nessuna tecnica trovata per questa regione.',
        patientPositionLabel: 'Posizione paziente',
        directionLabel: 'Direzione',
        indicationsLabel: 'Indicazioni',
        procedureLabel: 'Procedura',
        regionLabels: {
          'ATM': 'ATM',
          'Colonna Cervicale': 'Colonna Cervicale',
          'Colonna Toracica': 'Colonna Toracica',
          'Colonna Lombare e Pelvi': 'Colonna Lombare e Pelvi',
          'Spalla': 'Spalla',
          'Gomito': 'Gomito',
          'Polso e Mano': 'Polso e Mano',
          'Anca': 'Anca',
          'Ginocchio': 'Ginocchio',
          'Caviglia': 'Caviglia',
          'Piede': 'Piede',
        },
        typeLabels: {
          all: 'Tutte',
          mobilization: 'Mobilizzazione',
          manipulation: 'Manipolazione',
          thrust: 'Thrust',
          nonthrust: 'Non-thrust',
          mwm: 'MWM (Mulligan)',
          prp: 'PRP (Mulligan)',
        },
      },
      orthopedic: {
        regionLabels: {
          knee: 'Ginocchio',
          shoulder: 'Spalla',
          hip: 'Anca',
          spine: 'Colonna Lombare',
          ankle: 'Caviglia/Piede',
          'elbow-wrist': 'Gomito/Polso',
          cervical: 'Colonna Cervicale',
        },
        procedureLabel: 'Procedura',
        positiveLabel: 'Positivo se',
        loading: 'Caricamento test in corso...',
        errorLoadingTests: 'Impossibile caricare i test ortopedici.',
      },
      pelvicFloor: {
        questionnaireCalloutHeading: 'Questionario Anamnestico Interattivo',
        questionnaireCalloutDescription: 'Raccolta strutturata di anamnesi intestinale, urinaria e del dolore pelvico, con riepilogo finale organizzato per area.',
        startQuestionnaireLabel: 'Avvia Questionario',
        loading: 'Caricamento test in corso...',
        errorLoadingTests: 'Impossibile caricare i test del pavimento pelvico.',
        categoryLabels: {
          neuropathy: 'Test Neuropatici',
          manual_assessment: 'Valutazione Manuale',
          urodynamic: 'Test Urodinamici',
          questionnaire: 'Questionari',
          symptom_questionnaire: 'Questionari Sintomatologici',
        },
        procedureLabel: 'Procedura',
        interpretationLabel: 'Interpretazione',
        fillQuestionnaireLabel: 'Compila il questionario',
        hideQuestionnaireLabel: 'Nascondi questionario',
        fillableBadge: 'Compilabile',
        loadingQuestionnaireContent: 'Caricamento questionario...',
        sf36: {
          domainLabels: {
            PF: 'Attività Fisica',
            RP: 'Limitazioni di Ruolo — Fisico',
            RE: 'Limitazioni di Ruolo — Emotivo',
            VT: 'Vitalità/Energia',
            MH: 'Salute Mentale',
            SF: 'Attività Sociali',
            BP: 'Dolore Fisico',
            GH: 'Salute Generale',
          },
          scoreHeader: 'Punteggi per dominio (0-100, più alto = stato di salute percepito migliore) — {answered}/{total} domande compilate',
          responsesLabel: 'risposte',
        },
        pfdi: {
          subscaleLabels: {
            POPDI: 'Prolasso Genitale (POPDI-6)',
            CRADI: 'Colon-Retto-Ano (CRADI-8)',
            UDI: 'Urinario (UDI-6)',
          },
          scoreHeader: 'Punteggi per sottoscala (0-100, più alto = maggiore disagio) — {answered}/{total} domande compilate',
          responsesLabel: 'risposte',
          severityLabels: {
            minimal: 'Sintomi minimi',
            moderate: 'Disagio moderato',
            severe: 'Disagio severo',
          },
        },
        iciq: {
          severityPrefix: 'Severità',
          severityLabels: {
            mild: 'Lieve',
            moderate: 'Moderato',
            severe: 'Severo',
            verySevere: 'Molto severo',
          },
        },
      },
      neuro: {
        calloutHeading: 'Esame Obiettivo Neurologico',
        calloutDescription: 'Esame clinico multi-step: nervi cranici, riflessi, segni patologici, sensibilità, forza muscolare, coordinazione, equilibrio e andatura, con riepilogo finale.',
        startExamLabel: 'Avvia Esame',
        loading: 'Caricamento test in corso...',
        errorLoadingTests: 'Impossibile caricare i test neurologici.',
        categoryLabels: {
          cranial_nerves: 'Nervi Cranici',
          reflexes: 'Riflessi',
          sensation: 'Sensibilità',
          strength: 'Forza Muscolare',
          coordination: 'Coordinazione',
          balance_gait: 'Equilibrio e Andatura',
        },
        procedureLabel: 'Procedura',
        interpretationLabel: 'Interpretazione',
      },
      functional: {
        loading: 'Caricamento contenuti in corso...',
        errorLoadingScales: 'Impossibile caricare le scale funzionali.',
        yesLabel: 'Sì',
        noLabel: 'No',
        secondsUnit: 'secondi',
        secondsMax120Unit: 'secondi (max 120)',
        metersUnit: 'metri',
        groupLabels: {
          balanceFalls: 'Equilibrio e Rischio di Caduta',
          adl: 'Autonomia nelle Attività Quotidiane',
          cognitiveConsciousness: 'Stato Cognitivo e di Coscienza',
          painTone: 'Dolore e Tono Muscolare',
          aerobicQol: 'Capacità Aerobica e Qualità della Vita',
          strokeNeurodegenerative: 'Ictus e Malattie Neurodegenerative',
          upperLimb: 'Arto Superiore',
          orthopedics: 'Ortopedia e Recupero Post-Chirurgico',
          trunkGlobalDisability: 'Controllo del Tronco e Disabilità Globale',
        },
      },
    },
    metabolicCalculator: {
      badge: 'Calcolatore Metabolico',
      heading: 'Profilo Metabolico',
      subtitle: 'Stima il fabbisogno energetico e la ripartizione dei macronutrienti in meno di un minuto.',
      disclaimer: 'Questi valori sono stime a scopo informativo e di pianificazione e non sostituiscono una consulenza medica o nutrizionale personalizzata.',
      sexLabel: 'Sesso',
      sexOptions: { male: 'Uomo', female: 'Donna' },
      ageLabel: 'Età',
      weightLabel: 'Peso (kg)',
      heightLabel: 'Altezza (cm)',
      activityLabel: 'Livello di Attività',
      activityLevels: {
        sedentary: 'Sedentario',
        light: 'Leggermente Attivo',
        moderate: 'Moderatamente Attivo',
        very: 'Molto Attivo',
        extreme: 'Estremamente Attivo',
      },
      bodyFatLabel: 'Massa Grassa (%)',
      bodyFatOptionalHint: 'Facoltativo — se indicata, la stima usa la tua massa magra reale invece di una media statistica.',
      goalLabel: 'Obiettivo',
      goals: {
        maintain: 'Mantenimento',
        fat_loss: 'Dimagrimento',
        muscle_gain: 'Aumento Massa',
        performance: 'Performance',
      },
      macroStrategyLabel: 'Strategia Macro',
      macroStrategies: {
        balanced: 'Bilanciata',
        high_protein: 'Alto Proteica',
        high_carb: 'Alto Carboidrati',
        low_carb: 'Basso Carboidrati',
        custom: 'Personalizzata',
      },
      calculateCta: 'Calcola',
      recalculateCta: 'Ricalcola',
      invalidInputWarning: 'Verifica i dati inseriti: alcuni valori sembrano fuori dal range plausibile.',
      resultsHeading: 'Il Tuo Profilo Metabolico',
      bmrLabel: 'Metabolismo Basale (BMR)',
      tdeeLabel: 'Fabbisogno Energetico Totale (TDEE)',
      bmiLabel: 'BMI',
      bmiCategories: {
        underweight: 'Sottopeso',
        normal: 'Normopeso',
        overweight: 'Sovrappeso',
        obese: 'Obesità',
      },
      leanBodyMassLabel: 'Massa Magra Stimata',
      fatMassLabel: 'Massa Grassa Stimata',
      estimateNote: 'Stima, non una misurazione clinica esatta.',
      calorieTargetLabel: 'Target Calorico Giornaliero',
      calorieScenariosHeading: 'Scenari Calorici',
      kcalPerDaySuffix: 'kcal/giorno',
      macronutrientsHeading: 'Macronutrienti',
      proteinLabel: 'Proteine',
      carbsLabel: 'Carboidrati',
      fatLabel: 'Grassi',
      perKgSuffix: 'g/kg',
      editMacrosCta: 'Modifica Percentuali',
      doneEditingCta: 'Fatto',
      saveCta: 'Salva sul Profilo',
      saveToPatientCta: 'Salva sul Paziente',
      selectPatientPrompt: 'Seleziona un paziente',
      savedConfirmation: 'Salvato',
      historyHeading: 'Storico Metabolico',
      noHistoryYet: 'Nessun profilo salvato finora.',
      todaysTargetHeading: 'Target di Oggi',
      activityLevelLabel: 'Livello di Attività',
      printCta: 'Esporta PDF',
      printedForLabel: 'Profilo per',
      printedOnLabel: 'Generato il',
      adaptiveBadge: 'Phygo Adapt',
      adaptiveHeading: 'Il Tuo TDEE Reale',
      adaptiveExplain: 'Calcolato dal trend di peso realmente registrato — più affidabile della sola formula, perché si basa su cosa è successo davvero, non solo su una stima statistica.',
      adaptiveDeltaAbove: 'Il tuo metabolismo reale sembra più alto della stima: {value} kcal/giorno in più.',
      adaptiveDeltaBelow: 'Il tuo metabolismo reale sembra più basso della stima: {value} kcal/giorno in meno.',
      adaptiveDeltaMatch: 'Il tuo metabolismo reale è in linea con la stima calcolata.',
      adaptiveBasedOn: 'Basato su {days} giorni e {entries} rilevazioni.',
      adaptiveNotEnoughData: 'Continua a salvare i tuoi dati: con almeno due rilevazioni a distanza di 10+ giorni, Phygo calibrerà il tuo TDEE reale sul tuo trend di peso effettivo.',
      goalWeightLabel: 'Peso Obiettivo (kg)',
      goalWeightPlaceholder: 'es. 70',
      goalWeightHint: 'Inserisci un peso obiettivo per vedere una stima di quando potresti raggiungerlo, basata sul tuo ritmo reale.',
      projectionHeading: 'Stima al Traguardo',
      projectionAchievable: 'Al ritmo attuale, potresti raggiungere il tuo obiettivo in circa {days} giorni (~{date}).',
      projectionWrongDirection: 'Il tuo trend di peso attuale si sta muovendo nella direzione opposta rispetto a questo obiettivo.',
      projectionNoProgress: 'Il tuo peso è rimasto stabile nel periodo osservato: non è ancora possibile stimare una data.',
      weightTrendHeading: 'Andamento del Peso',
      foodExamplesCta: 'Esempi Alimentari',
      hideFoodExamplesCta: 'Nascondi Esempi Alimentari',
      foodExamplesDisclaimer: 'Valori indicativi e generali, non specifici di un prodotto o marca — un riferimento per farsi un\'idea, non un piano alimentare.',
      perHundredGramsSuffix: '/100g',
    },
    myPhygoLife: {
      badge: 'Phygo Life',
      heading: 'La Tua Vita, Monitorata',
      subtitle: 'Strumenti per prenderti cura di te ogni giorno, oltre le sedute con il tuo fisioterapista.',
      metabolicCardTitle: 'Profilo Metabolico',
      metabolicCardSubtitle: 'Scopri il tuo fabbisogno calorico e la ripartizione ideale di proteine, carboidrati e grassi.',
      backToHome: 'Torna alla Home',
      noProfileYet: 'Non hai ancora calcolato il tuo profilo metabolico.',
      startCalculatorCta: 'Calcola il Tuo Profilo',
      recalculatePrompt: 'Vuoi aggiornare i tuoi dati?',
      scaleReminderHeading: 'Non hai una bilancia? Ecco i nostri consigli.',
      scaleReminderCta: 'Vedi le bilance consigliate',
    },
    neuroExam: {
      backToClinicalToolkit: 'Torna a Clinical Toolkit',
      badge: 'Esame Obiettivo',
      heading: 'Esame Neurologico',
      sectionCounterSeparator: 'di',
      backButton: 'Indietro',
      nextButton: 'Avanti',
      viewSummaryButton: 'Vedi Riepilogo',
      editAnswersButton: 'Modifica risposte',
      finishButton: 'Concludi',
      summaryHeading: 'Riepilogo Esame Neurologico',
      loading: 'Caricamento...',
      errorLoading: "Impossibile caricare il contenuto dell'esame.",
      sections: {
        consciousness: 'Stato di Vigilanza e Coscienza',
        cortical_functions: 'Funzioni Corticali Superiori',
        stance_gait: 'Stazione Eretta e Deambulazione',
        strength_tone: 'Forza, Trofismo e Tono Muscolare',
        reflexes: 'Riflessi Osteotendinei e Superficiali',
        sensation: 'Sensibilità',
        cerebellar: 'Prove Cerebellari',
        cranial_nerves: 'Nervi Cranici',
        involuntary_movements: 'Movimenti Involontari',
        meningeal_signs: 'Segni Meningei',
      },
    },
    patients: {
      eyebrow: 'Dashboard',
      greetingMorning: 'Buongiorno',
      greetingAfternoon: 'Buon pomeriggio',
      greetingEvening: 'Buonasera',
      greetingDefault: 'Bentornato/a',
      subtitle: 'Ecco il tuo elenco pazienti',
      newPatient: 'Nuovo paziente',
      cancel: 'Annulla',
      statPatients: 'Pazienti',
      statNotesThisMonth: 'Note questo mese',
      statActivePlans: 'Piani attivi',
      searchPlaceholder: 'Cerca pazienti per nome...',
      formNameLabel: 'Nome',
      formGenderLabel: 'Genere',
      genderMale: 'Maschio',
      genderFemale: 'Femmina',
      genderNotSpecified: 'Non specificato',
      formAgeLabel: 'Età',
      formConditionLabel: 'Condizione principale',
      savingButton: 'Salvataggio...',
      savePatientButton: 'Salva paziente',
      noPatientsYet: 'Ancora nessun paziente. Aggiungine uno per iniziare.',
      noPatientsMatch: 'Nessun paziente corrisponde a "{search}".',
      yearsOld: '{age} anni',
      patientNotFound: 'Paziente non trovato.',
      portalActive: 'Portale attivo',
      scheduleButton: 'Agenda',
      generateNewNoteButton: 'Genera nuova nota',
      generatingInvite: 'Generazione...',
      inviteToPortalButton: 'Invita al portale',
      resetPortalAccess: 'Reimposta accesso portale',
      resetPortalConfirm: "Questo disconnetterà l'account portale attuale di {name}. Dovrà usare un nuovo link di invito per accedere di nuovo. Continuare?",
      inviteReadyHeading: 'Link di invito pronto — valido 7 giorni',
      inviteShareText: 'Condividi questo link con {name} per accedere al portale My Phygo.',
      copied: 'Copiato',
      copyButton: 'Copia',
      inviteError: "Impossibile creare l'invito. Riprova.",
      statSessions: 'Sessioni',
      statLastSession: 'Ultima sessione',
      statPatientSince: 'Paziente da',
      statLinkedItems: 'Elementi collegati',
      noteHistoryHeading: 'Storico note',
      noNotesYet: 'Ancora nessuna nota per questo paziente.',
      generateFirstNote: 'Genera la prima nota di sessione per iniziare lo storico.',
      noAssessmentRecorded: 'Nessuna valutazione registrata.',
      treatmentPlanHeading: 'Piano di trattamento e riferimenti clinici',
      nothingLinkedYet: 'Ancora nulla collegato a {name}.',
      treatmentPlanHint: 'Usa "Aggiungi al Piano di Trattamento" / "Usa con Paziente" in Mappa del Corpo, Neurologia, Cardiopolmonare, Oncologia o Terapia Manuale per costruire qui il suo storico.',
      noteHistorySubtitle: 'Cronologia completa delle sessioni cliniche registrate',
      treatmentPlanSubtitle: 'Test, questionari, esercizi e riferimenti clinici assegnati al percorso di cura',
      openReferenceHint: 'Apri',
      removeTitle: 'Rimuovi',
      refTypeExercise: 'Esercizio / Tecnica',
      refTypeClinicalTest: 'Test Clinico',
      refTypeQuestionnaire: 'Questionario',
      refTypeCondition: 'Condizione',
      refTypeBodyZone: 'Zona Corporea',
      refTypeProduct: 'Prodotto',
      refTypeMetabolicProfile: 'Profilo Metabolico',
      sinceToday: 'Oggi',
      since1Day: '1 giorno',
      sinceDays: '{days} giorni',
      since1Month: '1 mese',
      sinceMonths: '{months} mesi',
      since1Year: '1 anno',
      sinceYears: '{years} anni',
      backToPatientName: 'Torna a {name}',
      sessionNoteTab: 'Nota di Sessione',
      videoCallTab: 'Videochiamata',
      noteSavedMessage: 'Nota salvata nella cartella di {name}.',
      nutritionHeading: 'Nutrizione e profilo metabolico',
      nutritionSubtitle: 'Fabbisogno calorico, macronutrienti e andamento del peso nel tempo',
      nutritionEmpty: 'Nessun profilo metabolico ancora calcolato per {name}.',
      nutritionEmptyHint: 'Calcola un primo profilo dal Calcolatore Metabolico in Strumenti Clinici per iniziare a tracciare il suo andamento qui.',
      weightTrendHeading: 'Andamento del Peso',
      latestProfileLabel: 'Ultimo profilo',
      newCalculationCta: 'Nuovo Calcolo',
      viewFullCalculatorCta: 'Apri nel Calcolatore',
    },
    pelvicFloorAnamnesis: {
      backToPelvicFloor: 'Torna al Pavimento Pelvico',
      badge: 'Questionario Anamnestico',
      heading: 'Valutazione del Pavimento Pelvico',
      sectionCounterSeparator: 'di',
      backButton: 'Indietro',
      nextButton: 'Avanti',
      viewSummaryButton: 'Vedi Riepilogo',
      editAnswersButton: 'Modifica risposte',
      finishButton: 'Concludi',
      summaryHeading: 'Riepilogo Anamnestico',
      loading: 'Caricamento...',
      errorLoading: 'Impossibile caricare il contenuto del questionario.',
    },
    firstAid: {
      badge: 'Atlante di Primo Soccorso',
      heading: 'Primo Soccorso',
      subtitle: 'Protocolli confrontati tra Italia, Francia, Regno Unito, Spagna e USA — perché le linee guida non sono sempre le stesse ovunque.',
      infoBox: "Ogni scheda riporta, per ciascun paese, il numero di emergenza da chiamare, l'ente sanitario di riferimento, il protocollo pratico da seguire e la fonte ufficiale consultata — così da poter passare rapidamente da un paese all'altro senza perdere accuratezza.",
      allFilter: 'Tutti',
      loadingTopics: 'Caricamento argomenti...',
      errorLoadingTopics: 'Impossibile caricare gli argomenti di primo soccorso.',
      backToTopics: 'Tutti gli argomenti',
      errorLoadingTopic: 'Impossibile caricare questo argomento di primo soccorso.',
      emergencyNumberLabel: 'Numero di emergenza: ',
      governingBodyLabel: 'Ente di riferimento: ',
      protocolLabel: 'Protocollo',
      notesLabel: 'Note sulle differenze',
      sourceLabel: 'Fonte: ',
      categoryLabels: {
        rianimazione: 'Rianimazione',
        neurologico: 'Neurologico',
        cardiovascolare: 'Cardiovascolare',
        allergologico: 'Allergologico',
        trauma: 'Trauma',
        ambientale: 'Ambientale',
        tossicologico: 'Tossicologico',
        organizzazione: 'Organizzazione',
      },
      countryLabels: {
        Italia: 'Italia',
        Francia: 'Francia',
        'Regno Unito': 'Regno Unito',
        Spagna: 'Spagna',
        USA: 'USA',
      },
    },
    bls: {
      badge: 'BLSD',
      heading: 'Basic Life Support',
      subtitle: 'RCP, DAE e disostruzione delle vie aeree — verificato con le linee guida AHA 2025 (American Heart Association).',
      infoBox: "Il BLSD (Basic Life Support Defibrillation) è l'insieme delle manovre salvavita di base — rianimazione cardiopolmonare, uso del defibrillatore e disostruzione delle vie aeree — che ogni operatore sanitario dovrebbe saper eseguire in autonomia prima dell'arrivo del soccorso avanzato. Ogni scheda qui sotto riporta la procedura completa, i parametri tecnici chiave (frequenza, profondità, rapporto compressioni/ventilazioni) e le precauzioni specifiche per fascia d'età, con le eventuali variazioni introdotte dalle linee guida più recenti.",
      errorLoading: 'Impossibile caricare le procedure BLSD.',
      positionLabel: 'Posizione',
      procedureLabel: 'Procedura',
      keyParametersLabel: 'Parametri Chiave',
      precautionsLabel: 'Precauzioni',
      evidenceLabel: 'Evidenza',
      categoryLabels: {
        adult_cpr: 'RCP Adulto',
        child_cpr: 'RCP Pediatrica',
        infant_cpr: 'RCP Infantile',
        choking: 'Disostruzione Vie Aeree',
        aed: 'DAE',
        team_dynamics: 'Dinamiche di Team',
      },
    },
    bodyMap: {
      badge: 'Mappa 3D Interattiva del Corpo',
      calibrationBadge: 'Modalità Calibrazione — clicca sul modello',
      heading: 'Anatomical Navigator',
      subtitle: 'Ruota, ingrandisci ed esplora il modello anatomico 3D — clicca su una zona per aprire condizioni, test e protocolli specifici.',
      legendMuscleZones: 'Zone muscolari',
      legendBoneZones: 'Zone ossee (raggi-X)',
      legendDragScroll: 'Trascina per ruotare, scorri per zoom',
      howItWorks: {
        clickZone: {
          label: 'Clicca una zona',
          text: 'Ogni regione evidenziata apre la sua pagina dedicata: anatomia, biomeccanica, test clinici e protocolli riabilitativi.',
        },
        xray: {
          label: 'Attiva i raggi-X',
          text: 'Passa alla modalità scheletrica per esplorare 14 gruppi ossei, con le loro fratture e patologie più frequenti.',
        },
        search: {
          label: 'Cerca una zona',
          text: 'Per le aree piccole (polso, caviglia, gomito) è più rapido digitare il nome nella barra di ricerca che centrarle col mouse.',
        },
      },
      clinicalFooter: 'Contenuto clinico ancorato a classificazioni e linee guida verificate — Neer, Kibler, AO/Weber, Garden, SOSORT e altre',
      ctaWholeBody: 'Corpo Intero / Equilibrio e Andatura',
      loadingModel: 'Caricamento modello 3D...',
      searchPlaceholder: 'Cerca zona...',
      noZoneFound: 'Nessuna zona trovata',
      dragRotateZoom: 'Trascina per ruotare · scorri per zoom',
      xrayLabel: 'Raggi-X',
      modelCreditPrefix: 'Modello 3D:',
      zoneNotFound: 'Zona non trovata.',
      backToBodyMap: 'Mappa del Corpo',
      zoneTypeSkeletal: 'Struttura Ossea',
      zoneTypeAnatomical: 'Zona Anatomica',
      relatedZonesLabel: 'Zone Correlate',
      askPhygoButton: 'Chiedi a Phygo su questa zona',
      askPhygoHeadingPrefix: 'Chiedi a Phygo su {zone}',
      askPlaceholder: 'Fai una domanda clinica su questa regione...',
      askGenericError: 'Qualcosa è andato storto.',
      askGenericErrorRetry: 'Qualcosa è andato storto. Riprova.',
      noExercisesLinked: 'Ancora nessun esercizio collegato a questa zona.',
      seeAllExercises: 'Vedi tutti i {count} esercizi nella Libreria Pro →',
      relatedConditionsHeading: 'Patologie Collegate',
      noConditionsLinked: 'Ancora nessuna patologia collegata a questa zona.',
      sourceCitedAriaLabel: 'Fonte citata',
      zoneNames: {
        'cervical-spine': 'Rachide Cervicale',
        trapezius: 'Trapezio / Trapezio Superiore',
        shoulder: 'Spalla',
        chest: 'Petto / Pettorali',
        biceps: 'Bicipite',
        triceps: 'Tricipite',
        elbow: 'Gomito',
        forearm: 'Avambraccio',
        'wrist-hand': 'Polso / Mano',
        'core-abdomen': 'Core / Addome',
        'thoracic-spine': 'Rachide Toracico / Schiena Alta',
        'lumbar-spine': 'Rachide Lombare / Schiena Bassa',
        hip: 'Anca',
        glutes: 'Glutei',
        quadriceps: 'Quadricipite',
        hamstrings: 'Femorali',
        knee: 'Ginocchio',
        calf: 'Polpaccio',
        'ankle-foot': 'Caviglia / Piede',
      },
      boneNames: {
        'bone-cranio': 'Cranio',
        'bone-clavicola-scapola': 'Clavicola e Scapola',
        'bone-coste-sterno': 'Coste e Sterno',
        'bone-omero': 'Omero',
        'bone-radio-ulna': 'Radio e Ulna',
        'bone-mano': 'Ossa della Mano',
        'bone-bacino': 'Bacino',
        'bone-sacro': 'Sacro e Coccige',
        'bone-femore': 'Femore',
        'bone-tibia-perone': 'Tibia e Perone',
        'bone-piede': 'Ossa del Piede',
        'bone-cervicale': 'Vertebre Cervicali',
        'bone-dorsale': 'Vertebre Toraciche',
        'bone-lombare': 'Vertebre Lombari',
      },
    },
    pelvicFloorAtlas: {
      badge: 'Atlante del Pavimento Pelvico',
      heading: 'Pavimento Pelvico',
      subTabs: { anatomy: 'Anatomia', conditions: 'Patologie', assessment: 'Valutazione', rehab: 'Riabilitazione' },
      anatomyHeading: 'Anatomia del Pavimento Pelvico',
      anatomyIntro:
        'Muscoli, fasce, legamenti e concetti chiave che spiegano come il pavimento pelvico funziona come sistema integrato.',
      overviewIntro:
        "Il pavimento pelvico è un sistema muscolo-fasciale a forma di imbuto che chiude inferiormente la cavità addomino-pelvica, sostenendo vescica, utero/prostata e retto. Non è un blocco muscolare isolato: lavora in coordinazione con muscolatura addominale profonda, diaframma respiratorio e struttura connettivale circostante (fasce e legamenti) per contrastare le pressioni intra-addominali generate da respirazione, tosse, sforzo e sollevamento pesi. Il suo corretto funzionamento dipende dall'equilibrio tra tono di riposo (chiusura degli orifizi), capacità contrattile volontaria (continenza attiva) e capacità di rilasciamento coordinato (minzione, defecazione, parto). Le sezioni sottostanti approfondiscono la componente muscolare, quella fasciale/legamentosa, e i due concetti — la teoria della vela e le sinergie muscolari — che spiegano come queste parti lavorano insieme.",
      conditionsHeading: 'Patologie Correlate',
      conditionsIntro: 'Patologie organizzate per compartimento. Tocca una card per obiettivi, test clinici ed esercizi.',
      assessmentHeading: 'Valutazione Clinica',
      assessmentIntro: 'Test clinici e protocolli di valutazione manuale e strumentale.',
      rehabHeading: 'Riabilitazione',
      rehabIntro: 'Protocolli di esercizio, biofeedback, elettrostimolazione e riabilitazione per popolazioni speciali.',
      loading: 'Caricamento...',
      errorStructures: 'Impossibile caricare le strutture anatomiche.',
      errorConditions: 'Impossibile caricare le patologie.',
      errorTests: 'Impossibile caricare i test di valutazione.',
      errorRehab: 'Impossibile caricare i contenuti riabilitativi.',
      structureCategoryLabels: { muscle: 'Muscoli', fascia_ligament: 'Fasce e Legamenti', concept: 'Concetti Chiave', nerve: 'Nervi' },
      structureCategoryLabelsSingular: { muscle: 'Muscolo', fascia_ligament: 'Fascia / Legamento', concept: 'Concetto Chiave', nerve: 'Nervo' },
      compartmentLabels: {
        anterior: 'Compartimento Anteriore',
        central: 'Compartimento Centrale',
        posterior: 'Compartimento Posteriore',
        systemic: 'Sindromi Sistemiche',
      },
      rehabCategoryLabels: {
        kegel: 'Esercizio del Pavimento Pelvico',
        biofeedback_electrostim: 'Biofeedback ed Elettrostimolazione',
        bladder_training: 'Rieducazione Vescicale (Bladder Training)',
        postpartum: 'Riabilitazione Post-Partum',
        special_population: 'Popolazioni Speciali',
      },
      imageLabels: {
        femaleSagittal: 'Sagittale — Femminile',
        maleSagittal: 'Sagittale — Maschile',
        inferiorView: 'Vista Inferiore',
        inferiorViewFull: 'Vista Inferiore (Femminile) — piano perineale, tre compartimenti',
      },
      protocolLabel: 'Protocollo',
      relatedConditionsHeading: 'Patologie Collegate',
      noConditionsLinked: 'Nessuna patologia ancora collegata a questa struttura.',
      backToAtlas: 'Torna al Pavimento Pelvico',
      structureNotFound: 'Struttura non trovata.',
      errorLoadingStructure: 'Impossibile caricare i dati della struttura.',
      anatomySectionLabel: 'Anatomia',
      functionSectionLabel: 'Funzione',
      clinicalRelevanceLabel: 'Rilevanza Clinica',
    },
    profilePage: {
      eyebrow: 'Area Professionale',
      heading: 'Profilo',
      subtitle: 'Le informazioni che i tuoi pazienti e colleghi vedono di te.',
      photoLabel: 'Foto profilo',
      photoHint: 'Visibile ai tuoi pazienti',
      displayNameLabel: 'Nome visualizzato',
      displayNamePlaceholder: 'Dr. Andrea Stilfer',
      bioLabel: 'Bio breve',
      bioPlaceholder: 'Qualche riga sul tuo approccio e la tua esperienza...',
      registrationNumberLabel: "Numero di Iscrizione all'Albo",
      registrationNumberPlaceholder: 'Es. Albo TSRM-PSTRP n. 12345',
      registrationNumberHint: 'Facoltativo — il formato varia in base al Paese e all\'Ordine professionale di appartenenza.',
      credentialsLabel: 'Corsi e certificazioni',
      credentialPlaceholder: 'Es. Master in Riabilitazione del Pavimento Pelvico',
      add: 'Aggiungi',
      saveProfile: 'Salva profilo',
    },
  },
  en: {
    clinicalActionBar: {
      addToTreatmentPlan: 'Add to Treatment Plan',
      useWithPatient: 'Use with Patient',
      startForPatient: 'Start for Patient',
      useAsClinicalReference: 'Use as Clinical Reference',
      recommendToPatient: 'Recommend to Patient',
      selectPatient: 'Select patient',
      addedFor: 'Added for {name}',
      added: 'Added',
      searchPlaceholder: 'Search patient...',
      searching: 'Searching...',
      noPatientsFound: 'No patients found.',
    },
    nav: {
      patients: 'Patients',
      library: 'Library',
      world: 'Phygo World',
      schedule: 'Schedule',
      profile: 'Profile',
      signOut: 'Sign out',
      startFree: 'Start Free',
      search: 'Search',
      liveDemo: 'Live demo',
      features: 'Features',
      trust: 'Trust',
      pricing: 'Pricing',
      faq: 'FAQ',
      currentPatient: 'Current patient',
    },
    libraryLinks: {
      bodyMap: { label: 'Body Map', description: 'Interactive anatomy explorer' },
      neurology: { label: 'Neurology', description: 'Brain, nerves & neural pathways' },
      physiology: { label: 'Physiology', description: 'Foundational muscular & neurological mechanisms' },
      sportsMedicine: { label: 'Sports Medicine', description: 'Sports injury science and return-to-play' },
      pelvicFloor: { label: 'Pelvic Floor', description: 'Anatomy, conditions & rehabilitation' },
      cardiopulmonary: { label: 'Cardiopulmonary', description: 'Anatomy, conditions & rehabilitation' },
      endocrine: { label: 'Endocrine', description: 'Anatomy, conditions & rehabilitation' },
      fascia: { label: 'Fascia', description: 'Anatomy, function & clinical applications' },
      urinary: { label: 'Urinary', description: 'Anatomy, conditions & rehabilitation' },
      gastrointestinal: { label: 'Gastrointestinal', description: 'Anatomy, conditions & rehabilitation' },
      immune: { label: 'Immune', description: 'Anatomy, conditions & rehabilitation' },
      hematology: { label: 'Hematology', description: 'Anatomy, conditions & rehabilitation' },
      oncology: { label: 'Oncology', description: 'Anatomy, conditions & rehabilitation' },
      firstAid: { label: 'First Aid', description: 'Protocols by country' },
      blsd: { label: 'BLSD', description: 'CPR, AED & airway obstruction relief' },
      clinicalTools: { label: 'Clinical Tools', description: 'Assessment scales & tests' },
    },
    physiologyCrossLink: { question: 'Want to understand how it works?', cta: 'Go to Physiology' },
    worldLinks: {
      science: { label: 'Evidence Hub', description: 'Latest research summaries' },
      events: { label: 'Events', description: 'Congresses, courses & webinars in health' },
      shop: { label: 'Shop', description: 'Recommended equipment' },
    },
    events: {
      badge: 'Phygo World',
      heading: 'Events',
      subtitle: 'Discover courses, conferences, congresses and experiences shaping physiotherapy, healthcare and human performance.',
      searchPlaceholder: 'Search by name, topic, city or country...',
      filtersLabel: 'Filters',
      categoryLabel: 'Category',
      typeLabel: 'Event type',
      dateLabel: 'Date',
      locationLabel: 'Location',
      audienceLabel: 'Audience',
      levelLabel: 'Professional level',
      allLabel: 'All',
      onlineLabel: 'Online',
      inPersonLabel: 'In person',
      hybridLabel: 'Hybrid',
      freeLabel: 'Free',
      paidLabel: 'Paid',
      datePresets: { today: 'Today', thisWeek: 'This Week', thisMonth: 'This Month', next3Months: 'Next 3 Months', custom: 'Custom' },
      featuredHeading: 'Featured',
      upcomingHeading: 'Upcoming Events',
      onlineHeading: 'Online Events',
      nearYouHeading: 'Near You',
      viewEventCta: 'View Event',
      noEventsFound: 'No events match these filters.',
      loadingEvents: 'Loading events...',
      categoryLabels: { physiotherapy: 'Physiotherapy', rehabilitation: 'Rehabilitation', sportsRehabilitation: 'Sports Rehabilitation', sportsMedicine: 'Sports Medicine', orthopaedics: 'Orthopaedics', neurology: 'Neurology', neurorehabilitation: 'Neurorehabilitation', exerciseScience: 'Exercise Science', strengthConditioning: 'Strength & Conditioning', manualTherapy: 'Manual Therapy', painScience: 'Pain Science', pelvicFloor: 'Pelvic Floor', cardiopulmonary: 'Cardiopulmonary', oncology: 'Oncology', nutrition: 'Nutrition', psychology: 'Psychology', yoga: 'Yoga', pilates: 'Pilates', mobility: 'Mobility', wellness: 'Wellness', longevity: 'Longevity', healthyAging: 'Healthy Aging', prevention: 'Prevention', healthcareTechnology: 'Healthcare Technology', aiHealthcare: 'AI & Healthcare', digitalHealth: 'Digital Health', research: 'Research' },
      typeLabels: { congress: 'Congress', conference: 'Conference', course: 'Course', workshop: 'Workshop', webinar: 'Webinar', masterclass: 'Masterclass', seminar: 'Seminar', symposium: 'Symposium', certification: 'Certification Course' },
      audienceLabels: { professionals: 'Professionals', students: 'Students', public: 'Patients / Public', both: 'Everyone' },
      levelLabels: { student: 'Student', beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', expert: 'Expert' },
      statusLabels: { upcoming: 'Upcoming', updated: 'Updated', dateChanged: 'Date Changed', locationChanged: 'Location Changed', cancelled: 'Cancelled', soldOut: 'Sold Out', registrationOpen: 'Registration Open', registrationClosed: 'Registration Closed', completed: 'Completed' },
      verificationLabels: { unverified: 'Unverified', source_verified: 'Source Verified', organizer_verified: 'Organizer Verified', phygo_verified: 'Phygo Verified' },
      verificationExplainer: 'Verification reflects source accuracy, not a Phygo endorsement of the event\'s scientific quality.',
      organizerLabel: 'Organizer',
      timeLabel: 'Time',
      timezoneLabel: 'Timezone',
      descriptionLabel: 'Description',
      topicsLabel: 'Topics',
      speakersLabel: 'Speakers',
      priceLabel: 'Price',
      registrationDeadlineLabel: 'Registration deadline',
      registerCta: 'Register / Official Website',
      officialWebsiteCta: 'Official Website',
      saveEventCta: 'Save Event',
      savedCta: 'Saved',
      backToEvents: 'Back to Events',
      eventNotFound: 'Event not found.',
      myEventsHeading: 'My Events',
      savedTab: 'Saved',
      upcomingTab: 'Upcoming',
      pastTab: 'Past',
      noSavedEvents: 'You haven\'t saved any events yet.',
      signInToSave: 'Sign in to save events.',
      providersHeading: 'More Training Resources',
      providersSubtitle: 'Organizations that publish courses continuously: visit their site for the always up-to-date calendar.',
      visitProviderCta: 'Visit Site',
    },
    science: {
      badge: 'Phygo Evidence Hub',
      headingLead: 'Latest',
      headingAccent: 'Evidence',
      subtitle: 'Evidence-based research for physiotherapists.',
      searchPlaceholder: 'Search studies by title...',
      loadingText: 'Loading research…',
      noResultsText: 'No studies match your search.',
      clinicalQuestionLabel: 'Clinical question',
      whyItMattersLabel: 'Why it matters',
      resultsCountSuffix: 'studies found',
      originalStudyCta: 'Original Study',
    },
    shop: {
      eyebrow: 'Equipment',
      heading: 'Shop',
      subtitle: 'Equipment picks you can recommend straight from a session.',
      curatedPicksSuffix: 'curated picks',
      allLabel: 'All',
      viewOnAmazonCta: 'View on Amazon',
      categoryLabels: {
        'Pelvic Floor': 'Pelvic Floor',
        'Low Back': 'Low Back',
        Posture: 'Posture',
        Mobility: 'Mobility',
        Recovery: 'Recovery',
        'Body Composition': 'Body Composition',
        Nutrition: 'Nutrition',
      },
    },
    fields: {
      goals: 'Goals',
      clinicalTests: 'Clinical Tests',
      typicalExercises: 'Typical Exercises',
      progressionCriteria: 'Progression Criteria',
      returnToActivityCriteria: 'Return to Activity Criteria',
      outcomeMeasures: 'Outcome Measures',
      contraindications: 'Contraindications',
      redFlags: 'Red Flags',
      featuredExercises: 'Featured Exercises',
      source: 'Source',
      evidence: 'Evidence',
    },
    anatomy: {
      anatomy: 'Anatomy',
      innervation: 'Innervation',
      biomechanics: 'Biomechanics',
      clinicalRelevance: 'Clinical Relevance',
      connections: 'Connections',
      vascularSupply: 'Vascular Supply',
      function: 'Function',
    },
    evidenceLevels: {
      high: 'High',
      strong: 'High',
      moderate: 'Moderate',
      low: 'Low',
      limited: 'Low',
    },
    common: {
      loading: 'Loading...',
      save: 'Save',
      saving: 'Saving...',
      saved: 'Saved',
      backToPatients: 'Back to patients',
      machineTranslatedNotice:
        'Machine-translated from Italian — for clinical decisions, please verify Red Flags and Contraindications against the original source.',
    },
    brainMap: {
      atlasBadge: 'Neurological Atlas',
      heading: 'Neurology',
      subtitle:
        'Anatomy, neural pathways and clinical localization reasoning — an interactive atlas built for everyday practice.',
      viewLabels: { brain: 'Brain', nerves: 'Peripheral Nerves', pathways: 'Neural Circuits' },
      brainSubTabs: { atlas: 'Atlas', conditions: 'Conditions' },
      deepStructuresHint: "Deep structures — not visible on the 3D model's surface, but available here.",
      referenceViewsHint: 'Reference views — lateral, sagittal and coronal, with the main structures labeled.',
      nerveViewerHint: 'Move your cursor over the image to explore it in perspective',
      loading3DModel: 'Loading 3D model...',
      dragRotateZoom: 'Drag to rotate · scroll to zoom',
      modelCreditPrefix: '3D Model:',
      zoneNames: {
        'frontal-lobe': 'Frontal Lobe',
        'parietal-lobe': 'Parietal Lobe',
        'temporal-lobe': 'Temporal Lobe',
        'occipital-lobe': 'Occipital Lobe',
        cerebellum: 'Cerebellum',
        brainstem: 'Brainstem',
        'basal-ganglia': 'Basal Ganglia',
        insula: 'Insula',
        'corpus-callosum': 'Corpus Callosum',
        thalamus: 'Thalamus',
        hypothalamus: 'Hypothalamus',
        amygdala: 'Amygdala',
        hippocampus: 'Hippocampus',
      },
      brainConditionsHeading: 'Brain Conditions',
      brainConditionsHint:
        'Every condition linked to a brain zone, in one searchable list — tap a card for clinical details.',
      searchConditionsPlaceholder: 'Search by condition name...',
      loadingConditions: 'Loading conditions...',
      errorLoadingConditions: 'Unable to load the linked conditions.',
      noConditionsFound: 'No conditions found.',
      relatedConditionsHeading: 'Related Conditions',
      nervesSubTabs: {
        atlas: 'Nerve Atlas',
        seddon: 'Seddon Classification',
        conduction: 'Nerve Conduction',
        conditions: 'Related Conditions',
        diffuse: 'Diffuse Disorders',
      },
      peripheralAtlasHeading: 'Peripheral Nerve Atlas',
      peripheralAtlasHint:
        'Tap a nerve for anatomy, motor/sensory function, typical compression site and linked conditions.',
      regionAll: 'All',
      regionLabels: {
        plexus: 'Plexus',
        upper_limb: 'Upper Limb',
        lower_limb: 'Lower Limb',
        cranial: 'Cranial Nerves',
      },
      askPhygoPrompt: "Can't find the nerve you're looking for? Ask Phygo",
      askPhygoPlaceholder: 'e.g. iliohypogastric nerve, genitofemoral nerve...',
      askButton: 'Ask',
      loadingNerves: 'Loading nerves...',
      errorLoadingNerves: 'Unable to load nerves.',
      nerveInjuryHeading: 'Nerve Injury Classification',
      nerveInjuryHint:
        "Seddon's classification, from mildest to most severe — useful for guiding prognosis and recovery timelines.",
      nerveConductionHeading: 'Nerve Conduction',
      nerveConductionHint: 'Types of nerve fibers and their conduction velocities.',
      fiberDiameter: 'Diameter',
      fiberMyelination: 'Myelination',
      fiberVelocity: 'Velocity',
      fiberFunction: 'Function',
      snpConditionsHint:
        "Peripheral nervous system conditions in Phygo's Knowledge Base. Tap a card for clinical details.",
      diffuseHeading: 'Diffuse PNS Disorders',
      diffuseHint:
        'Conditions that affect the peripheral nervous system diffusely or systemically, rather than a single named nerve. Tap a card for clinical details.',
      loadingDiffuse: 'Loading diffuse disorders...',
      errorLoadingDiffuse: 'Unable to load diffuse PNS disorders.',
      pathwaySubTabs: { circuits: 'Pathways', gait: 'Gait Patterns', localization: 'Localization' },
      pathwayCategoryLabels: { longTracts: 'Long Tracts', brainCircuits: 'Brain Circuits' },
      gaitHint: 'Recognizing the gait pattern helps localize the underlying neurological lesion.',
      localizationHint:
        'Six clinical reasoning principles for localizing a neurological lesion from physical exam findings.',
      zone: {
        badge: 'Neurological Zone',
        geriatricHeading: 'Geriatric Neurology Principles',
        noConditionsLinked: 'No conditions linked to this zone yet.',
        backToBrainMap: 'Brain Map',
        zoneNotFound: 'Zone not found.',
      },
      nerve: {
        backToNeuroMap: 'Back to the neurological map',
        errorLoadingNerve: 'Unable to load the nerve data.',
        anatomyAndCourse: 'Anatomy and course',
        motorFunction: 'Motor function',
        sensoryFunction: 'Sensory function',
        compressionSite: 'Typical compression/injury site',
        clinicalSign: 'Characteristic clinical sign',
        linkedConditions: 'Linked conditions',
        noConditionsLinkedToNerve: 'No conditions linked to this nerve yet.',
      },
    },
    oncology: {
      atlasBadge: 'Oncology Atlas',
      heading: 'Oncology',
      subTabs: {
        anatomy: 'Anatomy',
        conditions: 'Conditions',
        treatments: 'Treatments',
        assessment: 'Assessment',
        rehab: 'Rehabilitation',
      },
      anatomyHeading: 'Oncology Anatomy',
      anatomyHint:
        'Anatomy and lymphatic drainage relevant to understanding major cancers and their rehabilitation complications.',
      anatomyIntro:
        "This section starts with the biological and molecular mechanisms by which a normal cell becomes a cancer cell — a step often overlooked but useful for understanding why a tumor behaves the way it does. It then covers regional lymphatic drainage anatomy, organ by organ: this is the most clinically relevant map for physiotherapy practice, since most post-surgical rehabilitation complications (lymphedema above all) depend on which lymphatic pathways were disrupted.",
      conditionsHeading: 'Related Conditions',
      conditionsHint: 'Oncological conditions organized by system. Tap a card for goals, clinical tests, red flags and typical exercises.',
      treatmentsHeading: 'Oncology Treatments',
      treatmentsHint: 'Diagnostic-therapeutic pathways by tumor type and general treatment modalities, with their physiotherapy implications.',
      assessmentHeading: 'Clinical Assessment',
      assessmentHint: 'Performance status scales and assessment tools specific to the oncology patient.',
      rehabHeading: 'Rehabilitation',
      rehabHint: 'Lymphedema management protocols (including step-by-step manual lymphatic drainage), exercise in oncology and management of specific complications.',
      loading: 'Loading...',
      errorLoadingStructures: 'Unable to load anatomical structures.',
      errorLoadingConditions: 'Unable to load conditions.',
      errorLoadingTests: 'Unable to load assessment tests.',
      errorLoadingRehab: 'Unable to load rehabilitation content.',
      errorLoadingTreatments: 'Unable to load treatments.',
      procedureLabel: 'Procedure',
      interpretationLabel: 'Interpretation',
      protocolLabel: 'Protocol',
      ptImplicationsLabel: 'Physiotherapy Implications',
      askPhygoPrompt: "Can't find the condition you're looking for? Ask Phygo",
      askPhygoPlaceholder: 'e.g. lymphoma, melanoma, soft tissue sarcoma...',
      askButton: 'Ask',
      regionLabels: {
        'tumor-biology': 'Tumor Biology',
        'lymphatic-general': 'General Lymphatic System',
        breast: 'Breast',
        gynecological: 'Gynecological',
        prostate: 'Prostate',
        bladder: 'Bladder',
        lung: 'Lung',
        brain: 'Brain',
        'head-neck': 'Head-Neck',
        colorectal: 'Colorectal',
        systemic: 'Systemic',
      },
      systemLabels: {
        mammario: 'Breast Cancer',
        ginecologico: 'Gynecological Cancers',
        prostatico: 'Prostate Cancer',
        vescicale: 'Bladder Cancer',
        'neuro-oncologico': 'Brain Tumors',
        'colon-retto': 'Colorectal Cancer',
        polmonare: 'Lung Cancer',
        'testa-collo': 'Head-Neck Cancers',
        sarcoma: 'Sarcomas',
        ematologico: 'Hematologic Malignancies',
        sistemico: 'Systemic Complications',
      },
      testCategoryLabels: {
        performance_status: 'Performance Status',
        lymphedema_assessment: 'Lymphedema Assessment',
        red_flag_screening: 'Pre-Exercise Screening',
      },
      rehabCategoryLabels: {
        linfedema: 'Lymphedema Management',
        complicanze_specifiche: 'Specific Complications',
        esercizio: 'Exercise in Oncology',
      },
      treatmentCategoryLabels: {
        per_tipo_tumore: 'Pathways by Tumor Type',
        diagnostica: 'Diagnostics and Staging',
        chirurgia: 'Surgery',
        farmacologico: 'Pharmacological Treatments',
        fisico: 'Physical Treatments',
      },
    },
    cardiopulmonary: {
      atlasBadge: 'Cardiopulmonary Atlas',
      heading: 'Cardiopulmonary',
      subTabs: {
        anatomy: 'Anatomy',
        conditions: 'Conditions',
        assessment: 'Assessment',
        rehab: 'Rehabilitation',
        airwayClearance: 'Airway Clearance',
      },
      anatomyHeading: 'Cardiopulmonary Anatomy',
      anatomyHint: 'Heart, circulation, respiratory system and thoracic mechanics: how they function as an integrated system.',
      anatomyIntro:
        'The cardiorespiratory system integrates cardiac, circulatory and pulmonary function: an impairment in one of these areas almost always affects the others. Physiotherapy assessment considers thoracic mechanics, exercise capacity and vital signs together, since they are closely interdependent. The sections below cover cardiac anatomy, the vascular system, the respiratory apparatus, thoracic mechanics/kinematics, and the key concept of VO2max/cardiac reserve, which guides exercise prescription.',
      conditionsHeading: 'Related Conditions',
      conditionsHint: 'Conditions organized by system. Tap a card for goals, clinical tests and exercises.',
      assessmentHeading: 'Clinical Assessment',
      assessmentHint: 'Clinical tests and cardiorespiratory assessment scales.',
      rehabHeading: 'Rehabilitation',
      rehabHint: 'FITT protocols, post-surgical management, and protocols specific to heart failure and respiratory conditions.',
      airwayHeading: 'Airway Clearance Techniques',
      airwayHint: 'Postural drainage, manual techniques, PEP, active breathing, ventilatory support. Tap a card for the full procedure.',
      loading: 'Loading...',
      errorLoadingStructures: 'Unable to load anatomical structures.',
      errorLoadingConditions: 'Unable to load conditions.',
      errorLoadingTests: 'Unable to load assessment tests.',
      errorLoadingRehab: 'Unable to load rehabilitation content.',
      errorLoadingAirway: 'Unable to load airway clearance techniques.',
      procedureLabel: 'Procedure',
      interpretationLabel: 'Interpretation',
      protocolLabel: 'Protocol',
      patientPositionLabel: 'Patient Position',
      indicationsLabel: 'Indications',
      contraindicationsPrecautionsLabel: 'Contraindications/Precautions',
      categoryLabels: {
        cardiac: 'Cardiac',
        circulatory: 'Circulatory',
        respiratory: 'Respiratory',
        thoracic_mechanics: 'Thoracic Mechanics',
        concept: 'Key Concepts',
      },
      systemLabels: {
        cardiac: 'Cardiac Conditions',
        respiratory: 'Respiratory Conditions',
        mixed_systemic: 'Systemic/Mixed Conditions',
      },
      testCategoryLabels: {
        functional_capacity: 'Functional Capacity',
        dyspnea_scale: 'Dyspnea Scales',
        strength: 'Strength',
        vital_signs: 'Vital Signs',
        consciousness: 'Consciousness',
      },
      rehabCategoryLabels: {
        aerobic_training: 'Aerobic Training',
        resistance_training: 'Resistance Training',
        post_surgical: 'Post-Surgical',
        heart_failure: 'Heart Failure',
        respiratory_specific: 'Respiratory-Specific',
      },
      airwayCategoryLabels: {
        postural_drainage: 'Postural Drainage',
        manual: 'Manual Techniques',
        active_breathing: 'Active Breathing',
        device_dependent: 'Devices (PEP)',
        machine_dependent: 'Mechanical Devices',
        ventilation_support: 'Ventilatory Support',
        dyspnoea_technique: 'Dyspnea Techniques',
      },
      ageGroupLabels: {
        adult: 'Adults',
        paediatric: 'Paediatric',
        both: 'Adults and children',
      },
    },
    endocrine: {
      atlasBadge: 'Endocrine Atlas',
      heading: 'Endocrine System',
      subTabs: {
        anatomy: 'Anatomy',
        conditions: 'Conditions',
        assessment: 'Assessment',
        rehab: 'Rehabilitation',
      },
      anatomyHeading: 'Endocrine Anatomy',
      anatomyHint: 'Glands, hormonal axes and key concepts: how the endocrine system regulates metabolism, growth and homeostasis.',
      anatomyIntro:
        'The endocrine system coordinates hormonal communication between glands and target organs, regulating metabolism, growth, body composition, bone density and reproductive function. Endocrine dysfunction often affects exercise tolerance, muscle strength, bone health and balance, making physiotherapy assessment closely tied to the patient\'s hormonal status. The sections below cover the main glands (thyroid, adrenal, parathyroid, endocrine pancreas), the key hormonal axes (hypothalamic-pituitary, GH/IGF-1, gonadal) and the role of bone as both a target and an endocrine organ.',
      conditionsHeading: 'Related Conditions',
      conditionsHint: 'The main endocrinopathies of physiotherapy interest. Tap a card for goals, clinical tests and exercises.',
      assessmentHeading: 'Clinical Assessment',
      assessmentHint: 'Hormonal, metabolic and structural tests relevant to the physiotherapy assessment of the endocrine patient.',
      rehabHeading: 'Rehabilitation',
      rehabHint: 'Protocols for bone health, fall prevention, hormone replacement therapy, metabolic training and nutritional support.',
      loading: 'Loading...',
      errorLoadingStructures: 'Unable to load anatomical structures.',
      errorLoadingConditions: 'Unable to load conditions.',
      errorLoadingTests: 'Unable to load assessment tests.',
      errorLoadingRehab: 'Unable to load rehabilitation content.',
      procedureLabel: 'Procedure',
      interpretationLabel: 'Interpretation',
      protocolLabel: 'Protocol',
      categoryLabels: {
        axis: 'Hormonal Axes',
        concept: 'Key Concepts',
        gland: 'Glands',
      },
      testCategoryLabels: {
        hormonal: 'Hormonal',
        metabolic: 'Metabolic',
        structural: 'Structural',
      },
      rehabCategoryLabels: {
        bone_health: 'Bone Health',
        fall_prevention: 'Fall Prevention',
        hormone_replacement: 'Hormone Replacement Therapy',
        metabolic_training: 'Metabolic Training',
        nutritional_support: 'Nutritional Support',
      },
    },
    fascia: {
      atlasBadge: 'Fascia Atlas',
      heading: 'Fascia',
      subTabs: {
        structures: 'Anatomy',
        function: 'Function',
        treatments: 'Clinical Applications',
        rehab: 'Rehabilitation',
      },
      structuresHeading: 'Fascial Anatomy & Physiology',
      structuresHint: 'Structure, histology, innervation and regulation of the fascial system — the foundation for understanding its clinical role.',
      structuresIntro: 'This section describes fascia as a sensory organ and force-transmission structure in its own right: from its histological composition to its rich mechanoreceptive and nociceptive innervation, through to the hormonal and cellular mechanisms that regulate its properties over time.',
      functionHeading: 'Fascial Function',
      functionHint: 'Biotensegrity, load response, viscoelastic properties and the role of fascia in movement and posture.',
      treatmentsHeading: 'Clinical Applications',
      treatmentsHint: 'Manual approaches and fascia-oriented exercise programmes, with their physiotherapy implications and the available level of evidence.',
      rehabHeading: 'Rehabilitation',
      rehabHint: 'Structured rehabilitation protocols for the fascial system, with the available level of scientific evidence for each approach.',
      loading: 'Loading...',
      errorLoadingStructures: 'Unable to load anatomy and physiology content.',
      errorLoadingFunction: 'Unable to load fascial function content.',
      errorLoadingTreatments: 'Unable to load clinical applications.',
      errorLoadingRehab: 'Unable to load rehabilitation content.',
      ptImplicationsLabel: 'Physiotherapy Implications',
      protocolLabel: 'Protocol',
      askPhygoPrompt: "Can't find what you're looking for on fascia? Ask Phygo",
      askPhygoPlaceholder: 'e.g. thoracolumbar fascia, cupping, fascial densification...',
      askButton: 'Ask',
      structureCategoryLabels: {
        anatomia_generale: 'General Anatomy',
        istologia: 'Histology',
        innervazione: 'Innervation',
        vascolarizzazione: 'Vascularization',
        regolazione_ormonale: 'Hormonal Regulation',
        contrattilita_miofibroblasti: 'Contractility & Myofibroblasts',
        metodi_di_studio: 'Study Methods',
      },
      functionCategoryLabels: {
        biotensegrita: 'Biotensegrity',
        carico_e_nutrizione: 'Loading & Nutrition',
        capacita_di_allungamento: 'Stretch Capacity',
        cammino_e_locomozione: 'Gait & Locomotion',
        valutazione_posturale: 'Postural Assessment',
      },
      treatmentCategoryLabels: {
        integrazione_strutturale: 'Structural Integration',
        terapia_dei_punti_trigger: 'Trigger Point Therapy',
        manipolazione_fasciale: 'Fascial Manipulation',
        fascial_stretch_therapy: 'Fascial Stretch Therapy',
        gestione_delle_cicatrici: 'Scar Management',
        riabilitazione_oncologica_fasciale: 'Oncology Rehabilitation',
        auto_trattamento_miofasciale: 'Self Myofascial Release',
        movimento_e_rieducazione_fasciale: 'Movement & Re-education',
      },
      rehabCategoryLabels: {
        post_surgical_scar_management: 'Post-Surgical Scar Management',
        progressive_loading: 'Progressive Loading',
        movement_reeducation: 'Movement Re-education',
        sports_performance: 'Sports Performance',
        chronic_pain_management: 'Chronic Pain Management',
      },
    },
    urinary: {
      atlasBadge: 'Urinary Atlas',
      heading: 'Urinary/Renal System',
      subTabs: {
        anatomy: 'Anatomy',
        conditions: 'Conditions',
        assessment: 'Assessment',
        rehab: 'Rehabilitation',
      },
      anatomyHeading: 'Renal and Urinary Anatomy',
      anatomyHint: 'Kidney, nephron and lower urinary tract: the structure and physiology of filtration, reabsorption and fluid-electrolyte balance.',
      anatomyIntro:
        "The kidney regulates the volume and composition of body fluids through glomerular filtration, tubular reabsorption and secretion, the renin-angiotensin-aldosterone system, and acid-base control. Impaired renal function affects electrolytes, blood pressure, hydration status and exercise tolerance, making physiotherapy assessment closely interdependent with the patient's metabolic and cardiovascular parameters. The sections below cover kidney and bladder anatomy and the key physiological processes — glomerular filtration, tubular function, RAAS, fluid and electrolyte balance, acid-base balance — that guide clinical management and exercise prescription.",
      conditionsHeading: 'Related Conditions',
      conditionsHint: 'Nephrological and urological conditions relevant to physiotherapy practice. Tap a card for goals, clinical tests and exercises.',
      assessmentHeading: 'Clinical Assessment',
      assessmentHint: 'Renal function tests, urinalysis, metabolic parameters and imaging.',
      rehabHeading: 'Rehabilitation',
      rehabHint: 'Exercise prescription in chronic kidney disease, dialysis, post-transplant care and sports nephrology.',
      loading: 'Loading...',
      errorLoadingStructures: 'Unable to load anatomical structures.',
      errorLoadingConditions: 'Unable to load conditions.',
      errorLoadingTests: 'Unable to load assessment tests.',
      errorLoadingRehab: 'Unable to load rehabilitation content.',
      procedureLabel: 'Procedure',
      interpretationLabel: 'Interpretation',
      protocolLabel: 'Protocol',
      categoryLabels: {
        organ: 'Organ',
        physiology: 'Physiology',
      },
      testCategoryLabels: {
        imaging: 'Imaging',
        metabolic: 'Metabolic',
        renal_function: 'Renal Function',
        urinalysis: 'Urinalysis',
      },
      rehabCategoryLabels: {
        renal_training: 'Renal Disease Training',
        sports_nephrology: 'Sports Nephrology',
      },
    },
    physiology: {
      atlasBadge: 'Physiology Atlas',
      heading: 'Foundational Physiology',
      systemTabs: { muscular: 'Muscular', neurological: 'Neurological', cellular: 'Cellular' },
      sectionHint: 'The physiological mechanisms behind movement and the nervous system — not the anatomy of a single zone, but how the underlying tissues and circuits actually work, with clinical relevance for physiotherapy practice.',
      loading: 'Loading...',
      errorLoading: 'Unable to load physiology content.',
      clinicalRelevanceLabel: 'Clinical Relevance',
      categoryLabels: {
        contraction_mechanics: 'Contraction Mechanisms',
        fiber_types: 'Fiber Types',
        mechanics: 'Muscle Mechanics',
        motor_control: 'Motor Control',
        exercise_adaptation: 'Exercise Adaptation',
        neuromuscular: 'Neuromuscular Junction',
        smooth_cardiac: 'Smooth & Cardiac Muscle',
        cellular_basics: 'Cellular Physiology',
        reflexes: 'Reflexes',
        sensory: 'Sensory Systems',
        plasticity: 'Plasticity & Learning',
        autonomic: 'Autonomic Nervous System',
        membrane_transport: 'Membrane Transport',
        chemical_messengers: 'Chemical Messengers',
        homeostasis: 'Homeostasis & Control',
        energy_metabolism: 'Energy Metabolism',
      },
    },
    sportsMedicine: {
      atlasBadge: 'Sports Medicine Atlas',
      heading: 'Sports Medicine',
      sectionHint: 'The foundational science of sports injury and recovery — classification, tissue healing, clinical reasoning and therapeutic modalities, with the latest guidelines for a safe and effective return to sport.',
      loading: 'Loading...',
      errorLoading: 'Unable to load sports medicine content.',
      clinicalRelevanceLabel: 'Clinical Relevance',
      categoryLabels: {
        injury_classification: 'Injury Classification',
        tissue_healing: 'Tissue Healing',
        clinical_reasoning: 'Clinical Reasoning',
        therapeutic_modalities: 'Therapeutic Modalities',
        on_field_emergency_rtp: 'On-Field Emergency & Return to Play',
        rehabilitation_programming: 'Rehabilitation Programming',
      },
    },
    librarySearchPlaceholder: 'Search this section...',
    librarySearchNoResults: 'No results found for your search.',
    gastrointestinal: {
      atlasBadge: 'Gastrointestinal Atlas',
      heading: 'Gastrointestinal System',
      subTabs: {
        anatomy: 'Anatomy',
        conditions: 'Conditions',
        assessment: 'Assessment',
        rehab: 'Rehabilitation',
      },
      anatomyHeading: 'Gastrointestinal Anatomy',
      anatomyHint: 'Motility of the digestive tract, stomach, small intestine, liver, exocrine pancreas, colon and microbiota: how they work as an integrated system.',
      anatomyIntro:
        "The gastrointestinal system integrates motility, secretion, digestion and absorption along the entire digestive tract: dysfunction in one segment (for example gastric dysmotility or colonic inflammation) often affects nutrition, energy available for exercise and exertion tolerance. Physiotherapy assessment in the gastrointestinal field considers the digestive clinical history, available laboratory and functional tests, and the impact of the condition on exercise capacity and quality of life. The sections below cover the digestive tract as a whole, individual organs (stomach, small intestine, liver, pancreas, colon) and the gut-muscle axis mediated by the microbiota, which is central to exercise prescription in these patients.",
      conditionsHeading: 'Related Conditions',
      conditionsHint: 'The main gastrointestinal conditions relevant to physiotherapy practice. Tap a card for goals, clinical tests and exercises.',
      assessmentHeading: 'Clinical Assessment',
      assessmentHint: 'Blood panels, stool markers, serology, functional tests, imaging and endoscopy used to work up the gastroenterology patient.',
      rehabHeading: 'Rehabilitation',
      rehabHint: 'Therapeutic exercise protocols for inflammatory bowel disease, chronic liver disease, bariatric surgery, ostomies and endurance sports.',
      loading: 'Loading...',
      errorLoadingStructures: 'Unable to load anatomical structures.',
      errorLoadingConditions: 'Unable to load conditions.',
      errorLoadingTests: 'Unable to load assessment tests.',
      errorLoadingRehab: 'Unable to load rehabilitation content.',
      procedureLabel: 'Procedure',
      interpretationLabel: 'Interpretation',
      protocolLabel: 'Protocol',
      categoryLabels: {
        organ: 'Organs',
        system_overview: 'System Overview',
      },
      testCategoryLabels: {
        blood_panel: 'Blood Panel',
        endoscopy: 'Endoscopy',
        functional_test: 'Functional Tests',
        imaging: 'Imaging',
        serology: 'Serology',
        stool_marker: 'Stool Markers',
      },
      rehabCategoryLabels: {
        chronic_disease_management: 'Chronic Disease Management',
        gi_disease_management: 'GI Disease Management',
        post_surgical: 'Post-Surgical',
        sports_nutrition: 'Sports Nutrition',
      },
    },
    immune: {
      atlasBadge: 'Immune System Atlas',
      heading: 'Immune System',
      subTabs: {
        anatomy: 'Anatomy',
        conditions: 'Conditions',
        assessment: 'Assessment',
        rehab: 'Rehabilitation',
      },
      anatomyHeading: 'Immune System Anatomy',
      anatomyHint: 'Primary and secondary lymphoid organs, peripheral lymphatic drainage, and the three lines of immune defense.',
      anatomyIntro:
        'The immune system integrates primary lymphoid organs (bone marrow and thymus), where immune cells mature, and secondary lymphoid organs (lymph nodes, spleen, MALT), where the immune response is triggered. Peripheral lymphatic drainage carries fluid, antigens and immune cells toward these organs, while innate, humoral and cell-mediated immunity represent the three ways the body recognizes and neutralizes threats. An impairment in any of these components — from disease, immunosuppressive medication or overtraining — has direct consequences for the body\'s ability to respond to infection, chronic inflammation and exercise.',
      conditionsHeading: 'Related Conditions',
      conditionsHint: 'Immune, autoimmune and post-infectious conditions. Tap a card for goals, clinical tests and exercises.',
      assessmentHeading: 'Clinical Assessment',
      assessmentHint: 'Haematological, immunological and inflammatory marker tests used in physiotherapy assessment.',
      rehabHeading: 'Rehabilitation',
      rehabHint: 'Exercise dosing, immunosuppression precautions, lymphedema management and post-viral rehabilitation.',
      loading: 'Loading...',
      errorLoadingStructures: 'Unable to load anatomical structures.',
      errorLoadingConditions: 'Unable to load conditions.',
      errorLoadingTests: 'Unable to load assessment tests.',
      errorLoadingRehab: 'Unable to load rehabilitation content.',
      procedureLabel: 'Procedure',
      interpretationLabel: 'Interpretation',
      protocolLabel: 'Protocol',
      categoryLabels: {
        cell_mediated_immunity: 'Cell-Mediated Immunity',
        humoral_immunity: 'Humoral Immunity',
        innate_immunity: 'Innate Immunity',
        lymphatic_drainage: 'Lymphatic Drainage',
        primary_lymphoid_organ: 'Primary Lymphoid Organs',
        secondary_lymphoid_organ: 'Secondary Lymphoid Organs',
      },
      testCategoryLabels: {
        functional: 'Functional Tests',
        hematologic: 'Haematologic',
        immunologic: 'Immunologic',
        inflammatory_marker: 'Inflammatory Markers',
      },
      rehabCategoryLabels: {
        exercise_immunology: 'Exercise Immunology',
        immunosuppression_precautions: 'Immunosuppression Precautions',
        inflammatory_arthritis_training: 'Inflammatory Arthritis Training',
        lymphedema_management: 'Lymphedema Management',
        post_viral_rehabilitation: 'Post-Viral Rehabilitation',
      },
    },
    hematology: {
      atlasBadge: 'Hematology Atlas',
      heading: 'Blood / Hematology',
      subTabs: {
        anatomy: 'Anatomy',
        conditions: 'Conditions',
        assessment: 'Assessment',
        rehab: 'Rehabilitation',
      },
      anatomyHeading: 'Blood Anatomy and Physiology',
      anatomyHint: 'Cell lines, plasma, hemoglobin and hemostasis: the components and processes governing oxygen transport, immune defense and coagulation.',
      anatomyIntro:
        'Blood is a liquid connective tissue with transport (oxygen, nutrients, hormones), immune defense and hemostatic functions. The cellular component (erythrocytes, leukocytes, platelets) and the plasma component work in dynamic equilibrium: an alteration of the red cell line, the coagulation cascade or plasma composition directly affects exercise tolerance and the safety of therapeutic exercise. The sections below cover erythrocytes and erythropoiesis, leukocytes, plasma, hemoglobin/oxygen transport, and hemostasis/coagulation.',
      conditionsHeading: 'Related Conditions',
      conditionsHint: 'Hematological conditions of relevance to physiotherapy practice. Tap a card for goals, clinical tests and exercises.',
      assessmentHeading: 'Clinical Assessment',
      assessmentHint: 'Laboratory tests and hematological assessments relevant to physiotherapy practice.',
      rehabHeading: 'Rehabilitation',
      rehabHint: 'Exercise prescription, venous thromboembolism prevention, anticoagulant therapy precautions, and condition-specific protocols.',
      loading: 'Loading...',
      errorLoadingStructures: 'Unable to load hematological structures.',
      errorLoadingConditions: 'Unable to load conditions.',
      errorLoadingTests: 'Unable to load assessment tests.',
      errorLoadingRehab: 'Unable to load rehabilitation content.',
      procedureLabel: 'Procedure',
      interpretationLabel: 'Interpretation',
      protocolLabel: 'Protocol',
      categoryLabels: {
        cell_line: 'Cell Lines',
        fluid: 'Fluid Component',
        molecule: 'Molecules',
        process: 'Processes',
      },
      testCategoryLabels: {
        coagulation: 'Coagulation',
        diagnostic: 'Diagnostics',
        general: 'General Tests',
        metabolic: 'Metabolic',
      },
      rehabCategoryLabels: {
        condition_specific: 'Condition-Specific',
        exercise_prescription: 'Exercise Prescription',
        post_surgical: 'Post-Surgical',
        precaution_protocol: 'Precaution Protocols',
      },
    },
    clinicalToolkit: {
      badge: 'Clinical Tools',
      headingAccent: 'Clinical',
      headingRest: 'Toolkit',
      subtitle: 'Validated scales, clinical tests and treatment protocols brought together in one professional workspace.',
      tabLabels: {
        functional: 'Functional Scales',
        orthopedic: 'Orthopedic Tests',
        pelvicFloor: 'Pelvic Floor',
        neuro: 'Neurology',
        manualTherapy: 'Manual Therapy',
        metabolic: 'Metabolic',
      },
      manualTherapy: {
        mulliganPrinciplesHeading: 'Core Principles of the Mulligan Concept',
        mulliganPrinciplesHint: 'The theoretical framework (PILL, CROCKS, Specific Dysfunction) that guides the application of all MWM techniques in the regions below.',
        closeLabel: 'Close',
        readLabel: 'Read',
        loadingTechniques: 'Loading techniques...',
        errorLoadingTechniques: 'Unable to load manual therapy techniques.',
        noTechniquesFound: 'No techniques found for this region.',
        patientPositionLabel: 'Patient Position',
        directionLabel: 'Direction',
        indicationsLabel: 'Indications',
        procedureLabel: 'Procedure',
        regionLabels: {
          'ATM': 'TMJ',
          'Colonna Cervicale': 'Cervical Spine',
          'Colonna Toracica': 'Thoracic Spine',
          'Colonna Lombare e Pelvi': 'Lumbar Spine and Pelvis',
          'Spalla': 'Shoulder',
          'Gomito': 'Elbow',
          'Polso e Mano': 'Wrist and Hand',
          'Anca': 'Hip',
          'Ginocchio': 'Knee',
          'Caviglia': 'Ankle',
          'Piede': 'Foot',
        },
        typeLabels: {
          all: 'All',
          mobilization: 'Mobilization',
          manipulation: 'Manipulation',
          thrust: 'Thrust',
          nonthrust: 'Non-thrust',
          mwm: 'MWM (Mulligan)',
          prp: 'PRP (Mulligan)',
        },
      },
      orthopedic: {
        regionLabels: {
          knee: 'Knee',
          shoulder: 'Shoulder',
          hip: 'Hip',
          spine: 'Lumbar Spine',
          ankle: 'Ankle/Foot',
          'elbow-wrist': 'Elbow/Wrist',
          cervical: 'Cervical Spine',
        },
        procedureLabel: 'Procedure',
        positiveLabel: 'Positive if',
        loading: 'Loading tests...',
        errorLoadingTests: 'Unable to load the orthopedic tests.',
      },
      pelvicFloor: {
        questionnaireCalloutHeading: 'Interactive History-Taking Questionnaire',
        questionnaireCalloutDescription: 'Structured collection of bowel, urinary and pelvic pain history, with a final summary organized by area.',
        startQuestionnaireLabel: 'Start Questionnaire',
        loading: 'Loading tests...',
        errorLoadingTests: 'Unable to load the pelvic floor tests.',
        categoryLabels: {
          neuropathy: 'Neuropathic Tests',
          manual_assessment: 'Manual Assessment',
          urodynamic: 'Urodynamic Tests',
          questionnaire: 'Questionnaires',
          symptom_questionnaire: 'Symptom Questionnaires',
        },
        procedureLabel: 'Procedure',
        interpretationLabel: 'Interpretation',
        fillQuestionnaireLabel: 'Fill in the questionnaire',
        hideQuestionnaireLabel: 'Hide questionnaire',
        fillableBadge: 'Fillable',
        loadingQuestionnaireContent: 'Loading questionnaire...',
        sf36: {
          domainLabels: {
            PF: 'Physical Functioning',
            RP: 'Role Limitations — Physical',
            RE: 'Role Limitations — Emotional',
            VT: 'Vitality/Energy',
            MH: 'Mental Health',
            SF: 'Social Functioning',
            BP: 'Bodily Pain',
            GH: 'General Health',
          },
          scoreHeader: 'Domain scores (0-100, higher = better perceived health status) — {answered}/{total} questions completed',
          responsesLabel: 'responses',
        },
        pfdi: {
          subscaleLabels: {
            POPDI: 'Pelvic Organ Prolapse (POPDI-6)',
            CRADI: 'Colorectal-Anal (CRADI-8)',
            UDI: 'Urinary (UDI-6)',
          },
          scoreHeader: 'Subscale scores (0-100, higher = greater distress) — {answered}/{total} questions completed',
          responsesLabel: 'responses',
          severityLabels: {
            minimal: 'Minimal symptoms',
            moderate: 'Moderate distress',
            severe: 'Severe distress',
          },
        },
        iciq: {
          severityPrefix: 'Severity',
          severityLabels: {
            mild: 'Mild',
            moderate: 'Moderate',
            severe: 'Severe',
            verySevere: 'Very severe',
          },
        },
      },
      neuro: {
        calloutHeading: 'Neurological Examination',
        calloutDescription: 'Multi-step clinical exam: cranial nerves, reflexes, pathological signs, sensation, muscle strength, coordination, balance and gait, with a final summary.',
        startExamLabel: 'Start Exam',
        loading: 'Loading tests...',
        errorLoadingTests: 'Unable to load the neurological tests.',
        categoryLabels: {
          cranial_nerves: 'Cranial Nerves',
          reflexes: 'Reflexes',
          sensation: 'Sensation',
          strength: 'Muscle Strength',
          coordination: 'Coordination',
          balance_gait: 'Balance and Gait',
        },
        procedureLabel: 'Procedure',
        interpretationLabel: 'Interpretation',
      },
      functional: {
        loading: 'Loading content...',
        errorLoadingScales: 'Unable to load the functional scales.',
        yesLabel: 'Yes',
        noLabel: 'No',
        secondsUnit: 'seconds',
        secondsMax120Unit: 'seconds (max 120)',
        metersUnit: 'meters',
        groupLabels: {
          balanceFalls: 'Balance & Fall Risk',
          adl: 'Activities of Daily Living',
          cognitiveConsciousness: 'Cognitive & Consciousness Status',
          painTone: 'Pain & Muscle Tone',
          aerobicQol: 'Aerobic Capacity & Quality of Life',
          strokeNeurodegenerative: 'Stroke & Neurodegenerative Disease',
          upperLimb: 'Upper Limb',
          orthopedics: 'Orthopedics & Post-Surgical Recovery',
          trunkGlobalDisability: 'Trunk Control & Global Disability',
        },
      },
    },
    metabolicCalculator: {
      badge: 'Metabolic Calculator',
      heading: 'Metabolic Profile',
      subtitle: 'Estimate energy needs and macronutrient breakdown in under a minute.',
      disclaimer: 'These values are estimates for informational and planning purposes and are not a substitute for individualized medical or nutritional advice.',
      sexLabel: 'Sex',
      sexOptions: { male: 'Male', female: 'Female' },
      ageLabel: 'Age',
      weightLabel: 'Weight (kg)',
      heightLabel: 'Height (cm)',
      activityLabel: 'Activity Level',
      activityLevels: {
        sedentary: 'Sedentary',
        light: 'Lightly Active',
        moderate: 'Moderately Active',
        very: 'Very Active',
        extreme: 'Extremely Active',
      },
      bodyFatLabel: 'Body Fat (%)',
      bodyFatOptionalHint: 'Optional — when provided, the estimate uses your actual lean mass instead of a statistical average.',
      goalLabel: 'Goal',
      goals: {
        maintain: 'Maintain Weight',
        fat_loss: 'Fat Loss',
        muscle_gain: 'Muscle Gain',
        performance: 'Performance',
      },
      macroStrategyLabel: 'Macro Strategy',
      macroStrategies: {
        balanced: 'Balanced',
        high_protein: 'High Protein',
        high_carb: 'High Carbohydrate',
        low_carb: 'Lower Carbohydrate',
        custom: 'Custom',
      },
      calculateCta: 'Calculate',
      recalculateCta: 'Recalculate',
      invalidInputWarning: 'Please double-check your data — some values look outside a plausible range.',
      resultsHeading: 'Your Metabolic Profile',
      bmrLabel: 'Basal Metabolic Rate (BMR)',
      tdeeLabel: 'Total Daily Energy Expenditure (TDEE)',
      bmiLabel: 'BMI',
      bmiCategories: {
        underweight: 'Underweight',
        normal: 'Normal Weight',
        overweight: 'Overweight',
        obese: 'Obese',
      },
      leanBodyMassLabel: 'Estimated Lean Mass',
      fatMassLabel: 'Estimated Fat Mass',
      estimateNote: 'An estimate, not an exact clinical measurement.',
      calorieTargetLabel: 'Daily Calorie Target',
      calorieScenariosHeading: 'Calorie Scenarios',
      kcalPerDaySuffix: 'kcal/day',
      macronutrientsHeading: 'Macronutrients',
      proteinLabel: 'Protein',
      carbsLabel: 'Carbohydrates',
      fatLabel: 'Fat',
      perKgSuffix: 'g/kg',
      editMacrosCta: 'Edit Percentages',
      doneEditingCta: 'Done',
      saveCta: 'Save to Profile',
      saveToPatientCta: 'Save to Patient',
      selectPatientPrompt: 'Select a patient',
      savedConfirmation: 'Saved',
      historyHeading: 'Metabolic History',
      noHistoryYet: 'No saved profiles yet.',
      todaysTargetHeading: "Today's Target",
      activityLevelLabel: 'Activity Level',
      printCta: 'Export PDF',
      printedForLabel: 'Profile for',
      printedOnLabel: 'Generated on',
      adaptiveBadge: 'Phygo Adapt',
      adaptiveHeading: 'Your Real TDEE',
      adaptiveExplain: 'Calculated from your actually recorded weight trend — more reliable than the formula alone, because it is based on what really happened, not just a statistical estimate.',
      adaptiveDeltaAbove: 'Your real metabolism looks higher than estimated: {value} kcal/day more.',
      adaptiveDeltaBelow: 'Your real metabolism looks lower than estimated: {value} kcal/day less.',
      adaptiveDeltaMatch: 'Your real metabolism matches the calculated estimate.',
      adaptiveBasedOn: 'Based on {days} days and {entries} entries.',
      adaptiveNotEnoughData: 'Keep saving your data: with at least two entries 10+ days apart, Phygo will calibrate your real TDEE to your actual weight trend.',
      goalWeightLabel: 'Goal Weight (kg)',
      goalWeightPlaceholder: 'e.g. 70',
      goalWeightHint: 'Enter a goal weight to see an estimate of when you might reach it, based on your real pace.',
      projectionHeading: 'Goal Estimate',
      projectionAchievable: 'At your current pace, you could reach your goal in about {days} days (~{date}).',
      projectionWrongDirection: 'Your current weight trend is moving in the opposite direction from this goal.',
      projectionNoProgress: "Your weight has stayed stable over the observed period: not enough movement yet to estimate a date.",
      weightTrendHeading: 'Weight Trend',
      foodExamplesCta: 'Food Examples',
      hideFoodExamplesCta: 'Hide Food Examples',
      foodExamplesDisclaimer: 'General, indicative values — not specific to any product or brand. A reference to get a feel for the numbers, not a meal plan.',
      perHundredGramsSuffix: '/100g',
    },
    myPhygoLife: {
      badge: 'Phygo Life',
      heading: 'Your Life, Tracked',
      subtitle: 'Tools to take care of yourself every day, beyond your physiotherapy sessions.',
      metabolicCardTitle: 'Metabolic Profile',
      metabolicCardSubtitle: 'Discover your calorie needs and the ideal split of protein, carbs and fat.',
      backToHome: 'Back to Home',
      noProfileYet: "You haven't calculated your metabolic profile yet.",
      startCalculatorCta: 'Calculate Your Profile',
      recalculatePrompt: 'Want to update your data?',
      scaleReminderHeading: "Don't have a scale? Here are our picks.",
      scaleReminderCta: 'See recommended scales',
    },
    neuroExam: {
      backToClinicalToolkit: 'Back to Clinical Toolkit',
      badge: 'Physical Exam',
      heading: 'Neurological Exam',
      sectionCounterSeparator: 'of',
      backButton: 'Back',
      nextButton: 'Next',
      viewSummaryButton: 'View Summary',
      editAnswersButton: 'Edit answers',
      finishButton: 'Finish',
      summaryHeading: 'Neurological Exam Summary',
      loading: 'Loading...',
      errorLoading: 'Unable to load the exam content.',
      sections: {
        consciousness: 'Level of Consciousness',
        cortical_functions: 'Higher Cortical Functions',
        stance_gait: 'Stance and Gait',
        strength_tone: 'Strength, Bulk and Tone',
        reflexes: 'Tendon and Superficial Reflexes',
        sensation: 'Sensation',
        cerebellar: 'Cerebellar Tests',
        cranial_nerves: 'Cranial Nerves',
        involuntary_movements: 'Involuntary Movements',
        meningeal_signs: 'Meningeal Signs',
      },
    },
    patients: {
      eyebrow: 'Dashboard',
      greetingMorning: 'Good morning',
      greetingAfternoon: 'Good afternoon',
      greetingEvening: 'Good evening',
      greetingDefault: 'Welcome back',
      subtitle: "Here's your patient roster",
      newPatient: 'New patient',
      cancel: 'Cancel',
      statPatients: 'Patients',
      statNotesThisMonth: 'Notes this month',
      statActivePlans: 'Active plans',
      searchPlaceholder: 'Search patients by name...',
      formNameLabel: 'Name',
      formGenderLabel: 'Gender',
      genderMale: 'Male',
      genderFemale: 'Female',
      genderNotSpecified: 'Not specified',
      formAgeLabel: 'Age',
      formConditionLabel: 'Main condition',
      savingButton: 'Saving...',
      savePatientButton: 'Save patient',
      noPatientsYet: 'No patients yet. Add one to get started.',
      noPatientsMatch: 'No patients match "{search}".',
      yearsOld: '{age} years old',
      patientNotFound: 'Patient not found.',
      portalActive: 'Portal active',
      scheduleButton: 'Schedule',
      generateNewNoteButton: 'Generate new note',
      generatingInvite: 'Generating...',
      inviteToPortalButton: 'Invite to Portal',
      resetPortalAccess: 'Reset portal access',
      resetPortalConfirm: "This will disconnect {name}'s current portal account. They will need a new invite link to log in again. Continue?",
      inviteReadyHeading: 'Invite link ready — valid for 7 days',
      inviteShareText: 'Share this with {name} so they can access their My Phygo portal.',
      copied: 'Copied',
      copyButton: 'Copy',
      inviteError: 'Could not create invite. Please try again.',
      statSessions: 'Sessions',
      statLastSession: 'Last session',
      statPatientSince: 'Patient since',
      statLinkedItems: 'Linked items',
      noteHistoryHeading: 'Note history',
      noNotesYet: 'No notes yet for this patient.',
      generateFirstNote: 'Generate the first session note to start their history.',
      noAssessmentRecorded: 'No assessment recorded.',
      treatmentPlanHeading: 'Treatment plan & clinical references',
      nothingLinkedYet: 'Nothing linked to {name} yet.',
      treatmentPlanHint: 'Use "Add to Treatment Plan" / "Use with Patient" anywhere in Body Map, Neurology, Cardiopulmonary, Oncology or Manual Therapy to build their history here.',
      noteHistorySubtitle: 'Full timeline of recorded clinical sessions',
      treatmentPlanSubtitle: 'Tests, questionnaires, exercises and clinical references assigned to the care plan',
      openReferenceHint: 'Open',
      removeTitle: 'Remove',
      refTypeExercise: 'Exercise / Technique',
      refTypeClinicalTest: 'Clinical Test',
      refTypeQuestionnaire: 'Questionnaire',
      refTypeCondition: 'Condition',
      refTypeBodyZone: 'Body Zone',
      refTypeProduct: 'Product',
      refTypeMetabolicProfile: 'Metabolic Profile',
      sinceToday: 'Today',
      since1Day: '1 day',
      sinceDays: '{days} days',
      since1Month: '1 month',
      sinceMonths: '{months} months',
      since1Year: '1 year',
      sinceYears: '{years} years',
      backToPatientName: 'Back to {name}',
      sessionNoteTab: 'Session Note',
      videoCallTab: 'Video Call',
      noteSavedMessage: "Note saved to {name}'s record.",
      nutritionHeading: 'Nutrition & metabolic profile',
      nutritionSubtitle: 'Calorie needs, macronutrients and weight trend over time',
      nutritionEmpty: 'No metabolic profile calculated yet for {name}.',
      nutritionEmptyHint: 'Calculate a first profile from the Metabolic Calculator in Clinical Tools to start tracking their trend here.',
      weightTrendHeading: 'Weight Trend',
      latestProfileLabel: 'Latest profile',
      newCalculationCta: 'New Calculation',
      viewFullCalculatorCta: 'Open in Calculator',
    },
    pelvicFloorAnamnesis: {
      backToPelvicFloor: 'Back to Pelvic Floor',
      badge: 'Anamnestic Questionnaire',
      heading: 'Pelvic Floor Assessment',
      sectionCounterSeparator: 'of',
      backButton: 'Back',
      nextButton: 'Next',
      viewSummaryButton: 'View Summary',
      editAnswersButton: 'Edit answers',
      finishButton: 'Finish',
      summaryHeading: 'Anamnestic Summary',
      loading: 'Loading...',
      errorLoading: 'Could not load the questionnaire content.',
    },
    firstAid: {
      badge: 'First Aid Atlas',
      heading: 'First Aid',
      subtitle: "Protocols compared across Italy, France, the United Kingdom, Spain and the USA — because guidelines aren't always the same everywhere.",
      infoBox: 'Each card shows, for every country, the emergency number to call, the reference health authority, the practical protocol to follow and the official source consulted — so you can move quickly between countries without losing accuracy.',
      allFilter: 'All',
      loadingTopics: 'Loading topics...',
      errorLoadingTopics: 'Could not load first aid topics.',
      backToTopics: 'All topics',
      errorLoadingTopic: 'Could not load this first aid topic.',
      emergencyNumberLabel: 'Emergency number: ',
      governingBodyLabel: 'Reference authority: ',
      protocolLabel: 'Protocol',
      notesLabel: 'Notes on differences',
      sourceLabel: 'Source: ',
      categoryLabels: {
        rianimazione: 'Resuscitation',
        neurologico: 'Neurological',
        cardiovascolare: 'Cardiovascular',
        allergologico: 'Allergic',
        trauma: 'Trauma',
        ambientale: 'Environmental',
        tossicologico: 'Toxicological',
        organizzazione: 'Organization',
      },
      countryLabels: {
        Italia: 'Italy',
        Francia: 'France',
        'Regno Unito': 'United Kingdom',
        Spagna: 'Spain',
        USA: 'USA',
      },
    },
    bls: {
      badge: 'BLSD',
      heading: 'Basic Life Support',
      subtitle: 'CPR, AED and airway obstruction relief — verified against the 2025 AHA (American Heart Association) guidelines.',
      infoBox: 'BLSD (Basic Life Support Defibrillation) is the set of basic life-saving maneuvers — cardiopulmonary resuscitation, defibrillator use and airway obstruction relief — that every healthcare provider should be able to perform independently before advanced help arrives. Each card below shows the full procedure, the key technical parameters (rate, depth, compression-to-ventilation ratio) and the age-specific precautions, along with any changes introduced by the most recent guidelines.',
      errorLoading: 'Could not load BLSD procedures.',
      positionLabel: 'Position',
      procedureLabel: 'Procedure',
      keyParametersLabel: 'Key Parameters',
      precautionsLabel: 'Precautions',
      evidenceLabel: 'Evidence',
      categoryLabels: {
        adult_cpr: 'Adult CPR',
        child_cpr: 'Child CPR',
        infant_cpr: 'Infant CPR',
        choking: 'Airway Obstruction',
        aed: 'AED',
        team_dynamics: 'Team Dynamics',
      },
    },
    bodyMap: {
      badge: 'Interactive 3D Body Map',
      calibrationBadge: 'Calibration Mode — click the model',
      heading: 'Anatomical Navigator',
      subtitle: 'Rotate, zoom and explore the 3D anatomical model — tap a zone to open its conditions, tests and protocols.',
      legendMuscleZones: 'Muscle zones',
      legendBoneZones: 'Bone zones (X-ray)',
      legendDragScroll: 'Drag to rotate, scroll to zoom',
      howItWorks: {
        clickZone: {
          label: 'Tap a zone',
          text: 'Each highlighted region opens its own dedicated page: anatomy, biomechanics, clinical tests and rehabilitation protocols.',
        },
        xray: {
          label: 'Switch on X-ray',
          text: 'Switch to skeletal mode to explore 14 bone groups, along with their most common fractures and conditions.',
        },
        search: {
          label: 'Search for a zone',
          text: 'For small areas (wrist, ankle, elbow), typing the name in the search bar is faster than centering them with the mouse.',
        },
      },
      clinicalFooter: 'Clinical content anchored to verified classifications and guidelines — Neer, Kibler, AO/Weber, Garden, SOSORT and others',
      ctaWholeBody: 'Whole Body / Balance & Gait',
      loadingModel: 'Loading 3D model...',
      searchPlaceholder: 'Search zone...',
      noZoneFound: 'No zone found',
      dragRotateZoom: 'Drag to rotate · scroll to zoom',
      xrayLabel: 'X-Ray',
      modelCreditPrefix: '3D Model:',
      zoneNotFound: 'Zone not found.',
      backToBodyMap: 'Body Map',
      zoneTypeSkeletal: 'Skeletal Structure',
      zoneTypeAnatomical: 'Anatomical Zone',
      relatedZonesLabel: 'Related Zones',
      askPhygoButton: 'Ask Phygo about this zone',
      askPhygoHeadingPrefix: 'Ask Phygo about {zone}',
      askPlaceholder: 'Ask a clinical question about this region...',
      askGenericError: 'Something went wrong.',
      askGenericErrorRetry: 'Something went wrong. Please try again.',
      noExercisesLinked: 'No exercises linked to this zone yet.',
      seeAllExercises: 'See all {count} exercises in Pro Library →',
      relatedConditionsHeading: 'Related Conditions',
      noConditionsLinked: 'No conditions linked to this zone yet.',
      sourceCitedAriaLabel: 'Cited source',
      zoneNames: {
        'cervical-spine': 'Cervical Spine',
        trapezius: 'Trapezius / Upper Trap',
        shoulder: 'Shoulder',
        chest: 'Chest / Pectorals',
        biceps: 'Biceps',
        triceps: 'Triceps',
        elbow: 'Elbow',
        forearm: 'Forearm',
        'wrist-hand': 'Wrist / Hand',
        'core-abdomen': 'Core / Abdomen',
        'thoracic-spine': 'Thoracic Spine / Upper Back',
        'lumbar-spine': 'Lumbar Spine / Lower Back',
        hip: 'Hip',
        glutes: 'Glutes',
        quadriceps: 'Quadriceps',
        hamstrings: 'Hamstrings',
        knee: 'Knee',
        calf: 'Calf',
        'ankle-foot': 'Ankle / Foot',
      },
      boneNames: {
        'bone-cranio': 'Skull',
        'bone-clavicola-scapola': 'Clavicle & Scapula',
        'bone-coste-sterno': 'Ribs & Sternum',
        'bone-omero': 'Humerus',
        'bone-radio-ulna': 'Radius & Ulna',
        'bone-mano': 'Hand Bones',
        'bone-bacino': 'Pelvis',
        'bone-sacro': 'Sacrum & Coccyx',
        'bone-femore': 'Femur',
        'bone-tibia-perone': 'Tibia & Fibula',
        'bone-piede': 'Foot Bones',
        'bone-cervicale': 'Cervical Vertebrae',
        'bone-dorsale': 'Thoracic Vertebrae',
        'bone-lombare': 'Lumbar Vertebrae',
      },
    },
    pelvicFloorAtlas: {
      badge: 'Pelvic Health Atlas',
      heading: 'Pelvic Floor',
      subTabs: { anatomy: 'Anatomy', conditions: 'Conditions', assessment: 'Assessment', rehab: 'Rehabilitation' },
      anatomyHeading: 'Pelvic Floor Anatomy',
      anatomyIntro:
        'Muscles, fasciae, ligaments and key concepts explaining how the pelvic floor works as an integrated system.',
      overviewIntro:
        "The pelvic floor is a funnel-shaped musculo-fascial system that closes the abdomino-pelvic cavity from below, supporting the bladder, uterus/prostate and rectum. It is not an isolated muscle block: it works in coordination with the deep abdominal muscles, the respiratory diaphragm and the surrounding connective structures (fasciae and ligaments) to counter the intra-abdominal pressures generated by breathing, coughing, straining and lifting. Correct function depends on the balance between resting tone (closing the orifices), voluntary contractile capacity (active continence) and coordinated relaxation capacity (voiding, defecation, childbirth). The sections below cover the muscular component, the fascial/ligamentous component, and the two concepts — the hammock theory and muscular synergies — that explain how these parts work together.",
      conditionsHeading: 'Related Conditions',
      conditionsIntro: 'Conditions organized by compartment. Tap a card for goals, clinical tests and exercises.',
      assessmentHeading: 'Clinical Assessment',
      assessmentIntro: 'Clinical tests and manual/instrumental assessment protocols.',
      rehabHeading: 'Rehabilitation',
      rehabIntro: 'Exercise, biofeedback, electrostimulation protocols and rehabilitation for special populations.',
      loading: 'Loading...',
      errorStructures: 'Unable to load anatomical structures.',
      errorConditions: 'Unable to load conditions.',
      errorTests: 'Unable to load assessment tests.',
      errorRehab: 'Unable to load rehabilitation content.',
      structureCategoryLabels: { muscle: 'Muscles', fascia_ligament: 'Fasciae & Ligaments', concept: 'Key Concepts', nerve: 'Nerves' },
      structureCategoryLabelsSingular: { muscle: 'Muscle', fascia_ligament: 'Fascia / Ligament', concept: 'Key Concept', nerve: 'Nerve' },
      compartmentLabels: {
        anterior: 'Anterior Compartment',
        central: 'Central Compartment',
        posterior: 'Posterior Compartment',
        systemic: 'Systemic Syndromes',
      },
      rehabCategoryLabels: {
        kegel: 'Pelvic Floor Exercise',
        biofeedback_electrostim: 'Biofeedback & Electrostimulation',
        bladder_training: 'Bladder Training',
        postpartum: 'Postpartum Rehabilitation',
        special_population: 'Special Populations',
      },
      imageLabels: {
        femaleSagittal: 'Sagittal — Female',
        maleSagittal: 'Sagittal — Male',
        inferiorView: 'Inferior View',
        inferiorViewFull: 'Inferior View (Female) — perineal plane, three compartments',
      },
      protocolLabel: 'Protocol',
      relatedConditionsHeading: 'Related Conditions',
      noConditionsLinked: 'No conditions linked to this structure yet.',
      backToAtlas: 'Back to Pelvic Floor',
      structureNotFound: 'Structure not found.',
      errorLoadingStructure: 'Unable to load the structure data.',
      anatomySectionLabel: 'Anatomy',
      functionSectionLabel: 'Function',
      clinicalRelevanceLabel: 'Clinical Relevance',
    },
    profilePage: {
      eyebrow: 'Professional Area',
      heading: 'Profile',
      subtitle: 'The information your patients and colleagues see about you.',
      photoLabel: 'Profile photo',
      photoHint: 'Visible to your patients',
      displayNameLabel: 'Display name',
      displayNamePlaceholder: 'Dr. Andrea Stilfer',
      bioLabel: 'Short bio',
      bioPlaceholder: 'A few lines about your approach and experience...',
      registrationNumberLabel: 'Professional Registration Number',
      registrationNumberPlaceholder: 'e.g. HCPC No. 12345 / License No. 12345',
      registrationNumberHint: 'Optional — the format varies by country and professional licensing body.',
      credentialsLabel: 'Courses & certifications',
      credentialPlaceholder: 'e.g. Master in Pelvic Floor Rehabilitation',
      add: 'Add',
      saveProfile: 'Save profile',
    },
  },
  es: {
    clinicalActionBar: {
      addToTreatmentPlan: 'Añadir al Plan de Tratamiento',
      useWithPatient: 'Añadir al Paciente',
      startForPatient: 'Asignar al Paciente',
      useAsClinicalReference: 'Usar como Referencia Clínica',
      recommendToPatient: 'Recomendar al Paciente',
      selectPatient: 'Seleccionar paciente',
      addedFor: 'Añadido para {name}',
      added: 'Añadido',
      searchPlaceholder: 'Buscar paciente...',
      searching: 'Buscando...',
      noPatientsFound: 'No se encontraron pacientes.',
    },
    nav: {
      patients: 'Pacientes',
      library: 'Biblioteca',
      world: 'Phygo World',
      schedule: 'Agenda',
      profile: 'Perfil',
      signOut: 'Cerrar sesión',
      startFree: 'Empieza gratis',
      search: 'Buscar',
      liveDemo: 'Demo en vivo',
      features: 'Funciones',
      trust: 'Confianza',
      pricing: 'Precios',
      faq: 'Preguntas frecuentes',
      currentPatient: 'Paciente actual',
    },
    libraryLinks: {
      bodyMap: { label: 'Mapa Corporal', description: 'Explorador anatómico interactivo' },
      neurology: { label: 'Neurología', description: 'Cerebro, nervios y vías nerviosas' },
      physiology: { label: 'Fisiología', description: 'Mecanismos musculares y neurológicos fundamentales' },
      sportsMedicine: { label: 'Medicina Deportiva', description: 'Ciencia de la lesión deportiva y retorno al deporte' },
      pelvicFloor: { label: 'Suelo Pélvico', description: 'Anatomía, condiciones y rehabilitación' },
      cardiopulmonary: { label: 'Cardiopulmonar', description: 'Anatomía, condiciones y rehabilitación' },
      endocrine: { label: 'Endocrino', description: 'Anatomía, condiciones y rehabilitación' },
      fascia: { label: 'Fascia', description: 'Anatomía, función y aplicaciones clínicas' },
      urinary: { label: 'Urinario', description: 'Anatomía, condiciones y rehabilitación' },
      gastrointestinal: { label: 'Gastrointestinal', description: 'Anatomía, condiciones y rehabilitación' },
      immune: { label: 'Inmunitario', description: 'Anatomía, condiciones y rehabilitación' },
      hematology: { label: 'Hematología', description: 'Anatomía, condiciones y rehabilitación' },
      oncology: { label: 'Oncología', description: 'Anatomía, condiciones y rehabilitación' },
      firstAid: { label: 'Primeros Auxilios', description: 'Protocolos por país' },
      blsd: { label: 'RCP/DEA', description: 'RCP, DEA y desobstrucción de vía aérea' },
      clinicalTools: { label: 'Herramientas Clínicas', description: 'Escalas de valoración y pruebas' },
    },
    physiologyCrossLink: { question: '¿Quieres entender cómo funciona?', cta: 'Ir a Fisiología' },
    worldLinks: {
      science: { label: 'Evidence Hub', description: 'Resúmenes de las últimas investigaciones' },
      events: { label: 'Eventos', description: 'Congresos, cursos y webinars de salud' },
      shop: { label: 'Tienda', description: 'Equipamiento recomendado' },
    },
    events: {
      badge: 'Phygo World',
      heading: 'Eventos',
      subtitle: 'Descubre congresos, cursos y experiencias que están dando forma a la fisioterapia, la salud y el rendimiento humano.',
      searchPlaceholder: 'Busca por nombre, tema, ciudad o país...',
      filtersLabel: 'Filtros',
      categoryLabel: 'Categoría',
      typeLabel: 'Tipo de evento',
      dateLabel: 'Fecha',
      locationLabel: 'Ubicación',
      audienceLabel: 'Público',
      levelLabel: 'Nivel profesional',
      allLabel: 'Todos',
      onlineLabel: 'En línea',
      inPersonLabel: 'Presencial',
      hybridLabel: 'Híbrido',
      freeLabel: 'Gratis',
      paidLabel: 'De pago',
      datePresets: { today: 'Hoy', thisWeek: 'Esta Semana', thisMonth: 'Este Mes', next3Months: 'Próximos 3 Meses', custom: 'Personalizado' },
      featuredHeading: 'Destacados',
      upcomingHeading: 'Próximos Eventos',
      onlineHeading: 'Eventos en Línea',
      nearYouHeading: 'Cerca de Ti',
      viewEventCta: 'Ver Evento',
      noEventsFound: 'Ningún evento coincide con estos filtros.',
      loadingEvents: 'Cargando eventos...',
      categoryLabels: { physiotherapy: 'Fisioterapia', rehabilitation: 'Rehabilitación', sportsRehabilitation: 'Rehabilitación Deportiva', sportsMedicine: 'Medicina Deportiva', orthopaedics: 'Ortopedia', neurology: 'Neurología', neurorehabilitation: 'Neurorrehabilitación', exerciseScience: 'Ciencias del Ejercicio', strengthConditioning: 'Preparación Física', manualTherapy: 'Terapia Manual', painScience: 'Ciencia del Dolor', pelvicFloor: 'Suelo Pélvico', cardiopulmonary: 'Cardiopulmonar', oncology: 'Oncología', nutrition: 'Nutrición', psychology: 'Psicología', yoga: 'Yoga', pilates: 'Pilates', mobility: 'Movilidad', wellness: 'Bienestar', longevity: 'Longevidad', healthyAging: 'Envejecimiento Saludable', prevention: 'Prevención', healthcareTechnology: 'Tecnología Sanitaria', aiHealthcare: 'IA y Salud', digitalHealth: 'Salud Digital', research: 'Investigación' },
      typeLabels: { congress: 'Congreso', conference: 'Conferencia', course: 'Curso', workshop: 'Taller', webinar: 'Webinar', masterclass: 'Masterclass', seminar: 'Seminario', symposium: 'Simposio', certification: 'Curso de Certificación' },
      audienceLabels: { professionals: 'Profesionales', students: 'Estudiantes', public: 'Pacientes / Público', both: 'Todos' },
      levelLabels: { student: 'Estudiante', beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado', expert: 'Experto' },
      statusLabels: { upcoming: 'Próximo', updated: 'Actualizado', dateChanged: 'Fecha Modificada', locationChanged: 'Ubicación Modificada', cancelled: 'Cancelado', soldOut: 'Agotado', registrationOpen: 'Inscripciones Abiertas', registrationClosed: 'Inscripciones Cerradas', completed: 'Finalizado' },
      verificationLabels: { unverified: 'No Verificado', source_verified: 'Fuente Verificada', organizer_verified: 'Organizador Verificado', phygo_verified: 'Verificado por Phygo' },
      verificationExplainer: 'La verificación refleja la precisión de la fuente, no un respaldo de Phygo a la calidad científica del evento.',
      organizerLabel: 'Organizador',
      timeLabel: 'Hora',
      timezoneLabel: 'Zona horaria',
      descriptionLabel: 'Descripción',
      topicsLabel: 'Temas',
      speakersLabel: 'Ponentes',
      priceLabel: 'Precio',
      registrationDeadlineLabel: 'Fecha límite de inscripción',
      registerCta: 'Inscribirse / Sitio Oficial',
      officialWebsiteCta: 'Sitio Oficial',
      saveEventCta: 'Guardar Evento',
      savedCta: 'Guardado',
      backToEvents: 'Volver a Eventos',
      eventNotFound: 'Evento no encontrado.',
      myEventsHeading: 'Mis Eventos',
      savedTab: 'Guardados',
      upcomingTab: 'Próximos',
      pastTab: 'Pasados',
      noSavedEvents: 'Aún no has guardado ningún evento.',
      signInToSave: 'Inicia sesión para guardar eventos.',
      providersHeading: 'Más Recursos de Formación',
      providersSubtitle: 'Entidades que publican cursos continuamente: visita su sitio para el calendario siempre actualizado.',
      visitProviderCta: 'Visitar Sitio',
    },
    science: {
      badge: 'Phygo Evidence Hub',
      headingLead: 'Últimas',
      headingAccent: 'Evidencias',
      subtitle: 'Investigación basada en la evidencia para fisioterapeutas.',
      searchPlaceholder: 'Buscar estudios por título...',
      loadingText: 'Cargando investigaciones…',
      noResultsText: 'Ningún estudio coincide con tu búsqueda.',
      clinicalQuestionLabel: 'Pregunta clínica',
      whyItMattersLabel: 'Por qué importa',
      resultsCountSuffix: 'estudios encontrados',
      originalStudyCta: 'Estudio Original',
    },
    shop: {
      eyebrow: 'Equipamiento',
      heading: 'Tienda',
      subtitle: 'Selección de equipamiento que puedes recomendar directamente desde una sesión.',
      curatedPicksSuffix: 'productos seleccionados',
      allLabel: 'Todos',
      viewOnAmazonCta: 'Ver en Amazon',
      categoryLabels: {
        'Pelvic Floor': 'Suelo Pélvico',
        'Low Back': 'Zona Lumbar',
        Posture: 'Postura',
        Mobility: 'Movilidad',
        Recovery: 'Recuperación',
        'Body Composition': 'Composición Corporal',
        Nutrition: 'Nutrición',
      },
    },
    fields: {
      goals: 'Objetivos',
      clinicalTests: 'Pruebas Clínicas',
      typicalExercises: 'Ejercicios Típicos',
      progressionCriteria: 'Criterios de Progresión',
      returnToActivityCriteria: 'Criterios de Retorno a la Actividad',
      outcomeMeasures: 'Medidas de Resultado',
      contraindications: 'Contraindicaciones',
      redFlags: 'Señales de Alarma',
      featuredExercises: 'Ejercicios Destacados',
      source: 'Fuente',
      evidence: 'Evidencia',
    },
    anatomy: {
      anatomy: 'Anatomía',
      innervation: 'Inervación',
      biomechanics: 'Biomecánica',
      clinicalRelevance: 'Relevancia Clínica',
      connections: 'Conexiones',
      vascularSupply: 'Vascularización',
      function: 'Función',
    },
    evidenceLevels: {
      high: 'Alta',
      strong: 'Alta',
      moderate: 'Moderada',
      low: 'Baja',
      limited: 'Baja',
    },
    common: {
      loading: 'Cargando...',
      save: 'Guardar',
      saving: 'Guardando...',
      saved: 'Guardado',
      backToPatients: 'Volver a pacientes',
      machineTranslatedNotice:
        'Traducido automáticamente del italiano — para decisiones clínicas, verifica las Señales de Alarma y las Contraindicaciones contra el texto original.',
    },
    brainMap: {
      atlasBadge: 'Atlas Neurológico',
      heading: 'Neurología',
      subtitle:
        'Anatomía, vías nerviosas y razonamiento clínico de localización — un atlas interactivo pensado para la práctica diaria.',
      viewLabels: { brain: 'Cerebro', nerves: 'Nervios Periféricos', pathways: 'Circuitos Neurales' },
      brainSubTabs: { atlas: 'Atlas', conditions: 'Condiciones' },
      deepStructuresHint: 'Estructuras profundas — no visibles en la superficie del modelo 3D, pero consultables aquí.',
      referenceViewsHint: 'Vistas de referencia — lateral, sagital y coronal, con las estructuras principales etiquetadas.',
      nerveViewerHint: 'Mueve el cursor sobre la imagen para explorarla en perspectiva',
      loading3DModel: 'Cargando modelo 3D...',
      dragRotateZoom: 'Arrastra para girar · desplázate para el zoom',
      modelCreditPrefix: 'Modelo 3D:',
      zoneNames: {
        'frontal-lobe': 'Lóbulo Frontal',
        'parietal-lobe': 'Lóbulo Parietal',
        'temporal-lobe': 'Lóbulo Temporal',
        'occipital-lobe': 'Lóbulo Occipital',
        cerebellum: 'Cerebelo',
        brainstem: 'Tronco Encefálico',
        'basal-ganglia': 'Ganglios Basales',
        insula: 'Ínsula',
        'corpus-callosum': 'Cuerpo Calloso',
        thalamus: 'Tálamo',
        hypothalamus: 'Hipotálamo',
        amygdala: 'Amígdala',
        hippocampus: 'Hipocampo',
      },
      brainConditionsHeading: 'Condiciones Cerebrales',
      brainConditionsHint:
        'Todas las condiciones vinculadas a las zonas cerebrales, en una única lista con búsqueda — toca una tarjeta para ver los detalles clínicos.',
      searchConditionsPlaceholder: 'Buscar por nombre de la condición...',
      loadingConditions: 'Cargando condiciones...',
      errorLoadingConditions: 'No se pudieron cargar las condiciones vinculadas.',
      noConditionsFound: 'No se encontraron condiciones.',
      relatedConditionsHeading: 'Condiciones Relacionadas',
      nervesSubTabs: {
        atlas: 'Atlas de Nervios',
        seddon: 'Clasificación de Seddon',
        conduction: 'Conducción Nerviosa',
        conditions: 'Condiciones Relacionadas',
        diffuse: 'Trastornos Difusos',
      },
      peripheralAtlasHeading: 'Atlas de Nervios Periféricos',
      peripheralAtlasHint:
        'Toca un nervio para ver anatomía, función motora/sensitiva, sitio típico de compresión y condiciones relacionadas.',
      regionAll: 'Todos',
      regionLabels: {
        plexus: 'Plexo',
        upper_limb: 'Miembro Superior',
        lower_limb: 'Miembro Inferior',
        cranial: 'Nervios Craneales',
      },
      askPhygoPrompt: '¿No encuentras el nervio que buscas? Pregunta a Phygo',
      askPhygoPlaceholder: 'ej. nervio iliohipogástrico, nervio genitofemoral...',
      askButton: 'Preguntar',
      loadingNerves: 'Cargando nervios...',
      errorLoadingNerves: 'No se pudieron cargar los nervios.',
      nerveInjuryHeading: 'Clasificación de Lesiones Nerviosas',
      nerveInjuryHint:
        'Clasificación de Seddon, de la más leve a la más grave — útil para orientar el pronóstico y los tiempos de recuperación.',
      nerveConductionHeading: 'Conducción Nerviosa',
      nerveConductionHint: 'Tipos de fibras nerviosas y sus velocidades de conducción.',
      fiberDiameter: 'Diámetro',
      fiberMyelination: 'Mielinización',
      fiberVelocity: 'Velocidad',
      fiberFunction: 'Función',
      snpConditionsHint:
        'Condiciones del sistema nervioso periférico presentes en la Base de Conocimiento de Phygo. Toca una tarjeta para ver los detalles clínicos.',
      diffuseHeading: 'Trastornos Difusos del SNP',
      diffuseHint:
        'Condiciones que afectan al sistema nervioso periférico de forma difusa o sistémica, no a un solo nervio nombrado. Toca una tarjeta para ver los detalles clínicos.',
      loadingDiffuse: 'Cargando trastornos difusos...',
      errorLoadingDiffuse: 'No se pudieron cargar los trastornos difusos del SNP.',
      pathwaySubTabs: { circuits: 'Vías Nerviosas', gait: 'Patrones de Marcha', localization: 'Localización' },
      pathwayCategoryLabels: { longTracts: 'Vías Largas', brainCircuits: 'Circuitos Cerebrales' },
      gaitHint: 'Reconocer el patrón de marcha ayuda a localizar la lesión neurológica subyacente.',
      localizationHint:
        'Seis principios de razonamiento clínico para localizar una lesión neurológica a partir de los hallazgos del examen físico.',
      zone: {
        badge: 'Zona Neurológica',
        geriatricHeading: 'Principios de Neurología Geriátrica',
        noConditionsLinked: 'Aún no hay condiciones vinculadas a esta zona.',
        backToBrainMap: 'Mapa Cerebral',
        zoneNotFound: 'Zona no encontrada.',
      },
      nerve: {
        backToNeuroMap: 'Volver al mapa neurológico',
        errorLoadingNerve: 'No se pudieron cargar los datos del nervio.',
        anatomyAndCourse: 'Anatomía y trayecto',
        motorFunction: 'Función motora',
        sensoryFunction: 'Función sensitiva',
        compressionSite: 'Sitio típico de compresión/lesión',
        clinicalSign: 'Signo clínico característico',
        linkedConditions: 'Condiciones relacionadas',
        noConditionsLinkedToNerve: 'Aún no hay condiciones vinculadas a este nervio.',
      },
    },
    oncology: {
      atlasBadge: 'Atlas Oncológico',
      heading: 'Oncología',
      subTabs: {
        anatomy: 'Anatomía',
        conditions: 'Patologías',
        treatments: 'Tratamientos',
        assessment: 'Evaluación',
        rehab: 'Rehabilitación',
      },
      anatomyHeading: 'Anatomía Oncológica',
      anatomyHint:
        'Anatomía y drenaje linfático relevantes para comprender los principales cánceres y sus complicaciones de rehabilitación.',
      anatomyIntro:
        'Esta sección parte de los mecanismos biológicos y moleculares por los que una célula normal se transforma en célula tumoral, un paso a menudo pasado por alto pero útil para entender por qué un tumor se comporta como lo hace. A continuación sigue la anatomía del drenaje linfático regional, órgano por órgano: es el mapa más relevante para la práctica fisioterapéutica, ya que gran parte de las complicaciones de rehabilitación posquirúrgicas (sobre todo el linfedema) depende de qué vías linfáticas fueron interrumpidas.',
      conditionsHeading: 'Patologías Relacionadas',
      conditionsHint: 'Patologías oncológicas organizadas por sistema. Toca una tarjeta para ver objetivos, pruebas clínicas, señales de alarma y ejercicios típicos.',
      treatmentsHeading: 'Tratamientos Oncológicos',
      treatmentsHint: 'Vías diagnóstico-terapéuticas por tipo de tumor y modalidades de tratamiento generales, con sus implicaciones fisioterapéuticas.',
      assessmentHeading: 'Evaluación Clínica',
      assessmentHint: 'Escalas de performance status y herramientas de evaluación específicas para el paciente oncológico.',
      rehabHeading: 'Rehabilitación',
      rehabHint: 'Protocolos de manejo del linfedema (incluido el drenaje linfático manual paso a paso), ejercicio en oncología y manejo de complicaciones específicas.',
      loading: 'Cargando...',
      errorLoadingStructures: 'No se pudieron cargar las estructuras anatómicas.',
      errorLoadingConditions: 'No se pudieron cargar las patologías.',
      errorLoadingTests: 'No se pudieron cargar las pruebas de evaluación.',
      errorLoadingRehab: 'No se pudo cargar el contenido de rehabilitación.',
      errorLoadingTreatments: 'No se pudieron cargar los tratamientos.',
      procedureLabel: 'Procedimiento',
      interpretationLabel: 'Interpretación',
      protocolLabel: 'Protocolo',
      ptImplicationsLabel: 'Implicaciones Fisioterapéuticas',
      askPhygoPrompt: '¿No encuentras la patología que buscas? Pregunta a Phygo',
      askPhygoPlaceholder: 'ej. linfoma, melanoma, sarcoma de tejidos blandos...',
      askButton: 'Preguntar',
      regionLabels: {
        'tumor-biology': 'Biología del Tumor',
        'lymphatic-general': 'Sistema Linfático General',
        breast: 'Mama',
        gynecological: 'Ginecológico',
        prostate: 'Próstata',
        bladder: 'Vejiga',
        lung: 'Pulmón',
        brain: 'Cerebro',
        'head-neck': 'Cabeza-Cuello',
        colorectal: 'Colon-Recto',
        systemic: 'Sistémico',
      },
      systemLabels: {
        mammario: 'Cáncer de Mama',
        ginecologico: 'Cánceres Ginecológicos',
        prostatico: 'Cáncer de Próstata',
        vescicale: 'Cáncer de Vejiga',
        'neuro-oncologico': 'Tumores Cerebrales',
        'colon-retto': 'Cáncer Colorrectal',
        polmonare: 'Cáncer de Pulmón',
        'testa-collo': 'Cánceres de Cabeza y Cuello',
        sarcoma: 'Sarcomas',
        ematologico: 'Neoplasias Hematológicas',
        sistemico: 'Complicaciones Sistémicas',
      },
      testCategoryLabels: {
        performance_status: 'Performance Status',
        lymphedema_assessment: 'Evaluación del Linfedema',
        red_flag_screening: 'Detección Previa al Ejercicio',
      },
      rehabCategoryLabels: {
        linfedema: 'Manejo del Linfedema',
        complicanze_specifiche: 'Complicaciones Específicas',
        esercizio: 'Ejercicio en Oncología',
      },
      treatmentCategoryLabels: {
        per_tipo_tumore: 'Vías por Tipo de Tumor',
        diagnostica: 'Diagnóstico y Estadificación',
        chirurgia: 'Cirugía',
        farmacologico: 'Tratamientos Farmacológicos',
        fisico: 'Tratamientos Físicos',
      },
    },
    cardiopulmonary: {
      atlasBadge: 'Atlas Cardiopulmonar',
      heading: 'Cardiopulmonar',
      subTabs: {
        anatomy: 'Anatomía',
        conditions: 'Patologías',
        assessment: 'Evaluación',
        rehab: 'Rehabilitación',
        airwayClearance: 'Desobstrucción',
      },
      anatomyHeading: 'Anatomía Cardiopulmonar',
      anatomyHint: 'Corazón, circulación, aparato respiratorio y mecánica torácica: cómo funcionan como un sistema integrado.',
      anatomyIntro:
        'El sistema cardiorrespiratorio integra la función cardíaca, circulatoria y pulmonar: un compromiso en uno de estos ámbitos casi siempre repercute en los demás. La evaluación fisioterapéutica considera juntos la mecánica torácica, la capacidad de ejercicio y los signos vitales, ya que son estrechamente interdependientes. Las secciones siguientes profundizan en la anatomía cardíaca, el sistema vascular, el aparato respiratorio, la mecánica/cinemática torácica y el concepto clave de VO2máx/reserva cardíaca, que orienta la prescripción del ejercicio.',
      conditionsHeading: 'Patologías Relacionadas',
      conditionsHint: 'Patologías organizadas por sistema. Toca una tarjeta para ver objetivos, pruebas clínicas y ejercicios.',
      assessmentHeading: 'Evaluación Clínica',
      assessmentHint: 'Pruebas clínicas y escalas de evaluación cardiorrespiratoria.',
      rehabHeading: 'Rehabilitación',
      rehabHint: 'Protocolos FITT, manejo post-quirúrgico y específicos para la insuficiencia cardíaca y las patologías respiratorias.',
      airwayHeading: 'Técnicas de Desobstrucción Bronquial',
      airwayHint: 'Drenaje postural, técnicas manuales, PEP, respiración activa, soporte ventilatorio. Toca una tarjeta para ver el procedimiento completo.',
      loading: 'Cargando...',
      errorLoadingStructures: 'No se pudieron cargar las estructuras anatómicas.',
      errorLoadingConditions: 'No se pudieron cargar las patologías.',
      errorLoadingTests: 'No se pudieron cargar las pruebas de evaluación.',
      errorLoadingRehab: 'No se pudo cargar el contenido de rehabilitación.',
      errorLoadingAirway: 'No se pudieron cargar las técnicas de desobstrucción.',
      procedureLabel: 'Procedimiento',
      interpretationLabel: 'Interpretación',
      protocolLabel: 'Protocolo',
      patientPositionLabel: 'Posición del paciente',
      indicationsLabel: 'Indicaciones',
      contraindicationsPrecautionsLabel: 'Contraindicaciones/Precauciones',
      categoryLabels: {
        cardiac: 'Cardíaco',
        circulatory: 'Circulatorio',
        respiratory: 'Respiratorio',
        thoracic_mechanics: 'Mecánica Torácica',
        concept: 'Conceptos Clave',
      },
      systemLabels: {
        cardiac: 'Patologías Cardíacas',
        respiratory: 'Patologías Respiratorias',
        mixed_systemic: 'Patologías Sistémicas/Mixtas',
      },
      testCategoryLabels: {
        functional_capacity: 'Capacidad Funcional',
        dyspnea_scale: 'Escalas de Disnea',
        strength: 'Fuerza',
        vital_signs: 'Signos Vitales',
        consciousness: 'Estado de Consciencia',
      },
      rehabCategoryLabels: {
        aerobic_training: 'Entrenamiento Aeróbico',
        resistance_training: 'Entrenamiento de Fuerza',
        post_surgical: 'Post-Quirúrgico',
        heart_failure: 'Insuficiencia Cardíaca',
        respiratory_specific: 'Específico Respiratorio',
      },
      airwayCategoryLabels: {
        postural_drainage: 'Drenaje Postural',
        manual: 'Técnicas Manuales',
        active_breathing: 'Respiración Activa',
        device_dependent: 'Dispositivos (PEP)',
        machine_dependent: 'Dispositivos Mecánicos',
        ventilation_support: 'Soporte Ventilatorio',
        dyspnoea_technique: 'Técnicas para la Disnea',
      },
      ageGroupLabels: {
        adult: 'Adultos',
        paediatric: 'Pediátrico',
        both: 'Adultos y niños',
      },
    },
    endocrine: {
      atlasBadge: 'Atlas Endocrino',
      heading: 'Sistema Endocrino',
      subTabs: {
        anatomy: 'Anatomía',
        conditions: 'Patologías',
        assessment: 'Evaluación',
        rehab: 'Rehabilitación',
      },
      anatomyHeading: 'Anatomía Endocrina',
      anatomyHint: 'Glándulas, ejes hormonales y conceptos clave: cómo el sistema endocrino regula el metabolismo, el crecimiento y la homeostasis.',
      anatomyIntro:
        'El sistema endocrino coordina la comunicación hormonal entre glándulas y órganos diana, regulando el metabolismo, el crecimiento, la composición corporal, la densidad ósea y la función reproductiva. Una disfunción endocrina suele repercutir en la tolerancia al ejercicio, la fuerza muscular, la salud ósea y el equilibrio, por lo que la evaluación fisioterapéutica está estrechamente ligada al perfil hormonal del paciente. Las siguientes secciones profundizan en las principales glándulas (tiroides, suprarrenal, paratiroides, páncreas endocrino), los ejes hormonales clave (hipotálamo-hipofisario, GH/IGF-1, gonadal) y el papel del hueso como órgano diana y endocrino.',
      conditionsHeading: 'Patologías Relacionadas',
      conditionsHint: 'Las principales endocrinopatías de interés fisioterapéutico. Toca una tarjeta para ver objetivos, pruebas clínicas y ejercicios.',
      assessmentHeading: 'Evaluación Clínica',
      assessmentHint: 'Pruebas hormonales, metabólicas y estructurales relevantes para la evaluación fisioterapéutica del paciente endocrino.',
      rehabHeading: 'Rehabilitación',
      rehabHint: 'Protocolos de salud ósea, prevención de caídas, terapia hormonal sustitutiva, entrenamiento metabólico y apoyo nutricional.',
      loading: 'Cargando...',
      errorLoadingStructures: 'No se pudieron cargar las estructuras anatómicas.',
      errorLoadingConditions: 'No se pudieron cargar las patologías.',
      errorLoadingTests: 'No se pudieron cargar las pruebas de evaluación.',
      errorLoadingRehab: 'No se pudo cargar el contenido de rehabilitación.',
      procedureLabel: 'Procedimiento',
      interpretationLabel: 'Interpretación',
      protocolLabel: 'Protocolo',
      categoryLabels: {
        axis: 'Ejes Hormonales',
        concept: 'Conceptos Clave',
        gland: 'Glándulas',
      },
      testCategoryLabels: {
        hormonal: 'Hormonal',
        metabolic: 'Metabólico',
        structural: 'Estructural',
      },
      rehabCategoryLabels: {
        bone_health: 'Salud Ósea',
        fall_prevention: 'Prevención de Caídas',
        hormone_replacement: 'Terapia Hormonal Sustitutiva',
        metabolic_training: 'Entrenamiento Metabólico',
        nutritional_support: 'Apoyo Nutricional',
      },
    },
    fascia: {
      atlasBadge: 'Atlas de la Fascia',
      heading: 'Fascia',
      subTabs: {
        structures: 'Anatomía',
        function: 'Función',
        treatments: 'Aplicaciones Clínicas',
        rehab: 'Rehabilitación',
      },
      structuresHeading: 'Anatomía y Fisiología de la Fascia',
      structuresHint: 'Estructura, histología, inervación y regulación del sistema fascial — la base para comprender su papel clínico.',
      structuresIntro: 'Esta sección describe la fascia como un órgano sensorial y de transmisión de fuerza por derecho propio: desde su composición histológica hasta su rica inervación mecanorreceptiva y nociceptiva, pasando por los mecanismos hormonales y celulares que regulan sus propiedades a lo largo del tiempo.',
      functionHeading: 'Función Fascial',
      functionHint: 'Biotensegridad, respuesta a la carga, propiedades viscoelásticas y el papel de la fascia en el movimiento y la postura.',
      treatmentsHeading: 'Aplicaciones Clínicas',
      treatmentsHint: 'Enfoques manuales y programas de ejercicio orientados a la fascia, con sus implicaciones fisioterapéuticas y el nivel de evidencia disponible.',
      rehabHeading: 'Rehabilitación',
      rehabHint: 'Protocolos de rehabilitación estructurados para el sistema fascial, con el nivel de evidencia científica disponible para cada enfoque.',
      loading: 'Cargando...',
      errorLoadingStructures: 'No se pudieron cargar los contenidos de anatomía y fisiología.',
      errorLoadingFunction: 'No se pudieron cargar los contenidos sobre la función fascial.',
      errorLoadingTreatments: 'No se pudieron cargar las aplicaciones clínicas.',
      errorLoadingRehab: 'No se pudieron cargar los contenidos de rehabilitación.',
      ptImplicationsLabel: 'Implicaciones Fisioterapéuticas',
      protocolLabel: 'Protocolo',
      askPhygoPrompt: '¿No encuentras lo que buscas sobre la fascia? Pregunta a Phygo',
      askPhygoPlaceholder: 'ej. fascia toracolumbar, cupping, densificación fascial...',
      askButton: 'Preguntar',
      structureCategoryLabels: {
        anatomia_generale: 'Anatomía General',
        istologia: 'Histología',
        innervazione: 'Inervación',
        vascolarizzazione: 'Vascularización',
        regolazione_ormonale: 'Regulación Hormonal',
        contrattilita_miofibroblasti: 'Contractilidad y Miofibroblastos',
        metodi_di_studio: 'Métodos de Estudio',
      },
      functionCategoryLabels: {
        biotensegrita: 'Biotensegridad',
        carico_e_nutrizione: 'Carga y Nutrición',
        capacita_di_allungamento: 'Capacidad de Elongación',
        cammino_e_locomozione: 'Marcha y Locomoción',
        valutazione_posturale: 'Evaluación Postural',
      },
      treatmentCategoryLabels: {
        integrazione_strutturale: 'Integración Estructural',
        terapia_dei_punti_trigger: 'Terapia de Puntos Gatillo',
        manipolazione_fasciale: 'Manipulación Fascial',
        fascial_stretch_therapy: 'Fascial Stretch Therapy',
        gestione_delle_cicatrici: 'Manejo de Cicatrices',
        riabilitazione_oncologica_fasciale: 'Rehabilitación Oncológica',
        auto_trattamento_miofasciale: 'Auto-liberación Miofascial',
        movimento_e_rieducazione_fasciale: 'Movimiento y Reeducación',
      },
      rehabCategoryLabels: {
        post_surgical_scar_management: 'Gestión de Cicatrices Postquirúrgicas',
        progressive_loading: 'Carga Progresiva',
        movement_reeducation: 'Reeducación del Movimiento',
        sports_performance: 'Rendimiento Deportivo',
        chronic_pain_management: 'Gestión del Dolor Crónico',
      },
    },
    urinary: {
      atlasBadge: 'Atlas Urinario',
      heading: 'Sistema Urinario/Renal',
      subTabs: {
        anatomy: 'Anatomía',
        conditions: 'Patologías',
        assessment: 'Evaluación',
        rehab: 'Rehabilitación',
      },
      anatomyHeading: 'Anatomía Renal y Urinaria',
      anatomyHint: 'Riñón, nefrona y tracto urinario inferior: estructura y fisiología de la filtración, la reabsorción y el equilibrio hidroelectrolítico.',
      anatomyIntro:
        'El riñón regula el volumen y la composición de los líquidos corporales mediante la filtración glomerular, la reabsorción y secreción tubular, el sistema renina-angiotensina-aldosterona y el control del equilibrio ácido-base. Un deterioro de la función renal repercute en los electrolitos, la presión arterial, el estado de hidratación y la tolerancia al ejercicio, por lo que la evaluación fisioterapéutica está estrechamente ligada a los parámetros metabólicos y cardiovasculares del paciente. Las secciones siguientes profundizan en la anatomía del riñón y la vejiga, y en los principales procesos fisiológicos —filtración glomerular, función tubular, SRAA, equilibrio hídrico y electrolítico, equilibrio ácido-base— que orientan el manejo clínico y la prescripción del ejercicio.',
      conditionsHeading: 'Patologías Relacionadas',
      conditionsHint: 'Patologías nefrológicas y urológicas relevantes para la práctica fisioterapéutica. Toca una tarjeta para ver objetivos, pruebas clínicas y ejercicios.',
      assessmentHeading: 'Evaluación Clínica',
      assessmentHint: 'Pruebas de función renal, análisis de orina, parámetros metabólicos y diagnóstico por imagen.',
      rehabHeading: 'Rehabilitación',
      rehabHint: 'Prescripción del ejercicio en la enfermedad renal crónica, en diálisis, post-trasplante y en nefrología del deporte.',
      loading: 'Cargando...',
      errorLoadingStructures: 'No se pudieron cargar las estructuras anatómicas.',
      errorLoadingConditions: 'No se pudieron cargar las patologías.',
      errorLoadingTests: 'No se pudieron cargar las pruebas de evaluación.',
      errorLoadingRehab: 'No se pudo cargar el contenido de rehabilitación.',
      procedureLabel: 'Procedimiento',
      interpretationLabel: 'Interpretación',
      protocolLabel: 'Protocolo',
      categoryLabels: {
        organ: 'Órgano',
        physiology: 'Fisiología',
      },
      testCategoryLabels: {
        imaging: 'Diagnóstico por Imagen',
        metabolic: 'Metabólico',
        renal_function: 'Función Renal',
        urinalysis: 'Análisis de Orina',
      },
      rehabCategoryLabels: {
        renal_training: 'Entrenamiento en Nefropatía',
        sports_nephrology: 'Nefrología del Deporte',
      },
    },
    physiology: {
      atlasBadge: 'Atlas de Fisiología',
      heading: 'Fisiología Fundamental',
      systemTabs: { muscular: 'Muscular', neurological: 'Neurológico', cellular: 'Celular' },
      sectionHint: 'Los mecanismos fisiológicos que sustentan el movimiento y el sistema nervioso — no la anatomía de una zona específica, sino cómo funcionan realmente los tejidos y circuitos subyacentes, con su relevancia clínica para la práctica fisioterapéutica.',
      loading: 'Cargando...',
      errorLoading: 'No se pudo cargar el contenido de fisiología.',
      clinicalRelevanceLabel: 'Relevancia Clínica',
      categoryLabels: {
        contraction_mechanics: 'Mecanismos de Contracción',
        fiber_types: 'Tipos de Fibras',
        mechanics: 'Mecánica Muscular',
        motor_control: 'Control Motor',
        exercise_adaptation: 'Adaptación al Ejercicio',
        neuromuscular: 'Unión Neuromuscular',
        smooth_cardiac: 'Músculo Liso y Cardíaco',
        cellular_basics: 'Fisiología Celular',
        reflexes: 'Reflejos',
        sensory: 'Sistemas Sensoriales',
        plasticity: 'Plasticidad y Aprendizaje',
        autonomic: 'Sistema Nervioso Autónomo',
        membrane_transport: 'Transporte de Membrana',
        chemical_messengers: 'Mensajeros Químicos',
        homeostasis: 'Homeostasis y Control',
        energy_metabolism: 'Metabolismo Energético',
      },
    },
    sportsMedicine: {
      atlasBadge: 'Atlas de Medicina Deportiva',
      heading: 'Medicina Deportiva',
      sectionHint: 'La ciencia fundamental de la lesión deportiva y la recuperación — clasificación, curación tisular, razonamiento clínico y modalidades terapéuticas, con las guías más actuales para un retorno al deporte seguro y eficaz.',
      loading: 'Cargando...',
      errorLoading: 'No se pudo cargar el contenido de medicina deportiva.',
      clinicalRelevanceLabel: 'Relevancia Clínica',
      categoryLabels: {
        injury_classification: 'Clasificación de Lesiones',
        tissue_healing: 'Curación Tisular',
        clinical_reasoning: 'Razonamiento Clínico',
        therapeutic_modalities: 'Modalidades Terapéuticas',
        on_field_emergency_rtp: 'Emergencia en Campo y Retorno al Deporte',
        rehabilitation_programming: 'Programación de la Rehabilitación',
      },
    },
    librarySearchPlaceholder: 'Buscar en esta sección...',
    librarySearchNoResults: 'No se han encontrado resultados para tu búsqueda.',
    gastrointestinal: {
      atlasBadge: 'Atlas Gastrointestinal',
      heading: 'Sistema Gastrointestinal',
      subTabs: {
        anatomy: 'Anatomía',
        conditions: 'Patologías',
        assessment: 'Evaluación',
        rehab: 'Rehabilitación',
      },
      anatomyHeading: 'Anatomía Gastrointestinal',
      anatomyHint: 'Motilidad del tracto digestivo, estómago, intestino delgado, hígado, páncreas exocrino, colon y microbiota: cómo funcionan como sistema integrado.',
      anatomyIntro:
        'El sistema gastrointestinal integra motilidad, secreción, digestión y absorción a lo largo de todo el tracto digestivo: una disfunción en un tramo (por ejemplo motora a nivel gástrico o inflamatoria a nivel colónico) suele repercutir en la nutrición, la energía disponible para el ejercicio y la tolerancia al esfuerzo. La evaluación fisioterapéutica en el ámbito gastrointestinal considera la historia clínica digestiva, los estudios de laboratorio y funcionales disponibles, y el impacto de la patología sobre la capacidad de ejercicio y la calidad de vida. Las secciones siguientes profundizan en el tracto digestivo en su conjunto, los órganos individuales (estómago, intestino delgado, hígado, páncreas, colon) y el eje intestino-músculo mediado por la microbiota, central para la prescripción de ejercicio en estos pacientes.',
      conditionsHeading: 'Patologías Relacionadas',
      conditionsHint: 'Las principales condiciones gastrointestinales relevantes para la práctica fisioterapéutica. Toca una tarjeta para ver objetivos, pruebas clínicas y ejercicios.',
      assessmentHeading: 'Evaluación Clínica',
      assessmentHint: 'Análisis de sangre, marcadores fecales, serología, pruebas funcionales, imagen y endoscopia útiles para valorar al paciente gastroenterológico.',
      rehabHeading: 'Rehabilitación',
      rehabHint: 'Protocolos de ejercicio terapéutico para enfermedad inflamatoria intestinal, hepatopatías crónicas, cirugía bariátrica, ostomías y deportes de resistencia.',
      loading: 'Cargando...',
      errorLoadingStructures: 'No se pudieron cargar las estructuras anatómicas.',
      errorLoadingConditions: 'No se pudieron cargar las patologías.',
      errorLoadingTests: 'No se pudieron cargar las pruebas de evaluación.',
      errorLoadingRehab: 'No se pudieron cargar los contenidos de rehabilitación.',
      procedureLabel: 'Procedimiento',
      interpretationLabel: 'Interpretación',
      protocolLabel: 'Protocolo',
      categoryLabels: {
        organ: 'Órganos',
        system_overview: 'Panorama del Sistema',
      },
      testCategoryLabels: {
        blood_panel: 'Panel Sanguíneo',
        endoscopy: 'Endoscopia',
        functional_test: 'Pruebas Funcionales',
        imaging: 'Imagenología',
        serology: 'Serología',
        stool_marker: 'Marcadores Fecales',
      },
      rehabCategoryLabels: {
        chronic_disease_management: 'Manejo de Enfermedades Crónicas',
        gi_disease_management: 'Manejo de Patologías Gastrointestinales',
        post_surgical: 'Post-Quirúrgico',
        sports_nutrition: 'Nutrición Deportiva',
      },
    },
    immune: {
      atlasBadge: 'Atlas del Sistema Inmunitario',
      heading: 'Sistema Inmunitario',
      subTabs: {
        anatomy: 'Anatomía',
        conditions: 'Patologías',
        assessment: 'Evaluación',
        rehab: 'Rehabilitación',
      },
      anatomyHeading: 'Anatomía del Sistema Inmunitario',
      anatomyHint: 'Órganos linfoides primarios y secundarios, drenaje linfático periférico y las tres líneas de defensa inmunitaria.',
      anatomyIntro:
        'El sistema inmunitario integra órganos linfoides primarios (médula ósea y timo), donde maduran las células inmunitarias, y órganos linfoides secundarios (ganglios linfáticos, bazo, MALT), donde se desencadena la respuesta inmunitaria. El drenaje linfático periférico transporta líquido, antígenos y células inmunitarias hacia estos órganos, mientras que la inmunidad innata, humoral y celular representan las tres formas en que el organismo reconoce y neutraliza las amenazas. Una alteración en cualquiera de estos componentes —por enfermedad, fármacos inmunosupresores o sobreentrenamiento— repercute directamente en la capacidad del organismo para responder a infecciones, inflamación crónica y ejercicio físico.',
      conditionsHeading: 'Patologías Relacionadas',
      conditionsHint: 'Condiciones inmunitarias, autoinmunes y posinfecciosas. Toca una tarjeta para ver objetivos, pruebas clínicas y ejercicios.',
      assessmentHeading: 'Evaluación Clínica',
      assessmentHint: 'Pruebas hematológicas, inmunológicas y marcadores inflamatorios utilizados en la evaluación fisioterapéutica.',
      rehabHeading: 'Rehabilitación',
      rehabHint: 'Dosificación del ejercicio, precauciones en inmunosupresión, manejo del linfedema y rehabilitación posviral.',
      loading: 'Cargando...',
      errorLoadingStructures: 'No se pudieron cargar las estructuras anatómicas.',
      errorLoadingConditions: 'No se pudieron cargar las patologías.',
      errorLoadingTests: 'No se pudieron cargar las pruebas de evaluación.',
      errorLoadingRehab: 'No se pudo cargar el contenido de rehabilitación.',
      procedureLabel: 'Procedimiento',
      interpretationLabel: 'Interpretación',
      protocolLabel: 'Protocolo',
      categoryLabels: {
        cell_mediated_immunity: 'Inmunidad Celular',
        humoral_immunity: 'Inmunidad Humoral',
        innate_immunity: 'Inmunidad Innata',
        lymphatic_drainage: 'Drenaje Linfático',
        primary_lymphoid_organ: 'Órganos Linfoides Primarios',
        secondary_lymphoid_organ: 'Órganos Linfoides Secundarios',
      },
      testCategoryLabels: {
        functional: 'Pruebas Funcionales',
        hematologic: 'Hematológico',
        immunologic: 'Inmunológico',
        inflammatory_marker: 'Marcadores Inflamatorios',
      },
      rehabCategoryLabels: {
        exercise_immunology: 'Inmunología del Ejercicio',
        immunosuppression_precautions: 'Precauciones en Inmunosupresión',
        inflammatory_arthritis_training: 'Entrenamiento en Artritis Inflamatorias',
        lymphedema_management: 'Manejo del Linfedema',
        post_viral_rehabilitation: 'Rehabilitación Posviral',
      },
    },
    hematology: {
      atlasBadge: 'Atlas Hematológico',
      heading: 'Sangre / Hematología',
      subTabs: {
        anatomy: 'Anatomía',
        conditions: 'Patologías',
        assessment: 'Evaluación',
        rehab: 'Rehabilitación',
      },
      anatomyHeading: 'Anatomía y Fisiología de la Sangre',
      anatomyHint: 'Líneas celulares, plasma, hemoglobina y hemostasia: los componentes y procesos que regulan el transporte de oxígeno, la defensa inmunitaria y la coagulación.',
      anatomyIntro:
        'La sangre es un tejido conectivo líquido con funciones de transporte (oxígeno, nutrientes, hormonas), defensa inmunitaria y hemostasia. El componente celular (eritrocitos, leucocitos, plaquetas) y el componente plasmático trabajan en equilibrio dinámico: una alteración de la serie roja, de la cascada de coagulación o de la composición del plasma repercute directamente en la tolerancia al esfuerzo y en la seguridad del ejercicio terapéutico. Las siguientes secciones profundizan en eritrocitos y eritropoyesis, leucocitos, plasma, hemoglobina/transporte de oxígeno y hemostasia/coagulación.',
      conditionsHeading: 'Patologías Relacionadas',
      conditionsHint: 'Patologías hematológicas de interés fisioterapéutico. Toca una tarjeta para ver objetivos, pruebas clínicas y ejercicios.',
      assessmentHeading: 'Evaluación Clínica',
      assessmentHint: 'Pruebas de laboratorio y evaluaciones hematológicas relevantes para la práctica fisioterapéutica.',
      rehabHeading: 'Rehabilitación',
      rehabHint: 'Prescripción del ejercicio, prevención del tromboembolismo venoso, precauciones en terapia anticoagulante y protocolos específicos por condición.',
      loading: 'Cargando...',
      errorLoadingStructures: 'No se pudieron cargar las estructuras hematológicas.',
      errorLoadingConditions: 'No se pudieron cargar las patologías.',
      errorLoadingTests: 'No se pudieron cargar las pruebas de evaluación.',
      errorLoadingRehab: 'No se pudo cargar el contenido de rehabilitación.',
      procedureLabel: 'Procedimiento',
      interpretationLabel: 'Interpretación',
      protocolLabel: 'Protocolo',
      categoryLabels: {
        cell_line: 'Líneas Celulares',
        fluid: 'Componente Líquido',
        molecule: 'Moléculas',
        process: 'Procesos',
      },
      testCategoryLabels: {
        coagulation: 'Coagulación',
        diagnostic: 'Diagnóstico',
        general: 'Pruebas Generales',
        metabolic: 'Metabólico',
      },
      rehabCategoryLabels: {
        condition_specific: 'Específico por Condición',
        exercise_prescription: 'Prescripción del Ejercicio',
        post_surgical: 'Post-Quirúrgico',
        precaution_protocol: 'Protocolos de Precaución',
      },
    },
    clinicalToolkit: {
      badge: 'Herramientas Clínicas',
      headingAccent: 'Toolkit',
      headingRest: 'Clínico',
      subtitle: 'Escalas validadas, pruebas clínicas y protocolos de tratamiento reunidos en un único espacio de trabajo profesional.',
      tabLabels: {
        functional: 'Escalas Funcionales',
        orthopedic: 'Pruebas Ortopédicas',
        pelvicFloor: 'Suelo Pélvico',
        neuro: 'Neurología',
        manualTherapy: 'Terapia Manual',
        metabolic: 'Metabólico',
      },
      manualTherapy: {
        mulliganPrinciplesHeading: 'Principios Fundamentales del Concepto Mulligan',
        mulliganPrinciplesHint: 'El marco teórico (PILL, CROCKS, Disfunción Específica) que guía la aplicación de todas las técnicas MWM presentes en las regiones siguientes.',
        closeLabel: 'Cerrar',
        readLabel: 'Leer',
        loadingTechniques: 'Cargando técnicas...',
        errorLoadingTechniques: 'No se pudieron cargar las técnicas de terapia manual.',
        noTechniquesFound: 'No se encontraron técnicas para esta región.',
        patientPositionLabel: 'Posición del paciente',
        directionLabel: 'Dirección',
        indicationsLabel: 'Indicaciones',
        procedureLabel: 'Procedimiento',
        regionLabels: {
          'ATM': 'ATM',
          'Colonna Cervicale': 'Columna Cervical',
          'Colonna Toracica': 'Columna Torácica',
          'Colonna Lombare e Pelvi': 'Columna Lumbar y Pelvis',
          'Spalla': 'Hombro',
          'Gomito': 'Codo',
          'Polso e Mano': 'Muñeca y Mano',
          'Anca': 'Cadera',
          'Ginocchio': 'Rodilla',
          'Caviglia': 'Tobillo',
          'Piede': 'Pie',
        },
        typeLabels: {
          all: 'Todas',
          mobilization: 'Movilización',
          manipulation: 'Manipulación',
          thrust: 'Thrust',
          nonthrust: 'Non-thrust',
          mwm: 'MWM (Mulligan)',
          prp: 'PRP (Mulligan)',
        },
      },
      orthopedic: {
        regionLabels: {
          knee: 'Rodilla',
          shoulder: 'Hombro',
          hip: 'Cadera',
          spine: 'Columna Lumbar',
          ankle: 'Tobillo/Pie',
          'elbow-wrist': 'Codo/Muñeca',
          cervical: 'Columna Cervical',
        },
        procedureLabel: 'Procedimiento',
        positiveLabel: 'Positivo si',
        loading: 'Cargando pruebas...',
        errorLoadingTests: 'No se pudieron cargar las pruebas ortopédicas.',
      },
      pelvicFloor: {
        questionnaireCalloutHeading: 'Cuestionario Anamnésico Interactivo',
        questionnaireCalloutDescription: 'Recogida estructurada de la anamnesis intestinal, urinaria y del dolor pélvico, con un resumen final organizado por área.',
        startQuestionnaireLabel: 'Iniciar Cuestionario',
        loading: 'Cargando pruebas...',
        errorLoadingTests: 'No se pudieron cargar las pruebas del suelo pélvico.',
        categoryLabels: {
          neuropathy: 'Pruebas Neuropáticas',
          manual_assessment: 'Evaluación Manual',
          urodynamic: 'Pruebas Urodinámicas',
          questionnaire: 'Cuestionarios',
          symptom_questionnaire: 'Cuestionarios Sintomáticos',
        },
        procedureLabel: 'Procedimiento',
        interpretationLabel: 'Interpretación',
        fillQuestionnaireLabel: 'Rellenar el cuestionario',
        hideQuestionnaireLabel: 'Ocultar cuestionario',
        fillableBadge: 'Rellenable',
        loadingQuestionnaireContent: 'Cargando cuestionario...',
        sf36: {
          domainLabels: {
            PF: 'Función Física',
            RP: 'Limitaciones de Rol — Físico',
            RE: 'Limitaciones de Rol — Emocional',
            VT: 'Vitalidad/Energía',
            MH: 'Salud Mental',
            SF: 'Función Social',
            BP: 'Dolor Corporal',
            GH: 'Salud General',
          },
          scoreHeader: 'Puntuaciones por dominio (0-100, más alto = mejor estado de salud percibido) — {answered}/{total} preguntas completadas',
          responsesLabel: 'respuestas',
        },
        pfdi: {
          subscaleLabels: {
            POPDI: 'Prolapso de Órganos Pélvicos (POPDI-6)',
            CRADI: 'Colorrectal-Anal (CRADI-8)',
            UDI: 'Urinario (UDI-6)',
          },
          scoreHeader: 'Puntuaciones por subescala (0-100, más alto = mayor malestar) — {answered}/{total} preguntas completadas',
          responsesLabel: 'respuestas',
          severityLabels: {
            minimal: 'Síntomas mínimos',
            moderate: 'Malestar moderado',
            severe: 'Malestar severo',
          },
        },
        iciq: {
          severityPrefix: 'Severidad',
          severityLabels: {
            mild: 'Leve',
            moderate: 'Moderado',
            severe: 'Severo',
            verySevere: 'Muy severo',
          },
        },
      },
      neuro: {
        calloutHeading: 'Examen Neurológico Objetivo',
        calloutDescription: 'Examen clínico multi-paso: nervios craneales, reflejos, signos patológicos, sensibilidad, fuerza muscular, coordinación, equilibrio y marcha, con un resumen final.',
        startExamLabel: 'Iniciar Examen',
        loading: 'Cargando pruebas...',
        errorLoadingTests: 'No se pudieron cargar las pruebas neurológicas.',
        categoryLabels: {
          cranial_nerves: 'Nervios Craneales',
          reflexes: 'Reflejos',
          sensation: 'Sensibilidad',
          strength: 'Fuerza Muscular',
          coordination: 'Coordinación',
          balance_gait: 'Equilibrio y Marcha',
        },
        procedureLabel: 'Procedimiento',
        interpretationLabel: 'Interpretación',
      },
      functional: {
        loading: 'Cargando contenido...',
        errorLoadingScales: 'No se pudieron cargar las escalas funcionales.',
        yesLabel: 'Sí',
        noLabel: 'No',
        secondsUnit: 'segundos',
        secondsMax120Unit: 'segundos (máx 120)',
        metersUnit: 'metros',
        groupLabels: {
          balanceFalls: 'Equilibrio y Riesgo de Caída',
          adl: 'Autonomía en las Actividades Diarias',
          cognitiveConsciousness: 'Estado Cognitivo y de Consciencia',
          painTone: 'Dolor y Tono Muscular',
          aerobicQol: 'Capacidad Aeróbica y Calidad de Vida',
          strokeNeurodegenerative: 'Ictus y Enfermedades Neurodegenerativas',
          upperLimb: 'Miembro Superior',
          orthopedics: 'Ortopedia y Recuperación Postquirúrgica',
          trunkGlobalDisability: 'Control del Tronco y Discapacidad Global',
        },
      },
    },
    metabolicCalculator: {
      badge: 'Calculadora Metabólica',
      heading: 'Perfil Metabólico',
      subtitle: 'Estima el gasto energético y el reparto de macronutrientes en menos de un minuto.',
      disclaimer: 'Estos valores son estimaciones con fines informativos y de planificación, y no sustituyen el asesoramiento médico o nutricional individualizado.',
      sexLabel: 'Sexo',
      sexOptions: { male: 'Hombre', female: 'Mujer' },
      ageLabel: 'Edad',
      weightLabel: 'Peso (kg)',
      heightLabel: 'Altura (cm)',
      activityLabel: 'Nivel de Actividad',
      activityLevels: {
        sedentary: 'Sedentario',
        light: 'Ligeramente Activo',
        moderate: 'Moderadamente Activo',
        very: 'Muy Activo',
        extreme: 'Extremadamente Activo',
      },
      bodyFatLabel: 'Grasa Corporal (%)',
      bodyFatOptionalHint: 'Opcional — si se indica, la estimación usa tu masa magra real en lugar de una media estadística.',
      goalLabel: 'Objetivo',
      goals: {
        maintain: 'Mantenimiento',
        fat_loss: 'Pérdida de Grasa',
        muscle_gain: 'Ganancia Muscular',
        performance: 'Rendimiento',
      },
      macroStrategyLabel: 'Estrategia de Macros',
      macroStrategies: {
        balanced: 'Equilibrada',
        high_protein: 'Alta en Proteína',
        high_carb: 'Alta en Carbohidratos',
        low_carb: 'Baja en Carbohidratos',
        custom: 'Personalizada',
      },
      calculateCta: 'Calcular',
      recalculateCta: 'Recalcular',
      invalidInputWarning: 'Comprueba los datos introducidos: algunos valores parecen fuera de un rango plausible.',
      resultsHeading: 'Tu Perfil Metabólico',
      bmrLabel: 'Metabolismo Basal (BMR)',
      tdeeLabel: 'Gasto Energético Total (TDEE)',
      bmiLabel: 'IMC',
      bmiCategories: {
        underweight: 'Bajo Peso',
        normal: 'Peso Normal',
        overweight: 'Sobrepeso',
        obese: 'Obesidad',
      },
      leanBodyMassLabel: 'Masa Magra Estimada',
      fatMassLabel: 'Masa Grasa Estimada',
      estimateNote: 'Una estimación, no una medición clínica exacta.',
      calorieTargetLabel: 'Objetivo Calórico Diario',
      calorieScenariosHeading: 'Escenarios Calóricos',
      kcalPerDaySuffix: 'kcal/día',
      macronutrientsHeading: 'Macronutrientes',
      proteinLabel: 'Proteína',
      carbsLabel: 'Carbohidratos',
      fatLabel: 'Grasas',
      perKgSuffix: 'g/kg',
      editMacrosCta: 'Editar Porcentajes',
      doneEditingCta: 'Listo',
      saveCta: 'Guardar en Perfil',
      saveToPatientCta: 'Guardar en Paciente',
      selectPatientPrompt: 'Selecciona un paciente',
      savedConfirmation: 'Guardado',
      historyHeading: 'Historial Metabólico',
      noHistoryYet: 'Aún no hay perfiles guardados.',
      todaysTargetHeading: 'Objetivo de Hoy',
      activityLevelLabel: 'Nivel de Actividad',
      printCta: 'Exportar PDF',
      printedForLabel: 'Perfil de',
      printedOnLabel: 'Generado el',
      adaptiveBadge: 'Phygo Adapt',
      adaptiveHeading: 'Tu TDEE Real',
      adaptiveExplain: 'Calculado a partir de tu tendencia de peso realmente registrada — más fiable que la sola fórmula, porque se basa en lo que realmente ha ocurrido, no solo en una estimación estadística.',
      adaptiveDeltaAbove: 'Tu metabolismo real parece más alto de lo estimado: {value} kcal/día más.',
      adaptiveDeltaBelow: 'Tu metabolismo real parece más bajo de lo estimado: {value} kcal/día menos.',
      adaptiveDeltaMatch: 'Tu metabolismo real coincide con la estimación calculada.',
      adaptiveBasedOn: 'Basado en {days} días y {entries} registros.',
      adaptiveNotEnoughData: 'Sigue guardando tus datos: con al menos dos registros separados por 10+ días, Phygo calibrará tu TDEE real según tu tendencia de peso efectiva.',
      goalWeightLabel: 'Peso Objetivo (kg)',
      goalWeightPlaceholder: 'p. ej. 70',
      goalWeightHint: 'Introduce un peso objetivo para ver una estimación de cuándo podrías alcanzarlo, según tu ritmo real.',
      projectionHeading: 'Estimación del Objetivo',
      projectionAchievable: 'A tu ritmo actual, podrías alcanzar tu objetivo en unos {days} días (~{date}).',
      projectionWrongDirection: 'Tu tendencia de peso actual se mueve en dirección opuesta a este objetivo.',
      projectionNoProgress: 'Tu peso se ha mantenido estable en el periodo observado: aún no hay suficiente movimiento para estimar una fecha.',
      weightTrendHeading: 'Evolución del Peso',
      foodExamplesCta: 'Ejemplos de Alimentos',
      hideFoodExamplesCta: 'Ocultar Ejemplos de Alimentos',
      foodExamplesDisclaimer: 'Valores generales e indicativos, no específicos de un producto o marca — una referencia para hacerte una idea, no un plan de comidas.',
      perHundredGramsSuffix: '/100g',
    },
    myPhygoLife: {
      badge: 'Phygo Life',
      heading: 'Tu Vida, Monitorizada',
      subtitle: 'Herramientas para cuidarte cada día, más allá de las sesiones con tu fisioterapeuta.',
      metabolicCardTitle: 'Perfil Metabólico',
      metabolicCardSubtitle: 'Descubre tu necesidad calórica y el reparto ideal de proteínas, carbohidratos y grasas.',
      backToHome: 'Volver al Inicio',
      noProfileYet: 'Aún no has calculado tu perfil metabólico.',
      startCalculatorCta: 'Calcula Tu Perfil',
      recalculatePrompt: '¿Quieres actualizar tus datos?',
      scaleReminderHeading: '¿No tienes báscula? Aquí tienes nuestras recomendaciones.',
      scaleReminderCta: 'Ver básculas recomendadas',
    },
    neuroExam: {
      backToClinicalToolkit: 'Volver a Clinical Toolkit',
      badge: 'Examen Objetivo',
      heading: 'Examen Neurológico',
      sectionCounterSeparator: 'de',
      backButton: 'Atrás',
      nextButton: 'Siguiente',
      viewSummaryButton: 'Ver Resumen',
      editAnswersButton: 'Editar respuestas',
      finishButton: 'Concluir',
      summaryHeading: 'Resumen del Examen Neurológico',
      loading: 'Cargando...',
      errorLoading: 'No se pudo cargar el contenido del examen.',
      sections: {
        consciousness: 'Estado de Vigilancia y Conciencia',
        cortical_functions: 'Funciones Corticales Superiores',
        stance_gait: 'Bipedestación y Marcha',
        strength_tone: 'Fuerza, Trofismo y Tono Muscular',
        reflexes: 'Reflejos Osteotendinosos y Superficiales',
        sensation: 'Sensibilidad',
        cerebellar: 'Pruebas Cerebelosas',
        cranial_nerves: 'Nervios Craneales',
        involuntary_movements: 'Movimientos Involuntarios',
        meningeal_signs: 'Signos Meníngeos',
      },
    },
    patients: {
      eyebrow: 'Dashboard',
      greetingMorning: 'Buenos días',
      greetingAfternoon: 'Buenas tardes',
      greetingEvening: 'Buenas noches',
      greetingDefault: 'Bienvenido/a de nuevo',
      subtitle: 'Aquí está tu lista de pacientes',
      newPatient: 'Nuevo paciente',
      cancel: 'Cancelar',
      statPatients: 'Pacientes',
      statNotesThisMonth: 'Notas este mes',
      statActivePlans: 'Planes activos',
      searchPlaceholder: 'Buscar pacientes por nombre...',
      formNameLabel: 'Nombre',
      formGenderLabel: 'Género',
      genderMale: 'Masculino',
      genderFemale: 'Femenino',
      genderNotSpecified: 'No especificado',
      formAgeLabel: 'Edad',
      formConditionLabel: 'Condición principal',
      savingButton: 'Guardando...',
      savePatientButton: 'Guardar paciente',
      noPatientsYet: 'Aún no hay pacientes. Añade uno para empezar.',
      noPatientsMatch: 'Ningún paciente coincide con "{search}".',
      yearsOld: '{age} años',
      patientNotFound: 'Paciente no encontrado.',
      portalActive: 'Portal activo',
      scheduleButton: 'Agenda',
      generateNewNoteButton: 'Generar nueva nota',
      generatingInvite: 'Generando...',
      inviteToPortalButton: 'Invitar al portal',
      resetPortalAccess: 'Restablecer acceso al portal',
      resetPortalConfirm: 'Esto desconectará la cuenta actual del portal de {name}. Necesitará un nuevo enlace de invitación para volver a iniciar sesión. ¿Continuar?',
      inviteReadyHeading: 'Enlace de invitación listo — válido 7 días',
      inviteShareText: 'Comparte esto con {name} para que pueda acceder a su portal My Phygo.',
      copied: 'Copiado',
      copyButton: 'Copiar',
      inviteError: 'No se pudo crear la invitación. Inténtalo de nuevo.',
      statSessions: 'Sesiones',
      statLastSession: 'Última sesión',
      statPatientSince: 'Paciente desde',
      statLinkedItems: 'Elementos vinculados',
      noteHistoryHeading: 'Historial de notas',
      noNotesYet: 'Aún no hay notas para este paciente.',
      generateFirstNote: 'Genera la primera nota de sesión para iniciar su historial.',
      noAssessmentRecorded: 'No se registró ninguna evaluación.',
      treatmentPlanHeading: 'Plan de tratamiento y referencias clínicas',
      nothingLinkedYet: 'Todavía nada vinculado a {name}.',
      treatmentPlanHint: 'Usa "Añadir al Plan de Tratamiento" / "Usar con Paciente" en cualquier parte de Mapa Corporal, Neurología, Cardiopulmonar, Oncología o Terapia Manual para construir aquí su historial.',
      noteHistorySubtitle: 'Cronología completa de las sesiones clínicas registradas',
      treatmentPlanSubtitle: 'Pruebas, cuestionarios, ejercicios y referencias clínicas asignadas al plan de cuidado',
      openReferenceHint: 'Abrir',
      removeTitle: 'Eliminar',
      refTypeExercise: 'Ejercicio / Técnica',
      refTypeClinicalTest: 'Prueba Clínica',
      refTypeQuestionnaire: 'Cuestionario',
      refTypeCondition: 'Condición',
      refTypeBodyZone: 'Zona Corporal',
      refTypeProduct: 'Producto',
      refTypeMetabolicProfile: 'Perfil Metabólico',
      sinceToday: 'Hoy',
      since1Day: '1 día',
      sinceDays: '{days} días',
      since1Month: '1 mes',
      sinceMonths: '{months} meses',
      since1Year: '1 año',
      sinceYears: '{years} años',
      backToPatientName: 'Volver a {name}',
      sessionNoteTab: 'Nota de Sesión',
      videoCallTab: 'Videollamada',
      noteSavedMessage: 'Nota guardada en el registro de {name}.',
      nutritionHeading: 'Nutrición y perfil metabólico',
      nutritionSubtitle: 'Necesidad calórica, macronutrientes y evolución del peso en el tiempo',
      nutritionEmpty: 'Aún no se ha calculado ningún perfil metabólico para {name}.',
      nutritionEmptyHint: 'Calcula un primer perfil desde la Calculadora Metabólica en Herramientas Clínicas para empezar a seguir su evolución aquí.',
      weightTrendHeading: 'Evolución del Peso',
      latestProfileLabel: 'Último perfil',
      newCalculationCta: 'Nuevo Cálculo',
      viewFullCalculatorCta: 'Abrir en la Calculadora',
    },
    pelvicFloorAnamnesis: {
      backToPelvicFloor: 'Volver al Suelo Pélvico',
      badge: 'Cuestionario Anamnésico',
      heading: 'Evaluación del Suelo Pélvico',
      sectionCounterSeparator: 'de',
      backButton: 'Atrás',
      nextButton: 'Siguiente',
      viewSummaryButton: 'Ver Resumen',
      editAnswersButton: 'Editar respuestas',
      finishButton: 'Finalizar',
      summaryHeading: 'Resumen Anamnésico',
      loading: 'Cargando...',
      errorLoading: 'No se pudo cargar el contenido del cuestionario.',
    },
    firstAid: {
      badge: 'Atlas de Primeros Auxilios',
      heading: 'Primeros Auxilios',
      subtitle: 'Protocolos comparados entre Italia, Francia, Reino Unido, España y EE. UU. — porque las pautas no siempre son las mismas en todas partes.',
      infoBox: 'Cada ficha muestra, para cada país, el número de emergencia a llamar, el organismo sanitario de referencia, el protocolo práctico a seguir y la fuente oficial consultada — para poder pasar rápidamente de un país a otro sin perder precisión.',
      allFilter: 'Todos',
      loadingTopics: 'Cargando temas...',
      errorLoadingTopics: 'No se pudieron cargar los temas de primeros auxilios.',
      backToTopics: 'Todos los temas',
      errorLoadingTopic: 'No se pudo cargar este tema de primeros auxilios.',
      emergencyNumberLabel: 'Número de emergencia: ',
      governingBodyLabel: 'Organismo de referencia: ',
      protocolLabel: 'Protocolo',
      notesLabel: 'Notas sobre las diferencias',
      sourceLabel: 'Fuente: ',
      categoryLabels: {
        rianimazione: 'Reanimación',
        neurologico: 'Neurológico',
        cardiovascolare: 'Cardiovascular',
        allergologico: 'Alérgico',
        trauma: 'Trauma',
        ambientale: 'Ambiental',
        tossicologico: 'Toxicológico',
        organizzazione: 'Organización',
      },
      countryLabels: {
        Italia: 'Italia',
        Francia: 'Francia',
        'Regno Unito': 'Reino Unido',
        Spagna: 'España',
        USA: 'EE. UU.',
      },
    },
    bls: {
      badge: 'BLSD',
      heading: 'Basic Life Support',
      subtitle: 'RCP, DEA y desobstrucción de la vía aérea — verificado con las directrices AHA 2025 (American Heart Association).',
      infoBox: 'El SVB-D (Soporte Vital Básico con Desfibrilación) es el conjunto de maniobras básicas de soporte vital — reanimación cardiopulmonar, uso del desfibrilador y desobstrucción de la vía aérea — que todo profesional sanitario debería poder realizar de forma autónoma antes de la llegada del soporte avanzado. Cada ficha a continuación muestra el procedimiento completo, los parámetros técnicos clave (frecuencia, profundidad, relación compresión-ventilación) y las precauciones específicas por grupo de edad, junto con los cambios introducidos por las directrices más recientes.',
      errorLoading: 'No se pudieron cargar los procedimientos de SVB-D.',
      positionLabel: 'Posición',
      procedureLabel: 'Procedimiento',
      keyParametersLabel: 'Parámetros Clave',
      precautionsLabel: 'Precauciones',
      evidenceLabel: 'Evidencia',
      categoryLabels: {
        adult_cpr: 'RCP Adulto',
        child_cpr: 'RCP Pediátrica',
        infant_cpr: 'RCP Infantil',
        choking: 'Obstrucción de la Vía Aérea',
        aed: 'DEA',
        team_dynamics: 'Dinámica de Equipo',
      },
    },
    bodyMap: {
      badge: 'Mapa Corporal 3D Interactivo',
      calibrationBadge: 'Modo Calibración — toca el modelo',
      heading: 'Anatomical Navigator',
      subtitle: 'Gira, amplía y explora el modelo anatómico 3D — toca una zona para abrir sus condiciones, pruebas y protocolos.',
      legendMuscleZones: 'Zonas musculares',
      legendBoneZones: 'Zonas óseas (rayos X)',
      legendDragScroll: 'Arrastra para girar, desplázate para el zoom',
      howItWorks: {
        clickZone: {
          label: 'Toca una zona',
          text: 'Cada región resaltada abre su propia página dedicada: anatomía, biomecánica, pruebas clínicas y protocolos de rehabilitación.',
        },
        xray: {
          label: 'Activa los rayos X',
          text: 'Cambia al modo esquelético para explorar 14 grupos óseos, junto con sus fracturas y patologías más frecuentes.',
        },
        search: {
          label: 'Busca una zona',
          text: 'Para las zonas pequeñas (muñeca, tobillo, codo) es más rápido escribir el nombre en la barra de búsqueda que centrarlas con el ratón.',
        },
      },
      clinicalFooter: 'Contenido clínico basado en clasificaciones y guías verificadas — Neer, Kibler, AO/Weber, Garden, SOSORT y otras',
      ctaWholeBody: 'Cuerpo Entero / Equilibrio y Marcha',
      loadingModel: 'Cargando modelo 3D...',
      searchPlaceholder: 'Buscar zona...',
      noZoneFound: 'Ninguna zona encontrada',
      dragRotateZoom: 'Arrastra para girar · desplázate para el zoom',
      xrayLabel: 'Rayos X',
      modelCreditPrefix: 'Modelo 3D:',
      zoneNotFound: 'Zona no encontrada.',
      backToBodyMap: 'Mapa Corporal',
      zoneTypeSkeletal: 'Estructura Ósea',
      zoneTypeAnatomical: 'Zona Anatómica',
      relatedZonesLabel: 'Zonas Relacionadas',
      askPhygoButton: 'Pregunta a Phygo sobre esta zona',
      askPhygoHeadingPrefix: 'Pregunta a Phygo sobre {zone}',
      askPlaceholder: 'Haz una pregunta clínica sobre esta región...',
      askGenericError: 'Algo salió mal.',
      askGenericErrorRetry: 'Algo salió mal. Inténtalo de nuevo.',
      noExercisesLinked: 'Aún no hay ejercicios vinculados a esta zona.',
      seeAllExercises: 'Ver los {count} ejercicios en la Biblioteca Pro →',
      relatedConditionsHeading: 'Patologías Relacionadas',
      noConditionsLinked: 'Aún no hay patologías vinculadas a esta zona.',
      sourceCitedAriaLabel: 'Fuente citada',
      zoneNames: {
        'cervical-spine': 'Columna Cervical',
        trapezius: 'Trapecio / Trapecio Superior',
        shoulder: 'Hombro',
        chest: 'Pecho / Pectorales',
        biceps: 'Bíceps',
        triceps: 'Tríceps',
        elbow: 'Codo',
        forearm: 'Antebrazo',
        'wrist-hand': 'Muñeca / Mano',
        'core-abdomen': 'Core / Abdomen',
        'thoracic-spine': 'Columna Torácica / Espalda Alta',
        'lumbar-spine': 'Columna Lumbar / Espalda Baja',
        hip: 'Cadera',
        glutes: 'Glúteos',
        quadriceps: 'Cuádriceps',
        hamstrings: 'Isquiotibiales',
        knee: 'Rodilla',
        calf: 'Pantorrilla',
        'ankle-foot': 'Tobillo / Pie',
      },
      boneNames: {
        'bone-cranio': 'Cráneo',
        'bone-clavicola-scapola': 'Clavícula y Escápula',
        'bone-coste-sterno': 'Costillas y Esternón',
        'bone-omero': 'Húmero',
        'bone-radio-ulna': 'Radio y Cúbito',
        'bone-mano': 'Huesos de la Mano',
        'bone-bacino': 'Pelvis',
        'bone-sacro': 'Sacro y Cóccix',
        'bone-femore': 'Fémur',
        'bone-tibia-perone': 'Tibia y Peroné',
        'bone-piede': 'Huesos del Pie',
        'bone-cervicale': 'Vértebras Cervicales',
        'bone-dorsale': 'Vértebras Torácicas',
        'bone-lombare': 'Vértebras Lumbares',
      },
    },
    pelvicFloorAtlas: {
      badge: 'Atlas de Salud Pélvica',
      heading: 'Suelo Pélvico',
      subTabs: { anatomy: 'Anatomía', conditions: 'Patologías', assessment: 'Evaluación', rehab: 'Rehabilitación' },
      anatomyHeading: 'Anatomía del Suelo Pélvico',
      anatomyIntro:
        'Músculos, fascias, ligamentos y conceptos clave que explican cómo el suelo pélvico funciona como sistema integrado.',
      overviewIntro:
        'El suelo pélvico es un sistema músculo-fascial en forma de embudo que cierra por abajo la cavidad abdomino-pélvica, sosteniendo la vejiga, el útero/próstata y el recto. No es un bloque muscular aislado: trabaja en coordinación con la musculatura abdominal profunda, el diafragma respiratorio y la estructura conectiva circundante (fascias y ligamentos) para contrarrestar las presiones intraabdominales generadas por la respiración, la tos, el esfuerzo y el levantamiento de pesos. Su correcto funcionamiento depende del equilibrio entre el tono de reposo (cierre de los orificios), la capacidad contráctil voluntaria (continencia activa) y la capacidad de relajación coordinada (micción, defecación, parto). Las siguientes secciones profundizan en el componente muscular, el fascial/ligamentoso, y los dos conceptos — la teoría de la hamaca y las sinergias musculares — que explican cómo estas partes trabajan juntas.',
      conditionsHeading: 'Patologías Relacionadas',
      conditionsIntro: 'Patologías organizadas por compartimento. Toca una tarjeta para objetivos, pruebas clínicas y ejercicios.',
      assessmentHeading: 'Evaluación Clínica',
      assessmentIntro: 'Pruebas clínicas y protocolos de evaluación manual e instrumental.',
      rehabHeading: 'Rehabilitación',
      rehabIntro: 'Protocolos de ejercicio, biofeedback, electroestimulación y rehabilitación para poblaciones especiales.',
      loading: 'Cargando...',
      errorStructures: 'No se pudieron cargar las estructuras anatómicas.',
      errorConditions: 'No se pudieron cargar las patologías.',
      errorTests: 'No se pudieron cargar las pruebas de evaluación.',
      errorRehab: 'No se pudieron cargar los contenidos de rehabilitación.',
      structureCategoryLabels: { muscle: 'Músculos', fascia_ligament: 'Fascias y Ligamentos', concept: 'Conceptos Clave', nerve: 'Nervios' },
      structureCategoryLabelsSingular: { muscle: 'Músculo', fascia_ligament: 'Fascia / Ligamento', concept: 'Concepto Clave', nerve: 'Nervio' },
      compartmentLabels: {
        anterior: 'Compartimento Anterior',
        central: 'Compartimento Central',
        posterior: 'Compartimento Posterior',
        systemic: 'Síndromes Sistémicos',
      },
      rehabCategoryLabels: {
        kegel: 'Ejercicio del Suelo Pélvico',
        biofeedback_electrostim: 'Biofeedback y Electroestimulación',
        bladder_training: 'Reeducación Vesical (Bladder Training)',
        postpartum: 'Rehabilitación Posparto',
        special_population: 'Poblaciones Especiales',
      },
      imageLabels: {
        femaleSagittal: 'Sagital — Femenino',
        maleSagittal: 'Sagital — Masculino',
        inferiorView: 'Vista Inferior',
        inferiorViewFull: 'Vista Inferior (Femenina) — plano perineal, tres compartimentos',
      },
      protocolLabel: 'Protocolo',
      relatedConditionsHeading: 'Patologías Relacionadas',
      noConditionsLinked: 'Todavía no hay patologías vinculadas a esta estructura.',
      backToAtlas: 'Volver al Suelo Pélvico',
      structureNotFound: 'Estructura no encontrada.',
      errorLoadingStructure: 'No se pudieron cargar los datos de la estructura.',
      anatomySectionLabel: 'Anatomía',
      functionSectionLabel: 'Función',
      clinicalRelevanceLabel: 'Relevancia Clínica',
    },
    profilePage: {
      eyebrow: 'Área Profesional',
      heading: 'Perfil',
      subtitle: 'La información que tus pacientes y colegas ven de ti.',
      photoLabel: 'Foto de perfil',
      photoHint: 'Visible para tus pacientes',
      displayNameLabel: 'Nombre visible',
      displayNamePlaceholder: 'Dr. Andrea Stilfer',
      bioLabel: 'Biografía breve',
      bioPlaceholder: 'Unas líneas sobre tu enfoque y experiencia...',
      registrationNumberLabel: 'Número de Colegiación',
      registrationNumberPlaceholder: 'Ej. Colegio Profesional n.º 12345',
      registrationNumberHint: 'Opcional — el formato varía según el país y el colegio profesional.',
      credentialsLabel: 'Cursos y certificaciones',
      credentialPlaceholder: 'Ej. Máster en Rehabilitación del Suelo Pélvico',
      add: 'Añadir',
      saveProfile: 'Guardar perfil',
    },
  },
  fr: {
    clinicalActionBar: {
      addToTreatmentPlan: 'Ajouter au Plan de Traitement',
      useWithPatient: 'Ajouter au Patient',
      startForPatient: 'Assigner au Patient',
      useAsClinicalReference: 'Utiliser comme Référence Clinique',
      recommendToPatient: 'Recommander au Patient',
      selectPatient: 'Sélectionner un patient',
      addedFor: 'Ajouté pour {name}',
      added: 'Ajouté',
      searchPlaceholder: 'Rechercher un patient...',
      searching: 'Recherche en cours...',
      noPatientsFound: 'Aucun patient trouvé.',
    },
    nav: {
      patients: 'Patients',
      library: 'Bibliothèque',
      world: 'Phygo World',
      schedule: 'Agenda',
      profile: 'Profil',
      signOut: 'Déconnexion',
      startFree: 'Essai gratuit',
      search: 'Rechercher',
      liveDemo: 'Démo en direct',
      features: 'Fonctionnalités',
      trust: 'Confiance',
      pricing: 'Tarifs',
      faq: 'FAQ',
      currentPatient: 'Patient actuel',
    },
    libraryLinks: {
      bodyMap: { label: 'Carte du Corps', description: 'Explorateur anatomique interactif' },
      neurology: { label: 'Neurologie', description: 'Cerveau, nerfs et voies nerveuses' },
      physiology: { label: 'Physiologie', description: 'Mécanismes musculaires et neurologiques fondamentaux' },
      sportsMedicine: { label: 'Médecine du Sport', description: 'Science de la blessure sportive et retour au sport' },
      pelvicFloor: { label: 'Plancher Pelvien', description: 'Anatomie, pathologies et rééducation' },
      cardiopulmonary: { label: 'Cardiopulmonaire', description: 'Anatomie, pathologies et rééducation' },
      endocrine: { label: 'Endocrinien', description: 'Anatomie, pathologies et rééducation' },
      fascia: { label: 'Fascia', description: 'Anatomie, fonction et applications cliniques' },
      urinary: { label: 'Urinaire', description: 'Anatomie, pathologies et rééducation' },
      gastrointestinal: { label: 'Gastro-intestinal', description: 'Anatomie, pathologies et rééducation' },
      immune: { label: 'Immunitaire', description: 'Anatomie, pathologies et rééducation' },
      hematology: { label: 'Hématologie', description: 'Anatomie, pathologies et rééducation' },
      oncology: { label: 'Oncologie', description: 'Anatomie, pathologies et rééducation' },
      firstAid: { label: 'Premiers Secours', description: 'Protocoles par pays' },
      blsd: { label: 'RCP/DEA', description: 'RCP, DEA et désobstruction des voies aériennes' },
      clinicalTools: { label: 'Outils Cliniques', description: "Échelles d'évaluation et tests" },
    },
    physiologyCrossLink: { question: 'Vous voulez comprendre comment ça marche ?', cta: 'Aller à Physiologie' },
    worldLinks: {
      science: { label: 'Evidence Hub', description: 'Résumés des dernières recherches' },
      events: { label: 'Événements', description: 'Congrès, cours et webinaires santé' },
      shop: { label: 'Boutique', description: 'Équipements recommandés' },
    },
    events: {
      badge: 'Phygo World',
      heading: 'Événements',
      subtitle: 'Découvrez congrès, cours et expériences qui façonnent la physiothérapie, la santé et la performance humaine.',
      searchPlaceholder: 'Rechercher par nom, sujet, ville ou pays...',
      filtersLabel: 'Filtres',
      categoryLabel: 'Catégorie',
      typeLabel: "Type d'événement",
      dateLabel: 'Date',
      locationLabel: 'Lieu',
      audienceLabel: 'Public',
      levelLabel: 'Niveau professionnel',
      allLabel: 'Tous',
      onlineLabel: 'En ligne',
      inPersonLabel: 'En présentiel',
      hybridLabel: 'Hybride',
      freeLabel: 'Gratuit',
      paidLabel: 'Payant',
      datePresets: { today: "Aujourd'hui", thisWeek: 'Cette Semaine', thisMonth: 'Ce Mois', next3Months: '3 Prochains Mois', custom: 'Personnalisé' },
      featuredHeading: 'À la Une',
      upcomingHeading: 'Événements à Venir',
      onlineHeading: 'Événements en Ligne',
      nearYouHeading: 'Près de Chez Vous',
      viewEventCta: "Voir l'Événement",
      noEventsFound: 'Aucun événement ne correspond à ces filtres.',
      loadingEvents: 'Chargement des événements...',
      categoryLabels: { physiotherapy: 'Physiothérapie', rehabilitation: 'Réadaptation', sportsRehabilitation: 'Réadaptation Sportive', sportsMedicine: 'Médecine du Sport', orthopaedics: 'Orthopédie', neurology: 'Neurologie', neurorehabilitation: 'Neuroréadaptation', exerciseScience: "Sciences de l'Exercice", strengthConditioning: 'Préparation Physique', manualTherapy: 'Thérapie Manuelle', painScience: 'Science de la Douleur', pelvicFloor: 'Plancher Pelvien', cardiopulmonary: 'Cardiopulmonaire', oncology: 'Oncologie', nutrition: 'Nutrition', psychology: 'Psychologie', yoga: 'Yoga', pilates: 'Pilates', mobility: 'Mobilité', wellness: 'Bien-être', longevity: 'Longévité', healthyAging: 'Vieillissement en Santé', prevention: 'Prévention', healthcareTechnology: 'Technologie de la Santé', aiHealthcare: 'IA et Santé', digitalHealth: 'Santé Numérique', research: 'Recherche' },
      typeLabels: { congress: 'Congrès', conference: 'Conférence', course: 'Cours', workshop: 'Atelier', webinar: 'Webinaire', masterclass: 'Masterclass', seminar: 'Séminaire', symposium: 'Symposium', certification: 'Cours de Certification' },
      audienceLabels: { professionals: 'Professionnels', students: 'Étudiants', public: 'Patients / Public', both: 'Tous' },
      levelLabels: { student: 'Étudiant', beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé', expert: 'Expert' },
      statusLabels: { upcoming: 'À Venir', updated: 'Mis à Jour', dateChanged: 'Date Modifiée', locationChanged: 'Lieu Modifié', cancelled: 'Annulé', soldOut: 'Complet', registrationOpen: 'Inscriptions Ouvertes', registrationClosed: 'Inscriptions Fermées', completed: 'Terminé' },
      verificationLabels: { unverified: 'Non Vérifié', source_verified: 'Source Vérifiée', organizer_verified: 'Organisateur Vérifié', phygo_verified: 'Vérifié par Phygo' },
      verificationExplainer: "La vérification reflète l'exactitude de la source, non une approbation de Phygo sur la qualité scientifique de l'événement.",
      organizerLabel: 'Organisateur',
      timeLabel: 'Horaire',
      timezoneLabel: 'Fuseau horaire',
      descriptionLabel: 'Description',
      topicsLabel: 'Sujets',
      speakersLabel: 'Intervenants',
      priceLabel: 'Prix',
      registrationDeadlineLabel: "Date limite d'inscription",
      registerCta: "S'inscrire / Site Officiel",
      officialWebsiteCta: 'Site Officiel',
      saveEventCta: "Enregistrer l'Événement",
      savedCta: 'Enregistré',
      backToEvents: 'Retour aux Événements',
      eventNotFound: 'Événement introuvable.',
      myEventsHeading: 'Mes Événements',
      savedTab: 'Enregistrés',
      upcomingTab: 'À venir',
      pastTab: 'Passés',
      noSavedEvents: "Vous n'avez pas encore enregistré d'événement.",
      signInToSave: 'Connectez-vous pour enregistrer des événements.',
      providersHeading: 'Autres Ressources de Formation',
      providersSubtitle: 'Organismes qui publient des formations en continu : consultez leur site pour le calendrier toujours à jour.',
      visitProviderCta: 'Visiter le Site',
    },
    science: {
      badge: 'Phygo Evidence Hub',
      headingLead: 'Dernières',
      headingAccent: 'Preuves',
      subtitle: 'Recherche fondée sur les preuves pour les kinésithérapeutes.',
      searchPlaceholder: 'Rechercher des études par titre...',
      loadingText: 'Chargement des recherches…',
      noResultsText: 'Aucune étude ne correspond à votre recherche.',
      clinicalQuestionLabel: 'Question clinique',
      whyItMattersLabel: 'Pourquoi c\'est important',
      resultsCountSuffix: 'études trouvées',
      originalStudyCta: 'Étude Originale',
    },
    shop: {
      eyebrow: 'Équipement',
      heading: 'Boutique',
      subtitle: 'Une sélection de matériel à recommander directement pendant une séance.',
      curatedPicksSuffix: 'produits sélectionnés',
      allLabel: 'Tous',
      viewOnAmazonCta: 'Voir sur Amazon',
      categoryLabels: {
        'Pelvic Floor': 'Plancher Pelvien',
        'Low Back': 'Bas du Dos',
        Posture: 'Posture',
        Mobility: 'Mobilité',
        Recovery: 'Récupération',
        'Body Composition': 'Composition Corporelle',
        Nutrition: 'Nutrition',
      },
    },
    fields: {
      goals: 'Objectifs',
      clinicalTests: 'Tests Cliniques',
      typicalExercises: 'Exercices Types',
      progressionCriteria: 'Critères de Progression',
      returnToActivityCriteria: "Critères de Reprise d'Activité",
      outcomeMeasures: 'Mesures de Résultat',
      contraindications: 'Contre-indications',
      redFlags: "Signaux d'Alarme",
      featuredExercises: 'Exercices à la Une',
      source: 'Source',
      evidence: 'Niveau de Preuve',
    },
    anatomy: {
      anatomy: 'Anatomie',
      innervation: 'Innervation',
      biomechanics: 'Biomécanique',
      clinicalRelevance: 'Pertinence Clinique',
      connections: 'Connexions',
      vascularSupply: 'Vascularisation',
      function: 'Fonction',
    },
    evidenceLevels: {
      high: 'Élevé',
      strong: 'Élevé',
      moderate: 'Modéré',
      low: 'Faible',
      limited: 'Faible',
    },
    common: {
      loading: 'Chargement...',
      save: 'Enregistrer',
      saving: 'Enregistrement...',
      saved: 'Enregistré',
      backToPatients: 'Retour aux patients',
      machineTranslatedNotice:
        "Traduit automatiquement de l'italien — pour toute décision clinique, vérifiez les Signaux d'Alarme et les Contre-indications par rapport au texte original.",
    },
    brainMap: {
      atlasBadge: 'Atlas Neurologique',
      heading: 'Neurologie',
      subtitle:
        'Anatomie, voies nerveuses et raisonnement clinique de localisation — un atlas interactif conçu pour la pratique quotidienne.',
      viewLabels: { brain: 'Cerveau', nerves: 'Nerfs Périphériques', pathways: 'Circuits Neuraux' },
      brainSubTabs: { atlas: 'Atlas', conditions: 'Pathologies' },
      deepStructuresHint: 'Structures profondes — non visibles à la surface du modèle 3D, mais consultables ici.',
      referenceViewsHint: 'Vues de référence — latérale, sagittale et coronale, avec les principales structures annotées.',
      nerveViewerHint: "Déplacez le curseur sur l'image pour l'explorer en perspective",
      loading3DModel: 'Chargement du modèle 3D...',
      dragRotateZoom: 'Faites glisser pour pivoter · défilez pour zoomer',
      modelCreditPrefix: 'Modèle 3D :',
      zoneNames: {
        'frontal-lobe': 'Lobe Frontal',
        'parietal-lobe': 'Lobe Pariétal',
        'temporal-lobe': 'Lobe Temporal',
        'occipital-lobe': 'Lobe Occipital',
        cerebellum: 'Cervelet',
        brainstem: 'Tronc Cérébral',
        'basal-ganglia': 'Noyaux Gris Centraux',
        insula: 'Insula',
        'corpus-callosum': 'Corps Calleux',
        thalamus: 'Thalamus',
        hypothalamus: 'Hypothalamus',
        amygdala: 'Amygdale',
        hippocampus: 'Hippocampe',
      },
      brainConditionsHeading: 'Pathologies Cérébrales',
      brainConditionsHint:
        'Toutes les pathologies liées aux zones cérébrales, dans une liste unique et consultable — touchez une carte pour les détails cliniques.',
      searchConditionsPlaceholder: 'Rechercher par nom de pathologie...',
      loadingConditions: 'Chargement des pathologies...',
      errorLoadingConditions: 'Impossible de charger les pathologies liées.',
      noConditionsFound: 'Aucune pathologie trouvée.',
      relatedConditionsHeading: 'Pathologies Liées',
      nervesSubTabs: {
        atlas: 'Atlas des Nerfs',
        seddon: 'Classification de Seddon',
        conduction: 'Conduction Nerveuse',
        conditions: 'Pathologies Liées',
        diffuse: 'Troubles Diffus',
      },
      peripheralAtlasHeading: 'Atlas des Nerfs Périphériques',
      peripheralAtlasHint:
        'Touchez un nerf pour son anatomie, sa fonction motrice/sensitive, son site de compression habituel et les pathologies liées.',
      regionAll: 'Tous',
      regionLabels: {
        plexus: 'Plexus',
        upper_limb: 'Membre Supérieur',
        lower_limb: 'Membre Inférieur',
        cranial: 'Nerfs Crâniens',
      },
      askPhygoPrompt: 'Vous ne trouvez pas le nerf recherché ? Demandez à Phygo',
      askPhygoPlaceholder: 'ex. nerf ilio-hypogastrique, nerf génito-fémoral...',
      askButton: 'Demander',
      loadingNerves: 'Chargement des nerfs...',
      errorLoadingNerves: 'Impossible de charger les nerfs.',
      nerveInjuryHeading: 'Classification des Lésions Nerveuses',
      nerveInjuryHint:
        'Classification de Seddon, de la plus légère à la plus sévère — utile pour orienter le pronostic et les délais de récupération.',
      nerveConductionHeading: 'Conduction Nerveuse',
      nerveConductionHint: 'Types de fibres nerveuses et leurs vitesses de conduction respectives.',
      fiberDiameter: 'Diamètre',
      fiberMyelination: 'Myélinisation',
      fiberVelocity: 'Vitesse',
      fiberFunction: 'Fonction',
      snpConditionsHint:
        'Pathologies du système nerveux périphérique présentes dans la Base de Connaissances de Phygo. Touchez une carte pour les détails cliniques.',
      diffuseHeading: 'Troubles Diffus du SNP',
      diffuseHint:
        "Pathologies qui touchent le système nerveux périphérique de façon diffuse ou systémique, plutôt qu'un nerf nommé unique. Touchez une carte pour les détails cliniques.",
      loadingDiffuse: 'Chargement des troubles diffus...',
      errorLoadingDiffuse: 'Impossible de charger les troubles diffus du SNP.',
      pathwaySubTabs: { circuits: 'Voies Nerveuses', gait: 'Types de Marche', localization: 'Localisation' },
      pathwayCategoryLabels: { longTracts: 'Voies Longues', brainCircuits: 'Circuits Cérébraux' },
      gaitHint: 'Reconnaître le type de marche aide à localiser la lésion neurologique sous-jacente.',
      localizationHint:
        "Six principes de raisonnement clinique pour localiser une lésion neurologique à partir des signes de l'examen clinique.",
      zone: {
        badge: 'Zone Neurologique',
        geriatricHeading: 'Principes de Neurologie Gériatrique',
        noConditionsLinked: 'Aucune pathologie encore liée à cette zone.',
        backToBrainMap: 'Carte Cérébrale',
        zoneNotFound: 'Zone introuvable.',
      },
      nerve: {
        backToNeuroMap: 'Retour à la carte neurologique',
        errorLoadingNerve: 'Impossible de charger les données du nerf.',
        anatomyAndCourse: 'Anatomie et trajet',
        motorFunction: 'Fonction motrice',
        sensoryFunction: 'Fonction sensitive',
        compressionSite: 'Site typique de compression/lésion',
        clinicalSign: 'Signe clinique caractéristique',
        linkedConditions: 'Pathologies liées',
        noConditionsLinkedToNerve: 'Aucune pathologie encore liée à ce nerf.',
      },
    },
    oncology: {
      atlasBadge: 'Atlas Oncologique',
      heading: 'Oncologie',
      subTabs: {
        anatomy: 'Anatomie',
        conditions: 'Pathologies',
        treatments: 'Traitements',
        assessment: 'Évaluation',
        rehab: 'Rééducation',
      },
      anatomyHeading: 'Anatomie Oncologique',
      anatomyHint:
        'Anatomie et drainage lymphatique pertinents pour comprendre les principaux cancers et leurs complications de rééducation.',
      anatomyIntro:
        "Cette section part des mécanismes biologiques et moléculaires par lesquels une cellule normale se transforme en cellule tumorale — une étape souvent négligée mais utile pour comprendre pourquoi une tumeur se comporte comme elle le fait. Elle aborde ensuite l'anatomie du drainage lymphatique régional, organe par organe : c'est la carte la plus pertinente pour la pratique de la kinésithérapie, car la plupart des complications de rééducation post-chirurgicales (le lymphœdème en premier lieu) dépendent des voies lymphatiques qui ont été interrompues.",
      conditionsHeading: 'Pathologies Liées',
      conditionsHint: 'Pathologies oncologiques organisées par système. Touchez une carte pour les objectifs, tests cliniques, signaux d\'alarme et exercices typiques.',
      treatmentsHeading: 'Traitements Oncologiques',
      treatmentsHint: 'Parcours diagnostico-thérapeutiques par type de tumeur et modalités de traitement générales, avec leurs implications en kinésithérapie.',
      assessmentHeading: 'Évaluation Clinique',
      assessmentHint: 'Échelles de performance status et outils d\'évaluation spécifiques au patient oncologique.',
      rehabHeading: 'Rééducation',
      rehabHint: 'Protocoles de prise en charge du lymphœdème (y compris le drainage lymphatique manuel étape par étape), exercice en oncologie et gestion des complications spécifiques.',
      loading: 'Chargement...',
      errorLoadingStructures: 'Impossible de charger les structures anatomiques.',
      errorLoadingConditions: 'Impossible de charger les pathologies.',
      errorLoadingTests: 'Impossible de charger les tests d\'évaluation.',
      errorLoadingRehab: 'Impossible de charger le contenu de rééducation.',
      errorLoadingTreatments: 'Impossible de charger les traitements.',
      procedureLabel: 'Procédure',
      interpretationLabel: 'Interprétation',
      protocolLabel: 'Protocole',
      ptImplicationsLabel: 'Implications en Kinésithérapie',
      askPhygoPrompt: 'Vous ne trouvez pas la pathologie recherchée ? Demandez à Phygo',
      askPhygoPlaceholder: 'ex. lymphome, mélanome, sarcome des tissus mous...',
      askButton: 'Demander',
      regionLabels: {
        'tumor-biology': 'Biologie de la Tumeur',
        'lymphatic-general': 'Système Lymphatique Général',
        breast: 'Sein',
        gynecological: 'Gynécologique',
        prostate: 'Prostate',
        bladder: 'Vessie',
        lung: 'Poumon',
        brain: 'Cerveau',
        'head-neck': 'Tête-Cou',
        colorectal: 'Colorectal',
        systemic: 'Systémique',
      },
      systemLabels: {
        mammario: 'Cancer du Sein',
        ginecologico: 'Cancers Gynécologiques',
        prostatico: 'Cancer de la Prostate',
        vescicale: 'Cancer de la Vessie',
        'neuro-oncologico': 'Tumeurs Cérébrales',
        'colon-retto': 'Cancer Colorectal',
        polmonare: 'Cancer du Poumon',
        'testa-collo': 'Cancers Tête-Cou',
        sarcoma: 'Sarcomes',
        ematologico: 'Néoplasies Hématologiques',
        sistemico: 'Complications Systémiques',
      },
      testCategoryLabels: {
        performance_status: 'Performance Status',
        lymphedema_assessment: 'Évaluation du Lymphœdème',
        red_flag_screening: 'Dépistage Pré-Exercice',
      },
      rehabCategoryLabels: {
        linfedema: 'Prise en Charge du Lymphœdème',
        complicanze_specifiche: 'Complications Spécifiques',
        esercizio: 'Exercice en Oncologie',
      },
      treatmentCategoryLabels: {
        per_tipo_tumore: 'Parcours par Type de Tumeur',
        diagnostica: 'Diagnostic et Stadification',
        chirurgia: 'Chirurgie',
        farmacologico: 'Traitements Pharmacologiques',
        fisico: 'Traitements Physiques',
      },
    },
    cardiopulmonary: {
      atlasBadge: 'Atlas Cardiopulmonaire',
      heading: 'Cardiopulmonaire',
      subTabs: {
        anatomy: 'Anatomie',
        conditions: 'Pathologies',
        assessment: 'Évaluation',
        rehab: 'Rééducation',
        airwayClearance: 'Désencombrement',
      },
      anatomyHeading: 'Anatomie Cardiopulmonaire',
      anatomyHint: 'Cœur, circulation, appareil respiratoire et mécanique thoracique : comment ils fonctionnent comme un système intégré.',
      anatomyIntro:
        "Le système cardiorespiratoire intègre la fonction cardiaque, circulatoire et pulmonaire : une atteinte dans l'un de ces domaines se répercute presque toujours sur les autres. L'évaluation en kinésithérapie considère ensemble la mécanique thoracique, la capacité à l'exercice et les signes vitaux, car ils sont étroitement interdépendants. Les sections ci-dessous approfondissent l'anatomie cardiaque, le système vasculaire, l'appareil respiratoire, la mécanique/cinématique thoracique et le concept clé de VO2max/réserve cardiaque, qui oriente la prescription de l'exercice.",
      conditionsHeading: 'Pathologies Liées',
      conditionsHint: 'Pathologies organisées par système. Touchez une carte pour les objectifs, tests cliniques et exercices.',
      assessmentHeading: 'Évaluation Clinique',
      assessmentHint: 'Tests cliniques et échelles d\'évaluation cardiorespiratoire.',
      rehabHeading: 'Rééducation',
      rehabHint: 'Protocoles FITT, prise en charge post-chirurgicale et protocoles spécifiques à l\'insuffisance cardiaque et aux pathologies respiratoires.',
      airwayHeading: 'Techniques de Désencombrement Bronchique',
      airwayHint: 'Drainage postural, techniques manuelles, PEP, respiration active, support ventilatoire. Touchez une carte pour la procédure complète.',
      loading: 'Chargement...',
      errorLoadingStructures: 'Impossible de charger les structures anatomiques.',
      errorLoadingConditions: 'Impossible de charger les pathologies.',
      errorLoadingTests: 'Impossible de charger les tests d\'évaluation.',
      errorLoadingRehab: 'Impossible de charger le contenu de rééducation.',
      errorLoadingAirway: 'Impossible de charger les techniques de désencombrement.',
      procedureLabel: 'Procédure',
      interpretationLabel: 'Interprétation',
      protocolLabel: 'Protocole',
      patientPositionLabel: 'Position du patient',
      indicationsLabel: 'Indications',
      contraindicationsPrecautionsLabel: 'Contre-indications/Précautions',
      categoryLabels: {
        cardiac: 'Cardiaque',
        circulatory: 'Circulatoire',
        respiratory: 'Respiratoire',
        thoracic_mechanics: 'Mécanique Thoracique',
        concept: 'Concepts Clés',
      },
      systemLabels: {
        cardiac: 'Pathologies Cardiaques',
        respiratory: 'Pathologies Respiratoires',
        mixed_systemic: 'Pathologies Systémiques/Mixtes',
      },
      testCategoryLabels: {
        functional_capacity: 'Capacité Fonctionnelle',
        dyspnea_scale: 'Échelles de Dyspnée',
        strength: 'Force',
        vital_signs: 'Signes Vitaux',
        consciousness: 'État de Conscience',
      },
      rehabCategoryLabels: {
        aerobic_training: 'Entraînement Aérobie',
        resistance_training: 'Entraînement en Force',
        post_surgical: 'Post-Chirurgical',
        heart_failure: 'Insuffisance Cardiaque',
        respiratory_specific: 'Spécifique Respiratoire',
      },
      airwayCategoryLabels: {
        postural_drainage: 'Drainage Postural',
        manual: 'Techniques Manuelles',
        active_breathing: 'Respiration Active',
        device_dependent: 'Dispositifs (PEP)',
        machine_dependent: 'Dispositifs Mécaniques',
        ventilation_support: 'Support Ventilatoire',
        dyspnoea_technique: 'Techniques pour la Dyspnée',
      },
      ageGroupLabels: {
        adult: 'Adultes',
        paediatric: 'Pédiatrique',
        both: 'Adultes et enfants',
      },
    },
    endocrine: {
      atlasBadge: 'Atlas Endocrinien',
      heading: 'Système Endocrinien',
      subTabs: {
        anatomy: 'Anatomie',
        conditions: 'Pathologies',
        assessment: 'Évaluation',
        rehab: 'Rééducation',
      },
      anatomyHeading: 'Anatomie Endocrinienne',
      anatomyHint: 'Glandes, axes hormonaux et concepts clés : comment le système endocrinien régule le métabolisme, la croissance et l\'homéostasie.',
      anatomyIntro:
        "Le système endocrinien coordonne la communication hormonale entre les glandes et les organes cibles, régulant le métabolisme, la croissance, la composition corporelle, la densité osseuse et la fonction reproductive. Une dysfonction endocrinienne se répercute souvent sur la tolérance à l'effort, la force musculaire, la santé osseuse et l'équilibre, ce qui rend l'évaluation en kinésithérapie étroitement liée au profil hormonal du patient. Les sections ci-dessous approfondissent les principales glandes (thyroïde, surrénale, parathyroïdes, pancréas endocrine), les axes hormonaux clés (hypothalamo-hypophysaire, GH/IGF-1, gonadique) et le rôle de l'os en tant qu'organe cible et endocrinien.",
      conditionsHeading: 'Pathologies Liées',
      conditionsHint: 'Les principales endocrinopathies d\'intérêt en kinésithérapie. Touchez une carte pour les objectifs, tests cliniques et exercices.',
      assessmentHeading: 'Évaluation Clinique',
      assessmentHint: 'Examens hormonaux, métaboliques et structurels pertinents pour l\'évaluation en kinésithérapie du patient endocrinien.',
      rehabHeading: 'Rééducation',
      rehabHint: 'Protocoles de santé osseuse, prévention des chutes, hormonothérapie substitutive, entraînement métabolique et soutien nutritionnel.',
      loading: 'Chargement...',
      errorLoadingStructures: 'Impossible de charger les structures anatomiques.',
      errorLoadingConditions: 'Impossible de charger les pathologies.',
      errorLoadingTests: 'Impossible de charger les tests d\'évaluation.',
      errorLoadingRehab: 'Impossible de charger le contenu de rééducation.',
      procedureLabel: 'Procédure',
      interpretationLabel: 'Interprétation',
      protocolLabel: 'Protocole',
      categoryLabels: {
        axis: 'Axes Hormonaux',
        concept: 'Concepts Clés',
        gland: 'Glandes',
      },
      testCategoryLabels: {
        hormonal: 'Hormonal',
        metabolic: 'Métabolique',
        structural: 'Structurel',
      },
      rehabCategoryLabels: {
        bone_health: 'Santé Osseuse',
        fall_prevention: 'Prévention des Chutes',
        hormone_replacement: 'Hormonothérapie Substitutive',
        metabolic_training: 'Entraînement Métabolique',
        nutritional_support: 'Soutien Nutritionnel',
      },
    },
    fascia: {
      atlasBadge: 'Atlas du Fascia',
      heading: 'Fascia',
      subTabs: {
        structures: 'Anatomie',
        function: 'Fonction',
        treatments: 'Applications Cliniques',
        rehab: 'Rééducation',
      },
      structuresHeading: 'Anatomie et Physiologie du Fascia',
      structuresHint: 'Structure, histologie, innervation et régulation du système fascial — la base pour comprendre son rôle clinique.',
      structuresIntro: "Cette section décrit le fascia comme un organe sensoriel et de transmission de force à part entière : de sa composition histologique à sa riche innervation mécanoréceptive et nociceptive, en passant par les mécanismes hormonaux et cellulaires qui régulent ses propriétés dans le temps.",
      functionHeading: 'Fonction Fasciale',
      functionHint: 'Biotenségrité, réponse à la charge, propriétés viscoélastiques et rôle du fascia dans le mouvement et la posture.',
      treatmentsHeading: 'Applications Cliniques',
      treatmentsHint: "Approches manuelles et programmes d'exercice orientés vers le fascia, avec leurs implications kinésithérapiques et le niveau de preuve disponible.",
      rehabHeading: 'Rééducation',
      rehabHint: 'Protocoles de rééducation structurés pour le système fascial, avec le niveau de preuve scientifique disponible pour chaque approche.',
      loading: 'Chargement...',
      errorLoadingStructures: "Impossible de charger le contenu d'anatomie et de physiologie.",
      errorLoadingFunction: 'Impossible de charger le contenu sur la fonction fasciale.',
      errorLoadingTreatments: 'Impossible de charger les applications cliniques.',
      errorLoadingRehab: 'Impossible de charger le contenu de rééducation.',
      ptImplicationsLabel: 'Implications Kinésithérapiques',
      protocolLabel: 'Protocole',
      askPhygoPrompt: 'Vous ne trouvez pas ce que vous cherchez sur le fascia ? Demandez à Phygo',
      askPhygoPlaceholder: 'ex. fascia thoraco-lombaire, cupping, densification fasciale...',
      askButton: 'Demander',
      structureCategoryLabels: {
        anatomia_generale: 'Anatomie Générale',
        istologia: 'Histologie',
        innervazione: 'Innervation',
        vascolarizzazione: 'Vascularisation',
        regolazione_ormonale: 'Régulation Hormonale',
        contrattilita_miofibroblasti: 'Contractilité et Myofibroblastes',
        metodi_di_studio: "Méthodes d'Étude",
      },
      functionCategoryLabels: {
        biotensegrita: 'Biotenségrité',
        carico_e_nutrizione: 'Charge et Nutrition',
        capacita_di_allungamento: "Capacité d'Étirement",
        cammino_e_locomozione: 'Marche et Locomotion',
        valutazione_posturale: 'Évaluation Posturale',
      },
      treatmentCategoryLabels: {
        integrazione_strutturale: 'Intégration Structurale',
        terapia_dei_punti_trigger: 'Thérapie des Points Trigger',
        manipolazione_fasciale: 'Manipulation Fasciale',
        fascial_stretch_therapy: 'Fascial Stretch Therapy',
        gestione_delle_cicatrici: 'Gestion des Cicatrices',
        riabilitazione_oncologica_fasciale: 'Rééducation Oncologique',
        auto_trattamento_miofasciale: 'Auto-libération Myofasciale',
        movimento_e_rieducazione_fasciale: 'Mouvement et Rééducation',
      },
      rehabCategoryLabels: {
        post_surgical_scar_management: 'Gestion des Cicatrices Post-Chirurgicales',
        progressive_loading: 'Charge Progressive',
        movement_reeducation: 'Rééducation du Mouvement',
        sports_performance: 'Performance Sportive',
        chronic_pain_management: 'Gestion de la Douleur Chronique',
      },
    },
    urinary: {
      atlasBadge: 'Atlas Urinaire',
      heading: 'Système Urinaire/Rénal',
      subTabs: {
        anatomy: 'Anatomie',
        conditions: 'Pathologies',
        assessment: 'Évaluation',
        rehab: 'Rééducation',
      },
      anatomyHeading: 'Anatomie Rénale et Urinaire',
      anatomyHint: 'Rein, néphron et voies urinaires basses : structure et physiologie de la filtration, de la réabsorption et de l\'équilibre hydro-électrolytique.',
      anatomyIntro:
        "Le rein régule le volume et la composition des liquides corporels grâce à la filtration glomérulaire, à la réabsorption et à la sécrétion tubulaires, au système rénine-angiotensine-aldostérone et au contrôle de l'équilibre acido-basique. Une altération de la fonction rénale se répercute sur les électrolytes, la pression artérielle, l'état d'hydratation et la tolérance à l'effort, ce qui rend l'évaluation en kinésithérapie étroitement liée aux paramètres métaboliques et cardiovasculaires du patient. Les sections ci-dessous détaillent l'anatomie du rein et de la vessie, ainsi que les principaux processus physiologiques — filtration glomérulaire, fonction tubulaire, SRAA, équilibre hydrique et électrolytique, équilibre acido-basique — qui orientent la prise en charge clinique et la prescription de l'exercice.",
      conditionsHeading: 'Pathologies Liées',
      conditionsHint: 'Pathologies néphrologiques et urologiques pertinentes pour la pratique en kinésithérapie. Touchez une carte pour les objectifs, tests cliniques et exercices.',
      assessmentHeading: 'Évaluation Clinique',
      assessmentHint: 'Tests de fonction rénale, analyse d\'urine, paramètres métaboliques et imagerie.',
      rehabHeading: 'Rééducation',
      rehabHint: 'Prescription de l\'exercice dans l\'insuffisance rénale chronique, en dialyse, après transplantation et en néphrologie du sport.',
      loading: 'Chargement...',
      errorLoadingStructures: 'Impossible de charger les structures anatomiques.',
      errorLoadingConditions: 'Impossible de charger les pathologies.',
      errorLoadingTests: 'Impossible de charger les tests d\'évaluation.',
      errorLoadingRehab: 'Impossible de charger le contenu de rééducation.',
      procedureLabel: 'Procédure',
      interpretationLabel: 'Interprétation',
      protocolLabel: 'Protocole',
      categoryLabels: {
        organ: 'Organe',
        physiology: 'Physiologie',
      },
      testCategoryLabels: {
        imaging: 'Imagerie',
        metabolic: 'Métabolique',
        renal_function: 'Fonction Rénale',
        urinalysis: 'Analyse d\'Urine',
      },
      rehabCategoryLabels: {
        renal_training: 'Entraînement en Néphropathie',
        sports_nephrology: 'Néphrologie du Sport',
      },
    },
    physiology: {
      atlasBadge: 'Atlas de Physiologie',
      heading: 'Physiologie Fondamentale',
      systemTabs: { muscular: 'Musculaire', neurological: 'Neurologique', cellular: 'Cellulaire' },
      sectionHint: 'Les mécanismes physiologiques à la base du mouvement et du système nerveux — non l\'anatomie d\'une zone spécifique, mais le fonctionnement réel des tissus et circuits sous-jacents, avec leur pertinence clinique pour la pratique en kinésithérapie.',
      loading: 'Chargement...',
      errorLoading: 'Impossible de charger le contenu de physiologie.',
      clinicalRelevanceLabel: 'Pertinence Clinique',
      categoryLabels: {
        contraction_mechanics: 'Mécanismes de la Contraction',
        fiber_types: 'Types de Fibres',
        mechanics: 'Mécanique Musculaire',
        motor_control: 'Contrôle Moteur',
        exercise_adaptation: 'Adaptation à l\'Exercice',
        neuromuscular: 'Jonction Neuromusculaire',
        smooth_cardiac: 'Muscle Lisse et Cardiaque',
        cellular_basics: 'Physiologie Cellulaire',
        reflexes: 'Réflexes',
        sensory: 'Systèmes Sensoriels',
        plasticity: 'Plasticité et Apprentissage',
        autonomic: 'Système Nerveux Autonome',
        membrane_transport: 'Transport Membranaire',
        chemical_messengers: 'Messagers Chimiques',
        homeostasis: 'Homéostasie et Contrôle',
        energy_metabolism: 'Métabolisme Énergétique',
      },
    },
    sportsMedicine: {
      atlasBadge: 'Atlas de Médecine du Sport',
      heading: 'Médecine du Sport',
      sectionHint: 'La science fondamentale de la blessure sportive et de la récupération — classification, cicatrisation tissulaire, raisonnement clinique et modalités thérapeutiques, avec les directives les plus actuelles pour un retour au sport sûr et efficace.',
      loading: 'Chargement...',
      errorLoading: 'Impossible de charger le contenu de médecine du sport.',
      clinicalRelevanceLabel: 'Pertinence Clinique',
      categoryLabels: {
        injury_classification: 'Classification des Blessures',
        tissue_healing: 'Cicatrisation Tissulaire',
        clinical_reasoning: 'Raisonnement Clinique',
        therapeutic_modalities: 'Modalités Thérapeutiques',
        on_field_emergency_rtp: 'Urgence sur le Terrain et Retour au Sport',
        rehabilitation_programming: 'Programmation de la Rééducation',
      },
    },
    librarySearchPlaceholder: 'Rechercher dans cette section...',
    librarySearchNoResults: 'Aucun résultat trouvé pour votre recherche.',
    gastrointestinal: {
      atlasBadge: 'Atlas Gastro-intestinal',
      heading: 'Système Gastro-intestinal',
      subTabs: {
        anatomy: 'Anatomie',
        conditions: 'Pathologies',
        assessment: 'Évaluation',
        rehab: 'Rééducation',
      },
      anatomyHeading: 'Anatomie Gastro-intestinale',
      anatomyHint: 'Motilité du tube digestif, estomac, intestin grêle, foie, pancréas exocrine, côlon et microbiote : comment ils fonctionnent comme un système intégré.',
      anatomyIntro:
        "Le système gastro-intestinal intègre motilité, sécrétion, digestion et absorption sur tout le tube digestif : un dysfonctionnement d'un segment (par exemple moteur au niveau gastrique ou inflammatoire au niveau colique) se répercute souvent sur la nutrition, l'énergie disponible pour l'exercice et la tolérance à l'effort. L'évaluation kinésithérapique dans le domaine gastro-intestinal prend en compte l'anamnèse digestive, les examens de laboratoire et fonctionnels disponibles, ainsi que l'impact de la pathologie sur la capacité à l'exercice et la qualité de vie. Les sections ci-dessous détaillent le tube digestif dans son ensemble, les organes individuels (estomac, intestin grêle, foie, pancréas, côlon) et l'axe intestin-muscle médié par le microbiote, central dans la prescription d'exercice chez ces patients.",
      conditionsHeading: 'Pathologies Associées',
      conditionsHint: 'Les principales pathologies gastro-intestinales pertinentes pour la pratique kinésithérapique. Touchez une carte pour les objectifs, tests cliniques et exercices.',
      assessmentHeading: 'Évaluation Clinique',
      assessmentHint: 'Bilans sanguins, marqueurs fécaux, sérologie, tests fonctionnels, imagerie et endoscopie utiles pour évaluer le patient en gastro-entérologie.',
      rehabHeading: 'Rééducation',
      rehabHint: "Protocoles d'exercice thérapeutique pour les maladies inflammatoires chroniques de l'intestin, les hépatopathies chroniques, la chirurgie bariatrique, les stomies et les sports d'endurance.",
      loading: 'Chargement...',
      errorLoadingStructures: 'Impossible de charger les structures anatomiques.',
      errorLoadingConditions: 'Impossible de charger les pathologies.',
      errorLoadingTests: "Impossible de charger les tests d'évaluation.",
      errorLoadingRehab: 'Impossible de charger les contenus de rééducation.',
      procedureLabel: 'Procédure',
      interpretationLabel: 'Interprétation',
      protocolLabel: 'Protocole',
      categoryLabels: {
        organ: 'Organes',
        system_overview: "Vue d'Ensemble du Système",
      },
      testCategoryLabels: {
        blood_panel: 'Bilan Sanguin',
        endoscopy: 'Endoscopie',
        functional_test: 'Tests Fonctionnels',
        imaging: 'Imagerie',
        serology: 'Sérologie',
        stool_marker: 'Marqueurs Fécaux',
      },
      rehabCategoryLabels: {
        chronic_disease_management: 'Gestion des Maladies Chroniques',
        gi_disease_management: 'Gestion des Pathologies Gastro-intestinales',
        post_surgical: 'Post-Chirurgical',
        sports_nutrition: 'Nutrition Sportive',
      },
    },
    immune: {
      atlasBadge: 'Atlas du Système Immunitaire',
      heading: 'Système Immunitaire',
      subTabs: {
        anatomy: 'Anatomie',
        conditions: 'Pathologies',
        assessment: 'Évaluation',
        rehab: 'Rééducation',
      },
      anatomyHeading: 'Anatomie du Système Immunitaire',
      anatomyHint: 'Organes lymphoïdes primaires et secondaires, drainage lymphatique périphérique et les trois lignes de défense immunitaire.',
      anatomyIntro:
        "Le système immunitaire associe les organes lymphoïdes primaires (moelle osseuse et thymus), où les cellules immunitaires arrivent à maturité, et les organes lymphoïdes secondaires (ganglions lymphatiques, rate, MALT), où la réponse immunitaire est déclenchée. Le drainage lymphatique périphérique achemine liquide, antigènes et cellules immunitaires vers ces organes, tandis que l'immunité innée, humorale et cellulaire constituent les trois modalités par lesquelles l'organisme reconnaît et neutralise les menaces. Une altération de l'un de ces composants — maladie, traitement immunosuppresseur ou surentraînement — a des répercussions directes sur la capacité de l'organisme à répondre aux infections, à l'inflammation chronique et à l'exercice physique.",
      conditionsHeading: 'Pathologies Associées',
      conditionsHint: 'Pathologies immunitaires, auto-immunes et post-infectieuses. Touchez une carte pour les objectifs, tests cliniques et exercices.',
      assessmentHeading: 'Évaluation Clinique',
      assessmentHint: 'Examens hématologiques, immunologiques et marqueurs inflammatoires utilisés dans l\'évaluation kinésithérapique.',
      rehabHeading: 'Rééducation',
      rehabHint: 'Dosage de l\'exercice, précautions en immunosuppression, prise en charge du lymphœdème et rééducation post-virale.',
      loading: 'Chargement...',
      errorLoadingStructures: 'Impossible de charger les structures anatomiques.',
      errorLoadingConditions: 'Impossible de charger les pathologies.',
      errorLoadingTests: 'Impossible de charger les tests d\'évaluation.',
      errorLoadingRehab: 'Impossible de charger le contenu de rééducation.',
      procedureLabel: 'Procédure',
      interpretationLabel: 'Interprétation',
      protocolLabel: 'Protocole',
      categoryLabels: {
        cell_mediated_immunity: 'Immunité à Médiation Cellulaire',
        humoral_immunity: 'Immunité Humorale',
        innate_immunity: 'Immunité Innée',
        lymphatic_drainage: 'Drainage Lymphatique',
        primary_lymphoid_organ: 'Organes Lymphoïdes Primaires',
        secondary_lymphoid_organ: 'Organes Lymphoïdes Secondaires',
      },
      testCategoryLabels: {
        functional: 'Tests Fonctionnels',
        hematologic: 'Hématologique',
        immunologic: 'Immunologique',
        inflammatory_marker: 'Marqueurs Inflammatoires',
      },
      rehabCategoryLabels: {
        exercise_immunology: 'Immunologie de l\'Exercice',
        immunosuppression_precautions: 'Précautions en Immunosuppression',
        inflammatory_arthritis_training: 'Entraînement dans les Arthrites Inflammatoires',
        lymphedema_management: 'Prise en Charge du Lymphœdème',
        post_viral_rehabilitation: 'Rééducation Post-Virale',
      },
    },
    hematology: {
      atlasBadge: 'Atlas Hématologique',
      heading: 'Sang / Hématologie',
      subTabs: {
        anatomy: 'Anatomie',
        conditions: 'Pathologies',
        assessment: 'Évaluation',
        rehab: 'Rééducation',
      },
      anatomyHeading: 'Anatomie et Physiologie du Sang',
      anatomyHint: 'Lignées cellulaires, plasma, hémoglobine et hémostase : les composants et processus qui régissent le transport de l\'oxygène, la défense immunitaire et la coagulation.',
      anatomyIntro:
        'Le sang est un tissu conjonctif liquide assurant des fonctions de transport (oxygène, nutriments, hormones), de défense immunitaire et d\'hémostase. La composante cellulaire (érythrocytes, leucocytes, plaquettes) et la composante plasmatique fonctionnent en équilibre dynamique : une altération de la lignée rouge, de la cascade de coagulation ou de la composition du plasma se répercute directement sur la tolérance à l\'effort et sur la sécurité de l\'exercice thérapeutique. Les sections ci-dessous approfondissent les érythrocytes et l\'érythropoïèse, les leucocytes, le plasma, l\'hémoglobine/le transport de l\'oxygène et l\'hémostase/la coagulation.',
      conditionsHeading: 'Pathologies Liées',
      conditionsHint: 'Pathologies hématologiques d\'intérêt en kinésithérapie. Touchez une carte pour les objectifs, tests cliniques et exercices.',
      assessmentHeading: 'Évaluation Clinique',
      assessmentHint: 'Examens de laboratoire et évaluations hématologiques pertinents pour la pratique en kinésithérapie.',
      rehabHeading: 'Rééducation',
      rehabHint: 'Prescription de l\'exercice, prévention de la thromboembolie veineuse, précautions sous traitement anticoagulant et protocoles spécifiques par pathologie.',
      loading: 'Chargement...',
      errorLoadingStructures: 'Impossible de charger les structures hématologiques.',
      errorLoadingConditions: 'Impossible de charger les pathologies.',
      errorLoadingTests: 'Impossible de charger les tests d\'évaluation.',
      errorLoadingRehab: 'Impossible de charger le contenu de rééducation.',
      procedureLabel: 'Procédure',
      interpretationLabel: 'Interprétation',
      protocolLabel: 'Protocole',
      categoryLabels: {
        cell_line: 'Lignées Cellulaires',
        fluid: 'Composante Liquide',
        molecule: 'Molécules',
        process: 'Processus',
      },
      testCategoryLabels: {
        coagulation: 'Coagulation',
        diagnostic: 'Diagnostic',
        general: 'Examens Généraux',
        metabolic: 'Métabolique',
      },
      rehabCategoryLabels: {
        condition_specific: 'Spécifique par Pathologie',
        exercise_prescription: 'Prescription de l\'Exercice',
        post_surgical: 'Post-Chirurgical',
        precaution_protocol: 'Protocoles de Précaution',
      },
    },
    clinicalToolkit: {
      badge: 'Outils Cliniques',
      headingAccent: 'Toolkit',
      headingRest: 'Clinique',
      subtitle: 'Échelles validées, tests cliniques et protocoles de traitement réunis dans un seul espace de travail professionnel.',
      tabLabels: {
        functional: 'Échelles Fonctionnelles',
        orthopedic: 'Tests Orthopédiques',
        pelvicFloor: 'Plancher Pelvien',
        neuro: 'Neurologie',
        manualTherapy: 'Thérapie Manuelle',
        metabolic: 'Métabolique',
      },
      manualTherapy: {
        mulliganPrinciplesHeading: 'Principes Fondamentaux du Mulligan Concept',
        mulliganPrinciplesHint: "Le cadre théorique (PILL, CROCKS, Dysfonction Spécifique) qui guide l'application de toutes les techniques MWM présentes dans les régions ci-dessous.",
        closeLabel: 'Fermer',
        readLabel: 'Lire',
        loadingTechniques: 'Chargement des techniques...',
        errorLoadingTechniques: 'Impossible de charger les techniques de thérapie manuelle.',
        noTechniquesFound: 'Aucune technique trouvée pour cette région.',
        patientPositionLabel: 'Position du patient',
        directionLabel: 'Direction',
        indicationsLabel: 'Indications',
        procedureLabel: 'Procédure',
        regionLabels: {
          'ATM': 'ATM',
          'Colonna Cervicale': 'Colonne Cervicale',
          'Colonna Toracica': 'Colonne Thoracique',
          'Colonna Lombare e Pelvi': 'Colonne Lombaire et Bassin',
          'Spalla': 'Épaule',
          'Gomito': 'Coude',
          'Polso e Mano': 'Poignet et Main',
          'Anca': 'Hanche',
          'Ginocchio': 'Genou',
          'Caviglia': 'Cheville',
          'Piede': 'Pied',
        },
        typeLabels: {
          all: 'Toutes',
          mobilization: 'Mobilisation',
          manipulation: 'Manipulation',
          thrust: 'Thrust',
          nonthrust: 'Non-thrust',
          mwm: 'MWM (Mulligan)',
          prp: 'PRP (Mulligan)',
        },
      },
      orthopedic: {
        regionLabels: {
          knee: 'Genou',
          shoulder: 'Épaule',
          hip: 'Hanche',
          spine: 'Rachis Lombaire',
          ankle: 'Cheville/Pied',
          'elbow-wrist': 'Coude/Poignet',
          cervical: 'Rachis Cervical',
        },
        procedureLabel: 'Procédure',
        positiveLabel: 'Positif si',
        loading: 'Chargement des tests...',
        errorLoadingTests: 'Impossible de charger les tests orthopédiques.',
      },
      pelvicFloor: {
        questionnaireCalloutHeading: 'Questionnaire Anamnestique Interactif',
        questionnaireCalloutDescription: "Recueil structuré de l'anamnèse intestinale, urinaire et de la douleur pelvienne, avec un résumé final organisé par domaine.",
        startQuestionnaireLabel: 'Démarrer le Questionnaire',
        loading: 'Chargement des tests...',
        errorLoadingTests: 'Impossible de charger les tests du plancher pelvien.',
        categoryLabels: {
          neuropathy: 'Tests Neuropathiques',
          manual_assessment: 'Évaluation Manuelle',
          urodynamic: 'Tests Urodynamiques',
          questionnaire: 'Questionnaires',
          symptom_questionnaire: 'Questionnaires Symptomatiques',
        },
        procedureLabel: 'Procédure',
        interpretationLabel: 'Interprétation',
        fillQuestionnaireLabel: 'Remplir le questionnaire',
        hideQuestionnaireLabel: 'Masquer le questionnaire',
        fillableBadge: 'Remplissable',
        loadingQuestionnaireContent: 'Chargement du questionnaire...',
        sf36: {
          domainLabels: {
            PF: 'Activité Physique',
            RP: 'Limitations de Rôle — Physique',
            RE: 'Limitations de Rôle — Émotionnel',
            VT: 'Vitalité/Énergie',
            MH: 'Santé Mentale',
            SF: 'Vie et Relations Sociales',
            BP: 'Douleur Physique',
            GH: 'Santé Générale',
          },
          scoreHeader: 'Scores par domaine (0-100, plus élevé = meilleur état de santé perçu) — {answered}/{total} questions complétées',
          responsesLabel: 'réponses',
        },
        pfdi: {
          subscaleLabels: {
            POPDI: 'Prolapsus des Organes Pelviens (POPDI-6)',
            CRADI: 'Colorectal-Anal (CRADI-8)',
            UDI: 'Urinaire (UDI-6)',
          },
          scoreHeader: 'Scores par sous-échelle (0-100, plus élevé = gêne plus importante) — {answered}/{total} questions complétées',
          responsesLabel: 'réponses',
          severityLabels: {
            minimal: 'Symptômes minimes',
            moderate: 'Gêne modérée',
            severe: 'Gêne sévère',
          },
        },
        iciq: {
          severityPrefix: 'Sévérité',
          severityLabels: {
            mild: 'Légère',
            moderate: 'Modérée',
            severe: 'Sévère',
            verySevere: 'Très sévère',
          },
        },
      },
      neuro: {
        calloutHeading: 'Examen Neurologique Objectif',
        calloutDescription: 'Examen clinique en plusieurs étapes : nerfs crâniens, réflexes, signes pathologiques, sensibilité, force musculaire, coordination, équilibre et marche, avec un résumé final.',
        startExamLabel: "Démarrer l'Examen",
        loading: 'Chargement des tests...',
        errorLoadingTests: 'Impossible de charger les tests neurologiques.',
        categoryLabels: {
          cranial_nerves: 'Nerfs Crâniens',
          reflexes: 'Réflexes',
          sensation: 'Sensibilité',
          strength: 'Force Musculaire',
          coordination: 'Coordination',
          balance_gait: 'Équilibre et Marche',
        },
        procedureLabel: 'Procédure',
        interpretationLabel: 'Interprétation',
      },
      functional: {
        loading: 'Chargement du contenu...',
        errorLoadingScales: 'Impossible de charger les échelles fonctionnelles.',
        yesLabel: 'Oui',
        noLabel: 'Non',
        secondsUnit: 'secondes',
        secondsMax120Unit: 'secondes (max 120)',
        metersUnit: 'mètres',
        groupLabels: {
          balanceFalls: 'Équilibre et Risque de Chute',
          adl: 'Autonomie dans les Activités Quotidiennes',
          cognitiveConsciousness: 'État Cognitif et de Conscience',
          painTone: 'Douleur et Tonus Musculaire',
          aerobicQol: 'Capacité Aérobie et Qualité de Vie',
          strokeNeurodegenerative: 'AVC et Maladies Neurodégénératives',
          upperLimb: 'Membre Supérieur',
          orthopedics: 'Orthopédie et Récupération Post-Chirurgicale',
          trunkGlobalDisability: 'Contrôle du Tronc et Handicap Global',
        },
      },
    },
    metabolicCalculator: {
      badge: 'Calculateur Métabolique',
      heading: 'Profil Métabolique',
      subtitle: 'Estimez la dépense énergétique et la répartition des macronutriments en moins d\'une minute.',
      disclaimer: 'Ces valeurs sont des estimations à titre informatif et de planification, et ne remplacent pas un avis médical ou nutritionnel individualisé.',
      sexLabel: 'Sexe',
      sexOptions: { male: 'Homme', female: 'Femme' },
      ageLabel: 'Âge',
      weightLabel: 'Poids (kg)',
      heightLabel: 'Taille (cm)',
      activityLabel: "Niveau d'Activité",
      activityLevels: {
        sedentary: 'Sédentaire',
        light: 'Légèrement Actif',
        moderate: 'Modérément Actif',
        very: 'Très Actif',
        extreme: 'Extrêmement Actif',
      },
      bodyFatLabel: 'Masse Grasse (%)',
      bodyFatOptionalHint: "Facultatif — si indiquée, l'estimation utilise votre masse maigre réelle au lieu d'une moyenne statistique.",
      goalLabel: 'Objectif',
      goals: {
        maintain: 'Maintien du Poids',
        fat_loss: 'Perte de Graisse',
        muscle_gain: 'Prise de Muscle',
        performance: 'Performance',
      },
      macroStrategyLabel: 'Stratégie Macro',
      macroStrategies: {
        balanced: 'Équilibrée',
        high_protein: 'Riche en Protéines',
        high_carb: 'Riche en Glucides',
        low_carb: 'Pauvre en Glucides',
        custom: 'Personnalisée',
      },
      calculateCta: 'Calculer',
      recalculateCta: 'Recalculer',
      invalidInputWarning: 'Vérifiez les données saisies : certaines valeurs semblent hors d\'une plage plausible.',
      resultsHeading: 'Votre Profil Métabolique',
      bmrLabel: 'Métabolisme de Base (BMR)',
      tdeeLabel: 'Dépense Énergétique Totale (TDEE)',
      bmiLabel: 'IMC',
      bmiCategories: {
        underweight: 'Insuffisance Pondérale',
        normal: 'Poids Normal',
        overweight: 'Surpoids',
        obese: 'Obésité',
      },
      leanBodyMassLabel: 'Masse Maigre Estimée',
      fatMassLabel: 'Masse Grasse Estimée',
      estimateNote: 'Une estimation, pas une mesure clinique exacte.',
      calorieTargetLabel: 'Objectif Calorique Quotidien',
      calorieScenariosHeading: 'Scénarios Caloriques',
      kcalPerDaySuffix: 'kcal/jour',
      macronutrientsHeading: 'Macronutriments',
      proteinLabel: 'Protéines',
      carbsLabel: 'Glucides',
      fatLabel: 'Lipides',
      perKgSuffix: 'g/kg',
      editMacrosCta: 'Modifier les Pourcentages',
      doneEditingCta: 'Terminé',
      saveCta: 'Enregistrer sur le Profil',
      saveToPatientCta: 'Enregistrer sur le Patient',
      selectPatientPrompt: 'Sélectionnez un patient',
      savedConfirmation: 'Enregistré',
      historyHeading: 'Historique Métabolique',
      noHistoryYet: 'Aucun profil enregistré pour le moment.',
      todaysTargetHeading: "Objectif d'Aujourd'hui",
      activityLevelLabel: "Niveau d'Activité",
      printCta: 'Exporter en PDF',
      printedForLabel: 'Profil pour',
      printedOnLabel: 'Généré le',
      adaptiveBadge: 'Phygo Adapt',
      adaptiveHeading: 'Votre TDEE Réel',
      adaptiveExplain: "Calculé à partir de l'évolution de poids réellement enregistrée — plus fiable que la seule formule, car basé sur ce qui s'est vraiment passé, pas seulement sur une estimation statistique.",
      adaptiveDeltaAbove: 'Votre métabolisme réel semble plus élevé que l\'estimation : {value} kcal/jour de plus.',
      adaptiveDeltaBelow: 'Votre métabolisme réel semble plus bas que l\'estimation : {value} kcal/jour de moins.',
      adaptiveDeltaMatch: "Votre métabolisme réel correspond à l'estimation calculée.",
      adaptiveBasedOn: 'Basé sur {days} jours et {entries} relevés.',
      adaptiveNotEnoughData: "Continuez à enregistrer vos données : avec au moins deux relevés espacés de 10 jours ou plus, Phygo calibrera votre TDEE réel sur votre tendance de poids effective.",
      goalWeightLabel: 'Poids Objectif (kg)',
      goalWeightPlaceholder: 'ex. 70',
      goalWeightHint: "Indiquez un poids objectif pour voir une estimation du moment où vous pourriez l'atteindre, selon votre rythme réel.",
      projectionHeading: "Estimation de l'Objectif",
      projectionAchievable: 'À votre rythme actuel, vous pourriez atteindre votre objectif en environ {days} jours (~{date}).',
      projectionWrongDirection: 'Votre tendance de poids actuelle évolue dans la direction opposée à cet objectif.',
      projectionNoProgress: "Votre poids est resté stable sur la période observée : pas encore assez de mouvement pour estimer une date.",
      weightTrendHeading: 'Évolution du Poids',
      foodExamplesCta: 'Exemples d\'Aliments',
      hideFoodExamplesCta: 'Masquer les Exemples d\'Aliments',
      foodExamplesDisclaimer: "Valeurs générales et indicatives, non spécifiques à un produit ou une marque — une référence pour se faire une idée, pas un plan de repas.",
      perHundredGramsSuffix: '/100g',
    },
    myPhygoLife: {
      badge: 'Phygo Life',
      heading: 'Votre Vie, Suivie',
      subtitle: 'Des outils pour prendre soin de vous chaque jour, au-delà des séances avec votre kinésithérapeute.',
      metabolicCardTitle: 'Profil Métabolique',
      metabolicCardSubtitle: 'Découvrez vos besoins caloriques et la répartition idéale de protéines, glucides et lipides.',
      backToHome: "Retour à l'Accueil",
      noProfileYet: "Vous n'avez pas encore calculé votre profil métabolique.",
      startCalculatorCta: 'Calculez Votre Profil',
      recalculatePrompt: 'Voulez-vous mettre à jour vos données ?',
      scaleReminderHeading: "Pas de balance ? Voici nos recommandations.",
      scaleReminderCta: 'Voir les balances recommandées',
    },
    neuroExam: {
      backToClinicalToolkit: 'Retour à Clinical Toolkit',
      badge: 'Examen Objectif',
      heading: 'Examen Neurologique',
      sectionCounterSeparator: 'sur',
      backButton: 'Retour',
      nextButton: 'Suivant',
      viewSummaryButton: 'Voir le Résumé',
      editAnswersButton: 'Modifier les réponses',
      finishButton: 'Terminer',
      summaryHeading: "Résumé de l'Examen Neurologique",
      loading: 'Chargement...',
      errorLoading: "Impossible de charger le contenu de l'examen.",
      sections: {
        consciousness: 'État de Vigilance et de Conscience',
        cortical_functions: 'Fonctions Corticales Supérieures',
        stance_gait: 'Station Debout et Marche',
        strength_tone: 'Force, Trophicité et Tonus Musculaire',
        reflexes: 'Réflexes Ostéotendineux et Superficiels',
        sensation: 'Sensibilité',
        cerebellar: 'Épreuves Cérébelleuses',
        cranial_nerves: 'Nerfs Crâniens',
        involuntary_movements: 'Mouvements Involontaires',
        meningeal_signs: 'Signes Méningés',
      },
    },
    patients: {
      eyebrow: 'Dashboard',
      greetingMorning: 'Bonjour',
      greetingAfternoon: 'Bon après-midi',
      greetingEvening: 'Bonsoir',
      greetingDefault: 'Bon retour',
      subtitle: 'Voici votre liste de patients',
      newPatient: 'Nouveau patient',
      cancel: 'Annuler',
      statPatients: 'Patients',
      statNotesThisMonth: 'Notes ce mois-ci',
      statActivePlans: 'Plans actifs',
      searchPlaceholder: 'Rechercher des patients par nom...',
      formNameLabel: 'Nom',
      formGenderLabel: 'Genre',
      genderMale: 'Homme',
      genderFemale: 'Femme',
      genderNotSpecified: 'Non spécifié',
      formAgeLabel: 'Âge',
      formConditionLabel: 'Condition principale',
      savingButton: 'Enregistrement...',
      savePatientButton: 'Enregistrer le patient',
      noPatientsYet: 'Aucun patient pour le moment. Ajoutez-en un pour commencer.',
      noPatientsMatch: 'Aucun patient ne correspond à "{search}".',
      yearsOld: '{age} ans',
      patientNotFound: 'Patient introuvable.',
      portalActive: 'Portail actif',
      scheduleButton: 'Agenda',
      generateNewNoteButton: 'Générer une nouvelle note',
      generatingInvite: 'Génération...',
      inviteToPortalButton: 'Inviter au portail',
      resetPortalAccess: "Réinitialiser l'accès au portail",
      resetPortalConfirm: "Cela déconnectera le compte portail actuel de {name}. Il/elle aura besoin d'un nouveau lien d'invitation pour se reconnecter. Continuer ?",
      inviteReadyHeading: "Lien d'invitation prêt — valable 7 jours",
      inviteShareText: "Partagez ceci avec {name} pour qu'il/elle puisse accéder à son portail My Phygo.",
      copied: 'Copié',
      copyButton: 'Copier',
      inviteError: "Impossible de créer l'invitation. Veuillez réessayer.",
      statSessions: 'Séances',
      statLastSession: 'Dernière séance',
      statPatientSince: 'Patient depuis',
      statLinkedItems: 'Éléments liés',
      noteHistoryHeading: 'Historique des notes',
      noNotesYet: 'Aucune note pour ce patient pour le moment.',
      generateFirstNote: 'Générez la première note de séance pour démarrer son historique.',
      noAssessmentRecorded: 'Aucune évaluation enregistrée.',
      treatmentPlanHeading: 'Plan de traitement et références cliniques',
      nothingLinkedYet: 'Rien de lié à {name} pour le moment.',
      treatmentPlanHint: 'Utilisez "Ajouter au Plan de Traitement" / "Utiliser avec le Patient" n\'importe où dans Carte du Corps, Neurologie, Cardiopulmonaire, Oncologie ou Thérapie Manuelle pour construire son historique ici.',
      noteHistorySubtitle: 'Chronologie complète des séances cliniques enregistrées',
      treatmentPlanSubtitle: 'Tests, questionnaires, exercices et références cliniques assignés au parcours de soin',
      openReferenceHint: 'Ouvrir',
      removeTitle: 'Supprimer',
      refTypeExercise: 'Exercice / Technique',
      refTypeClinicalTest: 'Test Clinique',
      refTypeQuestionnaire: 'Questionnaire',
      refTypeCondition: 'Condition',
      refTypeBodyZone: 'Zone Corporelle',
      refTypeProduct: 'Produit',
      refTypeMetabolicProfile: 'Profil Métabolique',
      sinceToday: "Aujourd'hui",
      since1Day: '1 jour',
      sinceDays: '{days} jours',
      since1Month: '1 mois',
      sinceMonths: '{months} mois',
      since1Year: '1 an',
      sinceYears: '{years} ans',
      backToPatientName: 'Retour à {name}',
      sessionNoteTab: 'Note de Séance',
      videoCallTab: 'Appel Vidéo',
      noteSavedMessage: "Note enregistrée dans le dossier de {name}.",
      nutritionHeading: 'Nutrition et profil métabolique',
      nutritionSubtitle: 'Besoins caloriques, macronutriments et évolution du poids dans le temps',
      nutritionEmpty: 'Aucun profil métabolique calculé pour {name} pour le moment.',
      nutritionEmptyHint: 'Calculez un premier profil depuis le Calculateur Métabolique dans Outils Cliniques pour commencer à suivre son évolution ici.',
      weightTrendHeading: 'Évolution du Poids',
      latestProfileLabel: 'Dernier profil',
      newCalculationCta: 'Nouveau Calcul',
      viewFullCalculatorCta: 'Ouvrir dans le Calculateur',
    },
    pelvicFloorAnamnesis: {
      backToPelvicFloor: 'Retour au Plancher Pelvien',
      badge: 'Questionnaire Anamnestique',
      heading: 'Évaluation du Plancher Pelvien',
      sectionCounterSeparator: 'sur',
      backButton: 'Retour',
      nextButton: 'Suivant',
      viewSummaryButton: 'Voir le Résumé',
      editAnswersButton: 'Modifier les réponses',
      finishButton: 'Terminer',
      summaryHeading: 'Résumé Anamnestique',
      loading: 'Chargement...',
      errorLoading: 'Impossible de charger le contenu du questionnaire.',
    },
    firstAid: {
      badge: 'Atlas des Premiers Secours',
      heading: 'Premiers Secours',
      subtitle: "Protocoles comparés entre l'Italie, la France, le Royaume-Uni, l'Espagne et les États-Unis — parce que les directives ne sont pas toujours les mêmes partout.",
      infoBox: "Chaque fiche indique, pour chaque pays, le numéro d'urgence à appeler, l'organisme de santé de référence, le protocole pratique à suivre et la source officielle consultée — pour pouvoir passer rapidement d'un pays à l'autre sans perdre en précision.",
      allFilter: 'Tous',
      loadingTopics: 'Chargement des sujets...',
      errorLoadingTopics: 'Impossible de charger les sujets de premiers secours.',
      backToTopics: 'Tous les sujets',
      errorLoadingTopic: 'Impossible de charger ce sujet de premiers secours.',
      emergencyNumberLabel: "Numéro d'urgence : ",
      governingBodyLabel: 'Organisme de référence : ',
      protocolLabel: 'Protocole',
      notesLabel: 'Notes sur les différences',
      sourceLabel: 'Source : ',
      categoryLabels: {
        rianimazione: 'Réanimation',
        neurologico: 'Neurologique',
        cardiovascolare: 'Cardiovasculaire',
        allergologico: 'Allergique',
        trauma: 'Traumatisme',
        ambientale: 'Environnemental',
        tossicologico: 'Toxicologique',
        organizzazione: 'Organisation',
      },
      countryLabels: {
        Italia: 'Italie',
        Francia: 'France',
        'Regno Unito': 'Royaume-Uni',
        Spagna: 'Espagne',
        USA: 'États-Unis',
      },
    },
    bls: {
      badge: 'BLSD',
      heading: 'Basic Life Support',
      subtitle: 'RCP, DAE et désobstruction des voies aériennes — vérifié selon les directives AHA 2025 (American Heart Association).',
      infoBox: "Le BLSD (Basic Life Support Defibrillation) est l'ensemble des gestes de base qui sauvent — réanimation cardio-pulmonaire, utilisation du défibrillateur et désobstruction des voies aériennes — que tout professionnel de santé devrait pouvoir réaliser seul avant l'arrivée des secours avancés. Chaque fiche ci-dessous présente la procédure complète, les paramètres techniques clés (fréquence, profondeur, rapport compressions/ventilations) et les précautions spécifiques par tranche d'âge, ainsi que les éventuelles évolutions introduites par les directives les plus récentes.",
      errorLoading: 'Impossible de charger les procédures BLSD.',
      positionLabel: 'Position',
      procedureLabel: 'Procédure',
      keyParametersLabel: 'Paramètres Clés',
      precautionsLabel: 'Précautions',
      evidenceLabel: 'Preuves',
      categoryLabels: {
        adult_cpr: 'RCP Adulte',
        child_cpr: 'RCP Pédiatrique',
        infant_cpr: 'RCP Nourrisson',
        choking: 'Désobstruction des Voies Aériennes',
        aed: 'DAE',
        team_dynamics: "Dynamique d'Équipe",
      },
    },
    bodyMap: {
      badge: 'Carte du Corps 3D Interactive',
      calibrationBadge: 'Mode Calibration — touchez le modèle',
      heading: 'Anatomical Navigator',
      subtitle: 'Faites pivoter, zoomez et explorez le modèle anatomique 3D — touchez une zone pour ouvrir ses pathologies, tests et protocoles.',
      legendMuscleZones: 'Zones musculaires',
      legendBoneZones: 'Zones osseuses (rayons X)',
      legendDragScroll: 'Faites glisser pour pivoter, défilez pour zoomer',
      howItWorks: {
        clickZone: {
          label: 'Touchez une zone',
          text: 'Chaque région mise en évidence ouvre sa propre page dédiée : anatomie, biomécanique, tests cliniques et protocoles de rééducation.',
        },
        xray: {
          label: 'Activez les rayons X',
          text: 'Passez en mode squelettique pour explorer 14 groupes osseux, avec leurs fractures et pathologies les plus fréquentes.',
        },
        search: {
          label: 'Recherchez une zone',
          text: 'Pour les zones petites (poignet, cheville, coude), il est plus rapide de taper le nom dans la barre de recherche que de les centrer à la souris.',
        },
      },
      clinicalFooter: 'Contenu clinique fondé sur des classifications et directives vérifiées — Neer, Kibler, AO/Weber, Garden, SOSORT et autres',
      ctaWholeBody: 'Corps Entier / Équilibre et Marche',
      loadingModel: 'Chargement du modèle 3D...',
      searchPlaceholder: 'Rechercher une zone...',
      noZoneFound: 'Aucune zone trouvée',
      dragRotateZoom: 'Faites glisser pour pivoter · défilez pour zoomer',
      xrayLabel: 'Rayons X',
      modelCreditPrefix: 'Modèle 3D :',
      zoneNotFound: 'Zone introuvable.',
      backToBodyMap: 'Carte du Corps',
      zoneTypeSkeletal: 'Structure Osseuse',
      zoneTypeAnatomical: 'Zone Anatomique',
      relatedZonesLabel: 'Zones Liées',
      askPhygoButton: 'Demandez à Phygo à propos de cette zone',
      askPhygoHeadingPrefix: 'Demandez à Phygo à propos de {zone}',
      askPlaceholder: 'Posez une question clinique sur cette région...',
      askGenericError: "Une erreur s'est produite.",
      askGenericErrorRetry: "Une erreur s'est produite. Veuillez réessayer.",
      noExercisesLinked: 'Aucun exercice encore lié à cette zone.',
      seeAllExercises: 'Voir les {count} exercices dans la Bibliothèque Pro →',
      relatedConditionsHeading: 'Pathologies Liées',
      noConditionsLinked: 'Aucune pathologie encore liée à cette zone.',
      sourceCitedAriaLabel: 'Source citée',
      zoneNames: {
        'cervical-spine': 'Rachis Cervical',
        trapezius: 'Trapèze / Trapèze Supérieur',
        shoulder: 'Épaule',
        chest: 'Poitrine / Pectoraux',
        biceps: 'Biceps',
        triceps: 'Triceps',
        elbow: 'Coude',
        forearm: 'Avant-bras',
        'wrist-hand': 'Poignet / Main',
        'core-abdomen': 'Core / Abdomen',
        'thoracic-spine': 'Rachis Thoracique / Haut du Dos',
        'lumbar-spine': 'Rachis Lombaire / Bas du Dos',
        hip: 'Hanche',
        glutes: 'Fessiers',
        quadriceps: 'Quadriceps',
        hamstrings: 'Ischio-jambiers',
        knee: 'Genou',
        calf: 'Mollet',
        'ankle-foot': 'Cheville / Pied',
      },
      boneNames: {
        'bone-cranio': 'Crâne',
        'bone-clavicola-scapola': 'Clavicule et Omoplate',
        'bone-coste-sterno': 'Côtes et Sternum',
        'bone-omero': 'Humérus',
        'bone-radio-ulna': 'Radius et Cubitus',
        'bone-mano': 'Os de la Main',
        'bone-bacino': 'Bassin',
        'bone-sacro': 'Sacrum et Coccyx',
        'bone-femore': 'Fémur',
        'bone-tibia-perone': 'Tibia et Péroné',
        'bone-piede': 'Os du Pied',
        'bone-cervicale': 'Vertèbres Cervicales',
        'bone-dorsale': 'Vertèbres Thoraciques',
        'bone-lombare': 'Vertèbres Lombaires',
      },
    },
    pelvicFloorAtlas: {
      badge: 'Atlas de Santé Pelvienne',
      heading: 'Plancher Pelvien',
      subTabs: { anatomy: 'Anatomie', conditions: 'Pathologies', assessment: 'Évaluation', rehab: 'Rééducation' },
      anatomyHeading: 'Anatomie du Plancher Pelvien',
      anatomyIntro:
        'Muscles, fascias, ligaments et concepts clés qui expliquent comment le plancher pelvien fonctionne comme un système intégré.',
      overviewIntro:
        "Le plancher pelvien est un système musculo-fascial en forme d'entonnoir qui ferme la cavité abdomino-pelvienne par le bas, soutenant la vessie, l'utérus/la prostate et le rectum. Ce n'est pas un bloc musculaire isolé : il travaille en coordination avec la musculature abdominale profonde, le diaphragme respiratoire et la structure conjonctive environnante (fascias et ligaments) pour contrer les pressions intra-abdominales générées par la respiration, la toux, l'effort et le port de charges. Son bon fonctionnement dépend de l'équilibre entre le tonus de repos (fermeture des orifices), la capacité contractile volontaire (continence active) et la capacité de relâchement coordonné (miction, défécation, accouchement). Les sections ci-dessous approfondissent la composante musculaire, la composante fasciale/ligamentaire, et les deux concepts — la théorie du hamac et les synergies musculaires — qui expliquent comment ces éléments travaillent ensemble.",
      conditionsHeading: 'Pathologies Associées',
      conditionsIntro: 'Pathologies organisées par compartiment. Touchez une carte pour les objectifs, tests cliniques et exercices.',
      assessmentHeading: 'Évaluation Clinique',
      assessmentIntro: "Tests cliniques et protocoles d'évaluation manuelle et instrumentale.",
      rehabHeading: 'Rééducation',
      rehabIntro: 'Protocoles d\'exercice, biofeedback, électrostimulation et rééducation pour populations spéciales.',
      loading: 'Chargement...',
      errorStructures: 'Impossible de charger les structures anatomiques.',
      errorConditions: 'Impossible de charger les pathologies.',
      errorTests: "Impossible de charger les tests d'évaluation.",
      errorRehab: 'Impossible de charger les contenus de rééducation.',
      structureCategoryLabels: { muscle: 'Muscles', fascia_ligament: 'Fascias et Ligaments', concept: 'Concepts Clés', nerve: 'Nerfs' },
      structureCategoryLabelsSingular: { muscle: 'Muscle', fascia_ligament: 'Fascia / Ligament', concept: 'Concept Clé', nerve: 'Nerf' },
      compartmentLabels: {
        anterior: 'Compartiment Antérieur',
        central: 'Compartiment Central',
        posterior: 'Compartiment Postérieur',
        systemic: 'Syndromes Systémiques',
      },
      rehabCategoryLabels: {
        kegel: 'Exercice du Plancher Pelvien',
        biofeedback_electrostim: 'Biofeedback et Électrostimulation',
        bladder_training: 'Rééducation Vésicale (Bladder Training)',
        postpartum: 'Rééducation Post-Partum',
        special_population: 'Populations Spéciales',
      },
      imageLabels: {
        femaleSagittal: 'Sagittale — Féminine',
        maleSagittal: 'Sagittale — Masculine',
        inferiorView: 'Vue Inférieure',
        inferiorViewFull: 'Vue Inférieure (Féminine) — plan périnéal, trois compartiments',
      },
      protocolLabel: 'Protocole',
      relatedConditionsHeading: 'Pathologies Associées',
      noConditionsLinked: 'Aucune pathologie encore associée à cette structure.',
      backToAtlas: 'Retour au Plancher Pelvien',
      structureNotFound: 'Structure introuvable.',
      errorLoadingStructure: 'Impossible de charger les données de la structure.',
      anatomySectionLabel: 'Anatomie',
      functionSectionLabel: 'Fonction',
      clinicalRelevanceLabel: 'Pertinence Clinique',
    },
    profilePage: {
      eyebrow: 'Espace Professionnel',
      heading: 'Profil',
      subtitle: 'Les informations que vos patients et confrères voient de vous.',
      photoLabel: 'Photo de profil',
      photoHint: 'Visible par vos patients',
      displayNameLabel: 'Nom affiché',
      displayNamePlaceholder: 'Dr. Andrea Stilfer',
      bioLabel: 'Bio courte',
      bioPlaceholder: 'Quelques lignes sur votre approche et votre expérience...',
      registrationNumberLabel: "Numéro d'Inscription à l'Ordre",
      registrationNumberPlaceholder: 'Ex. Ordre professionnel n° 12345',
      registrationNumberHint: "Facultatif — le format varie selon le pays et l'ordre professionnel.",
      credentialsLabel: 'Formations et certifications',
      credentialPlaceholder: 'Ex. Master en Rééducation du Plancher Pelvien',
      add: 'Ajouter',
      saveProfile: 'Enregistrer le profil',
    },
  },
};
