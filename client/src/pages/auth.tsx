import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Capacitor } from "@capacitor/core";
import { SignInWithApple, type SignInWithAppleOptions } from "@capacitor-community/apple-sign-in";
import logoIcon from "@assets/generated_images/minimalist_medical_ai_logo_icon.png";
import { storeUser } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getDeviceId, getDeviceName, overrideStoredDeviceId } from "@/lib/device";
import { Loader2, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const PRODUCTION_URL = "https://med-note-ai-1--salmanvosuli.replit.app";
const apiBase = Capacitor.isNativePlatform() ? `${PRODUCTION_URL}/api` : "/api";

// Web Apple Sign In — requires Services ID configured in Apple Developer
// Set VITE_APPLE_WEB_CLIENT_ID in environment after creating the Services ID
const APPLE_WEB_CLIENT_ID = import.meta.env.VITE_APPLE_WEB_CLIENT_ID as string | undefined;
const APPLE_WEB_REDIRECT_URI = "https://mednoteai.net/api/auth/apple/web/callback";

function buildAppleOAuthURL() {
  const params = new URLSearchParams({
    client_id: APPLE_WEB_CLIENT_ID!,
    redirect_uri: APPLE_WEB_REDIRECT_URI,
    response_type: "code id_token",
    scope: "name email",
    response_mode: "form_post",
    state: Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, "0")).join(""),
  });
  return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
}

