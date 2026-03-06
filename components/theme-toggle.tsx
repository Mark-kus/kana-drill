"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/components/language-provider"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { t } = useLanguage()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="w-9 h-9" />
  }

  const isDark = resolvedTheme === "dark"

  const cycleTheme = () => {
    if (theme === "system") setTheme("light")
    else if (theme === "light") setTheme("dark")
    else setTheme("system")
  }

  return (
    <button
      onClick={cycleTheme}
      className={cn(
        "inline-flex items-center justify-center w-9 h-9 rounded-md",
        "bg-secondary text-secondary-foreground",
        "hover:bg-primary hover:text-primary-foreground",
        "transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
      aria-label={t.themeAriaLabel(theme === "system" ? t.themeNameSystem : isDark ? t.themeNameDark : t.themeNameLight)}
      title={theme === "system" ? t.themeSystem : isDark ? t.themeDark : t.themeLight}
    >
      {theme === "system" ? (
        <Monitor size={18} />
      ) : isDark ? (
        <Moon size={18} />
      ) : (
        <Sun size={18} />
      )}
    </button>
  )
}
