import Navbar from "@/components/Navbar";

export default function TermsPage() {
  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] transition-colors">
      <Navbar />
      <div className="relative max-w-2xl mx-auto pt-40 pb-24 px-6">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#4F7CFF] mb-3">
          Legal
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink dark:text-white mb-8">
          Terms of Service
        </h1>

        <div className="space-y-6 text-sm leading-relaxed text-ink/70 dark:text-white/70">
          <p className="text-ink/40 dark:text-white/40 text-xs">
            Last updated: [date] — Draft pending legal review by a qualified professional.
          </p>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">1. Acceptance of terms</h2>
            <p>
              By creating an account or using Phygo, you agree to these Terms of Service and our Privacy
              Policy. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">2. Nature of the Service</h2>
            <p>
              Phygo is a clinical decision support tool that generates AI-assisted documentation,
              evidence-based suggestions, and exercise recommendations. Phygo does not provide medical
              diagnoses and does not replace professional clinical judgment. The practitioner using Phygo
              retains full and sole responsibility for reviewing, editing, and approving all
              AI-generated content before it is used, saved, or shared with a patient.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">3. Eligibility</h2>
            <p>
              The Service is intended for use by licensed or qualified physiotherapy professionals acting
              in a professional capacity. You represent that you are authorized to practice physiotherapy
              or an equivalent recognized profession in your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">4. Your account and responsibilities</h2>
            <p>
              You are responsible for maintaining the confidentiality of your login credentials and for
              all activity under your account. You are responsible for obtaining any necessary patient
              consent for the collection and processing of clinical data through the Service, in
              accordance with applicable healthcare and data protection law in your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">5. Data ownership</h2>
            <p>
              You (or your practice) retain ownership of all clinical data entered into the Service.
              Phygo processes this data solely to provide the Service, as described in the Privacy
              Policy, and does not claim ownership over your clinical records.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">6. Acceptable use</h2>
            <p>
              You agree not to use the Service to store or process data you are not legally authorized to
              handle, to attempt to circumvent security measures, or to use the Service in a manner that
              could compromise patient safety by relying on AI-generated content without clinical review.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">7. Subscription and billing</h2>
            <p>
              Paid plans, where applicable, are billed as described at checkout. Prices and features may
              change with reasonable prior notice to active subscribers.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">8. Service availability</h2>
            <p>
              We aim to provide a reliable Service but do not guarantee uninterrupted availability. We
              are not liable for damages resulting from planned maintenance or factors outside our
              reasonable control.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">9. Limitation of liability</h2>
            <p>
              The Service is provided "as is" without warranties of any kind. To the maximum extent
              permitted by law, Phygo is not liable for clinical outcomes, decisions, or actions taken by
              a practitioner based on AI-generated suggestions. Nothing in these terms limits liability
              that cannot be limited under applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">10. Termination</h2>
            <p>
              You may close your account at any time. We may suspend or terminate accounts that violate
              these terms, with notice where reasonably possible. Upon termination, data will be handled
              as described in our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">11. Changes to these terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the Service after changes
              take effect constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">12. Governing law</h2>
            <p>
              These Terms are governed by the laws of [jurisdiction to be confirmed], without regard to
              conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink dark:text-white mb-2">13. Contact</h2>
            <p>
              Questions about these Terms:{" "}
              <a href="mailto:hello@phygo.app" className="text-[#4F7CFF] hover:underline">
                hello@phygo.app
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
