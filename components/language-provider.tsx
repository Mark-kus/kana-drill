"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { translations, type Language, type Translations } from "@/lib/translations"

interface LanguageContextType {
  language: Language
  t: Translations
  cycleLanguage: () => void
}

const LanguageContext = createContext<LanguageContextType | null>(null)

const LANGUAGE_ORDER: Language[] = ["en", "es", "pt"]

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  const cycleLanguage = useCallback(() => {
    setLanguage((prev) => {
      const idx = LANGUAGE_ORDER.indexOf(prev)
      return LANGUAGE_ORDER[(idx + 1) % LANGUAGE_ORDER.length]
    })
  }, [])

  const t = translations[language]

  return (
    <LanguageContext.Provider value={{ language, t, cycleLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider")
  return ctx
}
