import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Mic, MicOff, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

/**
 * Finds the end of a leading JSON object or array in a string.
 * Returns { json, remainder } or null if no balanced JSON found.
 */
function extractLeadingJson(text: string): { json: string; remainder: string } | null {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\" && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{" || ch === "[") depth++;
    if (ch === "}" || ch === "]") {
      depth--;
      if (depth === 0) {
        return { json: text.substring(0, i + 1), remainder: text.substring(i + 1) };
      }
    }
  }
  return null;
}

/**
 * Converts AI-generated content (which may be raw JSON or JSON + trailing text) into
 * clean display lines. Handles: plain text, JSON objects, JSON arrays, nested wrappers,
 * and the common case of {"key":"value"} followed by dictation corrections.
 */
export function parseAIContent(content: string): string[] {
  if (!content || !content.trim()) return [];

  const trimmed = content.trim();

  // Try to parse as full JSON first
  try {
    const parsed = JSON.parse(trimmed);

    if (typeof parsed === "string") {
      // Might be double-stringified — try one more parse before giving up
      if (parsed !== trimmed) return parseAIContent(parsed);
      return [parsed];
    }

    if (Array.isArray(parsed)) {
      return parsed.flatMap(item =>
        typeof item === "string" ? [item] : parseAIContent(JSON.stringify(item))
      );
    }

    if (typeof parsed === "object" && parsed !== null) {
      const keys = Object.keys(parsed);
      if (keys.length === 1) {
        const val = parsed[keys[0]];
        if (Array.isArray(val)) {
          return val.flatMap(v => typeof v === "string" ? [v] : parseAIContent(JSON.stringify(v)));
        }
        if (typeof val === "string") return [val];
        if (typeof val === "object" && val !== null) return parseAIContent(JSON.stringify(val));
      }

      // Multi-key object: render values as plain text lines (ignore keys)
      return Object.entries(parsed).flatMap(([, value]) => {
        if (typeof value === "string") return [value];
        if (Array.isArray(value)) return value.map(v => typeof v === "string" ? v : JSON.stringify(v));
        if (typeof value === "object" && value !== null) return parseAIContent(JSON.stringify(value));
        return [String(value)];
      });
    }
  } catch {
    // Handle set-like syntax {"item1","item2"} — invalid JSON but sometimes returned by AI
    // Replace outer braces with brackets and try parsing as array.
    // A real JSON object {"key":"value"} becomes ["key":"value"] which is still invalid JSON,
    // so this only succeeds for the set-like pattern.
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const asArray = "[" + trimmed.slice(1, -1) + "]";
        const parsed = JSON.parse(asArray);
        if (Array.isArray(parsed) && parsed.every(v => typeof v === "string")) {
          return parsed;
        }
      } catch {}
    }

    // Full parse failed — try extracting a leading JSON block (handles "JSON + trailing text" pattern)
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      const extracted = extractLeadingJson(trimmed);
      if (extracted) {
        try {
          const parts = parseAIContent(extracted.json);
          const tail = extracted.remainder.trim();
          if (tail) {
            parts.push(...tail.split("\n").map(l => l.trim()).filter(Boolean));
          }
          return parts;
        } catch {}
      }
    }
  }

  // Plain text — split by newlines
  const lines = trimmed.split("\n").map(l => l.trim()).filter(Boolean);
  return lines.length > 0 ? lines : [trimmed];
}

/**
 * Structured renderer for Physical Exam JSON objects.
 * Shows each system (General, Vitals, HEENT, CV, etc.) as its own labeled section.
 */
export function PhysicalExamDisplay({ content }: { content: string }) {
  if (!content) return <p className="text-sm text-muted-foreground italic">No physical exam recorded</p>;

  try {
    const parsed = JSON.parse(content.trim());
    if (typeof parsed === "object" && !Array.isArray(parsed) && parsed !== null) {
      const systemIcons: Record<string, string> = {
        General: "🧍", VitalSigns: "📊", Vitals: "📊", HEENT: "👁️",
        Cardiovascular: "❤️", Respiratory: "🫁", Abdomen: "🟡",
        Extremities: "🦵", Neurological: "🧠", Skin: "🩺", MSK: "🦴",
      };
      return (
        <div className="space-y-2">
          {Object.entries(parsed).map(([system, findings]) => (
            <div key={system} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/60 dark:to-slate-800/30 p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{systemIcons[system] || "🩺"}</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {system.replace(/([A-Z])/g, " $1").trim()}
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {typeof findings === "string" ? findings : JSON.stringify(findings)}
              </p>
            </div>
          ))}
        </div>
      );
    }
  } catch {}

  const lines = parseAIContent(content);
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => (
        <p key={i} className="text-sm text-foreground leading-relaxed">{line}</p>
      ))}
    </div>
  );
}

