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

function parseAndFormatContent(content: string): string {
  if (!content) return "";
  
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === "object" && parsed !== null) {
      if (Array.isArray(parsed)) {
        return parsed.map((item, i) => `${i + 1}. ${typeof item === 'string' ? item : JSON.stringify(item)}`).join("\n");
      }
      return Object.entries(parsed)
        .map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
        .join("\n");
    }
  } catch {
    // Not JSON, return as-is
  }
  return content;
}

interface EditableSectionProps {
  title: string;
  content: string;
  onSave: (content: string) => void;
  placeholder?: string;
  variant?: "default" | "highlighted" | "accent" | "warning";
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
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isRecordingRef = useRef(false);
  const finalTranscriptRef = useRef("");

  const formattedContent = parseAndFormatContent(content);

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
    recognition.lang = "en-US";

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
      console.error("Speech recognition error:", event);
      setIsRecording(false);
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
                Recording...
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
            <div 
              className={cn(
                "text-sm leading-relaxed whitespace-pre-wrap",
                content ? "text-foreground" : "text-muted-foreground italic",
                (variant === "accent" || variant === "highlighted") && "font-medium"
              )}
              data-testid={`text-${testId}`}
            >
              {formattedContent ? (
                <div className="space-y-1">
                  {(() => {
                    const lines = formattedContent.split('\n').filter(line => line.trim());
                    const listItems: string[] = [];
                    const regularContent: { type: 'header' | 'text' | 'list'; content: string | string[] }[] = [];
                    
                    lines.forEach((line) => {
                      const trimmedLine = line.trim();
                      const isNumberedItem = /^\d+[\.\)]\s/.test(trimmedLine);
                      const isBulletItem = /^[-•*]\s/.test(trimmedLine);
                      const isHeaderLike = trimmedLine.endsWith(':') && trimmedLine.length < 50;
                      
                      if (isNumberedItem || isBulletItem) {
                        listItems.push(trimmedLine.replace(/^\d+[\.\)]\s|^[-•*]\s/, ''));
                      } else {
                        if (listItems.length > 0) {
                          regularContent.push({ type: 'list', content: [...listItems] });
                          listItems.length = 0;
                        }
                        if (isHeaderLike) {
                          regularContent.push({ type: 'header', content: trimmedLine });
                        } else {
                          regularContent.push({ type: 'text', content: trimmedLine });
                        }
                      }
                    });
                    
                    if (listItems.length > 0) {
                      regularContent.push({ type: 'list', content: [...listItems] });
                    }
                    
                    return regularContent.map((item, idx) => {
                      if (item.type === 'header') {
                        return (
                          <p key={idx} className="font-semibold text-foreground mt-3 first:mt-0">
                            {item.content as string}
                          </p>
                        );
                      }
                      if (item.type === 'list') {
                        return (
                          <ul key={idx} className="list-disc list-inside space-y-1 pl-2 my-2">
                            {(item.content as string[]).map((listItem, listIdx) => (
                              <li key={listIdx} className="text-foreground/90">
                                {listItem}
                              </li>
                            ))}
                          </ul>
                        );
                      }
                      return <p key={idx}>{item.content as string}</p>;
                    });
                  })()}
                </div>
              ) : (
                placeholder
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
