import Navbar from "@/components/Navbar";

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] transition-colors">
      <Navbar />
      <div className="relative max-w-2xl mx-auto pt-40 pb-24 px-6">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#4F7CFF] mb-3">
          Legal
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink dark:text-white mb-8">
          Privacy Policy
        </h1>

        <div className="space-y-6 text-sm leading-relaxed text-ink/70 dark:text-white/70">
          <p className="text-ink/40 dark:text-white/40 text-xs">
            Last updated: [date] — Draft pending legal review by a qualified data protection professional.
          </p>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">1. Who we are and scope</h2>
            <p>
              Phygo ("we", "us", "the Service") provides AI-assisted clinical documentation tools for
              physiotherapists. This policy explains what personal data we process, on what legal basis,
              and what rights you have. It applies to practitioners who use Phygo directly and, indirectly,
              to the patients whose clinical data practitioners enter into the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">2. Roles: controller and processor</h2>
            <p>
              For account and billing data, Phygo acts as data controller. For clinical and patient data
              entered by a practitioner, the practitioner is the data controller and Phygo acts as data
              processor, processing that data only on the practitioner's documented instructions and for
              the purpose of providing the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">3. Special category data (health data)</h2>
            <p>
              Clinical notes, assessments, and treatment plans constitute health data under Article 9 of
              the GDPR. This data is processed based on the practitioner's own legal basis for treating
              the patient (typically necessity for healthcare purposes, or explicit consent collected by
              the practitioner). Phygo does not independently determine the legal basis for processing
              patient data — this responsibility sits with the practitioner as controller.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">4. Data we collect</h2>
            <p>
              <strong>Account data:</strong> name, email, password (hashed), practice information.
              <br />
              <strong>Clinical data:</strong> voice transcripts, SOAP notes, exercise plans, uploaded
              diagnostic documents, and any other content entered by the practitioner during a session.
              <br />
              <strong>Usage data:</strong> log data, device information, and interaction data needed to
              operate and secure the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">5. How we use data</h2>
            <p>
              To generate AI-assisted clinical documentation, provide the Service and its features
              (Clinical Insights, Rehab Protocol, Phygo Science), maintain security, and communicate
              essential service updates. We do not use clinical data to train third-party AI models, and
              we do not sell personal or clinical data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">6. Sub-processors</h2>
            <p>
              We rely on the following sub-processors to operate the Service, each bound by a Data
              Processing Agreement:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Supabase (database and authentication, EU region)</li>
              <li>OpenAI (AI-assisted note generation via API — data is not used to train OpenAI's models under API terms)</li>
              <li>Vercel (application hosting)</li>
              <li>Resend (transactional email delivery)</li>
            </ul>
            <p className="mt-2">
              An up-to-date list of sub-processors is available on request.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">7. International data transfers</h2>
            <p>
              Where a sub-processor is located outside the European Economic Area, transfers are governed
              by the European Commission's Standard Contractual Clauses or an equivalent adequacy
              mechanism.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">8. Data minimization toward AI processing</h2>
            <p>
              Where technically feasible, we aim to limit direct patient identifiers (e.g. full legal
              name) sent to AI processing endpoints, retaining them only where necessary for the
              functionality requested.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">9. Data retention</h2>
            <p>
              Clinical data is retained for as long as the practitioner's account is active, or as
              required by applicable healthcare record-keeping obligations, whichever is longer. Upon
              account closure, data is deleted or anonymized within a reasonable period, subject to legal
              retention requirements.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">10. Security measures</h2>
            <p>
              We apply encryption in transit and at rest, role-based access controls, Row Level Security
              on clinical data tables, and authenticated access only. No system is completely secure; we
              maintain incident response procedures to address any breach.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">11. Data breach notification</h2>
            <p>
              In the event of a personal data breach likely to result in a risk to individuals, we will
              notify the relevant supervisory authority within 72 hours where required, and notify
              affected practitioners without undue delay.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">12. Your rights</h2>
            <p>
              Subject to applicable law, you (or, for patient data, the practitioner acting on the
              patient's behalf) may request access, rectification, erasure, restriction of processing,
              data portability, or object to processing. Requests can be sent to the contact below. We
              will respond within the timeframes required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">13. Automated decision-making</h2>
            <p>
              Phygo generates AI-assisted suggestions (clinical notes, exercise recommendations) that are
              always reviewed and approved by the practitioner before use. Phygo does not make autonomous
              clinical decisions about patients.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">14. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. Material changes will be communicated to
              account holders in advance where possible.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">15. Contact and complaints</h2>
            <p>
              Questions or requests regarding this policy:{" "}
              <a href="mailto:hello@phygo.app" className="text-[#4F7CFF] hover:underline">
                hello@phygo.app
              </a>
              . You also have the right to lodge a complaint with your national data protection
              supervisory authority.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
