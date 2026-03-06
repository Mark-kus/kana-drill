"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { KanaTable } from "@/components/kana-table"
import { QuizPrompt } from "@/components/quiz-prompt"
import { DrawingCanvas } from "@/components/drawing-canvas"
import { ModeSelector, type KanaMode } from "@/components/mode-selector"
import {
  HIRAGANA_CELLS,
  KATAKANA_CELLS,
  getKanaStrokeRange,
  getAllKana,
  type KanaEntry,
} from "@/lib/kana-data"

const MAX_KANA_TIME = 20 // seconds

export function KanaPractice() {
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
        <span className="text-muted-foreground text-lg">Cargando...</span>
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
          <ModeSelector mode={mode} onModeChange={setMode} />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left side: Quiz prompt */}
          <div className="w-full lg:w-auto lg:sticky lg:top-8 flex flex-col items-center">
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground text-center mb-4">
                {"Cual es el kana correcto?"}
              </h2>

              {/* Scores + timers stacked */}
              <QuizPrompt
                romaji={currentKana.romaji}
                score={score}
                total={total}
                streak={streak}
                feedbackType={feedbackType}
                totalElapsed={totalElapsed}
                kanaElapsed={kanaElapsed}
                isCapped={isCapped}
                avgTime={avgTime}
                formatTime={formatTime}
              />

              {/* Romaji + Drawing side by side */}
              <div className="flex flex-row items-start justify-center gap-6 mt-4">
                {/* Romaji box */}
                <div className="relative flex w-40 flex-col items-start">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Romaji
                  </p>
                  <div
                    className={`flex items-center justify-center w-40 h-40 rounded-2xl border-4 transition-all duration-300 ${
                      feedbackType === "correct"
                        ? "border-success bg-success/10 scale-105"
                        : feedbackType === "incorrect"
                          ? "border-destructive bg-destructive/10 animate-shake"
                          : "border-primary/30 bg-card"
                    }`}
                  >
                    <span className="text-5xl font-bold text-foreground tracking-wider">
                      {currentKana.romaji}
                    </span>
                  </div>

                  {(drawingHint.bestMatchKana || drawingHint.strokeHint) && (
                    <div className="absolute left-0 top-full mt-3 w-52 rounded-lg border border-border bg-popover px-3 py-2 text-left shadow-sm">
                      {drawingHint.bestMatchKana && (
                        <p className="text-sm text-foreground">
                          Mejor coincidencia: <span className="text-xl font-bold leading-none">{drawingHint.bestMatchKana}</span>
                        </p>
                      )}
                      {drawingHint.strokeHint && (
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {drawingHint.strokeHint}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Drawing canvas */}
                <div className="flex flex-col items-center">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Dibuja el kana
                  </p>
                  <DrawingCanvas
                    targetKana={currentKana.kana}
                    candidateKanas={candidateKanas}
                    onCorrect={handleDrawingCorrect}
                    onHintChange={setDrawingHint}
                    disabled={isProcessing}
                    feedbackType={feedbackType}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right side: Kana grid */}
          <div className="flex-1 w-full min-w-0">
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
