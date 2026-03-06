"use client"

import { useLanguage } from "@/components/language-provider"

interface QuizPromptProps {
  score: number
  total: number
  streak: number
}

export function QuizPrompt({
  score,
  total,
  streak,
}: QuizPromptProps) {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Score row */}
      <div className="flex items-center justify-center gap-4 sm:gap-6">
        <div className="text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t.correct}
          </p>
          <p className="text-xl font-bold text-success">{score}</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t.total}
          </p>
          <p className="text-xl font-bold text-foreground">{total}</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t.streak}
          </p>
          <p className="text-xl font-bold text-accent">{streak}</p>
        </div>
      </div>


    </div>
  )
}
