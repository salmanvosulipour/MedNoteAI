import { useState } from "react";
import { Link, useLocation } from "wouter";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import logoIcon from "@assets/generated_images/minimalist_medical_ai_logo_icon.png";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setLocation("/home");
    }, 1000);
  };

  return (
    <MobileLayout showNav={false} className="bg-white dark:bg-slate-950">
      <div className="flex-1 flex flex-col justify-center px-6 relative overflow-hidden">
        {/* Abstract Background Element */}
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
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="dr.smith@hospital.com" required className="h-12 bg-slate-50 border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" required className="h-12 bg-slate-50 border-slate-200" />
                </div>
                <Button type="submit" className="w-full h-12 text-base shadow-lg shadow-primary/20" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Dr. John Smith" required className="h-12 bg-slate-50 border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input id="email-signup" type="email" placeholder="name@example.com" required className="h-12 bg-slate-50 border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Password</Label>
                  <Input id="password-signup" type="password" required className="h-12 bg-slate-50 border-slate-200" />
                </div>
                <Button type="submit" className="w-full h-12 text-base shadow-lg shadow-primary/20" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-8">
             <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-11">
                   Google
                </Button>
                <Button variant="outline" className="h-11">
                   Apple
                </Button>
              </div>
          </div>
        </motion.div>
      </div>
    </MobileLayout>
  );
}
