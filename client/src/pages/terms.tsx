import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, FileText, CheckCircle } from "lucide-react";
import { resolveUrl } from "@/lib/queryClient";
import { storeUser, clearStoredUser } from "@/hooks/useAuth";
import { getDeviceId } from "@/lib/device";
import { useToast } from "@/hooks/use-toast";

const TERMS_CONTENT = (
  <div className="space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
    <p className="text-xs text-slate-500">Last updated: June 12, 2026</p>

    <section>
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">1. Professional Use Only</h2>
      <p>
        MedNote AI is designed exclusively for licensed healthcare professionals, including physicians,
        nurse practitioners, and physician assistants. By using this application, you confirm that you
        are a licensed medical professional authorized to practice medicine in your jurisdiction.
        Unauthorized use by non-medical personnel is strictly prohibited.
      </p>
    </section>

    <section>
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">2. Educational and Informational Purposes</h2>
      <p>
        This application is provided for <strong>educational and informational purposes only</strong>.
        The AI-generated medical notes, diagnoses, and treatment suggestions are meant to assist in
        documentation and learning — not to serve as definitive medical advice or clinical guidance.
      </p>
    </section>

    <section>
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">3. Not a Replacement for Clinical Judgment</h2>
      <p className="mb-2">
        <strong>MedNote AI does not replace the clinical judgment of a licensed physician.</strong>
        All AI-generated content must be reviewed, verified, and approved by a qualified healthcare
        provider before being used in patient care. The physician remains fully responsible for all
        medical decisions.
      </p>
      <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600 dark:text-slate-400">
        <li>Always verify AI-generated diagnoses and treatment plans</li>
        <li>Do not rely solely on AI suggestions for clinical decision-making</li>
        <li>AI output may contain errors and must be critically evaluated</li>
        <li>The physician assumes full responsibility for all clinical decisions</li>
      </ul>
    </section>

    <section>
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">4. AI Data Processing</h2>
      <p>
        MedNote AI uses OpenAI's API to generate structured medical notes from physician dictation.
        Voice dictation is transcribed on-device using Apple Speech Recognition. The resulting text,
        along with basic patient context (first name, age, gender, chief complaint) provided by the
        physician, is sent to OpenAI for note generation. No patient data is sold or shared with
        third parties beyond OpenAI's API processing. OpenAI's API data usage policies prohibit
        training on API inputs.
      </p>
    </section>

    <section>
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">5. Subscriptions and Billing</h2>
      <p>
        MedNote AI offers auto-renewable subscriptions (monthly and annual) through the Apple App Store.
        Subscriptions automatically renew unless cancelled at least 24 hours before the end of the
        current period. You can manage and cancel subscriptions in your App Store account settings.
        No refunds are provided for unused portions of a subscription period.
      </p>
    </section>

    <section>
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">6. Data Privacy and HIPAA</h2>
      <p>
        We are committed to protecting patient privacy. All data is transmitted over encrypted
        connections (TLS/HTTPS). Do not enter fully identifiable patient information (such as full
        name and date of birth together) unless necessary. Users are responsible for ensuring their
        use of this application complies with applicable privacy laws, including HIPAA, in their
        jurisdiction.
      </p>
    </section>

    <section>
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">7. Limitation of Liability</h2>
      <p>
        By using MedNote AI, you acknowledge and agree that the developers and operators of this
        application are not liable for any clinical decisions made based on AI-generated content.
        The user assumes full responsibility for verifying all information and making appropriate
        clinical judgments. This application is provided "as is" without warranties of any kind.
      </p>
    </section>

    <section>
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">8. Changes to Terms</h2>
      <p>
        We reserve the right to update these Terms of Use at any time. Continued use of the
        application after changes constitutes acceptance of the updated terms. Material changes
        will be communicated within the app.
      </p>
    </section>

    <section>
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">9. Contact</h2>
      <p>
        For questions about these Terms of Use, please contact us at{" "}
        <a href="mailto:support@mednoteai.net" className="text-blue-600 underline">
          support@mednoteai.net
        </a>
        .
      </p>
    </section>
  </div>
);

function PublicTermsView() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Terms of Use</h1>
            <p className="text-sm text-slate-500">MedNote AI — EULA</p>
          </div>
        </div>
        {TERMS_CONTENT}
      </div>
    </div>
  );
}

interface TermsAcceptanceProps {
  requireAcceptance: boolean;
}

function TermsAcceptanceView() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [understandsEducational, setUnderstandsEducational] = useState(false);
  const [understandsNotReplacement, setUnderstandsNotReplacement] = useState(false);

  const acceptTermsMutation = useMutation({
    mutationFn: async () => {
      const storedUser = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();
      const authToken = storedUser?.token;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
      try {
        const deviceId = await getDeviceId();
        headers["X-Device-ID"] = deviceId;
      } catch { }
      const res = await fetch(resolveUrl("/api/auth/accept-terms"), {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Server error ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (updatedUser) => {
      storeUser(updatedUser);
      window.location.href = "/home";
    },
    onError: (err: any) => {
      toast({
        title: "Could not accept terms",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const allChecked = hasReadTerms && understandsEducational && understandsNotReplacement;

  return (
    <MobileLayout showNav={false} className="bg-slate-50 dark:bg-slate-950">
      <div className="flex-1 flex flex-col px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Terms of Use</h1>
            <p className="text-sm text-muted-foreground">Please read and accept to continue</p>
          </div>
        </motion.div>

        <ScrollArea className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-6">
          {TERMS_CONTENT}
        </ScrollArea>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="space-y-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={hasReadTerms}
                onCheckedChange={(checked) => setHasReadTerms(checked === true)}
                data-testid="checkbox-read-terms"
              />
              <span className="text-sm">I have read and understood the Terms of Use</span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={understandsEducational}
                onCheckedChange={(checked) => setUnderstandsEducational(checked === true)}
                data-testid="checkbox-educational"
              />
              <span className="text-sm">I understand this app is for educational purposes only</span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={understandsNotReplacement}
                onCheckedChange={(checked) => setUnderstandsNotReplacement(checked === true)}
                data-testid="checkbox-not-replacement"
              />
              <span className="text-sm">I understand this app does not replace clinical judgment</span>
            </label>
          </div>

          <Button
            onClick={() => acceptTermsMutation.mutate()}
            disabled={!allChecked || acceptTermsMutation.isPending}
            className="w-full h-12 text-base"
            data-testid="button-accept-terms"
          >
            {acceptTermsMutation.isPending ? "Processing..." : (
              <><CheckCircle className="w-4 h-4 mr-2" />Accept & Continue</>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={async () => {
              try {
                await fetch(resolveUrl("/api/auth/logout"), { method: "POST", credentials: "include" });
              } catch { }
              clearStoredUser();
              window.location.href = "/auth";
            }}
            className="w-full"
            data-testid="button-decline-logout"
          >
            Decline & Sign Out
          </Button>
        </motion.div>
      </div>
    </MobileLayout>
  );
}

export default function TermsPage({ requireAcceptance = false }: { requireAcceptance?: boolean }) {
  if (requireAcceptance) {
    return <TermsAcceptanceView />;
  }
  return <PublicTermsView />;
}
