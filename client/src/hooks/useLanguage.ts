import { useState, useEffect, useCallback } from "react";
import { type Lang, getStoredLang, setStoredLang, t as translate } from "@/lib/i18n";

export function useLanguage() {
  const [lang, setLangState] = useState<Lang>(getStoredLang);

  useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setStoredLang(l);
    setLangState(l);
  }, []);

  const t = useCallback((key: string) => translate(key, lang), [lang]);

  return { lang, setLang, t, isRtl: lang === "ar" };
}