interface EditableSectionProps {
  title: string;
  content: string;
  onSave: (content: string) => void;
  placeholder?: string;
  variant?: "default" | "highlighted" | "accent" | "warning";
  testId?: string;
  renderContent?: (content: string) => React.ReactNode;
  extraActions?: React.ReactNode;
}

export function EditableSection({
  title,
  content,
  onSave,
  placeholder = "No content recorded",
  variant = "default",
  testId,
  renderContent,
  extraActions,
}: EditableSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isRecordingRef = useRef(false);
  const finalTranscriptRef = useRef("");

  const formattedContent = parseAIContent(content);

  useEffect(() => { setEditedContent(content); }, [content]);
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);
  useEffect(() => {
    return () => { recognitionRef.current?.abort(); };
  }, []);

  const startVoiceInput = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) { alert("Speech recognition not supported. Please use Chrome, Edge, or Safari."); return; }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    finalTranscriptRef.current = editedContent ? editedContent + " " : "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalTranscriptRef.current += event.results[i][0].transcript + " ";
        else interim += event.results[i][0].transcript;
      }
      setEditedContent(finalTranscriptRef.current + interim);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => {
      if (isRecordingRef.current && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch { setIsRecording(false); }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopVoiceInput = () => {
    isRecordingRef.current = false;
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const handleSave = () => {
    stopVoiceInput();
    onSave(editedContent.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
    stopVoiceInput();
  };

  const variantStyles = {
    default: "bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30 border-slate-200 dark:border-slate-700",
    highlighted: "bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 border-primary/20",
    accent: "bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/10 border-emerald-200 dark:border-emerald-800",
    warning: "bg-gradient-to-br from-red-50 to-orange-50/50 dark:from-red-900/20 dark:to-orange-900/10 border-red-200 dark:border-red-800",
  };

  return (
    <div className="relative group">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <span className={cn("w-1.5 h-1.5 rounded-full", {
            "bg-slate-400": variant === "default",
            "bg-primary": variant === "highlighted",
            "bg-emerald-500": variant === "accent",
            "bg-red-500": variant === "warning",
          })} />
          {title}
        </h3>
        <div className="flex items-center gap-1">
          {extraActions}
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2 text-xs"
              data-testid={`button-edit-${testId}`}
            >
              <Pencil className="w-3 h-3 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div key="editing" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-3">
            <div className="relative">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder={placeholder}
                className={cn("min-h-[120px] resize-none pr-12 transition-all", isRecording && "border-red-400 ring-2 ring-red-100 dark:ring-red-900/30")}
                data-testid={`textarea-${testId}`}
              />
              <Button
                type="button"
                variant={isRecording ? "destructive" : "secondary"}
                size="icon"
                onClick={isRecording ? stopVoiceInput : startVoiceInput}
                className={cn("absolute right-2 top-2 h-8 w-8 transition-all", isRecording && "animate-pulse")}
                data-testid={`button-voice-${testId}`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            </div>
            {isRecording && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-xs text-red-500">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Recording...
              </motion.div>
            )}
            <div className="flex items-center gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={handleCancel} className="h-8" data-testid={`button-cancel-${testId}`}>
                <X className="w-3 h-3 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} className="h-8" data-testid={`button-save-${testId}`}>
                <Check className="w-3 h-3 mr-1" />
                Save
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn("rounded-xl border p-4 transition-all duration-300", variantStyles[variant], !content && "border-dashed")}
          >
            {renderContent ? (
              renderContent(content)
            ) : (
              <div
                className={cn("text-sm leading-relaxed", content ? "text-foreground" : "text-muted-foreground italic", (variant === "accent" || variant === "highlighted") && "font-medium")}
                data-testid={`text-${testId}`}
              >
                {formattedContent.length > 0 ? (
                  formattedContent.length > 1 ? (
                    <ul className="list-disc list-outside space-y-2 pl-5">
                      {formattedContent.map((item, idx) => (
                        <li key={idx} className="text-foreground/90 leading-relaxed">{item.replace(/^\d+[\.\)]\s*/, "")}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="leading-relaxed">{formattedContent[0]}</p>
                  )
                ) : (
                  placeholder
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
