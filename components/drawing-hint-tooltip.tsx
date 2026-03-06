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
      className={`absolute right-full top-1/2 -translate-y-1/2 mr-3 z-10 w-44 rounded-lg border border-border bg-popover px-3 py-2 text-left shadow-md transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
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
      {/* Arrow pointing right */}
      <div className="absolute top-1/2 left-full -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-l-[6px] border-l-border" />
      <div className="absolute top-1/2 left-full -translate-y-1/2 -ml-px w-0 h-0 border-y-[5px] border-y-transparent border-l-[5px] border-l-popover" />
    </div>
  )
}
