import type { LegalDict } from './types';

// Original wording of app/privacy, app/terms and app/contact, moved here
// unchanged so every language renders from the same structure.
export const en: LegalDict = {
  contents: 'On this page',
  privacy: {
    metaTitle: 'Privacy Policy — PHYGO',
    metaDescription:
      'How PHYGO processes personal and clinical data: roles, health data, sub-processors, retention, security and your rights.',
    eyebrow: 'Legal',
    title: 'Privacy Policy',
    updated: 'Last updated: [date] — Draft pending legal review by a qualified data protection professional.',
    sections: [
      {
        title: '1. Who we are and scope',
        blocks: [
          'Phygo ("we", "us", "the Service") provides AI-assisted clinical documentation tools for physiotherapists. This policy explains what personal data we process, on what legal basis, and what rights you have. It applies to practitioners who use Phygo directly and, indirectly, to the patients whose clinical data practitioners enter into the Service.',
        ],
      },
      {
        title: '2. Roles: controller and processor',
        blocks: [
          "For account and billing data, Phygo acts as data controller. For clinical and patient data entered by a practitioner, the practitioner is the data controller and Phygo acts as data processor, processing that data only on the practitioner's documented instructions and for the purpose of providing the Service.",
        ],
      },
      {
        title: '3. Special category data (health data)',
        blocks: [
          "Clinical notes, assessments, and treatment plans constitute health data under Article 9 of the GDPR. This data is processed based on the practitioner's own legal basis for treating the patient (typically necessity for healthcare purposes, or explicit consent collected by the practitioner). Phygo does not independently determine the legal basis for processing patient data — this responsibility sits with the practitioner as controller.",
        ],
      },
      {
        title: '4. Data we collect',
        blocks: [
          '**Account data:** name, email, password (hashed), practice information.',
          '**Clinical data:** voice transcripts, SOAP notes, exercise plans, uploaded diagnostic documents, and any other content entered by the practitioner during a session.',
          '**Usage data:** log data, device information, and interaction data needed to operate and secure the Service.',
        ],
      },
      {
        title: '5. How we use data',
        blocks: [
          'To generate AI-assisted clinical documentation, provide the Service and its features (Clinical Insights, Rehab Protocol, Phygo Science), maintain security, and communicate essential service updates. We do not use clinical data to train third-party AI models, and we do not sell personal or clinical data to third parties.',
        ],
      },
      {
        title: '6. Sub-processors',
        blocks: [
          'We rely on the following sub-processors to operate the Service, each bound by a Data Processing Agreement:',
          {
            list: [
              'Supabase (database and authentication, EU region)',
              "OpenAI (AI-assisted note generation via API — data is not used to train OpenAI's models under API terms)",
              'Vercel (application hosting)',
              'Resend (transactional email delivery)',
            ],
          },
          'An up-to-date list of sub-processors is available on request.',
        ],
      },
      {
        title: '7. International data transfers',
        blocks: [
          "Where a sub-processor is located outside the European Economic Area, transfers are governed by the European Commission's Standard Contractual Clauses or an equivalent adequacy mechanism.",
        ],
      },
      {
        title: '8. Data minimization toward AI processing',
        blocks: [
          'Where technically feasible, we aim to limit direct patient identifiers (e.g. full legal name) sent to AI processing endpoints, retaining them only where necessary for the functionality requested.',
        ],
      },
      {
        title: '9. Data retention',
        blocks: [
          "Clinical data is retained for as long as the practitioner's account is active, or as required by applicable healthcare record-keeping obligations, whichever is longer. Upon account closure, data is deleted or anonymized within a reasonable period, subject to legal retention requirements.",
        ],
      },
      {
        title: '10. Security measures',
        blocks: [
          'We apply encryption in transit and at rest, role-based access controls, Row Level Security on clinical data tables, and authenticated access only. No system is completely secure; we maintain incident response procedures to address any breach.',
        ],
      },
      {
        title: '11. Data breach notification',
        blocks: [
          'In the event of a personal data breach likely to result in a risk to individuals, we will notify the relevant supervisory authority within 72 hours where required, and notify affected practitioners without undue delay.',
        ],
      },
      {
        title: '12. Your rights',
        blocks: [
          "Subject to applicable law, you (or, for patient data, the practitioner acting on the patient's behalf) may request access, rectification, erasure, restriction of processing, data portability, or object to processing. Requests can be sent to the contact below. We will respond within the timeframes required by applicable law.",
        ],
      },
      {
        title: '13. Automated decision-making',
        blocks: [
          'Phygo generates AI-assisted suggestions (clinical notes, exercise recommendations) that are always reviewed and approved by the practitioner before use. Phygo does not make autonomous clinical decisions about patients.',
        ],
      },
      {
        title: '14. Changes to this policy',
        blocks: [
          'We may update this policy from time to time. Material changes will be communicated to account holders in advance where possible.',
        ],
      },
      {
        title: '15. Contact and complaints',
        blocks: [
          'Questions or requests regarding this policy: hello@phygo.app. You also have the right to lodge a complaint with your national data protection supervisory authority.',
        ],
      },
    ],
  },
  terms: {
    metaTitle: 'Terms of Service — PHYGO',
    metaDescription:
      'The terms that apply to using PHYGO: nature of the Service, eligibility, responsibilities, data ownership and liability.',
    eyebrow: 'Legal',
    title: 'Terms of Service',
    updated: 'Last updated: [date] — Draft pending legal review by a qualified professional.',
    sections: [
      {
        title: '1. Acceptance of terms',
        blocks: [
          'By creating an account or using Phygo, you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the Service.',
        ],
      },
      {
        title: '2. Nature of the Service',
        blocks: [
          'Phygo is a clinical decision support tool that generates AI-assisted documentation, evidence-based suggestions, and exercise recommendations. Phygo does not provide medical diagnoses and does not replace professional clinical judgment. The practitioner using Phygo retains full and sole responsibility for reviewing, editing, and approving all AI-generated content before it is used, saved, or shared with a patient.',
        ],
      },
      {
        title: '3. Eligibility',
        blocks: [
          'The Service is intended for use by licensed or qualified physiotherapy professionals acting in a professional capacity. You represent that you are authorized to practice physiotherapy or an equivalent recognized profession in your jurisdiction.',
        ],
      },
      {
        title: '4. Your account and responsibilities',
        blocks: [
          'You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. You are responsible for obtaining any necessary patient consent for the collection and processing of clinical data through the Service, in accordance with applicable healthcare and data protection law in your jurisdiction.',
        ],
      },
      {
        title: '5. Data ownership',
        blocks: [
          'You (or your practice) retain ownership of all clinical data entered into the Service. Phygo processes this data solely to provide the Service, as described in the Privacy Policy, and does not claim ownership over your clinical records.',
        ],
      },
      {
        title: '6. Acceptable use',
        blocks: [
          'You agree not to use the Service to store or process data you are not legally authorized to handle, to attempt to circumvent security measures, or to use the Service in a manner that could compromise patient safety by relying on AI-generated content without clinical review.',
        ],
      },
      {
        title: '7. Subscription and billing',
        blocks: [
          'Paid plans, where applicable, are billed as described at checkout. Prices and features may change with reasonable prior notice to active subscribers.',
        ],
      },
      {
        title: '8. Service availability',
        blocks: [
          'We aim to provide a reliable Service but do not guarantee uninterrupted availability. We are not liable for damages resulting from planned maintenance or factors outside our reasonable control.',
        ],
      },
      {
        title: '9. Limitation of liability',
        blocks: [
          'The Service is provided "as is" without warranties of any kind. To the maximum extent permitted by law, Phygo is not liable for clinical outcomes, decisions, or actions taken by a practitioner based on AI-generated suggestions. Nothing in these terms limits liability that cannot be limited under applicable law.',
        ],
      },
      {
        title: '10. Termination',
        blocks: [
          'You may close your account at any time. We may suspend or terminate accounts that violate these terms, with notice where reasonably possible. Upon termination, data will be handled as described in our Privacy Policy.',
        ],
      },
      {
        title: '11. Changes to these terms',
        blocks: [
          'We may update these Terms from time to time. Continued use of the Service after changes take effect constitutes acceptance of the updated Terms.',
        ],
      },
      {
        title: '12. Governing law',
        blocks: [
          'These Terms are governed by the laws of [jurisdiction to be confirmed], without regard to conflict of law principles.',
        ],
      },
      { title: '13. Contact', blocks: ['Questions about these Terms: hello@phygo.app'] },
    ],
  },
  contact: {
    metaTitle: 'Contact — PHYGO',
    metaDescription: 'Questions about PHYGO, feedback or a demo request: write to hello@phygo.app.',
    eyebrow: 'Get in touch',
    title: 'Contact us',
    text: 'Questions about Phygo, feedback, or want a demo? Send us an email and we will get back to you.',
    emailLabel: 'Write to us',
  },
};
