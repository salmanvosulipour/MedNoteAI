import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { storeUser } from "@/hooks/useAuth";
import { overrideStoredDeviceId } from "@/lib/device";
import logoIcon from "@assets/generated_images/minimalist_medical_ai_logo_icon.png";

const PRODUCTION_URL = "https://med-note-ai-1--salmanvosuli.replit.app";
const apiBase = "/api";

export default function AppleCallbackPage() {
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const deviceId = params.get("deviceId");
    const appleError = params.get("apple_error");

    if (appleError) {
      const messages: Record<string, string> = {
        missing_token: "Sign in failed — no token received from Apple.",
        invalid_token: "Sign in failed — invalid Apple token.",
        auth_failed: "Sign in failed. Please try again.",
      };
      setErrorMsg(messages[appleError] || "Sign in failed. Please try again.");
      setStatus("error");
      return;
    }

    if (!token) {
      setErrorMsg("Sign in failed — missing session token.");
      setStatus("error");
      return;
    }

    // Fetch the user profile using the token
    fetch(`${apiBase}/auth/user`, {
      credentials: "include",
      headers: {
        "Authorization": `Bearer ${token}`,
        ...(deviceId ? { "X-Device-ID": deviceId } : {}),
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch user");
        const user = await res.json();
        if (deviceId) overrideStoredDeviceId(deviceId);
        storeUser({ ...user, token });
        window.location.replace("/home");
      })
      .catch((err) => {
        setErrorMsg("Sign in failed — could not load your account. Please try again.");
        setStatus("error");
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#050810] text-white flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center overflow-hidden">
          <img src={logoIcon} alt="MedNote AI" className="w-full h-full object-cover" />
        </div>

        {status === "loading" ? (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <p className="text-slate-400 text-sm">Signing you in with Apple…</p>
          </>
        ) : (
          <>
            <div className="text-center">
              <p className="text-red-400 font-medium mb-2">Sign In Failed</p>
              <p className="text-slate-400 text-sm max-w-xs">{errorMsg}</p>
            </div>
            <a
              href="/"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Back to Sign In
            </a>
          </>
        )}
      </div>
    </div>
  );
}