type Mode = "landing" | "login" | "register";

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("landing");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const { toast } = useToast();
  const { lang, setLang, t } = useLanguage();

  // Show error if redirected back from a failed Apple Sign In
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const appleError = params.get("apple_error");
    if (appleError) {
      toast({
        title: "Sign in failed",
        description: "Sign in with Apple did not complete. Please try again.",
        variant: "destructive",
      });
      // Remove the error param from the URL without reloading
      const clean = window.location.pathname;
      window.history.replaceState({}, "", clean);
    }
  }, []);

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
        const isNetworkError = err?.message?.toLowerCase().includes("load failed") ||
          err?.message?.toLowerCase().includes("network") ||
          err?.message?.toLowerCase().includes("fetch");
        const description = isNetworkError
          ? "Could not reach the server. Please check your connection and try again."
          : err.message || "Please try again.";
        toast({ title: "Sign in failed", description, variant: "destructive" });
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
        // Apple account detected — guide user to correct sign-in method
        if (err.error === "APPLE_ACCOUNT") {
          toast({
            title: "Sign in with Apple required",
            description: "This account was created using Sign in with Apple. Please use the iOS app to sign in, or create a new account with email.",
            variant: "destructive",
          });
          return;
        }
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
          <p className="text-slate-300 text-center text-sm font-medium">
            {t("auth.tagline")}
          </p>
          <p className="text-slate-500 text-center text-xs mt-1">
            {t("auth.subtitle")}
          </p>
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="mt-2 mx-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/8 border border-white/12 text-slate-500 hover:text-slate-300 text-xs transition-colors"
            data-testid="button-toggle-lang"
          >
            {lang === "en" ? "🌐 العربية" : "🌐 English"}
          </button>
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
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><AppleLogo />{t("auth.apple")}</>}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      if (APPLE_WEB_CLIENT_ID) {
                        window.location.href = buildAppleOAuthURL();
                      } else {
                        toast({
                          title: "Use the iOS app",
                          description: "Sign in with Apple is available in the MedNote AI iOS app. Download it from the App Store to use your Apple ID.",
                        });
                      }
                    }}
                    data-testid="button-sign-in-apple-web"
                    className="w-full h-14 flex items-center justify-center gap-3 bg-white text-black font-semibold text-base rounded-2xl shadow-xl hover:bg-white/90 active:scale-[0.98] transition-all"
                  >
                    <AppleLogo />
                    {t("auth.apple")}
                  </button>
                  <button
                    onClick={() => setMode("login")}
                    data-testid="button-sign-in-email"
                    className="w-full h-14 flex items-center justify-center gap-3 bg-white/10 border border-white/20 text-white font-semibold text-base rounded-2xl hover:bg-white/15 active:scale-[0.98] transition-all"
                  >
                    <Mail className="w-5 h-5" />
                    {t("auth.email_login")}
                  </button>
                  <button
                    onClick={() => setMode("register")}
                    data-testid="button-create-account"
                    className="w-full h-14 flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white/70 font-semibold text-base rounded-2xl hover:bg-white/10 active:scale-[0.98] transition-all"
                  >
                    {t("auth.email_register")}
                  </button>
                </>
              )}

              <div className="pt-4 space-y-3">
                {[
                  { icon: "🎙️", key: "auth.feature1" },
                  { icon: "📋", key: "auth.feature2" },
                  { icon: "⏱️", key: "auth.feature3" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-slate-400 text-sm">
                    <span className="text-base">{item.icon}</span>
                    <span>{t(item.key)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/8 border border-emerald-500/15">
                <span className="text-emerald-400 text-base">🔒</span>
                <span className="text-[11px] text-emerald-400 font-medium">{t("auth.badge")}</span>
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
          {t("auth.terms")}
        </motion.p>
      </div>

      {/* Landing extras — only shown on web (not native iOS) */}
      {!Capacitor.isNativePlatform() && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="w-full max-w-sm relative z-10 mt-6 pb-16 space-y-8"
        >
          {/* Demo video #15 */}
          <DemoVideoSection />

          {/* Testimonials #16 */}
          <TestimonialsSection />
        </motion.div>
      )}
    </div>
  );
}

function DemoVideoSection() {
  const [playing, setPlaying] = useState(false);
  // Set VITE_DEMO_VIDEO_URL to a YouTube/Vimeo embed URL to activate
  const videoUrl = import.meta.env.VITE_DEMO_VIDEO_URL as string | undefined;

  return (
    <div className="space-y-3">
      <p className="text-center text-xs text-slate-500 font-medium uppercase tracking-wider">See it in action</p>
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-white/8 aspect-video shadow-xl">
        {videoUrl && playing ? (
          <iframe
            src={`${videoUrl}?autoplay=1`}
            className="w-full h-full"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        ) : (
          <button
            onClick={() => videoUrl ? setPlaying(true) : undefined}
            className="w-full h-full flex flex-col items-center justify-center gap-3 group"
            data-testid="button-play-demo"
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white ml-1">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div className="absolute inset-0 rounded-full bg-blue-500/30 blur-xl animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-sm">60-second demo</p>
              <p className="text-slate-500 text-xs mt-0.5">Voice → Full SOAP note, live</p>
            </div>
            {!videoUrl && (
              <p className="text-slate-600 text-[10px] mt-1">Coming soon</p>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

const TESTIMONIALS = [
  {
    name: "Dr. Sarah K.",
    specialty: "Emergency Medicine",
    quote: "I finish my notes before leaving the ER. MedNote AI changed my workflow completely.",
    avatar: "SK",
  },
  {
    name: "Dr. James M.",
    specialty: "Family Medicine",
    quote: "Saves me 2 hours every shift. My patients get more of my attention now.",
    avatar: "JM",
  },
  {
    name: "Dr. Aisha R.",
    specialty: "Internal Medicine",
    quote: "The ICD-10 coding alone is worth the subscription. Accurate, fast, effortless.",
    avatar: "AR",
  },
];

function TestimonialsSection() {
  return (
    <div className="space-y-3">
      <p className="text-center text-xs text-slate-500 font-medium uppercase tracking-wider">
        Join doctors saving 2hrs/day
      </p>
      <div className="space-y-3">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.name}
            className="bg-white/4 border border-white/8 rounded-2xl p-4 flex gap-3"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/30 border border-white/15 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-white/70">{t.avatar}</span>
            </div>
            <div>
              <p className="text-white/80 text-sm leading-relaxed">"{t.quote}"</p>
              <p className="text-slate-500 text-xs mt-1.5 font-medium">{t.name} · {t.specialty}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {[...Array(5)].map((_, i) => (
          <svg key={i} viewBox="0 0 20 20" fill="#f59e0b" className="w-3.5 h-3.5">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="text-slate-500 text-xs ml-1">4.9 · App Store</span>
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
