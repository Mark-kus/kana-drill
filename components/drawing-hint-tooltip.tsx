"use client"

import { useLanguage } from "@/components/language-provider"

interface DrawingHintTooltipProps {
  bestMatchKana: string | null
  strokeHint: string | null
  visible: boolean
}

export function DrawingHintTooltip({
  bestMatchKana,
  strokeHint,
  visible,
}: DrawingHintTooltipProps) {
  const { t } = useLanguage()

  if (!bestMatchKana && !strokeHint) return null

  return (
    <div
      className={`absolute bottom-full left-0 right-0 mb-1 z-10 rounded-lg border border-border bg-popover px-3 py-2 text-center shadow-md transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
    >
      {bestMatchKana && (
        <p className="text-sm text-foreground">
          {t.bestMatch}{" "}
          <span className="text-xl font-bold leading-none">{bestMatchKana}</span>
        </p>
      )}
      {strokeHint && (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {strokeHint}
        </p>
      )}
    </div>
  )
}
