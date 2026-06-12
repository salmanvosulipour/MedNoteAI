import { FileText } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Privacy Policy</h1>
            <p className="text-sm text-slate-500">MedNote AI</p>
          </div>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <p className="text-xs text-slate-500">Last updated: June 12, 2026</p>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">1. Overview</h2>
            <p>
              MedNote AI ("we", "our", or "us") is committed to protecting the privacy of its users.
              This Privacy Policy explains what information we collect, how we use it, and your rights
              regarding your data. MedNote AI is designed for licensed healthcare professionals and
              is not intended for use by the general public.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">2. Information We Collect</h2>
            <p className="mb-2">We collect the following types of information:</p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600 dark:text-slate-400">
              <li><strong>Account information</strong> — name and email address provided at sign-up via Apple ID or Google</li>
              <li><strong>Clinical notes</strong> — physician-dictated text entered in the app for note generation</li>
              <li><strong>Patient context</strong> — basic information entered by the physician (first name, age, gender, chief complaint) to generate structured notes</li>
              <li><strong>Usage data</strong> — app interactions, feature usage, and session information for service improvement</li>
              <li><strong>Device information</strong> — device type and a device identifier for security purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600 dark:text-slate-400">
              <li>To generate AI-powered medical notes and clinical documentation</li>
              <li>To provide, maintain, and improve the MedNote AI service</li>
              <li>To manage your account and subscription</li>
              <li>To send transactional emails (e.g., case summaries you export)</li>
              <li>To ensure security and prevent unauthorized access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">4. Third-Party AI Services</h2>
            <p className="mb-2">
              MedNote AI sends physician-dictated clinical text to third-party AI services to generate
              structured medical notes. Specifically:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600 dark:text-slate-400">
              <li>
                <strong>OpenAI</strong> — clinical text and basic patient context (first name, age, gender,
                chief complaint) are sent to OpenAI's API for note generation, text cleanup, and
                diagnostic interpretation. OpenAI's API data usage policies prohibit training on API inputs.
              </li>
              <li>
                <strong>Apple Speech Recognition</strong> — voice dictation is transcribed on-device
                using Apple's built-in speech framework. Audio does not leave your device.
              </li>
            </ul>
            <p className="mt-2">
              No patient data is sold or shared with any third party beyond what is necessary to
              provide the AI note generation service described above.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">5. Data Security</h2>
            <p>
              All data is transmitted over encrypted connections (TLS/HTTPS). We store clinical notes
              in a secured database with access controls. We do not store raw audio recordings.
              Users are responsible for ensuring they comply with applicable healthcare privacy laws
              (including HIPAA) when using this application.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">6. Data Retention</h2>
            <p>
              Your clinical notes and account data are retained as long as your account is active.
              You may request deletion of your account and associated data at any time by contacting
              us at{" "}
              <a href="mailto:support@mednoteai.net" className="text-blue-600 underline">
                support@mednoteai.net
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">7. Children's Privacy</h2>
            <p>
              MedNote AI is intended for licensed healthcare professionals only and is not directed
              at children under 18. We do not knowingly collect data from minors.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">8. Your Rights</h2>
            <p>
              Depending on your jurisdiction, you may have rights to access, correct, or delete your
              personal data. To exercise these rights, contact us at{" "}
              <a href="mailto:support@mednoteai.net" className="text-blue-600 underline">
                support@mednoteai.net
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be
              communicated within the app. Continued use after changes constitutes acceptance
              of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">10. Contact</h2>
            <p>
              For privacy-related questions or requests, contact us at{" "}
              <a href="mailto:support@mednoteai.net" className="text-blue-600 underline">
                support@mednoteai.net
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
