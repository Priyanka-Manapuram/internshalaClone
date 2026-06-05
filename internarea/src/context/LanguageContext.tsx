import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, Language, TranslationKey } from "@/i18n/translations";

interface LanguageContextType {
  lang: Language;
  t: (key: TranslationKey) => string;
  changeLang: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  t: (key) => key,
  changeLang: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setlang] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Language;
    if (saved && translations[saved]) setlang(saved);
  }, []);

  const changeLang = (newLang: Language) => {
    setlang(newLang);
    localStorage.setItem("lang", newLang);
  };

  const t = (key: TranslationKey): string => {
    return translations[lang][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, t, changeLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);