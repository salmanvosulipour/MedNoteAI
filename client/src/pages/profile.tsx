import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronRight, CreditCard, Shield, HelpCircle, LogOut, User, Bell } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  return (
    <MobileLayout>
      <header className="px-6 pt-12 pb-6">
        <h1 className="text-2xl font-heading font-bold mb-6">Settings</h1>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-md">
             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Dr. John Smith</h2>
            <p className="text-sm text-muted-foreground">Cardiology</p>
            <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              Pro Plan
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 space-y-6 pb-12">
        
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account</h3>
          
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium">Personal Information</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
            <Separator />
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium">Subscription & Billing</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
             <Separator />
             <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium">Security & Privacy (HIPAA)</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Preferences</h3>
          
           <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-slate-400" />
                  <div className="flex flex-col text-left">
                    <Label className="text-sm font-medium">Notifications</Label>
                    <span className="text-xs text-muted-foreground">Alerts for finished summaries</span>
                  </div>
                </div>
                <Switch defaultChecked />
             </div>
             <Separator />
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5" /> {/* Spacer */}
                  <div className="flex flex-col text-left">
                    <Label className="text-sm font-medium">Auto-Save Audio</Label>
                    <span className="text-xs text-muted-foreground">Keep backup on device</span>
                  </div>
                </div>
                <Switch />
             </div>
           </div>
        </section>

        <Button variant="destructive" className="w-full h-12 mt-4">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>

        <div className="text-center">
            <p className="text-xs text-slate-400">Version 1.0.2 (Build 450)</p>
        </div>

      </div>
    </MobileLayout>
  );
}
