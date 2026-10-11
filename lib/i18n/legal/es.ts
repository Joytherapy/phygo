import type { LegalDict } from './types';

// Faithful Spanish translation of the English legal pages (lib/i18n/legal/en.ts).
export const es: LegalDict = {
  contents: 'En esta página',
  privacy: {
    metaTitle: 'Política de privacidad — PHYGO',
    metaDescription:
      'Cómo trata PHYGO los datos personales y clínicos: funciones, datos de salud, subencargados, conservación, seguridad y tus derechos.',
    eyebrow: 'Aviso legal',
    title: 'Política de privacidad',
    updated:
      'Última actualización: [fecha] — Borrador pendiente de revisión legal por parte de un profesional cualificado en protección de datos.',
    sections: [
      {
        title: '1. Quiénes somos y ámbito de aplicación',
        blocks: [
          'Phygo («nosotros», «el Servicio») ofrece herramientas de documentación clínica asistida por IA para fisioterapeutas. Esta política explica qué datos personales tratamos, con qué base jurídica y qué derechos tienes. Se aplica a los profesionales que utilizan Phygo directamente y, de forma indirecta, a los pacientes cuyos datos clínicos introducen los profesionales en el Servicio.',
        ],
      },
      {
        title: '2. Funciones: responsable y encargado del tratamiento',
        blocks: [
          'Respecto a los datos de la cuenta y de facturación, Phygo actúa como responsable del tratamiento. Respecto a los datos clínicos y de pacientes introducidos por un profesional, el profesional es el responsable del tratamiento y Phygo actúa como encargado del tratamiento, y trata esos datos únicamente siguiendo las instrucciones documentadas del profesional y con el fin de prestar el Servicio.',
        ],
      },
      {
        title: '3. Categorías especiales de datos (datos de salud)',
        blocks: [
          'Las notas clínicas, las valoraciones y los planes de tratamiento constituyen datos relativos a la salud en virtud del artículo 9 del RGPD. Estos datos se tratan sobre la base jurídica propia del profesional para tratar al paciente (normalmente, la necesidad con fines de asistencia sanitaria o el consentimiento explícito recabado por el profesional). Phygo no determina de forma independiente la base jurídica del tratamiento de los datos de los pacientes: esta responsabilidad corresponde al profesional como responsable del tratamiento.',
        ],
      },
      {
        title: '4. Datos que recopilamos',
        blocks: [
          '**Datos de la cuenta:** nombre, correo electrónico, contraseña (cifrada mediante hash), información de la consulta.',
          '**Datos clínicos:** transcripciones de voz, notas SOAP, planes de ejercicios, documentos diagnósticos subidos y cualquier otro contenido introducido por el profesional durante una sesión.',
          '**Datos de uso:** datos de registro, información del dispositivo y datos de interacción necesarios para hacer funcionar y proteger el Servicio.',
        ],
      },
      {
        title: '5. Cómo utilizamos los datos',
        blocks: [
          'Para generar documentación clínica asistida por IA, prestar el Servicio y sus funcionalidades (Clinical Insights, Rehab Protocol, Phygo Science), mantener la seguridad y comunicar actualizaciones esenciales del servicio. No utilizamos los datos clínicos para entrenar modelos de IA de terceros y no vendemos datos personales ni clínicos a terceros.',
        ],
      },
      {
        title: '6. Subencargados del tratamiento',
        blocks: [
          'Para hacer funcionar el Servicio recurrimos a los siguientes subencargados del tratamiento, cada uno vinculado por un acuerdo de tratamiento de datos (Data Processing Agreement):',
          {
            list: [
              'Supabase (base de datos y autenticación, región de la UE)',
              'OpenAI (generación de notas asistida por IA mediante API — según las condiciones de la API, los datos no se utilizan para entrenar los modelos de OpenAI)',
              'Vercel (alojamiento de la aplicación)',
              'Resend (envío de correos electrónicos transaccionales)',
            ],
          },
          'Hay una lista actualizada de subencargados disponible previa solicitud.',
        ],
      },
      {
        title: '7. Transferencias internacionales de datos',
        blocks: [
          'Cuando un subencargado se encuentre fuera del Espacio Económico Europeo, las transferencias se rigen por las Cláusulas Contractuales Tipo de la Comisión Europea o por un mecanismo de adecuación equivalente.',
        ],
      },
      {
        title: '8. Minimización de los datos enviados al procesamiento por IA',
        blocks: [
          'Cuando sea técnicamente posible, procuramos limitar los identificadores directos del paciente (p. ej., el nombre legal completo) que se envían a los servicios de procesamiento por IA, y los conservamos solo cuando son necesarios para la funcionalidad solicitada.',
        ],
      },
      {
        title: '9. Conservación de los datos',
        blocks: [
          'Los datos clínicos se conservan mientras la cuenta del profesional esté activa o durante el plazo que exijan las obligaciones aplicables de conservación de la documentación sanitaria, si este fuera mayor. Al cerrar la cuenta, los datos se eliminan o anonimizan en un plazo razonable, sin perjuicio de los requisitos legales de conservación.',
        ],
      },
      {
        title: '10. Medidas de seguridad',
        blocks: [
          'Aplicamos cifrado en tránsito y en reposo, controles de acceso basados en roles, Row Level Security en las tablas de datos clínicos y acceso exclusivamente autenticado. Ningún sistema es completamente seguro; mantenemos procedimientos de respuesta a incidentes para gestionar cualquier brecha.',
        ],
      },
      {
        title: '11. Notificación de brechas de datos',
        blocks: [
          'En caso de una brecha de datos personales que pueda suponer un riesgo para las personas, lo notificaremos a la autoridad de control competente en un plazo de 72 horas cuando así se exija, y avisaremos sin dilación indebida a los profesionales afectados.',
        ],
      },
      {
        title: '12. Tus derechos',
        blocks: [
          'Con sujeción a la legislación aplicable, tú (o, en el caso de los datos de pacientes, el profesional que actúe en nombre del paciente) puedes solicitar el acceso, la rectificación, la supresión, la limitación del tratamiento o la portabilidad de los datos, u oponerte al tratamiento. Las solicitudes pueden enviarse al contacto indicado más abajo. Responderemos dentro de los plazos que exija la legislación aplicable.',
        ],
      },
      {
        title: '13. Decisiones automatizadas',
        blocks: [
          'Phygo genera sugerencias asistidas por IA (notas clínicas, recomendaciones de ejercicios) que el profesional siempre revisa y aprueba antes de su uso. Phygo no toma decisiones clínicas autónomas sobre los pacientes.',
        ],
      },
      {
        title: '14. Cambios en esta política',
        blocks: [
          'Podemos actualizar esta política periódicamente. Los cambios sustanciales se comunicarán con antelación a los titulares de cuentas cuando sea posible.',
        ],
      },
      {
        title: '15. Contacto y reclamaciones',
        blocks: [
          'Preguntas o solicitudes relativas a esta política: hello@phygo.app. También tienes derecho a presentar una reclamación ante la autoridad nacional de control de protección de datos.',
        ],
      },
    ],
  },
  terms: {
    metaTitle: 'Condiciones del servicio — PHYGO',
    metaDescription:
      'Las condiciones que se aplican al uso de PHYGO: naturaleza del Servicio, requisitos, responsabilidades, titularidad de los datos y limitación de responsabilidad.',
    eyebrow: 'Aviso legal',
    title: 'Condiciones del servicio',
    updated: 'Última actualización: [fecha] — Borrador pendiente de revisión legal por parte de un profesional cualificado.',
    sections: [
      {
        title: '1. Aceptación de las condiciones',
        blocks: [
          'Al crear una cuenta o utilizar Phygo, aceptas estas Condiciones del servicio y nuestra Política de privacidad. Si no estás de acuerdo, no utilices el Servicio.',
        ],
      },
      {
        title: '2. Naturaleza del Servicio',
        blocks: [
          'Phygo es una herramienta de apoyo a la decisión clínica que genera documentación asistida por IA, sugerencias basadas en la evidencia y recomendaciones de ejercicios. Phygo no proporciona diagnósticos médicos ni sustituye el juicio clínico profesional. El profesional que utiliza Phygo conserva la responsabilidad plena y exclusiva de revisar, editar y aprobar todo el contenido generado por IA antes de que se utilice, se guarde o se comparta con un paciente.',
        ],
      },
      {
        title: '3. Requisitos',
        blocks: [
          'El Servicio está destinado a profesionales de la fisioterapia colegiados o cualificados que actúen en el ejercicio de su profesión. Declaras que estás autorizado para ejercer la fisioterapia o una profesión reconocida equivalente en tu jurisdicción.',
        ],
      },
      {
        title: '4. Tu cuenta y tus responsabilidades',
        blocks: [
          'Eres responsable de mantener la confidencialidad de tus credenciales de acceso y de toda la actividad realizada con tu cuenta. Eres responsable de obtener el consentimiento necesario de los pacientes para la recogida y el tratamiento de datos clínicos a través del Servicio, de conformidad con la legislación sanitaria y de protección de datos aplicable en tu jurisdicción.',
        ],
      },
      {
        title: '5. Titularidad de los datos',
        blocks: [
          'Tú (o tu consulta) conservas la titularidad de todos los datos clínicos introducidos en el Servicio. Phygo trata estos datos únicamente para prestar el Servicio, tal como se describe en la Política de privacidad, y no reclama la titularidad de tu documentación clínica.',
        ],
      },
      {
        title: '6. Uso aceptable',
        blocks: [
          'Te comprometes a no utilizar el Servicio para almacenar o tratar datos que no estés legalmente autorizado a gestionar, a no intentar eludir las medidas de seguridad y a no utilizar el Servicio de forma que pueda comprometer la seguridad de los pacientes al basarte en contenido generado por IA sin revisión clínica.',
        ],
      },
      {
        title: '7. Suscripción y facturación',
        blocks: [
          'Los planes de pago, cuando corresponda, se facturan según lo indicado en el proceso de compra. Los precios y las funcionalidades pueden cambiar con un preaviso razonable a los suscriptores activos.',
        ],
      },
      {
        title: '8. Disponibilidad del Servicio',
        blocks: [
          'Procuramos ofrecer un Servicio fiable, pero no garantizamos una disponibilidad ininterrumpida. No somos responsables de los daños derivados del mantenimiento programado o de factores ajenos a nuestro control razonable.',
        ],
      },
      {
        title: '9. Limitación de responsabilidad',
        blocks: [
          'El Servicio se presta «tal cual», sin garantías de ningún tipo. En la máxima medida permitida por la ley, Phygo no es responsable de los resultados clínicos, las decisiones ni las acciones que un profesional adopte basándose en sugerencias generadas por IA. Nada de lo dispuesto en estas condiciones limita la responsabilidad que no pueda limitarse conforme a la legislación aplicable.',
        ],
      },
      {
        title: '10. Terminación',
        blocks: [
          'Puedes cerrar tu cuenta en cualquier momento. Podemos suspender o cancelar las cuentas que incumplan estas condiciones, con aviso previo cuando sea razonablemente posible. Tras la terminación, los datos se gestionarán según lo descrito en nuestra Política de privacidad.',
        ],
      },
      {
        title: '11. Cambios en estas condiciones',
        blocks: [
          'Podemos actualizar estas Condiciones periódicamente. El uso continuado del Servicio después de que los cambios entren en vigor constituye la aceptación de las Condiciones actualizadas.',
        ],
      },
      {
        title: '12. Legislación aplicable',
        blocks: [
          'Estas Condiciones se rigen por las leyes de [jurisdicción por confirmar], sin tener en cuenta los principios sobre conflicto de leyes.',
        ],
      },
      { title: '13. Contacto', blocks: ['Preguntas sobre estas Condiciones: hello@phygo.app'] },
    ],
  },
  contact: {
    metaTitle: 'Contacto — PHYGO',
    metaDescription: 'Preguntas sobre PHYGO, comentarios o solicitud de una demo: escribe a hello@phygo.app.',
    eyebrow: 'Ponte en contacto',
    title: 'Contacto',
    text: '¿Tienes preguntas sobre Phygo, quieres darnos tu opinión o pedir una demo? Envíanos un correo electrónico y te responderemos.',
    emailLabel: 'Escríbenos',
  },
};
