"use client"

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
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Score row */}
      <div className="flex items-center justify-center gap-6">
        <div className="w-40 text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Correctas
          </p>
          <p className="text-xl font-bold text-success">{score}</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Total
          </p>
          <p className="text-xl font-bold text-foreground">{total}</p>
        </div>
        <div className="w-40 text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Racha
          </p>
          <p className="text-xl font-bold text-accent">{streak}</p>
        </div>
      </div>


    </div>
  )
}
