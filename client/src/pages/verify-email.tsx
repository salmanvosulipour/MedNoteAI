import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Missing verification token. Please check your email link.");
        return;
      }

      try {
        const res = await apiRequest("POST", "/api/auth/verify-email", { token });
        const data = await res.json();
        
        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Your email has been verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.message || "Failed to verify email. The link may have expired.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Something went wrong. Please try again later.");
      }
    };

    verifyEmail();
  }, []);

  return (
    <MobileLayout showNav={false} className="bg-gradient-to-b from-slate-50 to-white">
      <div className="flex flex-col items-center justify-center min-h-full p-6">
        {status === "loading" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-slate-900 mb-2">Verifying your email...</h1>
            <p className="text-slate-500">Please wait while we verify your email address.</p>
          </motion.div>
        )}

        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-slate-900 mb-2" data-testid="text-success-title">Email Verified!</h1>
            <p className="text-slate-500 mb-8">{message}</p>
            <Link href="/home">
              <Button size="lg" className="w-full max-w-xs" data-testid="button-continue">
                Continue to MedNote AI
              </Button>
            </Link>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-slate-900 mb-2" data-testid="text-error-title">Verification Failed</h1>
            <p className="text-slate-500 mb-8">{message}</p>
            <div className="space-y-3 w-full max-w-xs">
              <Link href="/home">
                <Button size="lg" className="w-full" data-testid="button-go-home">
                  Go to Home
                </Button>
              </Link>
              <Link href="/profile">
                <Button size="lg" variant="outline" className="w-full" data-testid="button-resend">
                  <Mail className="w-4 h-4 mr-2" />
                  Resend Verification
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </MobileLayout>
  );
}
