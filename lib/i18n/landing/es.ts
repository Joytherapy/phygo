import type { LandingDict } from '../landingStrings';

export const es: LandingDict = {
  meta: {
    title: 'PHYGO — La plataforma de fisioterapia, del estudio a la práctica clínica',
    description:
      'Para estudiantes de fisioterapia y fisioterapeutas: anatomía 3D, más de {n} condiciones clínicas, cuestionarios y un espacio de estudio — y notas SOAP preparadas por IA que tú revisas, planes de ejercicios y seguimiento de pacientes. Cuenta gratuita.',
    descriptionNoCount:
      'Para estudiantes de fisioterapia y fisioterapeutas: anatomía 3D, una biblioteca de condiciones clínicas, cuestionarios y un espacio de estudio — y notas SOAP preparadas por IA que tú revisas, planes de ejercicios y seguimiento de pacientes. Cuenta gratuita.',
    ogLocale: 'es_ES',
  },
  nav: {
    students: 'Para estudiantes',
    physiotherapists: 'Para fisioterapeutas',
    library: 'Biblioteca',
    trust: 'Privacidad e IA',
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
    eyebrow: 'Para estudiantes de fisioterapia y fisioterapeutas',
    title: 'Una sola plataforma de fisioterapia, desde tu primer examen de anatomía hasta la práctica clínica diaria.',
    sub: 'Los estudiantes aprenden con anatomía 3D, una biblioteca clínica, cuestionarios y un espacio de estudio. Los fisioterapeutas documentan las sesiones con notas SOAP preparadas por IA que revisan ellos, planifican ejercicios y hacen el seguimiento de sus pacientes.',
    cta: 'Empieza gratis',
    note: 'Cuenta gratuita · sin tarjeta de crédito · elige Estudiante o Fisioterapeuta al configurarla',
    imageAlt:
      'Pantalla de sesión de PHYGO: un borrador SOAP de un paciente de prueba con Findings, Assessment, Plan y Follow-up y los botones Download PDF y Save to Patient',
    secondImageAlt: 'Mapa corporal 3D de PHYGO: un modelo anatómico de cuerpo entero',
    caption: 'Pantallas reales de PHYGO con un paciente de prueba sintético.',
    choose: 'Elige tu camino',
    paths: {
      students: {
        title: 'Para estudiantes',
        text: 'Anatomía en 3D, condiciones clínicas, cuestionarios y tu propio espacio de estudio.',
        link: 'Ver el camino para estudiantes',
      },
      physiotherapists: {
        title: 'Para fisioterapeutas',
        text: 'Notas de sesión, planes de ejercicios, seguimiento de pacientes y Agenda en un solo lugar.',
        link: 'Ver el camino para fisioterapeutas',
      },
    },
  },
  students: {
    eyebrow: 'Para estudiantes',
    title: 'Estudia con el conocimiento con el que trabajan los clínicos.',
    intro: 'De la anatomía al razonamiento clínico: explora, ponte a prueba y guarda tu material en un solo lugar, a tu ritmo.',
    tablistLabel: 'Herramientas para estudiantes',
    steps: [
      {
        label: 'Anatomía',
        title: 'Explora el cuerpo en 3D',
        text: 'Gira y amplía un modelo anatómico, cambia a rayos X para ver los huesos y abre las condiciones, pruebas y protocolos de cada región.',
        alt: 'Mapa corporal 3D de PHYGO: un modelo anatómico de cuerpo entero con búsqueda por zona y un interruptor de rayos X',
      },
      {
        label: 'Neuroanatomía',
        title: 'Cerebro, nervios y circuitos',
        text: 'Un cerebro en 3D con sus estructuras profundas, además de nervios periféricos y circuitos neuronales, vinculados a las condiciones neurológicas de la biblioteca.',
        alt: 'Mapa cerebral de PHYGO: un modelo 3D giratorio del cerebro humano',
      },
      {
        label: 'Cuestionarios',
        title: 'Ponte a prueba',
        text: 'Cuestionarios de 14 materias en tres niveles, con preguntas generadas a partir del contenido de PHYGO y tu progreso materia por materia.',
        alt: 'Página de cuestionarios de PHYGO con 14 materias, de anatomía y biología a oncología y suelo pélvico',
      },
      {
        label: 'Workspace',
        title: 'Tu espacio de estudio',
        text: 'Importa y anota PDF, organiza cuadernos y carpetas y retoma donde lo dejaste. Selecciona un texto del PDF para buscarlo en la biblioteca de PHYGO.',
        alt: 'Workspace de PHYGO con un documento para continuar, tres carpetas, dos cuadernos y dos PDF con su progreso de lectura',
      },
    ],
    extrasTitle: 'También incluye',
    extras: [
      'Evidence Hub: nuevos ensayos y revisiones de PubMed, resumidos con la misma estructura clínica',
      'Bibliotecas especializadas: medicina deportiva, cardiopulmonar, suelo pélvico, oncología, primeros auxilios y SVB',
      'Ask PHYGO, un asistente para tus preguntas, con límites por hora',
    ],
    cta: 'Empieza gratis como estudiante',
    ctaNote: 'Elige «Estudiante» al configurar tu cuenta. Las herramientas de pacientes y las notas de sesión con IA son para cuentas profesionales; puedes cambiarte cuando tengas el título.',
    caption: 'Pantallas reales de PHYGO; el contenido del workspace es de ejemplo.',
  },
  physiotherapists: {
    eyebrow: 'Para fisioterapeutas',
    title: 'De la sesión al seguimiento, en un solo flujo.',
    intro: 'PHYGO prepara cada borrador; tú decides qué se guarda y qué se comparte con tu paciente.',
    tablistLabel: 'Pasos del flujo de trabajo',
    steps: [
      {
        label: 'Sesión',
        title: 'Dicta o escribe',
        text: 'Cuenta la sesión en voz alta o escribe tus notas en español, inglés, italiano o francés. El dictado usa el reconocimiento de voz del navegador (en Chrome, el audio lo procesa el proveedor del navegador).',
        alt: 'Pantalla de sesión de PHYGO mientras se prepara el borrador: las observaciones escritas de un paciente de prueba sobre los campos vacíos Findings, Assessment, Plan y Follow-up',
      },
      {
        label: 'Nota SOAP',
        title: 'Revisa el borrador y su razonamiento',
        text: 'PHYGO prepara Subjetivo, Objetivo, Valoración y Plan, y muestra su razonamiento con prudencia: hipótesis, diagnósticos diferenciales, banderas rojas e información que falta. Puedes editarlo todo antes de guardar.',
        alt: 'Panel de razonamiento clínico de un borrador: hipótesis, consideraciones diferenciales, hallazgos a favor, información que falta, valoraciones sugeridas y banderas rojas',
      },
      {
        label: 'Ejercicios',
        title: 'Prescribe ejercicios y fases',
        text: 'Los ejercicios propuestos incluyen series, repeticiones y frecuencia, y se ajustan al protocolo por fases de la condición cuando la biblioteca tiene uno. Cada uno lo mantienes, lo ajustas o lo quitas.',
        alt: 'Ejercicios con series y repeticiones, cada uno con botones de editar y eliminar, sobre un protocolo de rehabilitación en tres fases con objetivos y criterios de progresión',
      },
      {
        label: 'Seguimiento',
        title: 'Compártelo en My Phygo',
        text: 'Al guardar, la nota pasa a la historia del paciente. Tu paciente, invitado por ti, ve en My Phygo el resumen, los ejercicios y el historial de sesiones: solo lo que has guardado.',
        alt: 'Vista del paciente en My Phygo: resumen de la última sesión, tres ejercicios con series y repeticiones y el historial de sesiones',
      },
    ],
    extrasTitle: 'Alrededor de la sesión',
    extras: [
      'Historias de pacientes con el historial de sesiones',
      'Agenda con las solicitudes de cita enviadas desde My Phygo',
      'Pruebas ortopédicas, escalas funcionales, exploración neurológica y cuestionarios de suelo pélvico',
      'PDF de la nota con ejercicios, resumen para el paciente y protocolo de rehabilitación',
      'Resumen escrito de un informe o una imagen que subas, con su incertidumbre: no es un diagnóstico y la imagen no se guarda',
      'Eventos: cursos, congresos y certificaciones para la formación continua',
    ],
    videoItem: 'Videollamadas con tus pacientes, que se conectan desde My Phygo',
    cta: 'Empieza gratis como fisioterapeuta',
    ctaNote: 'Elige «Fisioterapeuta» al configurar tu cuenta. La gestión de pacientes y las notas de sesión con IA se activan cuando PHYGO ha verificado tu colegiación profesional.',
    caption: 'Pantallas reales de PHYGO con un paciente de prueba sintético y contenido de ejemplo.',
    patients: {
      title: '¿Eres paciente?',
      text: 'Se accede a My Phygo por invitación de tu fisioterapeuta. Tras iniciar sesión, por ahora está disponible en inglés.',
      cta: 'Entrar en My Phygo',
    },
  },
  figures: {
    conditions: 'Más de {n} condiciones clínicas con pruebas, banderas rojas y nivel de evidencia',
    conditionsFallback: 'Biblioteca de condiciones clínicas con pruebas, banderas rojas y nivel de evidencia',
    protocols: 'Más de {n} protocolos de rehabilitación por fases',
    protocolsFallback: 'Protocolos de rehabilitación por fases',
    exercises: 'Más de {n} ejercicios con vídeo',
    exercisesFallback: 'Biblioteca de ejercicios con vídeo',
    libraryCta: 'Consulta la biblioteca sin cuenta',
    translationNote: 'Las entradas de la biblioteca en inglés, español y francés están traducidas automáticamente de la fuente italiana y se indican como tales.',
  },
  trust: {
    eyebrow: 'Privacidad e IA',
    title: 'Claros sobre lo que hace la IA y lo que queda en tus manos.',
    intro: 'PHYGO apoya el estudio y la documentación. No diagnostica ni actúa por su cuenta.',
    columns: [
      {
        title: 'Lo que hace la IA',
        items: [
          'Prepara la nota, el razonamiento y las propuestas de ejercicios a partir de lo que dictas o escribes',
          'Resume con prudencia una imagen que subas',
          'Para ello, el texto de la sesión y las imágenes los procesa nuestro proveedor de IA (OpenAI, mediante su API)',
        ],
      },
      {
        title: 'Lo que queda en tus manos',
        items: [
          'Todos los borradores son editables; nada pasa a la historia hasta que lo guardas',
          'Al paciente no le llega nada que no guardes o compartas tú',
          'Las funciones clínicas con IA son para profesionales verificados: cada colegiación se comprueba a mano en el registro público',
        ],
      },
      {
        title: 'Medidas aplicadas',
        items: [
          'Los datos se guardan en la UE (Supabase, Fráncfort); las funciones de la aplicación se ejecutan hoy en EE. UU. (Vercel)',
          'El acceso se comprueba en el servidor en cada solicitud clínica',
          'Reglas de la base de datos separan a los pacientes de cada profesional',
          'Las imágenes subidas no se guardan',
        ],
      },
    ],
    privacy: 'Lee la política de privacidad (borrador)',
  },
  pricing: {
    eyebrow: 'Precios',
    title: 'Gratis hoy, para estudiantes y fisioterapeutas.',
    sub: 'La cuenta gratuita es la única oferta disponible: sin tarjeta de crédito, sin pagos.',
    free: {
      label: 'Disponible hoy',
      name: 'Cuenta gratuita',
      price: 'Gratis',
      items: [
        'Biblioteca clínica, mapas 3D del cuerpo y del cerebro, ejercicios con vídeo',
        'Cuestionarios, Workspace, Evidence Hub y Eventos',
        'Para fisioterapeutas, tras la verificación: pacientes, Agenda, notas SOAP preparadas por IA y My Phygo',
      ],
      limits: 'Ask PHYGO tiene límites por hora y la Pro Library no está incluida.',
      cta: 'Empieza gratis',
    },
    planned: {
      title: 'Planes de pago, más adelante',
      text: 'Los planes Starter, Professional y Clinic están previstos, pero todavía no se pueden comprar. Hoy no se puede pagar nada.',
    },
  },
  faq: {
    eyebrow: 'Preguntas',
    title: 'Preguntas frecuentes',
    items: [
      {
        q: '¿Qué diferencia hay entre una cuenta de estudiante y una de fisioterapeuta?',
        a: 'Las dos son gratuitas e incluyen las bibliotecas, la anatomía 3D, los cuestionarios, el workspace y PHYGO World. La cuenta de fisioterapeuta añade historias de pacientes, Agenda, notas de sesión preparadas por IA e invitaciones a My Phygo cuando PHYGO ha verificado la colegiación profesional.',
      },
      {
        q: '¿Puedo pasar de una cuenta de estudiante a una de fisioterapeuta?',
        a: 'Sí. Cuando tengas el título, cambia al espacio profesional desde tu perfil y envía los datos de tu colegiación para su verificación.',
      },
      {
        q: '¿PHYGO sustituye el juicio clínico?',
        a: 'No. Cada nota, resumen del razonamiento y propuesta de ejercicios es un borrador que el fisioterapeuta revisa, edita y aprueba. El razonamiento se redacta como apoyo prudente a la decisión, con banderas rojas e información que falta a la vista. PHYGO no diagnostica.',
      },
      {
        q: '¿Cómo se tratan los datos de los pacientes?',
        a: 'Los datos se guardan en una base de datos en la UE (Fráncfort); las funciones de la aplicación se ejecutan hoy en EE. UU. Cada profesional accede solo a sus propios pacientes y el acceso se comprueba en el servidor. El texto de la sesión y las imágenes subidas los procesa nuestro proveedor de IA para crear los borradores; PHYGO no guarda las imágenes subidas. El dictado usa el reconocimiento de voz del navegador, que en Chrome procesa el audio a través del proveedor del navegador. Los detalles están en la política de privacidad, que por ahora es un borrador en revisión legal.',
      },
      {
        q: '¿Qué idiomas admite PHYGO?',
        a: 'Las sesiones se pueden dictar o escribir en español, inglés, italiano o francés, y el borrador sigue ese idioma. La web, el registro y la biblioteca clínica pública están en los cuatro; las entradas en inglés, español y francés están traducidas automáticamente de la fuente italiana y se indican como tales. My Phygo, tras iniciar sesión, está por ahora en inglés, salvo el perfil metabólico.',
      },
      {
        q: '¿De dónde sale el contenido de la biblioteca?',
        a: 'Las entradas se elaboran a partir de literatura publicada y guías clínicas. Cada una indica su nivel de evidencia y cita fuentes cuando las hay. La cobertura varía según la condición: usa la biblioteca como punto de partida para tu propio razonamiento.',
      },
    ],
  },
  final: {
    title: 'Del estudio a la práctica, en una sola plataforma.',
    text: 'Crea una cuenta gratuita y elige Estudiante o Fisioterapeuta.',
    cta: 'Empieza gratis',
    note: 'Sin tarjeta de crédito.',
  },
  footer: {
    tagline: 'La plataforma de fisioterapia, del estudio a la práctica clínica.',
    product: 'Producto',
    library: 'Biblioteca',
    pricing: 'Precios',
    privacy: 'Privacidad',
    terms: 'Términos',
    contact: 'Contacto',
    rights: 'Todos los derechos reservados.',
    navLabel: 'Sitio',
    languageLabel: 'Idioma',
  },
};
