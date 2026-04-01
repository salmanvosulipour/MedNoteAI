import { useState } from "react";
import { useLocation } from "wouter";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { resolveUrl } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import logoIcon from "@assets/generated_images/minimalist_medical_ai_logo_icon.png";

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch(resolveUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Request failed");
      }
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgotPasswordMutation.mutate(email);
  };

  if (submitted) {
    return (
      <MobileLayout showNav={false} className="bg-white dark:bg-slate-950">
        <div className="flex-1 flex flex-col justify-center px-6 relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-20%] w-[300px] h-[300px] bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-20%] w-[300px] h-[300px] bg-accent/20 rounded-full blur-3xl" />

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10 flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-heading font-bold mb-3">Check Your Email</h1>
            <p className="text-muted-foreground mb-8 max-w-[280px]">
              If an account exists for {email}, you'll receive a password reset link shortly.
            </p>
            <Button onClick={() => setLocation("/")} className="w-full max-w-xs" data-testid="button-back-login">
              Back to Login
            </Button>
          </motion.div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showNav={false} className="bg-white dark:bg-slate-950">
      <div className="flex-1 flex flex-col justify-center px-6 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-20%] w-[300px] h-[300px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-20%] w-[300px] h-[300px] bg-accent/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
            data-testid="link-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </button>

          <div className="flex flex-col items-center mb-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white to-slate-100 shadow-xl flex items-center justify-center mb-6 overflow-hidden border border-white/50"
            >
              <img src={logoIcon} alt="MedNote AI" className="w-full h-full object-cover" />
            </motion.div>
            <h1 className="text-2xl font-heading font-bold text-center">Forgot Password?</h1>
            <p className="text-muted-foreground text-center mt-2 max-w-[260px]">
              Enter your email and we'll send you a link to reset your password.
            </p>
          </div>

          <motion.form
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="dr.smith@hospital.com"
                  required
                  className="h-12 pl-10 bg-slate-50 border-slate-200"
                  data-testid="input-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base shadow-lg shadow-primary/20"
              disabled={forgotPasswordMutation.isPending}
              data-testid="button-submit"
            >
              {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
            </Button>
          </motion.form>
        </div>
      </div>
    </MobileLayout>
  );
}
