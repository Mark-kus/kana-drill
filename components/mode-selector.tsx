"use client"

import { cn } from "@/lib/utils"

export type KanaMode = "hiragana" | "katakana"

interface ModeSelectorProps {
  mode: KanaMode
  onModeChange: (mode: KanaMode) => void
}

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="inline-flex items-center rounded-lg bg-secondary p-1 gap-1">
      <button
        onClick={() => onModeChange("hiragana")}
        className={cn(
          "px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200",
          mode === "hiragana"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span className="mr-1.5 text-base">あ</span>
        Hiragana
      </button>
      <button
        onClick={() => onModeChange("katakana")}
        className={cn(
          "px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200",
          mode === "katakana"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <span className="mr-1.5 text-base">ア</span>
        Katakana
      </button>
    </div>
  )
}
