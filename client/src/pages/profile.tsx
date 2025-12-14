import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ChevronRight, CreditCard, Shield, HelpCircle, LogOut, User, Bell, Camera, Check, X, Edit3, Lock, Server, ShieldCheck, FileCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const SPECIALTIES = [
  "Emergency Medicine",
  "Family Medicine", 
  "Internal Medicine",
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "Geriatrics",
  "Hematology",
  "Infectious Disease",
  "Nephrology",
  "Neurology",
  "Obstetrics & Gynecology",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Otolaryngology (ENT)",
  "Pathology",
  "Pediatrics",
  "Physical Medicine",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Rheumatology",
  "Surgery",
  "Urology",
  "Other"
];

export default function ProfilePage() {
  const [avatar, setAvatar] = useState("https://api.dicebear.com/7.x/avataaars/svg?seed=Felix");
  const [fullName, setFullName] = useState("Dr. John Smith");
  const [specialty, setSpecialty] = useState("Emergency Medicine");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  const [specialtyOpen, setSpecialtyOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedAvatar = localStorage.getItem("user-avatar");
    const savedName = localStorage.getItem("user-fullname");
    const savedSpecialty = localStorage.getItem("user-specialty");
    
    if (savedAvatar) setAvatar(savedAvatar);
    if (savedName) setFullName(savedName);
    if (savedSpecialty) setSpecialty(savedSpecialty);
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatar(result);
        localStorage.setItem("user-avatar", result);
        toast({
          title: "Profile Photo Updated",
          description: "Your new profile photo has been saved.",
        });
        window.dispatchEvent(new Event("storage"));
      };
      reader.readAsDataURL(file);
    }
  };

  const startEditingName = () => {
    setEditNameValue(fullName);
    setIsEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  const saveName = () => {
    if (editNameValue.trim()) {
      setFullName(editNameValue.trim());
      localStorage.setItem("user-fullname", editNameValue.trim());
      toast({ title: "Name Updated", description: "Your profile name has been saved." });
      window.dispatchEvent(new Event("storage"));
    }
    setIsEditingName(false);
  };

  const handleSpecialtyChange = (value: string) => {
    setSpecialty(value);
    localStorage.setItem("user-specialty", value);
    toast({ title: "Specialty Updated", description: `Your specialty is now ${value}.` });
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <MobileLayout>
      <header className="px-6 pt-12 pb-6">
        <h1 className="text-2xl font-heading font-bold mb-6">Settings</h1>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="relative group">
            <div 
              className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-md cursor-pointer relative"
              onClick={handleAvatarClick}
              data-testid="button-avatar-upload"
            >
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full border-2 border-white shadow-sm pointer-events-none">
              <Camera className="w-3 h-3" />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
              data-testid="input-avatar-file"
            />
          </div>
          <div className="flex-1">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  ref={nameInputRef}
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  className="h-8 text-lg font-bold"
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                  data-testid="input-fullname"
                />
                <button onClick={saveName} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" data-testid="button-save-name">
                  <Check className="w-5 h-5" />
                </button>
                <button onClick={() => setIsEditingName(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded" data-testid="button-cancel-name">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold" data-testid="text-fullname">{fullName}</h2>
                <button onClick={startEditingName} className="p-1 text-slate-400 hover:text-primary hover:bg-slate-100 rounded transition-colors" data-testid="button-edit-name">
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}
            <Popover open={specialtyOpen} onOpenChange={setSpecialtyOpen}>
              <PopoverTrigger asChild>
                <button 
                  className="w-full h-8 mt-1 text-sm text-muted-foreground hover:text-primary flex items-center gap-1 text-left"
                  data-testid="select-specialty"
                >
                  {specialty || "Select specialty"}
                  <ChevronDown className="w-3 h-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search specialty..." data-testid="input-specialty-search" />
                  <CommandList className="max-h-60">
                    <CommandEmpty>No specialty found.</CommandEmpty>
                    <CommandGroup>
                      {SPECIALTIES.map((s) => (
                        <CommandItem
                          key={s}
                          value={s}
                          onSelect={() => {
                            handleSpecialtyChange(s);
                            setSpecialtyOpen(false);
                          }}
                          data-testid={`option-specialty-${s.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <Check className={`w-4 h-4 mr-2 ${specialty === s ? 'opacity-100' : 'opacity-0'}`} />
                          {s}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
            <button 
              onClick={startEditingName}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              data-testid="button-personal-info"
            >
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium">Personal Information</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
            <Separator />
            <Link href="/subscription" className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors" data-testid="button-subscription">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium">Subscription & Billing</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </Link>
            <Separator />
            <Link href="/security" className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors" data-testid="button-security">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium">Security & 2FA</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </Link>
            <Separator />
            <Dialog open={privacyDialogOpen} onOpenChange={setPrivacyDialogOpen}>
              <DialogTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors" data-testid="button-privacy">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-slate-400" />
                    <span className="text-sm font-medium">Privacy & HIPAA</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    HIPAA Compliance
                  </DialogTitle>
                  <DialogDescription>
                    Your data security and privacy are our top priority
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <Lock className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">End-to-End Encryption</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        All audio recordings and patient data are encrypted using AES-256 encryption both in transit and at rest.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Server className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">HIPAA-Compliant Infrastructure</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Our servers are hosted in SOC 2 Type II certified data centers with BAA agreements in place.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                    <FileCheck className="w-5 h-5 text-violet-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">Access Controls</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Role-based access controls ensure only authorized personnel can access patient information.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">Audit Logging</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        All access to PHI is logged and auditable for compliance reporting.
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="text-xs text-muted-foreground space-y-2">
                    <p><strong>Data Retention:</strong> Audio recordings are automatically deleted after 30 days. Case notes are retained for 7 years per HIPAA requirements.</p>
                    <p><strong>Data Export:</strong> You can export or delete your data at any time from the case management screen.</p>
                    <p><strong>Breach Notification:</strong> In the unlikely event of a data breach, we will notify affected users within 60 days per HIPAA guidelines.</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
