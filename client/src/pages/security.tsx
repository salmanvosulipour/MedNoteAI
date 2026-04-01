import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Shield, Smartphone, Fingerprint, Key, Copy, Check, AlertTriangle, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { resolveUrl } from "@/lib/queryClient";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const DEMO_USER_ID = "demo-user";

interface TwoFactorStatus {
  enabled: boolean;
  method: string | null;
  hasBackupCodes: boolean;
}

export default function SecurityPage() {
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus>({
    enabled: false,
    method: null,
    hasBackupCodes: false,
  });
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [backupCodesDialogOpen, setBackupCodesDialogOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [manualKey, setManualKey] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [setupStep, setSetupStep] = useState<"qr" | "verify" | "backup">("qr");
  const { toast } = useToast();

  useEffect(() => {
    fetchTwoFactorStatus();
  }, []);

  const fetchTwoFactorStatus = async () => {
    // 2FA backend not yet implemented — keep default disabled state
  };

  const startSetup = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(resolveUrl("/api/auth/2fa/setup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: DEMO_USER_ID }),
      });

      if (!res.ok) throw new Error("Failed to setup 2FA");

      const data = await res.json();
      setQrCodeUrl(data.qrCodeDataUrl);
      setManualKey(data.manualEntryKey);
      setSetupStep("qr");
      setSetupDialogOpen(true);
    } catch (error) {
      toast({
        title: "Setup Failed",
        description: "Could not start 2FA setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (verificationCode.length !== 6) return;

    setIsLoading(true);
    try {
      const res = await fetch(resolveUrl("/api/auth/2fa/enable"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: DEMO_USER_ID,
          token: verificationCode,
          method: "totp",
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Invalid code");
      }

      const data = await res.json();
      setBackupCodes(data.backupCodes);
      setSetupStep("backup");
      setTwoFactorStatus({ enabled: true, method: "totp", hasBackupCodes: true });
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication is now active on your account.",
      });
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    if (!disableCode) return;

    setIsLoading(true);
    try {
      const res = await fetch(resolveUrl("/api/auth/2fa/disable"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: DEMO_USER_ID,
          token: disableCode,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Invalid code");
      }

      setTwoFactorStatus({ enabled: false, method: null, hasBackupCodes: false });
      setDisableDialogOpen(false);
      setDisableCode("");
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been turned off.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Disable",
        description: error.message || "Invalid code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateBackupCodes = async () => {
    const code = prompt("Enter your 6-digit authenticator code to regenerate backup codes:");
    if (!code || code.length !== 6) return;

    setIsLoading(true);
    try {
      const res = await fetch(resolveUrl("/api/auth/2fa/regenerate-backup-codes"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: DEMO_USER_ID,
          token: code,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Invalid code");
      }

      const data = await res.json();
      setBackupCodes(data.backupCodes);
      setBackupCodesDialogOpen(true);
      toast({
        title: "Backup Codes Regenerated",
        description: "New backup codes have been generated. Save them securely.",
      });
    } catch (error: any) {
      toast({
        title: "Failed",
        description: error.message || "Could not regenerate backup codes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const copyAllBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast({ title: "Copied", description: "All backup codes copied to clipboard." });
  };

  return (
    <MobileLayout showNav={false}>
      <header className="px-6 pt-12 pb-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/profile">
            <button className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors" data-testid="button-back">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-2xl font-heading font-bold">Security</h1>
        </div>
      </header>

      <div className="px-6 space-y-6 pb-12">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Two-Factor Authentication (2FA)</span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${twoFactorStatus.enabled ? "bg-emerald-100" : "bg-slate-100"}`}>
                    <Smartphone className={`w-5 h-5 ${twoFactorStatus.enabled ? "text-emerald-600" : "text-slate-400"}`} />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Authenticator App</Label>
                    <p className="text-xs text-muted-foreground">
                      {twoFactorStatus.enabled ? "Enabled" : "Use Google Authenticator or similar"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <Switch
                    checked={false}
                    disabled={true}
                    data-testid="switch-2fa"
                  />
                  <span className="text-[10px] text-muted-foreground">Coming soon</span>
                </div>
              </div>

              {twoFactorStatus.enabled && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-amber-100">
                        <Key className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Backup Codes</Label>
                        <p className="text-xs text-muted-foreground">
                          {twoFactorStatus.hasBackupCodes ? "Available" : "Not generated"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={regenerateBackupCodes}
                      disabled={isLoading}
                      data-testid="button-regenerate-codes"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Regenerate
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100">Why use 2FA?</p>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  Two-factor authentication adds an extra layer of security to protect sensitive patient data and comply with HIPAA requirements.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Fingerprint className="w-4 h-4" />
            <span>Biometric Authentication</span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-slate-100">
                  <Fingerprint className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Face ID / Touch ID</Label>
                  <p className="text-xs text-muted-foreground">Use biometrics for quick login</p>
                </div>
              </div>
              <Switch disabled data-testid="switch-biometrics" />
            </div>
            <p className="text-xs text-muted-foreground mt-3 ml-11">
              Biometric authentication will be available in a future update.
            </p>
          </div>
        </section>
      </div>

      <Dialog open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {setupStep === "qr" && "Set Up Authenticator"}
              {setupStep === "verify" && "Verify Code"}
              {setupStep === "backup" && "Save Backup Codes"}
            </DialogTitle>
            <DialogDescription>
              {setupStep === "qr" && "Scan this QR code with your authenticator app"}
              {setupStep === "verify" && "Enter the 6-digit code from your app"}
              {setupStep === "backup" && "Save these codes in a secure location"}
            </DialogDescription>
          </DialogHeader>

          {setupStep === "qr" && (
            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                {qrCodeUrl && (
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 rounded-lg border" data-testid="img-qr-code" />
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Can't scan? Enter this key manually:</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded text-xs font-mono break-all" data-testid="text-manual-key">
                    {manualKey}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(manualKey)}
                    data-testid="button-copy-key"
                  >
                    {copiedCode === manualKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {setupStep === "verify" && (
            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={verificationCode}
                  onChange={setVerificationCode}
                  data-testid="input-verification-code"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
          )}

          {setupStep === "backup" && (
            <div className="space-y-4 py-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-100">Important!</p>
                <p className="text-amber-700 dark:text-amber-300 mt-1">
                  Save these backup codes. If you lose access to your authenticator, you can use these to log in.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded font-mono text-sm text-center"
                    data-testid={`text-backup-code-${index}`}
                  >
                    {code}
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full" onClick={copyAllBackupCodes} data-testid="button-copy-all-codes">
                <Copy className="w-4 h-4 mr-2" />
                Copy All Codes
              </Button>
            </div>
          )}

          <DialogFooter>
            {setupStep === "qr" && (
              <Button onClick={() => setSetupStep("verify")} className="w-full" data-testid="button-next-step">
                I've Scanned the Code
              </Button>
            )}
            {setupStep === "verify" && (
              <Button
                onClick={verifyAndEnable}
                disabled={verificationCode.length !== 6 || isLoading}
                className="w-full"
                data-testid="button-verify"
              >
                {isLoading ? "Verifying..." : "Verify & Enable"}
              </Button>
            )}
            {setupStep === "backup" && (
              <Button
                onClick={() => {
                  setSetupDialogOpen(false);
                  setSetupStep("qr");
                  setVerificationCode("");
                }}
                className="w-full"
                data-testid="button-done"
              >
                I've Saved My Codes
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your authenticator code or a backup code to disable 2FA.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter code"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
              className="text-center font-mono tracking-widest"
              data-testid="input-disable-code"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDisableDialogOpen(false)} data-testid="button-cancel-disable">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={disableTwoFactor}
              disabled={!disableCode || isLoading}
              data-testid="button-confirm-disable"
            >
              {isLoading ? "Disabling..." : "Disable 2FA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={backupCodesDialogOpen} onOpenChange={setBackupCodesDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Backup Codes</DialogTitle>
            <DialogDescription>
              Your previous backup codes have been invalidated. Save these new codes securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded font-mono text-sm text-center"
                >
                  {code}
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full" onClick={copyAllBackupCodes}>
              <Copy className="w-4 h-4 mr-2" />
              Copy All Codes
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setBackupCodesDialogOpen(false)} className="w-full">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
