"use client"

import { useLanguage } from "@/components/language-provider"
import { cn } from "@/lib/utils"

export function LanguageToggle() {
  const { language, cycleLanguage } = useLanguage()

  const label = language.toUpperCase()

  return (
    <button
      onClick={cycleLanguage}
      className={cn(
        "inline-flex items-center justify-center w-9 h-9 rounded-md",
        "bg-secondary text-secondary-foreground",
        "hover:bg-primary hover:text-primary-foreground",
        "transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "text-xs font-bold"
      )}
      aria-label={`Language: ${label}. Click to change.`}
      title={`Language: ${label}`}
    >
      {label}
    </button>
  )
}
