import { motion } from "framer-motion";
import logoIcon from "@assets/generated_images/minimalist_medical_ai_logo_icon.png";

export default function AuthPage() {
  const handleLogin = () => {
    window.location.href = "/api/login";
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
        {/* Logo + brand */}
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

        {/* Sign-in buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="w-full space-y-3"
        >
          {/* Sign in with Apple */}
          <button
            onClick={handleLogin}
            data-testid="button-sign-in-apple"
            className="w-full h-14 flex items-center justify-center gap-3 bg-white text-black font-semibold text-base rounded-2xl shadow-xl hover:bg-white/90 active:scale-[0.98] transition-all"
          >
            <AppleLogo />
            Sign in with Apple
          </button>

          {/* Sign in with Google */}
          <button
            onClick={handleLogin}
            data-testid="button-sign-in-google"
            className="w-full h-14 flex items-center justify-center gap-3 bg-white/5 border border-white/15 text-white font-semibold text-base rounded-2xl shadow-lg hover:bg-white/10 active:scale-[0.98] transition-all backdrop-blur-sm"
          >
            <GoogleLogo />
            Continue with Google
          </button>
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-10 w-full space-y-3"
        >
          {[
            { icon: "🔒", text: "Your account stays signed in on this device" },
            { icon: "🎙️", text: "AI-powered audio transcription in seconds" },
            { icon: "📋", text: "Structured SOAP notes generated automatically" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-slate-400 text-sm">
              <span className="text-base">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-slate-600 mt-10 px-4"
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

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}
