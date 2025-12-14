import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, FileText, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function TermsPage() {
  const [, setLocation] = useLocation();
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [isPhysician, setIsPhysician] = useState(false);
  const [understandsEducational, setUnderstandsEducational] = useState(false);
  const [understandsNotReplacement, setUnderstandsNotReplacement] = useState(false);
  const queryClient = useQueryClient();

  const acceptTermsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/accept-terms");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/home");
    },
  });

  const allChecked = hasReadTerms && isPhysician && understandsEducational && understandsNotReplacement;

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
          <div className="space-y-6 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            <section>
              <h2 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Professional Use Only
              </h2>
              <p>
                MedNote AI is designed exclusively for licensed healthcare professionals, including physicians, 
                nurse practitioners, and physician assistants. By using this application, you confirm that you 
                are a licensed medical professional authorized to practice medicine in your jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Educational Purposes
              </h2>
              <p>
                This application is provided for <strong>educational and informational purposes only</strong>. 
                The AI-generated medical notes, diagnoses, and treatment suggestions are meant to assist in 
                documentation and learning, not to serve as definitive medical advice.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Not a Replacement for Clinical Judgment
              </h2>
              <p className="mb-3">
                <strong>MedNote AI does not replace the clinical judgment of a licensed physician.</strong> 
                All AI-generated content must be reviewed, verified, and approved by a qualified healthcare 
                provider before being used in patient care.
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Always verify AI-generated diagnoses and treatment plans</li>
                <li>Do not rely solely on AI suggestions for clinical decision-making</li>
                <li>The physician remains fully responsible for all medical decisions</li>
                <li>AI output may contain errors and should be critically evaluated</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">Limitation of Liability</h2>
              <p>
                By using MedNote AI, you acknowledge and agree that the developers and operators of this 
                application are not liable for any clinical decisions made based on the AI-generated content. 
                The user assumes full responsibility for verifying all information and making appropriate 
                clinical judgments.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">Data Privacy</h2>
              <p>
                We are committed to protecting patient privacy and maintaining HIPAA compliance. All patient 
                data is encrypted and handled according to healthcare privacy regulations. Do not enter 
                identifiable patient information unless necessary for clinical documentation.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">Acceptance</h2>
              <p>
                By checking the boxes below and clicking "Accept & Continue", you confirm that you have read, 
                understood, and agree to these Terms of Use.
              </p>
            </section>
          </div>
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
                checked={isPhysician} 
                onCheckedChange={(checked) => setIsPhysician(checked === true)}
                data-testid="checkbox-physician"
              />
              <span className="text-sm">I am a licensed healthcare professional</span>
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
            {acceptTermsMutation.isPending ? (
              "Processing..."
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept & Continue
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={() => window.location.href = "/api/logout"}
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
