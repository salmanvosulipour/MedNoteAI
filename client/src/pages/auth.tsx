import { useLocation } from "wouter";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import logoIcon from "@assets/generated_images/minimalist_medical_ai_logo_icon.png";
import { FaApple, FaGoogle, FaGithub } from "react-icons/fa";

export default function AuthPage() {
  const [, setLocation] = useLocation();

  const handleLogin = () => {
    window.location.href = "/api/login";
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
          className="space-y-4"
        >
          <Button 
            onClick={handleLogin}
            className="w-full h-14 text-base font-semibold bg-black text-white hover:bg-black/90 shadow-lg"
            data-testid="button-sign-in-apple"
          >
            <FaApple className="mr-3 h-5 w-5" />
            Sign in with Apple
          </Button>
          
          <Button 
            onClick={handleLogin}
            variant="outline"
            className="w-full h-14 text-base font-semibold border-2 shadow-sm"
            data-testid="button-sign-in-google"
          >
            <FaGoogle className="mr-3 h-5 w-5 text-red-500" />
            Sign in with Google
          </Button>
          
          <Button 
            onClick={handleLogin}
            variant="outline"
            className="w-full h-14 text-base font-semibold border-2 shadow-sm"
            data-testid="button-sign-in-github"
          >
            <FaGithub className="mr-3 h-5 w-5" />
            Sign in with GitHub
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-6 px-4">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </MobileLayout>
  );
}
