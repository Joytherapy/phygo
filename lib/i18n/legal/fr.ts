import type { LegalDict } from './types';

// Faithful French translation of the English legal pages (lib/i18n/legal/en.ts).
// Written with plain spaces before ; : ! ? — frenchTypography() converts them.
export const fr: LegalDict = {
  contents: 'Sur cette page',
  privacy: {
    metaTitle: 'Politique de confidentialité — PHYGO',
    metaDescription:
      'Comment PHYGO traite les données personnelles et cliniques : rôles, données de santé, sous-traitants, conservation, sécurité et vos droits.',
    eyebrow: 'Mentions légales',
    title: 'Politique de confidentialité',
    updated:
      'Dernière mise à jour : [date] — Projet en attente de relecture juridique par un professionnel qualifié en protection des données.',
    sections: [
      {
        title: '1. Qui nous sommes et champ d’application',
        blocks: [
          'Phygo (« nous », « le Service ») fournit des outils de documentation clinique assistée par l’IA destinés aux kinésithérapeutes. La présente politique explique quelles données personnelles nous traitons, sur quelle base juridique et quels sont vos droits. Elle s’applique aux praticiens qui utilisent Phygo directement et, indirectement, aux patients dont les praticiens saisissent les données cliniques dans le Service.',
        ],
      },
      {
        title: '2. Rôles : responsable du traitement et sous-traitant',
        blocks: [
          'Pour les données de compte et de facturation, Phygo agit en qualité de responsable du traitement. Pour les données cliniques et les données des patients saisies par un praticien, le praticien est le responsable du traitement et Phygo agit en qualité de sous-traitant, en ne traitant ces données que sur instructions documentées du praticien et aux fins de la fourniture du Service.',
        ],
      },
      {
        title: '3. Catégories particulières de données (données de santé)',
        blocks: [
          'Les notes cliniques, les bilans et les plans de traitement constituent des données concernant la santé au sens de l’article 9 du RGPD. Ces données sont traitées sur la base juridique propre au praticien pour la prise en charge du patient (généralement la nécessité aux fins de soins de santé, ou le consentement explicite recueilli par le praticien). Phygo ne détermine pas de manière indépendante la base juridique du traitement des données des patients : cette responsabilité incombe au praticien en tant que responsable du traitement.',
        ],
      },
      {
        title: '4. Données que nous collectons',
        blocks: [
          '**Données de compte :** nom, adresse e-mail, mot de passe (haché), informations sur le cabinet.',
          '**Données cliniques :** notes SOAP, programmes d’exercices et tout autre contenu que le praticien enregistre au cours d’une séance. Le texte de la séance (dicté ou saisi) et les éventuelles images de documents diagnostiques importées par le praticien sont transmis au traitement par l’IA pour produire un brouillon de note ou un résumé écrit ; Phygo ne conserve ni la transcription de la séance ni les images importées.',
          '**Données d’utilisation :** données de journalisation, informations sur l’appareil et données d’interaction nécessaires au fonctionnement et à la sécurité du Service.',
        ],
      },
      {
        title: '5. Utilisation des données',
        blocks: [
          'Pour générer une documentation clinique assistée par l’IA, fournir le Service et ses fonctionnalités (Clinical Insights, Rehab Protocol, Phygo Science), en assurer la sécurité et communiquer les informations essentielles sur le service. Nous n’utilisons pas les données cliniques pour entraîner des modèles d’IA tiers et nous ne vendons pas de données personnelles ou cliniques à des tiers.',
        ],
      },
      {
        title: '6. Sous-traitants ultérieurs',
        blocks: [
          'Pour faire fonctionner le Service, nous faisons appel aux sous-traitants ultérieurs suivants, chacun lié par un accord de traitement des données (Data Processing Agreement) :',
          {
            list: [
              'Supabase (base de données et authentification, région UE)',
              'OpenAI (génération de notes assistée par l’IA via API — conformément aux conditions de l’API, les données ne sont pas utilisées pour entraîner les modèles d’OpenAI)',
              'Vercel (hébergement de l’application)',
              'Resend (envoi d’e-mails transactionnels)',
            ],
          },
          'Une liste à jour des sous-traitants ultérieurs est disponible sur demande.',
        ],
      },
      {
        title: '7. Transferts internationaux de données',
        blocks: [
          'Lorsqu’un sous-traitant ultérieur est situé en dehors de l’Espace économique européen, les transferts sont encadrés par les clauses contractuelles types de la Commission européenne ou par un mécanisme d’adéquation équivalent.',
        ],
      },
      {
        title: '8. Minimisation des données transmises au traitement par l’IA',
        blocks: [
          'Lorsque cela est techniquement possible, nous nous efforçons de limiter les identifiants directs des patients (par ex. nom complet) transmis aux services de traitement par l’IA, et ne les conservons que lorsqu’ils sont nécessaires à la fonctionnalité demandée.',
        ],
      },
      {
        title: '9. Conservation des données',
        blocks: [
          'Les données cliniques sont conservées tant que le compte du praticien est actif, ou pendant la durée requise par les obligations applicables de conservation des dossiers de santé, si celle-ci est plus longue. À la clôture du compte, les données sont supprimées ou anonymisées dans un délai raisonnable, sous réserve des obligations légales de conservation.',
        ],
      },
      {
        title: '10. Mesures de sécurité',
        blocks: [
          'Nous appliquons le chiffrement en transit et au repos, des contrôles d’accès fondés sur les rôles, la Row Level Security sur les tables de données cliniques et un accès exclusivement authentifié. Aucun système n’est totalement sûr ; nous maintenons des procédures de réponse aux incidents pour traiter toute violation.',
        ],
      },
      {
        title: '11. Notification des violations de données',
        blocks: [
          'En cas de violation de données personnelles susceptible d’engendrer un risque pour les personnes, nous la notifierons à l’autorité de contrôle compétente dans un délai de 72 heures lorsque cela est requis, et informerons les praticiens concernés dans les meilleurs délais.',
        ],
      },
      {
        title: '12. Vos droits',
        blocks: [
          'Sous réserve du droit applicable, vous (ou, pour les données des patients, le praticien agissant pour le compte du patient) pouvez demander l’accès, la rectification, l’effacement, la limitation du traitement ou la portabilité des données, ou vous opposer au traitement. Les demandes peuvent être adressées au contact ci-dessous. Nous répondrons dans les délais prévus par le droit applicable.',
        ],
      },
      {
        title: '13. Prise de décision automatisée',
        blocks: [
          'Phygo génère des suggestions assistées par l’IA (notes cliniques, recommandations d’exercices) qui sont toujours relues et validées par le praticien avant utilisation. Phygo ne prend aucune décision clinique autonome concernant les patients.',
        ],
      },
      {
        title: '14. Modifications de la présente politique',
        blocks: [
          'Nous pouvons mettre à jour la présente politique de temps à autre. Les modifications importantes seront communiquées à l’avance aux titulaires de compte lorsque cela est possible.',
        ],
      },
      {
        title: '15. Contact et réclamations',
        blocks: [
          'Questions ou demandes concernant la présente politique : hello@phygo.app. Vous avez également le droit d’introduire une réclamation auprès de votre autorité nationale de contrôle de la protection des données.',
        ],
      },
    ],
  },
  terms: {
    metaTitle: 'Conditions d’utilisation — PHYGO',
    metaDescription:
      'Les conditions applicables à l’utilisation de PHYGO : nature du Service, conditions d’accès, responsabilités, propriété des données et limitation de responsabilité.',
    eyebrow: 'Mentions légales',
    title: 'Conditions d’utilisation',
    updated: 'Dernière mise à jour : [date] — Projet en attente de relecture juridique par un professionnel qualifié.',
    sections: [
      {
        title: '1. Acceptation des conditions',
        blocks: [
          'En créant un compte ou en utilisant Phygo, vous acceptez les présentes Conditions d’utilisation et notre Politique de confidentialité. Si vous ne les acceptez pas, n’utilisez pas le Service.',
        ],
      },
      {
        title: '2. Nature du Service',
        blocks: [
          'Phygo est un outil d’aide à la décision clinique qui génère une documentation assistée par l’IA, des suggestions fondées sur les données probantes et des recommandations d’exercices. Phygo ne fournit pas de diagnostic médical et ne remplace pas le jugement clinique du professionnel. Le praticien qui utilise Phygo conserve l’entière et seule responsabilité de relire, modifier et valider tout contenu généré par l’IA avant qu’il ne soit utilisé, enregistré ou partagé avec un patient.',
        ],
      },
      {
        title: '3. Conditions d’accès',
        blocks: [
          'Le Service est destiné aux professionnels de la kinésithérapie diplômés ou qualifiés agissant dans le cadre de leur activité professionnelle. Vous déclarez être autorisé à exercer la kinésithérapie ou une profession reconnue équivalente dans votre juridiction.',
        ],
      },
      {
        title: '4. Votre compte et vos responsabilités',
        blocks: [
          'Vous êtes responsable de la confidentialité de vos identifiants de connexion et de toute activité effectuée depuis votre compte. Il vous appartient d’obtenir, le cas échéant, le consentement nécessaire des patients pour la collecte et le traitement de données cliniques via le Service, conformément au droit de la santé et de la protection des données applicable dans votre juridiction.',
        ],
      },
      {
        title: '5. Propriété des données',
        blocks: [
          'Vous (ou votre cabinet) conservez la propriété de toutes les données cliniques saisies dans le Service. Phygo traite ces données uniquement pour fournir le Service, comme décrit dans la Politique de confidentialité, et ne revendique aucun droit de propriété sur vos dossiers cliniques.',
        ],
      },
      {
        title: '6. Utilisation acceptable',
        blocks: [
          'Vous vous engagez à ne pas utiliser le Service pour stocker ou traiter des données que vous n’êtes pas légalement autorisé à traiter, à ne pas tenter de contourner les mesures de sécurité et à ne pas utiliser le Service d’une manière susceptible de compromettre la sécurité des patients en vous fiant à un contenu généré par l’IA sans relecture clinique.',
        ],
      },
      {
        title: '7. Abonnement et facturation',
        blocks: [
          'Les offres payantes, le cas échéant, sont facturées selon les modalités indiquées lors du paiement. Les prix et les fonctionnalités peuvent évoluer moyennant un préavis raisonnable adressé aux abonnés actifs.',
        ],
      },
      {
        title: '8. Disponibilité du Service',
        blocks: [
          'Nous nous efforçons de fournir un Service fiable, mais ne garantissons pas une disponibilité ininterrompue. Nous ne sommes pas responsables des dommages résultant d’une maintenance programmée ou de facteurs échappant à notre contrôle raisonnable.',
        ],
      },
      {
        title: '9. Limitation de responsabilité',
        blocks: [
          'Le Service est fourni « en l’état », sans garantie d’aucune sorte. Dans toute la mesure permise par la loi, Phygo n’est pas responsable des résultats cliniques, des décisions ou des actions d’un praticien fondés sur des suggestions générées par l’IA. Aucune disposition des présentes conditions ne limite une responsabilité qui ne peut être limitée en vertu du droit applicable.',
        ],
      },
      {
        title: '10. Résiliation',
        blocks: [
          'Vous pouvez clôturer votre compte à tout moment. Nous pouvons suspendre ou résilier les comptes qui enfreignent les présentes conditions, avec un préavis lorsque cela est raisonnablement possible. En cas de résiliation, les données seront traitées comme décrit dans notre Politique de confidentialité.',
        ],
      },
      {
        title: '11. Modifications des présentes conditions',
        blocks: [
          'Nous pouvons mettre à jour les présentes Conditions de temps à autre. La poursuite de l’utilisation du Service après l’entrée en vigueur des modifications vaut acceptation des Conditions mises à jour.',
        ],
      },
      {
        title: '12. Droit applicable',
        blocks: [
          'Les présentes Conditions sont régies par le droit de [juridiction à confirmer], sans égard aux principes de conflit de lois.',
        ],
      },
      { title: '13. Contact', blocks: ['Questions concernant les présentes Conditions : hello@phygo.app'] },
    ],
  },
  contact: {
    metaTitle: 'Contact — PHYGO',
    metaDescription: 'Questions sur PHYGO, remarques ou demande de démo : écrivez à hello@phygo.app.',
    eyebrow: 'Nous écrire',
    title: 'Nous contacter',
    text: 'Des questions sur Phygo, des remarques ou envie d’une démo ? Envoyez-nous un e-mail et nous vous répondrons.',
    emailLabel: 'Nous écrire',
  },
};
