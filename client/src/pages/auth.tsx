import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Capacitor } from "@capacitor/core";
import { SignInWithApple, type SignInWithAppleOptions } from "@capacitor-community/apple-sign-in";
import logoIcon from "@assets/generated_images/minimalist_medical_ai_logo_icon.png";
import { storeUser } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showWebFallback, setShowWebFallback] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleAppleSignIn = async () => {
    if (!Capacitor.isNativePlatform()) {
      // On web/browser show the email fallback for development
      setShowWebFallback(true);
      return;
    }

    setIsLoading(true);
    try {
      const options: SignInWithAppleOptions = {
        clientId: "com.mednote.ai",
        redirectURI: "",
        scopes: "email name",
        state: Math.random().toString(36).substring(7),
        nonce: Math.random().toString(36).substring(7),
      };

      const result = await SignInWithApple.authorize(options);
      const { identityToken, givenName, familyName, email: appleEmail } = result.response;

      const res = await fetch("/api/auth/apple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          identityToken,
          firstName: givenName,
          lastName: familyName,
          email: appleEmail,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Sign in failed");
      }

      const { user } = await res.json();
      storeUser(user);
      window.location.href = "/home";
    } catch (err: any) {
      if (err?.message !== "The operation couldn't be completed. (com.apple.AuthenticationServices.AuthorizationError error 1001.)") {
        // 1001 = user cancelled, don't show error for that
        toast({
          title: "Sign in failed",
          description: err.message || "Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleWebLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      localStorage.setItem("authToken", data.token);
      storeUser(data.user);
      window.location.href = "/home";
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050810] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[350px] h-[350px] bg-violet-600/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 left-0 w-[250px] h-[250px] bg-cyan-600/10 rounded-full blur-[80px]" />
      </div>

      <div className="w-full max-w-sm relative z-10 flex flex-col items-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center mb-12"
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-white/10 backdrop-blur-xl flex items-center justify-center mb-6 overflow-hidden shadow-2xl shadow-blue-500/20">
            <img src={logoIcon} alt="MedNote AI" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl font-bold text-center bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent mb-2">
            MedNote AI
          </h1>
          <p className="text-slate-400 text-center text-sm max-w-[220px] leading-relaxed">
            AI-powered clinical scribing for physicians
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!showWebFallback ? (
            <motion.div
              key="social"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="w-full space-y-3"
            >
              {/* Sign in with Apple */}
              <button
                onClick={handleAppleSignIn}
                disabled={isLoading}
                data-testid="button-sign-in-apple"
                className="w-full h-14 flex items-center justify-center gap-3 bg-white text-black font-semibold text-base rounded-2xl shadow-xl hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <AppleLogo />
                    Sign in with Apple
                  </>
                )}
              </button>

              {/* Feature list */}
              <div className="pt-6 space-y-3">
                {[
                  { icon: "🔒", text: "Stays signed in on your device — no passwords" },
                  { icon: "🎙️", text: "AI transcription from audio in seconds" },
                  { icon: "📋", text: "Structured SOAP notes, auto-generated" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-slate-400 text-sm">
                    <span className="text-base">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="web-fallback"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full space-y-4"
            >
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                <p className="text-xs text-blue-300">
                  Apple Sign In works on the iPhone app. Use your account credentials below for web access.
                </p>
              </div>

              <form onSubmit={handleWebLogin} className="space-y-3">
                <div>
                  <Label className="text-xs text-slate-400 uppercase tracking-wide">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="doctor@hospital.com"
                      required
                      className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl h-12"
                      data-testid="input-email"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-400 uppercase tracking-wide">Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Your password"
                      required
                      className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl h-12"
                      data-testid="input-password"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 font-semibold text-white disabled:opacity-60 flex items-center justify-center"
                  data-testid="button-web-login"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                </button>
              </form>

              <button
                onClick={() => setShowWebFallback(false)}
                className="w-full text-xs text-slate-500 hover:text-slate-400 transition-colors py-2"
              >
                ← Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-slate-600 mt-8 px-4"
        >
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </motion.p>
      </div>
    </div>
  );
}

function AppleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 814 1000" fill="currentColor">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.8 135.4-318.1 268.4-318.1 71 0 130.3 46.1 171.8 46.1 39.5 0 107.1-48.9 190.5-48.9zm-74.7-204.8c36.1-43.5 60.5-103.1 60.5-162.6 0-8.9-.8-18-2.5-25.5-57 2.2-124.3 38.2-165.1 87.5-33.1 37.7-62.6 97.2-62.6 157.5 0 9.7 1.6 19.3 2.4 22.4 3.5.6 9.4 1.3 15.2 1.3 51.3 0 113.1-34.4 152.1-80.6z" />
    </svg>
  );
}
