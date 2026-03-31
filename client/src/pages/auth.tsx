import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Capacitor } from "@capacitor/core";
import { SignInWithApple, type SignInWithAppleOptions } from "@capacitor-community/apple-sign-in";
import logoIcon from "@assets/generated_images/minimalist_medical_ai_logo_icon.png";
import { storeUser } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getDeviceId, getDeviceName, overrideStoredDeviceId } from "@/lib/device";
import { Loader2, Mail, Lock, User, Eye, EyeOff } from "lucide-react";

const PRODUCTION_URL = "https://med-note-ai-1--salmanvosuli.replit.app";
const apiBase = Capacitor.isNativePlatform() ? `${PRODUCTION_URL}/api` : "/api";

type Mode = "landing" | "login" | "register";

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("landing");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const { toast } = useToast();

  // Native iOS: Apple Sign In sheet (no Replit, no redirect)
  const handleNativeAppleSignIn = async () => {
    setIsLoading(true);
    try {
      const randomHex = () => Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, "0")).join("");
      const options: SignInWithAppleOptions = {
        clientId: "com.mednote.ai",
        redirectURI: "https://med-note-ai-1--salmanvosuli.replit.app",
        scopes: "email name",
        state: randomHex(),
        nonce: randomHex(),
      };
      const result = await SignInWithApple.authorize(options);
      const { identityToken, givenName, familyName, email } = result.response;

      const [deviceId, deviceName] = await Promise.all([getDeviceId(), getDeviceName()]).catch(() => ["", ""]) as [string, string];
      const platform = Capacitor.isNativePlatform() ? "ios" : "web";
      const res = await fetch(`${apiBase}/auth/apple`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identityToken, firstName: givenName, lastName: familyName, email, deviceId, deviceName, platform }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Sign in failed");
      }
      const { user, token, boundDeviceId } = await res.json();
      if (boundDeviceId && boundDeviceId !== deviceId) overrideStoredDeviceId(boundDeviceId);
      storeUser({ ...user, token });
      window.location.href = "/home";
    } catch (err: any) {
      const cancelled = err?.message?.includes("1001") || err?.code === "1001";
      if (!cancelled) {
        toast({ title: "Sign in failed", description: err.message || "Please try again.", variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Web: email/password login
  const handleEmailLogin = async () => {
    if (!form.email || !form.password) {
      toast({ title: "Missing fields", description: "Please enter your email and password.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const [deviceId, deviceName] = await Promise.all([getDeviceId(), getDeviceName()]).catch(() => ["", ""]) as [string, string];
      const platform = Capacitor.isNativePlatform() ? "ios" : "web";
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: form.email, password: form.password, deviceId, deviceName, platform }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Login failed");
      }
      const { user, token, boundDeviceId } = await res.json();
      if (boundDeviceId && boundDeviceId !== deviceId) overrideStoredDeviceId(boundDeviceId);
      storeUser({ ...user, token });
      window.location.href = "/home";
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message || "Check your email and password.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Web: email/password register
  const handleEmailRegister = async () => {
    if (!form.email || !form.password || !form.firstName) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    if (form.password.length < 8) {
      toast({ title: "Password too short", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const [deviceId, deviceName] = await Promise.all([getDeviceId(), getDeviceName()]).catch(() => ["", ""]) as [string, string];
      const platform = Capacitor.isNativePlatform() ? "ios" : "web";
      const res = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: form.email, password: form.password, firstName: form.firstName, lastName: form.lastName, deviceId, deviceName, platform }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Registration failed");
      }
      const { user, token, boundDeviceId } = await res.json();
      if (boundDeviceId && boundDeviceId !== deviceId) overrideStoredDeviceId(boundDeviceId);
      storeUser({ ...user, token });
      window.location.href = "/home";
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const isNative = Capacitor.isNativePlatform();

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
          className="flex flex-col items-center mb-10"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-white/10 backdrop-blur-xl flex items-center justify-center mb-4 overflow-hidden shadow-2xl shadow-blue-500/20">
            <img src={logoIcon} alt="MedNote AI" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-center bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent mb-1">
            MedNote AI
          </h1>
          <p className="text-slate-400 text-center text-sm">
            AI-powered clinical scribing
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* LANDING — native iOS shows Apple Sign In, web shows email options */}
          {mode === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full space-y-3"
            >
              {isNative ? (
                <button
                  onClick={handleNativeAppleSignIn}
                  disabled={isLoading}
                  data-testid="button-sign-in-apple"
                  className="w-full h-14 flex items-center justify-center gap-3 bg-white text-black font-semibold text-base rounded-2xl shadow-xl hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><AppleLogo />Sign in with Apple</>}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setMode("login")}
                    data-testid="button-sign-in-email"
                    className="w-full h-14 flex items-center justify-center gap-3 bg-white text-black font-semibold text-base rounded-2xl shadow-xl hover:bg-white/90 active:scale-[0.98] transition-all"
                  >
                    <Mail className="w-5 h-5" />
                    Sign in with Email
                  </button>
                  <button
                    onClick={() => setMode("register")}
                    data-testid="button-create-account"
                    className="w-full h-14 flex items-center justify-center gap-3 bg-white/10 border border-white/20 text-white font-semibold text-base rounded-2xl hover:bg-white/15 active:scale-[0.98] transition-all"
                  >
                    Create Account
                  </button>
                </>
              )}

              <div className="pt-4 space-y-3">
                {[
                  { icon: "🔒", text: "Stays signed in — no passwords to remember" },
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
          )}

          {/* LOGIN */}
          {mode === "login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="w-full space-y-3"
            >
              <h2 className="text-xl font-semibold text-center mb-2">Welcome back</h2>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  data-testid="input-email"
                  className="w-full h-12 pl-11 pr-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && handleEmailLogin()}
                  data-testid="input-password"
                  className="w-full h-12 pl-11 pr-11 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button onClick={() => setShowPassword(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                onClick={handleEmailLogin}
                disabled={isLoading}
                data-testid="button-login"
                className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
              </button>

              <p className="text-center text-slate-400 text-sm pt-1">
                Don't have an account?{" "}
                <button onClick={() => setMode("register")} className="text-blue-400 hover:text-blue-300 font-medium">
                  Create one
                </button>
              </p>
              <button onClick={() => setMode("landing")} className="w-full text-center text-slate-600 text-sm hover:text-slate-400 transition-colors pt-1">
                ← Back
              </button>
            </motion.div>
          )}

          {/* REGISTER */}
          {mode === "register" && (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="w-full space-y-3"
            >
              <h2 className="text-xl font-semibold text-center mb-2">Create account</h2>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="First name"
                    value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    data-testid="input-first-name"
                    className="w-full h-12 pl-9 pr-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  data-testid="input-last-name"
                  className="flex-1 h-12 px-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  data-testid="input-email-register"
                  className="w-full h-12 pl-11 pr-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password (min 8 chars)"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && handleEmailRegister()}
                  data-testid="input-password-register"
                  className="w-full h-12 pl-11 pr-11 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button onClick={() => setShowPassword(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                onClick={handleEmailRegister}
                disabled={isLoading}
                data-testid="button-register"
                className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
              </button>

              <p className="text-center text-slate-400 text-sm pt-1">
                Already have an account?{" "}
                <button onClick={() => setMode("login")} className="text-blue-400 hover:text-blue-300 font-medium">
                  Sign in
                </button>
              </p>
              <button onClick={() => setMode("landing")} className="w-full text-center text-slate-600 text-sm hover:text-slate-400 transition-colors pt-1">
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
