"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { KanaTable } from "@/components/kana-table"
import { QuizPrompt } from "@/components/quiz-prompt"
import { DrawingCanvas } from "@/components/drawing-canvas"
import { ModeSelector, type KanaMode } from "@/components/mode-selector"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { useLanguage } from "@/components/language-provider"
import { cn } from "@/lib/utils"
import {
  HIRAGANA_CELLS,
  KATAKANA_CELLS,
  getKanaStrokeRange,
  getAllKana,
  type KanaEntry,
} from "@/lib/kana-data"

const MAX_KANA_TIME = 20 // seconds

export function KanaPractice() {
  const { t } = useLanguage()
  const [mode, setMode] = useState<KanaMode>("hiragana")
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [streak, setStreak] = useState(0)
  const [feedbackKana, setFeedbackKana] = useState<string | null>(null)
  const [feedbackType, setFeedbackType] = useState<
    "correct" | "incorrect" | null
  >(null)
  const [correctKana, setCorrectKana] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [shuffleSeed, setShuffleSeed] = useState(0)
  const [drawingHint, setDrawingHint] = useState<{
    bestMatchKana: string | null
    strokeHint: string | null
  }>({ bestMatchKana: null, strokeHint: null })
  const [hintVisible, setHintVisible] = useState(false)
  const quizRef = useRef<HTMLDivElement>(null)

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

  // Timer state -- use refs for the tick logic to avoid stale closures
  const [totalElapsed, setTotalElapsed] = useState(0)
  const [kanaElapsed, setKanaElapsed] = useState(0)
  const [kanaTimes, setKanaTimes] = useState<number[]>([])
  const [isCapped, setIsCapped] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const kanaElapsedRef = useRef(0)
  const totalElapsedRef = useRef(0)
  const isCappedRef = useRef(false)

  const cells = mode === "hiragana" ? HIRAGANA_CELLS : KATAKANA_CELLS
  const allKana = getAllKana(cells)
  const candidateKanas = allKana.map((entry) => ({
    kana: entry.kana,
    strokeRange: getKanaStrokeRange(entry.kana),
  }))

  const getRandomKana = useCallback(
    (exclude?: string): KanaEntry => {
      const pool = exclude
        ? allKana.filter((k) => k.romaji !== exclude)
        : allKana
      return pool[Math.floor(Math.random() * pool.length)]
    },
    [allKana]
  )

  const [currentKana, setCurrentKana] = useState<KanaEntry>(allKana[0])

  // Single tick timer using refs so we never double-count
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (isCappedRef.current) return // already at 20s, don't add anything

      kanaElapsedRef.current += 1
      totalElapsedRef.current += 1

      if (kanaElapsedRef.current >= MAX_KANA_TIME) {
        isCappedRef.current = true
        setIsCapped(true)
      }

      setKanaElapsed(kanaElapsedRef.current)
      setTotalElapsed(totalElapsedRef.current)
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const restartKanaTimer = useCallback((recordedTime?: number) => {
    if (recordedTime !== undefined) {
      setKanaTimes((prev) => [...prev, recordedTime])
    }
    kanaElapsedRef.current = 0
    isCappedRef.current = false
    setKanaElapsed(0)
    setIsCapped(false)
  }, [])

  const resetAllTimers = useCallback(() => {
    kanaElapsedRef.current = 0
    totalElapsedRef.current = 0
    isCappedRef.current = false
    setKanaElapsed(0)
    setTotalElapsed(0)
    setIsCapped(false)
    setKanaTimes([])
  }, [])

  useEffect(() => {
    setCurrentKana(getRandomKana())
    setShuffleSeed(Date.now())
    setMounted(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!mounted) return
    const kanaList = getAllKana(
      mode === "hiragana" ? HIRAGANA_CELLS : KATAKANA_CELLS
    )
    const randomKana = kanaList[Math.floor(Math.random() * kanaList.length)]
    setCurrentKana(randomKana)
    setScore(0)
    setTotal(0)
    setStreak(0)
    setFeedbackKana(null)
    setFeedbackType(null)
    setCorrectKana(null)
    setIsProcessing(false)
    setDrawingHint({ bestMatchKana: null, strokeHint: null })
    setShuffleSeed(Date.now())
    resetAllTimers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const handleKanaClick = useCallback(
    (entry: KanaEntry) => {
      if (isProcessing) return

      setIsProcessing(true)
      setTotal((prev) => prev + 1)

      if (entry.romaji === currentKana.romaji) {
        setScore((prev) => prev + 1)
        setStreak((prev) => prev + 1)
        setFeedbackKana(entry.kana)
        setFeedbackType("correct")
        setCorrectKana(null)

        const time = Math.min(kanaElapsedRef.current, MAX_KANA_TIME)
        restartKanaTimer(time)

        // On mobile, scroll back to the quiz area after a short delay
        // so the feedback is visible before scrolling
        if (window.innerWidth < 1024 && quizRef.current) {
          const el = quizRef.current
          setTimeout(() => {
            const top = el.getBoundingClientRect().top + window.scrollY
            window.scrollTo({ top, behavior: "smooth" })
          }, 100)
        }

        setTimeout(() => {
          setFeedbackKana(null)
          setFeedbackType(null)
          setCurrentKana(getRandomKana(currentKana.romaji))
          setIsProcessing(false)
        }, 600)
      } else {
        setStreak(0)
        setFeedbackKana(entry.kana)
        setFeedbackType("incorrect")
        setCorrectKana(null)

        setTimeout(() => {
          setFeedbackKana(null)
          setFeedbackType(null)
          setIsProcessing(false)
        }, 800)
      }
    },
    [isProcessing, currentKana, getRandomKana, restartKanaTimer]
  )

  const handleDrawingCorrect = useCallback(() => {
    if (isProcessing) return
    setIsProcessing(true)
    setTotal((prev) => prev + 1)
    setScore((prev) => prev + 1)
    setStreak((prev) => prev + 1)
    setFeedbackType("correct")
    setFeedbackKana(currentKana.kana)
    setCorrectKana(null)

    const time = Math.min(kanaElapsedRef.current, MAX_KANA_TIME)
    restartKanaTimer(time)

    setTimeout(() => {
      setFeedbackKana(null)
      setFeedbackType(null)
      setCurrentKana(getRandomKana(currentKana.romaji))
      setIsProcessing(false)
    }, 1000)
  }, [isProcessing, currentKana, getRandomKana, restartKanaTimer])

  const handleGiveUp = useCallback(() => {
    if (isProcessing) return
    setIsProcessing(true)
    setTotal((prev) => prev + 1)
    setStreak(0)
    setFeedbackType("incorrect")
    setFeedbackKana(null)
    setCorrectKana(currentKana.kana)

    restartKanaTimer(MAX_KANA_TIME)

    setTimeout(() => {
      setFeedbackKana(null)
      setFeedbackType(null)
      setCorrectKana(null)
      setCurrentKana(getRandomKana(currentKana.romaji))
      setIsProcessing(false)
    }, 1500)
  }, [isProcessing, currentKana, getRandomKana, restartKanaTimer])

  // Computed values
  const avgTime =
    kanaTimes.length > 0
      ? kanaTimes.reduce((a, b) => a + b, 0) / kanaTimes.length
      : 0

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  if (!mounted) {
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
            <span className="text-2xl font-bold text-primary font-sans">
              Kana
            </span>
            <span className="text-2xl font-bold text-foreground font-sans">
              Drill
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ModeSelector mode={mode} onModeChange={setMode} />
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

              {/* Scores + timers stacked */}
              <QuizPrompt
                score={score}
                total={total}
                streak={streak}
              />

              {/* Romaji + Drawing side by side */}
              <div className="flex flex-row items-start justify-center gap-3 sm:gap-6 mt-4">
                {/* Romaji box */}
                <div className="flex w-[130px] sm:w-40 flex-col items-center">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    {t.romaji}
                  </p>
                  <div
                    className={`flex items-center justify-center w-[130px] h-[130px] sm:w-40 sm:h-40 rounded-2xl border-4 transition-all duration-300 ${
                      feedbackType === "correct"
                        ? "border-success bg-success/10 scale-105"
                        : feedbackType === "incorrect"
                          ? "border-destructive bg-destructive/10 animate-shake"
                          : "border-border bg-card"
                    }`}
                  >
                    <span className="text-4xl sm:text-5xl font-bold text-foreground tracking-wider">
                      {currentKana.romaji}
                    </span>
                  </div>
                  <div className="flex items-center justify-center mt-2">
                    <button
                      onClick={handleGiveUp}
                      disabled={isProcessing}
                      className={cn(
                        "px-2 py-1 text-xs rounded-md transition-colors",
                        "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
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

                  {/* Hint tooltip – positioned to the left of the canvas, overlapping romaji */}
                  {(drawingHint.bestMatchKana || drawingHint.strokeHint) && (
                    <div className={`absolute right-full top-1/2 -translate-y-1/2 mr-3 z-10 w-44 rounded-lg border border-border bg-popover px-3 py-2 text-left shadow-md transition-opacity duration-500 ${hintVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                      {drawingHint.bestMatchKana && (
                        <p className="text-sm text-foreground">
                          {t.bestMatch} <span className="text-xl font-bold leading-none">{drawingHint.bestMatchKana}</span>
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
                    targetKana={currentKana.kana}
                    candidateKanas={candidateKanas}
                    onCorrect={handleDrawingCorrect}
                    onHintChange={setDrawingHint}
                    disabled={isProcessing}
                    feedbackType={feedbackType}
                    showKanaShadow={correctKana !== null}
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
              cells={cells}
              onKanaClick={handleKanaClick}
              feedbackKana={feedbackKana}
              feedbackType={feedbackType}
              correctKana={correctKana}
              disabled={isProcessing}
              shuffleSeed={shuffleSeed}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
