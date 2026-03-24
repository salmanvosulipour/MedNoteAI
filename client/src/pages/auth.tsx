import { useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import logoIcon from "@assets/generated_images/minimalist_medical_ai_logo_icon.png";
import { Eye, EyeOff, Loader2, Mail, Lock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { storeUser } from "@/hooks/useAuth";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body: any = { email, password };
      if (mode === "register") {
        body.firstName = firstName;
        body.lastName = lastName;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      localStorage.setItem("authToken", data.token);
      storeUser(data.user);
      window.location.href = "/home";
    } catch (err: any) {
      toast({
        title: mode === "login" ? "Login failed" : "Registration failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileLayout showNav={false} className="bg-[#050810] text-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-blue-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-violet-600/15 rounded-full blur-[80px]" />
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-10"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-white/10 backdrop-blur-xl flex items-center justify-center mb-5 overflow-hidden shadow-2xl shadow-blue-500/20">
            <img src={logoIcon} alt="MedNote AI" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-center bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent mb-1">
            MedNote AI
          </h1>
          <p className="text-slate-400 text-center text-sm max-w-[240px] leading-relaxed">
            AI-powered clinical scribing for physicians
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode === "login" ? "bg-white text-slate-900 shadow" : "text-slate-400 hover:text-white"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode === "register" ? "bg-white text-slate-900 shadow" : "text-slate-400 hover:text-white"}`}
            >
              Create Account
            </button>
          </div>
        </motion.div>

        <motion.form
          key={mode}
          initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <AnimatePresence>
            {mode === "register" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 gap-3 overflow-hidden"
              >
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400 uppercase tracking-wide">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      placeholder="John"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl h-12 focus:border-blue-500/50"
                      data-testid="input-first-name"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400 uppercase tracking-wide">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      placeholder="Doe"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl h-12 focus:border-blue-500/50"
                      data-testid="input-last-name"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 uppercase tracking-wide">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                type="email"
                placeholder="doctor@hospital.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl h-12 focus:border-blue-500/50"
                data-testid="input-email"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-400 uppercase tracking-wide">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={mode === "register" ? "Min 8 characters" : "Your password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="pl-9 pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl h-12 focus:border-blue-500/50"
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 rounded-2xl text-base font-bold bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-xl shadow-blue-500/30 mt-2"
            data-testid="button-submit"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : mode === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </Button>
        </motion.form>

        <p className="text-center text-xs text-slate-600 mt-6 px-4">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </MobileLayout>
  );
}
