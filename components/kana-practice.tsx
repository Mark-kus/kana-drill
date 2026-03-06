"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { KanaTable } from "@/components/kana-table"
import { QuizPrompt } from "@/components/quiz-prompt"
import { DrawingCanvas } from "@/components/drawing-canvas"
import { ModeSelector } from "@/components/mode-selector"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { useLanguage } from "@/components/language-provider"
import { cn } from "@/lib/utils"
import { useQuizState } from "@/hooks/use-quiz-state"
import type { KanaEntry } from "@/lib/kana-data"

export function KanaPractice() {
  const { t } = useLanguage()
  const quiz = useQuizState()
  const quizRef = useRef<HTMLDivElement>(null)

  const [drawingHint, setDrawingHint] = useState<{
    bestMatchKana: string | null
    strokeHint: string | null
  }>({ bestMatchKana: null, strokeHint: null })
  const [hintVisible, setHintVisible] = useState(false)

  // Auto-fade the drawing hint after 5 seconds
  useEffect(() => {
    if (drawingHint.bestMatchKana || drawingHint.strokeHint) {
      setHintVisible(true)
      const id = setTimeout(() => setHintVisible(false), 5000)
      return () => clearTimeout(id)
    } else {
      setHintVisible(false)
    }
  }, [drawingHint])

  // Reset drawing hint when mode changes
  useEffect(() => {
    setDrawingHint({ bestMatchKana: null, strokeHint: null })
  }, [quiz.mode])

  // Wrap grid click to scroll back to the quiz area on mobile after a correct answer
  const handleKanaClick = useCallback(
    (entry: KanaEntry) => {
      const isCorrect = entry.romaji === quiz.currentKana.romaji
      quiz.handleKanaClick(entry)

      if (isCorrect && window.innerWidth < 1024 && quizRef.current) {
        const el = quizRef.current
        setTimeout(() => {
          const top = el.getBoundingClientRect().top + window.scrollY
          window.scrollTo({ top, behavior: "smooth" })
        }, 100)
      }
    },
    [quiz.handleKanaClick, quiz.currentKana.romaji],
  )

  if (!quiz.mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-muted-foreground text-lg">{t.loading}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-primary font-sans">Kana</span>
            <span className="text-2xl font-bold text-foreground font-sans">Drill</span>
          </div>
          <div className="flex items-center gap-3">
            <ModeSelector mode={quiz.mode} onModeChange={quiz.setMode} />
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left side: Quiz prompt */}
          <div ref={quizRef} className="w-full lg:w-auto lg:sticky lg:top-8 flex flex-col items-center">
            <div className="bg-card rounded-xl border border-border p-3 sm:p-6 shadow-sm w-full sm:w-fit mx-auto">
              <h2 className="text-lg font-bold text-foreground text-center mb-4">
                {t.quizQuestion}
              </h2>

              <QuizPrompt score={quiz.score} total={quiz.total} streak={quiz.streak} />

              {/* Romaji + Drawing side by side */}
              <div className="flex flex-row items-start justify-center gap-3 sm:gap-6 mt-4">
                {/* Romaji box */}
                <div className="flex w-[130px] sm:w-40 flex-col items-center">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    {t.romaji}
                  </p>
                  <div
                    className={`flex items-center justify-center w-[130px] h-[130px] sm:w-40 sm:h-40 rounded-2xl border-4 transition-all duration-300 ${
                      quiz.feedbackType === "correct"
                        ? "border-success bg-success/10 scale-105"
                        : quiz.feedbackType === "incorrect"
                          ? "border-destructive bg-destructive/10 animate-shake"
                          : "border-border bg-card"
                    }`}
                  >
                    <span className="text-4xl sm:text-5xl font-bold text-foreground tracking-wider">
                      {quiz.currentKana.romaji}
                    </span>
                  </div>
                  <div className="flex items-center justify-center mt-2">
                    <button
                      onClick={quiz.handleGiveUp}
                      disabled={quiz.isProcessing}
                      className={cn(
                        "px-2 py-1 text-xs rounded-md transition-colors",
                        "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                      )}
                    >
                      {t.skip}
                    </button>
                  </div>
                </div>

                {/* Drawing canvas */}
                <div className="relative flex flex-col items-center">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    {t.drawKana}
                  </p>

                  {/* Hint tooltip */}
                  {(drawingHint.bestMatchKana || drawingHint.strokeHint) && (
                    <div
                      className={`absolute right-full top-1/2 -translate-y-1/2 mr-3 z-10 w-44 rounded-lg border border-border bg-popover px-3 py-2 text-left shadow-md transition-opacity duration-500 ${hintVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                    >
                      {drawingHint.bestMatchKana && (
                        <p className="text-sm text-foreground">
                          {t.bestMatch}{" "}
                          <span className="text-xl font-bold leading-none">{drawingHint.bestMatchKana}</span>
                        </p>
                      )}
                      {drawingHint.strokeHint && (
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {drawingHint.strokeHint}
                        </p>
                      )}
                      {/* Arrow pointing right */}
                      <div className="absolute top-1/2 left-full -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-l-[6px] border-l-border" />
                      <div className="absolute top-1/2 left-full -translate-y-1/2 -ml-px w-0 h-0 border-y-[5px] border-y-transparent border-l-[5px] border-l-popover" />
                    </div>
                  )}

                  <DrawingCanvas
                    targetKana={quiz.currentKana.kana}
                    candidateKanas={quiz.candidateKanas}
                    onCorrect={quiz.handleDrawingCorrect}
                    onHintChange={setDrawingHint}
                    disabled={quiz.isProcessing}
                    feedbackType={quiz.feedbackType}
                    showKanaShadow={quiz.correctKana !== null}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right side: Kana grid */}
          <div className="flex-1 w-full min-w-0">
            <p className="text-xs text-muted-foreground text-center mb-2">
              <span className="hidden sm:inline">{t.kanaHintDesktop}</span>
              <span className="sm:hidden">{t.kanaHintMobile}</span>
            </p>
            <KanaTable
              cells={quiz.cells}
              onKanaClick={handleKanaClick}
              feedbackKana={quiz.feedbackKana}
              feedbackType={quiz.feedbackType}
              correctKana={quiz.correctKana}
              disabled={quiz.isProcessing}
              shuffleSeed={quiz.shuffleSeed}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
