"use client"

import { cn } from "@/lib/utils"

interface QuizPromptProps {
  romaji: string
  score: number
  total: number
  streak: number
  feedbackType: "correct" | "incorrect" | null
  totalElapsed: number
  kanaElapsed: number
  isCapped: boolean
  avgTime: number
  formatTime: (secs: number) => string
}

export function QuizPrompt({
  score,
  total,
  streak,
  totalElapsed,
  kanaElapsed,
  isCapped,
  avgTime,
  formatTime,
}: QuizPromptProps) {
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Score row */}
      <div className="flex items-center justify-center gap-5">
        <div className="text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Correctas
          </p>
          <p className="text-xl font-bold text-success">{score}</p>
        </div>
        <div className="w-px h-7 bg-border" />
        <div className="text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Total
          </p>
          <p className="text-xl font-bold text-foreground">{total}</p>
        </div>
        <div className="w-px h-7 bg-border" />
        <div className="text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Racha
          </p>
          <p className="text-xl font-bold text-accent">{streak}</p>
        </div>
      </div>

      {/* Timer row */}
      <div className="flex items-center justify-center gap-4">
        <div className="text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Tiempo
          </p>
          <p className="text-base font-bold text-foreground tabular-nums">
            {formatTime(totalElapsed)}
          </p>
        </div>
        <div className="w-px h-7 bg-border" />
        <div className="text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Este kana
          </p>
          <p
            className={cn(
              "text-base font-bold tabular-nums transition-colors",
              isCapped ? "text-destructive" : "text-foreground"
            )}
          >
            {kanaElapsed}s
          </p>
        </div>
        <div className="w-px h-7 bg-border" />
        <div className="text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Promedio
          </p>
          <p className="text-base font-bold text-foreground tabular-nums">
            {avgTime > 0 ? `${avgTime.toFixed(1)}s` : "-"}
          </p>
        </div>
      </div>
    </div>
  )
}
