import type { LandingDict } from '../landingStrings';

export const es: LandingDict = {
  meta: {
    title: 'PHYGO — El espacio de trabajo clínico para la fisioterapia',
    description:
      'Notas SOAP preparadas por IA que tú revisas y apruebas, más de {n} condiciones clínicas, anatomía 3D y prescripción de ejercicios: un único espacio de trabajo para fisioterapeutas.',
    descriptionNoCount:
      'Notas SOAP preparadas por IA que tú revisas y apruebas, una biblioteca de condiciones clínicas, anatomía 3D y prescripción de ejercicios: un único espacio de trabajo para fisioterapeutas.',
    ogLocale: 'es_ES',
  },
  nav: {
    tour: 'Producto',
    library: 'Biblioteca',
    pricing: 'Precios',
    faq: 'Preguntas',
    login: 'Iniciar sesión',
    startFree: 'Empieza gratis',
    openMenu: 'Abrir el menú',
    closeMenu: 'Cerrar el menú',
    language: 'Idioma',
    darkMode: 'Cambiar al tema oscuro',
    lightMode: 'Cambiar al tema claro',
    home: 'Inicio de PHYGO',
    skip: 'Ir al contenido',
  },
  hero: {
    eyebrow: 'El espacio de trabajo clínico para la fisioterapia',
    title: 'De la primera palabra\nal *plan de rehabilitación.*',
    sub: 'PHYGO convierte lo que observas en la sesión en un borrador SOAP estructurado, lo conecta con {conditions}, la anatomía 3D y {exercises} — y deja en tus manos cada decisión clínica.',
    conditionsPhrase: 'más de {n} condiciones clínicas',
    conditionsFallback: 'una biblioteca de condiciones clínicas',
    exercisesPhrase: 'más de {n} ejercicios con vídeo',
    exercisesFallback: 'una biblioteca de ejercicios con vídeo',
    ctaPrimary: 'Empieza gratis',
    ctaSecondary: 'Descubre el producto',
    assurances: ['Gratis para empezar', 'Sin tarjeta de crédito', 'ES · EN · IT · FR'],
    caption: 'Interfaz ilustrativa con un caso de ejemplo. Cada borrador espera tu revisión.',
    stage: {
      windowTitle: 'Sesión · Paciente de ejemplo',
      draft: 'Borrador · sin guardar',
      sidebar: ['Pacientes', 'Copiloto', 'Condiciones', 'Mapa corporal', 'Ejercicios', 'Evidencia'],
      voiceLabel: 'Dictado',
      voiceText: '“…arco doloroso entre 70 y 120 grados, más débil en rotación externa…”',
      linkedLabel: 'Condición vinculada',
      evidence: 'Evidencia: alta',
      exerciseLabel: 'Borrador de ejercicios',
      phasesLabel: 'Fases de rehabilitación',
      reviewSave: 'Revisar y guardar',
      ariaLabel:
        'Interfaz ilustrativa de PHYGO: un borrador de sesión vinculado a la biblioteca clínica, los ejercicios y las fases de rehabilitación',
    },
  },
  proof: {
    conditions: 'condiciones clínicas',
    exercises: 'ejercicios con vídeo',
    protocols: 'protocolos de rehabilitación por fases',
    languages: 'idiomas',
    mapsValue: '3D',
    maps: 'mapas del cuerpo y del cerebro',
  },
  story: {
    eyebrow: 'El producto',
    title: 'Un paciente. *Un único flujo de trabajo.*',
    intro:
      'Sigue un caso de ejemplo dentro de PHYGO: desde lo que escuchas en la sesión hasta un plan de rehabilitación listo para tu aprobación.',
    caseLabel: 'Caso de ejemplo · hombro derecho, 3 semanas',
    chapters: [
      {
        kicker: 'Comprende',
        title: 'Registra la sesión tal como la piensas.',
        text: 'Dicta o escribe tus notas con naturalidad, en español, inglés, italiano o francés. La transcripción se hace en el navegador, sin plantillas rígidas que seguir.',
      },
      {
        kicker: 'Organiza',
        title: 'Un borrador SOAP estructurado, con el razonamiento a la vista.',
        text: 'Subjetivo, objetivo, valoración y plan — con hipótesis, diagnósticos diferenciales, banderas rojas y la información que aún falta, redactados como apoyo a la decisión.',
      },
      {
        kicker: 'Explora',
        title: 'El conocimiento relevante, ya enlazado.',
        text: 'La valoración se vincula con la biblioteca clínica: objetivos, pruebas clínicas, banderas rojas y ejercicios habituales de la condición, a un clic.',
      },
      {
        kicker: 'Prescribe',
        title: 'Ejercicios con dosis, no solo con nombre.',
        text: 'Propuestas de ejercicios con series, repeticiones y frecuencia, ajustadas al protocolo por fases de la condición cuando existe. En la biblioteca de ejercicios, cada ejercicio incluye un vídeo demostrativo.',
      },
      {
        kicker: 'Planifica y revisa',
        title: 'Tú decides qué llega a la historia clínica.',
        text: 'Edita o descarta lo que quieras. Al guardar, el plan y un resumen en lenguaje sencillo quedan disponibles para tu paciente en My Phygo — y puedes exportar un PDF cuando lo necesites.',
      },
    ],
    listening: 'Escuchando',
    languagesPill: 'ES · EN · IT · FR',
    transcript:
      '42 años, dolor en el hombro derecho desde hace tres semanas, tras empezar a entrenar por encima de la cabeza. Arco doloroso entre 70 y 120 grados, más débil en rotación externa contra resistencia. Sin traumatismo ni dolor nocturno.',
    soapLabels: ['Subjetivo', 'Objetivo', 'Valoración', 'Plan'],
    soap: [
      'Dolor en el hombro derecho desde hace 3 semanas, iniciado con el entrenamiento por encima de la cabeza. Sin traumatismo ni dolor nocturno.',
      'Arco doloroso 70–120°. Fuerza reducida en rotación externa contra resistencia.',
      'El cuadro podría ser compatible con un dolor de hombro relacionado con el manguito rotador.',
      'Carga progresiva del manguito rotador y de la musculatura escapular; revisión en 2 semanas.',
    ],
    reasoning: [
      { label: 'Hipótesis', text: 'Posible dolor de hombro relacionado con el manguito rotador' },
      { label: 'Diagnósticos diferenciales', text: 'Considerar dolor referido cervical o capsulitis adhesiva incipiente' },
      { label: 'Banderas rojas', text: 'Ninguna aparente con la información disponible' },
      { label: 'Información que falta', text: 'Intensidad del dolor y una medida de resultado inicial (p. ej., SPADI)' },
    ],
    linkedLabel: 'Vinculada desde la biblioteca',
    region: 'Mapa corporal · Hombro',
    exercises: [
      { name: 'Rotación externa isométrica', dose: '5 × 30 s · a diario' },
      { name: 'Rotación externa en decúbito lateral', dose: '3 × 12 · en días alternos' },
      { name: 'Retracción escapular con banda', dose: '3 × 15 · a diario' },
    ],
    videoLabel: 'Vídeo',
    fromLibrary: 'De la biblioteca de ejercicios',
    phasesLabel: 'Fases de rehabilitación',
    current: 'Actual',
    review: 'Revisar y guardar',
    savedTo: 'Se comparte con el paciente cuando guardas',
    portalTitle: 'My Phygo · vista del paciente',
    portalText:
      'Ahora mismo tu hombro es sensible a la carga por encima de la cabeza. Haz tus tres ejercicios a diario y mantén sin dolor los levantamientos por encima de la cabeza.',
    pdf: 'Exportar PDF',
    caption:
      'Caso de ejemplo con fines ilustrativos. El nombre de la condición y las fases de rehabilitación proceden de la biblioteca real de PHYGO.',
    chapterNav: 'Capítulos de la presentación del producto',
  },
  library: {
    eyebrow: 'Biblioteca clínica',
    title: 'Más de {n} condiciones clínicas.\n*Una única estructura clínica.*',
    titleNoCount: 'Una biblioteca clínica construida\n*en torno a tu razonamiento.*',
    intro:
      'Cuadros ortopédicos, neurológicos, cardiorrespiratorios, oncológicos, de suelo pélvico y muchos más — cada ficha se organiza en torno a las preguntas que te haces en consulta, y se puede consultar libremente sin cuenta.',
    countLabel: 'condiciones y patologías, en directo desde la biblioteca',
    namesLabel: 'Una selección de las condiciones de la biblioteca',
    coverageTitle: 'Qué incluye cada ficha',
    coverageLive: 'Cobertura en directo · {n} fichas',
    fields: {
      goals: 'Objetivos de rehabilitación',
      clinical_tests: 'Pruebas clínicas',
      red_flags: 'Banderas rojas',
      contraindications: 'Contraindicaciones',
      typical_exercises: 'Ejercicios habituales',
      progression_criteria: 'Criterios de progresión',
      return_to_activity_criteria: 'Criterios de vuelta a la actividad',
      outcome_measures: 'Medidas de resultado',
      source: 'Fuentes citadas',
      phased: 'Protocolos de rehabilitación por fases',
    },
    coverageNote:
      'No todas las fichas tienen todavía todos los campos. Cada condición indica su nivel de evidencia y, cuando están disponibles, sus fuentes. La biblioteca apoya el juicio clínico, no lo sustituye.',
    featuredKicker: 'Una ficha real de la biblioteca',
    evidence: 'Evidencia',
    levels: { high: 'Alta', moderate: 'Moderada', low: 'Baja', strong: 'Fuerte' },
    tabs: {
      goals: 'Objetivos',
      clinical_tests: 'Pruebas clínicas',
      red_flags: 'Banderas rojas',
      typical_exercises: 'Ejercicios',
    },
    phasesLabel: 'Fases de rehabilitación',
    excerptTranslated: 'Extracto · traducido de la fuente en italiano',
    excerptSource: 'Extracto de la ficha original',
    openEntry: 'Abrir la ficha completa',
    cta: 'Explorar la biblioteca',
    languages: 'Consúltala en español, inglés, italiano o francés',
    tablistLabel: 'Secciones de {name}',
  },
  anatomy: {
    eyebrow: 'Anatomía y neuroanatomía',
    title: 'Empieza por el cuerpo.\n*Llega a la condición.*',
    intro:
      'Explora modelos 3D interactivos, selecciona una región y accede directamente a las condiciones vinculadas — y, en las regiones del cuerpo, a los programas de ejercicios.',
    body: {
      title: 'Mapa corporal',
      text: 'Un modelo musculoesquelético 3D con regiones seleccionables. Cada región abre sus condiciones y programas de ejercicios asociados.',
      regions: ['Hombro', 'Columna lumbar', 'Rodilla', 'Tobillo'],
      caption: 'Ilustración simplificada — la aplicación usa un modelo 3D interactivo.',
      svgLabel: 'Silueta ilustrativa del cuerpo con regiones seleccionables',
    },
    brain: {
      title: 'Mapa cerebral',
      text: 'Neuroanatomía en 3D: áreas cerebrales y nervios periféricos vinculados a las condiciones neurológicas que tratas, con vistas de referencia como esta.',
      alt: 'Referencia de neuroanatomía de PHYGO: vista lateral del cerebro con los lóbulos, el cerebelo y el tronco encefálico, sus funciones y los síndromes por lesión',
      caption: 'Vista de referencia del mapa cerebral de PHYGO (rótulos en inglés)',
    },
    systemsLabel: 'Y además, exploradores por sistema',
    systems: [
      'Suelo pélvico',
      'Cardiorrespiratorio',
      'Endocrino',
      'Gastrointestinal',
      'Urinario',
      'Inmunitario',
      'Hematología',
      'Oncología',
      'Fascia',
      'Fisiología',
    ],
  },
  tools: {
    eyebrow: 'Evidencia y herramientas profesionales',
    title: 'La estantería de referencia\n*de una consulta moderna.*',
    intro:
      'Investigación, herramientas de valoración y conocimiento especializado — junto al paciente que estás tratando, no en otra pestaña.',
    columns: [
      {
        title: 'Evidencia, filtrada',
        text: 'Cada día se revisan los nuevos estudios de PubMed. Solo se importan ensayos controlados aleatorizados, revisiones sistemáticas y metaanálisis sobre fisioterapia, que después se resumen con una estructura fija.',
        items: [
          'Pregunta clínica, población e intervención',
          'Resultados principales e interpretación clínica',
          'Publicación automática solo por encima de un umbral de calidad',
          'Estudios relacionados junto a los borradores del copiloto',
        ],
      },
      {
        title: 'Herramientas de valoración',
        text: 'Las pruebas y escalas que usas cada semana, a mano mientras escribes.',
        items: [
          'Pruebas ortopédicas especiales',
          'Escalas funcionales y medidas de resultado',
          'Exploración neurológica',
          'Cuestionarios de suelo pélvico',
          'Calculadora metabólica y de necesidades energéticas',
        ],
      },
      {
        title: 'Bibliotecas especializadas',
        text: 'Profundidad más allá de lo musculoesquelético.',
        items: [
          'Medicina deportiva y vuelta al juego',
          'Rehabilitación cardiorrespiratoria y drenaje de secreciones',
          'Rehabilitación del suelo pélvico',
          'Rehabilitación oncológica',
          'Primeros auxilios y SVB por país',
        ],
      },
    ],
  },
  workspace: {
    eyebrow: 'El espacio de trabajo',
    title: 'Tu consulta,\n*conectada.*',
    intro:
      'La documentación y el conocimiento son la mitad del trabajo. PHYGO también reúne en un solo lugar a tus pacientes, tu agenda y tu material de estudio.',
    items: [
      {
        title: 'Pacientes y sesiones',
        text: 'Las notas guardadas, los planes y las referencias clínicas de cada paciente en una sola historia: la siguiente visita empieza donde terminó la anterior.',
      },
      {
        title: 'My Phygo para pacientes',
        text: 'Invita a tus pacientes con un código. Ven el plan, los ejercicios y el resumen que has guardado — nada que no hayas aprobado.',
      },
      { title: 'Agenda', text: 'Programa sesiones y deja que los pacientes vinculados soliciten citas que tú confirmas.' },
      {
        title: 'Documentos y cuadernos',
        text: 'Sube PDF, subraya y anota, lleva cuadernos y pregúntale a PHYGO sobre lo que estás leyendo.',
      },
      {
        title: 'Modo estudiante',
        text: 'Para estudiantes de fisioterapia: el espacio de trabajo, las bibliotecas de conocimiento y cuestionarios por materia y dificultad.',
      },
    ],
  },
  trust: {
    eyebrow: 'Responsabilidad clínica',
    title: 'Pensado para apoyar tu criterio,\n*nunca para sustituirlo.*',
    intro:
      'PHYGO es una herramienta de documentación y conocimiento para profesionales cualificados. No diagnostica y nunca actúa sobre los pacientes sin ti.',
    items: [
      {
        title: 'Borradores, no decisiones',
        text: 'Lo que genera la IA es una propuesta. El razonamiento se formula como apoyo a la decisión y nada llega a la historia del paciente hasta que lo guardas.',
      },
      {
        title: 'Datos con acceso controlado',
        text: 'Almacenados en una base de datos alojada en la UE (Fráncfort), cifrados en tránsito y en reposo, con seguridad a nivel de fila: cada cuenta solo accede a sus propios pacientes.',
      },
      {
        title: 'Procesamiento de IA transparente',
        text: 'Para crear un borrador, el texto de la sesión — y cualquier imagen que subas — lo procesa nuestro proveedor de IA. Los datos clínicos no se usan para entrenar modelos de terceros.',
      },
      {
        title: 'Evidencia que puedes ponderar',
        text: 'Las fichas de la biblioteca indican su nivel de evidencia y citan fuentes cuando están disponibles, para que decidas cuánto peso darles.',
      },
    ],
    privacy: 'Leer la política de privacidad',
  },
  pricing: {
    eyebrow: 'Precios',
    title: 'Planes que crecen\n*con tu consulta.*',
    sub: 'Crea tu cuenta gratis, sin tarjeta de crédito.',
    monthly: 'Mensual',
    annual: 'Anual',
    save: 'Ahorra un 20 %',
    perMonth: '/mes',
    custom: 'A medida',
    popular: 'El más elegido',
    billingLabel: 'Facturación anual',
    tiers: [
      {
        description: 'Para profesionales independientes que empiezan.',
        features: ['50 sesiones al mes', 'Notas clínicas con IA', 'Exportación a PDF', 'Soporte por correo electrónico'],
        cta: 'Empieza gratis',
      },
      {
        description: 'Para consultas a tiempo completo que trabajan cada día.',
        features: [
          'Sesiones ilimitadas',
          'Notas clínicas con IA + resúmenes para el paciente',
          'Biblioteca de ejercicios',
          'Soporte prioritario',
        ],
        cta: 'Empieza gratis',
      },
      {
        description:
          'Para clínicas con varios profesionales. Las funciones de equipo están en desarrollo: cuéntanos qué necesita tu clínica.',
        features: [
          'Todo lo incluido en Professional',
          'Cuentas para varios profesionales (en desarrollo)',
          'Historial de pacientes compartido (en desarrollo)',
          'Incorporación personalizada',
        ],
        cta: 'Contáctanos',
      },
    ],
  },
  faq: {
    eyebrow: 'Preguntas',
    title: 'Lo que nos preguntan\n*los fisioterapeutas.*',
    items: [
      {
        q: '¿PHYGO sustituye mi juicio clínico?',
        a: 'No. PHYGO prepara la documentación y te acerca el conocimiento relevante. Cada nota, resumen del razonamiento y propuesta de ejercicios es un borrador que revisas, editas y apruebas. PHYGO no diagnostica ni contacta con los pacientes por su cuenta.',
      },
      {
        q: '¿Y si la IA se equivoca?',
        a: 'Puede ocurrir; por eso nada llega a la historia del paciente hasta que lo guardas. El razonamiento se redacta como un apoyo prudente a la decisión, con las banderas rojas y la información que falta bien visibles, para que sea fácil contrastarlo con tu propia valoración.',
      },
      {
        q: '¿Cómo se tratan los datos de los pacientes?',
        a: 'Los datos clínicos se almacenan en una base de datos alojada en la UE (Fráncfort), cifrados en tránsito y en reposo, con seguridad a nivel de fila: cada cuenta solo accede a sus propios pacientes. El texto de las sesiones y las imágenes que subes los procesa nuestro proveedor de IA para crear los borradores, y no se usan para entrenar modelos de terceros. Tienes los detalles en la política de privacidad.',
      },
      {
        q: '¿De dónde procede el contenido de la biblioteca?',
        a: 'Las fichas se elaboran a partir de la literatura publicada y de guías clínicas. Cada una indica su nivel de evidencia y cita fuentes cuando están disponibles. La cobertura varía según la condición, así que toma la biblioteca como punto de partida para tu propio razonamiento.',
      },
      {
        q: '¿Qué idiomas admite PHYGO?',
        a: 'Puedes dictar o escribir las sesiones en español, inglés, italiano o francés. La biblioteca pública de condiciones y la biblioteca de ejercicios están disponibles en esos mismos cuatro idiomas.',
      },
      {
        q: '¿Puedo probarlo antes con un caso de ejemplo?',
        a: 'Sí. Crea una cuenta gratuita y usa el copiloto con un caso inventado para ver los borradores que genera antes de usarlo en tu práctica.',
      },
      {
        q: '¿Cuánto cuesta empezar?',
        a: 'Crear una cuenta es gratis y no necesitas tarjeta de crédito.',
      },
    ],
  },
  final: {
    title: 'Dedica tu atención al paciente,\n*no al papeleo.*',
    text: 'Crea una cuenta gratuita y prueba el copiloto, la biblioteca clínica y las herramientas de ejercicios en tu próxima sesión.',
    cta: 'Empieza gratis',
    secondary: 'Explora antes la biblioteca',
    note: 'Sin tarjeta de crédito.',
  },
  footer: {
    tagline: 'El espacio de trabajo clínico para la fisioterapia.',
    product: 'Producto',
    library: 'Biblioteca',
    pricing: 'Precios',
    privacy: 'Privacidad',
    terms: 'Términos',
    contact: 'Contacto',
    rights: 'Todos los derechos reservados.',
    languageLabel: 'Idioma',
  },
  common: { illustrative: 'Ilustrativo' },
};
