import { useState } from "react";
import { useLocation } from "wouter";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import logoIcon from "@assets/generated_images/minimalist_medical_ai_logo_icon.png";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Login failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.needsTerms) {
        setLocation("/terms");
      } else {
        setLocation("/");
      }
    },
    onError: (error: Error) => {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Signup failed");
      }
      return res.json();
    },
    onSuccess: () => {
      setLocation("/terms");
    },
    onError: (error: Error) => {
      toast({ title: "Signup Failed", description: error.message, variant: "destructive" });
    },
  });

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email: loginEmail, password: loginPassword });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    signupMutation.mutate({ name: signupName, email: signupEmail, password: signupPassword });
  };

  return (
    <MobileLayout showNav={false} className="bg-white dark:bg-slate-950">
      <div className="flex-1 flex flex-col justify-center px-6 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-20%] w-[300px] h-[300px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-20%] w-[300px] h-[300px] bg-accent/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col items-center mb-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-24 h-24 rounded-2xl bg-gradient-to-br from-white to-slate-100 shadow-xl flex items-center justify-center mb-6 overflow-hidden border border-white/50"
          >
            <img src={logoIcon} alt="MedNote AI" className="w-full h-full object-cover" />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-heading font-bold text-center tracking-tight text-foreground"
          >
            MedNote AI
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground text-center mt-2 max-w-[260px]"
          >
            Your intelligent physician assistant for automated clinical scribing.
          </motion.p>
        </div>

        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
              <TabsTrigger value="signup" data-testid="tab-signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="dr.smith@hospital.com" 
                    required 
                    className="h-12 bg-slate-50 border-slate-200" 
                    data-testid="input-email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setLocation("/forgot-password")}
                      className="text-sm text-primary hover:underline"
                      data-testid="link-forgot-password"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    className="h-12 bg-slate-50 border-slate-200" 
                    data-testid="input-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-base shadow-lg shadow-primary/20" disabled={loginMutation.isPending} data-testid="button-login">
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Dr. John Smith" 
                    required 
                    className="h-12 bg-slate-50 border-slate-200" 
                    data-testid="input-name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input 
                    id="email-signup" 
                    type="email" 
                    placeholder="name@example.com" 
                    required 
                    className="h-12 bg-slate-50 border-slate-200" 
                    data-testid="input-email-signup"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Password</Label>
                  <Input 
                    id="password-signup" 
                    type="password" 
                    required 
                    className="h-12 bg-slate-50 border-slate-200" 
                    data-testid="input-password-signup"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-base shadow-lg shadow-primary/20" disabled={signupMutation.isPending} data-testid="button-signup">
                  {signupMutation.isPending ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </MobileLayout>
  );
}
