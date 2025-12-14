import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Lock, CheckCircle, XCircle } from "lucide-react";
import logoIcon from "@assets/generated_images/minimalist_medical_ai_logo_icon.png";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  const token = new URLSearchParams(search).get("token");

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Reset failed");
      }
      return res.json();
    },
    onSuccess: () => {
      setSuccess(true);
    },
    onError: (error: Error) => {
      if (error.message.includes("expired") || error.message.includes("Invalid")) {
        setError(true);
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (!token) {
      setError(true);
      return;
    }
    resetPasswordMutation.mutate({ token, password });
  };

  if (success) {
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
            <h1 className="text-2xl font-heading font-bold mb-3">Password Reset!</h1>
            <p className="text-muted-foreground mb-8 max-w-[280px]">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
            <Button onClick={() => setLocation("/")} className="w-full max-w-xs" data-testid="button-login">
              Sign In
            </Button>
          </motion.div>
        </div>
      </MobileLayout>
    );
  }

  if (error || !token) {
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
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-heading font-bold mb-3">Link Expired</h1>
            <p className="text-muted-foreground mb-8 max-w-[280px]">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Button onClick={() => setLocation("/forgot-password")} className="w-full max-w-xs" data-testid="button-request-new">
              Request New Link
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
          <div className="flex flex-col items-center mb-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white to-slate-100 shadow-xl flex items-center justify-center mb-6 overflow-hidden border border-white/50"
            >
              <img src={logoIcon} alt="MedNote AI" className="w-full h-full object-cover" />
            </motion.div>
            <h1 className="text-2xl font-heading font-bold text-center">Create New Password</h1>
            <p className="text-muted-foreground text-center mt-2 max-w-[260px]">
              Enter your new password below.
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
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  className="h-12 pl-10 bg-slate-50 border-slate-200"
                  data-testid="input-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Re-enter your password"
                  required
                  className="h-12 pl-10 bg-slate-50 border-slate-200"
                  data-testid="input-confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base shadow-lg shadow-primary/20"
              disabled={resetPasswordMutation.isPending}
              data-testid="button-submit"
            >
              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </motion.form>
        </div>
      </div>
    </MobileLayout>
  );
}
