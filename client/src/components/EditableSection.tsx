import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Mic, MicOff, Check, X, Languages } from "lucide-react";
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

const SUPPORTED_LANGUAGES = [
  { code: "en-US", name: "English (US)", flag: "🇺🇸" },
  { code: "en-GB", name: "English (UK)", flag: "🇬🇧" },
  { code: "fa-IR", name: "Persian (Farsi)", flag: "🇮🇷" },
  { code: "ar-SA", name: "Arabic", flag: "🇸🇦" },
  { code: "es-ES", name: "Spanish", flag: "🇪🇸" },
  { code: "fr-FR", name: "French", flag: "🇫🇷" },
  { code: "de-DE", name: "German", flag: "🇩🇪" },
  { code: "it-IT", name: "Italian", flag: "🇮🇹" },
  { code: "pt-BR", name: "Portuguese (Brazil)", flag: "🇧🇷" },
  { code: "ru-RU", name: "Russian", flag: "🇷🇺" },
  { code: "zh-CN", name: "Chinese (Mandarin)", flag: "🇨🇳" },
  { code: "ja-JP", name: "Japanese", flag: "🇯🇵" },
  { code: "ko-KR", name: "Korean", flag: "🇰🇷" },
  { code: "hi-IN", name: "Hindi", flag: "🇮🇳" },
  { code: "tr-TR", name: "Turkish", flag: "🇹🇷" },
  { code: "nl-NL", name: "Dutch", flag: "🇳🇱" },
  { code: "pl-PL", name: "Polish", flag: "🇵🇱" },
  { code: "uk-UA", name: "Ukrainian", flag: "🇺🇦" },
  { code: "he-IL", name: "Hebrew", flag: "🇮🇱" },
  { code: "th-TH", name: "Thai", flag: "🇹🇭" },
  { code: "vi-VN", name: "Vietnamese", flag: "🇻🇳" },
  { code: "id-ID", name: "Indonesian", flag: "🇮🇩" },
  { code: "sv-SE", name: "Swedish", flag: "🇸🇪" },
  { code: "da-DK", name: "Danish", flag: "🇩🇰" },
  { code: "fi-FI", name: "Finnish", flag: "🇫🇮" },
];

interface EditableSectionProps {
  title: string;
  content: string;
  onSave: (content: string) => void;
  placeholder?: string;
  variant?: "default" | "highlighted" | "accent";
  testId?: string;
}

export function EditableSection({ 
  title, 
  content, 
  onSave, 
  placeholder = "No content recorded",
  variant = "default",
  testId 
}: EditableSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isRecordingRef = useRef(false);
  const finalTranscriptRef = useRef("");

  useEffect(() => {
    setEditedContent(content);
  }, [content]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startVoiceInput = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert("Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectedLanguage;

    finalTranscriptRef.current = editedContent ? editedContent + " " : "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscriptRef.current += result[0].transcript + " ";
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      
      setEditedContent(finalTranscriptRef.current + interimTranscript);
    };

    recognition.onerror = (event: Event) => {
      const errorEvent = event as any;
      console.error("Speech recognition error:", event);
      setIsRecording(false);
      
      if (errorEvent.error === 'language-not-supported' || errorEvent.error === 'not-allowed') {
        alert(`Speech recognition for ${SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name || selectedLanguage} may not be supported in your browser. Try using Chrome or Edge for best language support.`);
      }
    };

    recognition.onend = () => {
      if (isRecordingRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          setIsRecording(false);
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopVoiceInput = () => {
    isRecordingRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleSave = () => {
    stopVoiceInput();
    const trimmedContent = editedContent.trim();
    onSave(trimmedContent);
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
  };

  const iconStyles = {
    default: "text-slate-500",
    highlighted: "text-primary",
    accent: "text-emerald-600 dark:text-emerald-400",
  };

  return (
    <div className="relative group">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <span className={cn("w-1.5 h-1.5 rounded-full", {
            "bg-slate-400": variant === "default",
            "bg-primary": variant === "highlighted",
            "bg-emerald-500": variant === "accent",
          })} />
          {title}
        </h3>
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

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="editing"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Languages className="w-3 h-3" />
                <span>Voice Language:</span>
              </div>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="h-7 w-[180px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code} className="text-xs">
                      <span className="mr-2">{lang.flag}</span>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder={placeholder}
                className={cn(
                  "min-h-[120px] resize-none pr-12 transition-all",
                  isRecording && "border-red-400 ring-2 ring-red-100 dark:ring-red-900/30"
                )}
                data-testid={`textarea-${testId}`}
              />
              <Button
                type="button"
                variant={isRecording ? "destructive" : "secondary"}
                size="icon"
                onClick={isRecording ? stopVoiceInput : startVoiceInput}
                className={cn(
                  "absolute right-2 top-2 h-8 w-8 transition-all",
                  isRecording && "animate-pulse"
                )}
                data-testid={`button-voice-${testId}`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            </div>

            {isRecording && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-xs text-red-500"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Recording in {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name}...
              </motion.div>
            )}

            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-8"
                data-testid={`button-cancel-${testId}`}
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="h-8"
                data-testid={`button-save-${testId}`}
              >
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
            className={cn(
              "rounded-xl border p-4 transition-all duration-300",
              variantStyles[variant],
              !content && "border-dashed"
            )}
          >
            <p 
              className={cn(
                "text-sm leading-relaxed whitespace-pre-wrap",
                content ? "text-foreground" : "text-muted-foreground italic"
              )}
              data-testid={`text-${testId}`}
            >
              {content || placeholder}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
