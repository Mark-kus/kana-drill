"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import {
  HIRAGANA_CELLS,
  KATAKANA_CELLS,
  getKanaStrokeRange,
  getAllKana,
  type KanaEntry,
} from "@/lib/kana-data"
import type { CandidateKana } from "@/lib/kana-recognition"
import type { KanaMode } from "@/components/mode-selector"

export function useQuizState() {
  const [mode, setMode] = useState<KanaMode>("hiragana")
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [streak, setStreak] = useState(0)
  const [feedbackKana, setFeedbackKana] = useState<string | null>(null)
  const [feedbackType, setFeedbackType] = useState<"correct" | "incorrect" | null>(null)
  const [correctKana, setCorrectKana] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [shuffleSeed, setShuffleSeed] = useState(0)

  const cells = mode === "hiragana" ? HIRAGANA_CELLS : KATAKANA_CELLS
  const allKana = useMemo(() => getAllKana(cells), [cells])
  const candidateKanas: CandidateKana[] = useMemo(
    () =>
      allKana.map((entry) => ({
        kana: entry.kana,
        strokeRange: getKanaStrokeRange(entry.kana),
      })),
    [allKana],
  )

  const getRandomKana = useCallback(
    (exclude?: string): KanaEntry => {
      const pool = exclude ? allKana.filter((k) => k.romaji !== exclude) : allKana
      return pool[Math.floor(Math.random() * pool.length)]
    },
    [allKana],
  )

  const [currentKana, setCurrentKana] = useState<KanaEntry>(allKana[0])

  useEffect(() => {
    setCurrentKana(getRandomKana())
    setShuffleSeed(Date.now())
    setMounted(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reset quiz state when mode changes
  useEffect(() => {
    if (!mounted) return
    setCurrentKana(getRandomKana())
    setScore(0)
    setTotal(0)
    setStreak(0)
    setFeedbackKana(null)
    setFeedbackType(null)
    setCorrectKana(null)
    setIsProcessing(false)
    setShuffleSeed(Date.now())
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
    [isProcessing, currentKana, getRandomKana],
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

    setTimeout(() => {
      setFeedbackKana(null)
      setFeedbackType(null)
      setCurrentKana(getRandomKana(currentKana.romaji))
      setIsProcessing(false)
    }, 1000)
  }, [isProcessing, currentKana, getRandomKana])

  const handleGiveUp = useCallback(() => {
    if (isProcessing) return
    setIsProcessing(true)
    setTotal((prev) => prev + 1)
    setStreak(0)
    setFeedbackType("incorrect")
    setFeedbackKana(null)
    setCorrectKana(currentKana.kana)

    setTimeout(() => {
      setFeedbackKana(null)
      setFeedbackType(null)
      setCorrectKana(null)
      setCurrentKana(getRandomKana(currentKana.romaji))
      setIsProcessing(false)
    }, 1500)
  }, [isProcessing, currentKana, getRandomKana])

  return {
    mode,
    setMode,
    score,
    total,
    streak,
    feedbackKana,
    feedbackType,
    correctKana,
    isProcessing,
    mounted,
    shuffleSeed,
    currentKana,
    cells,
    candidateKanas,
    handleKanaClick,
    handleDrawingCorrect,
    handleGiveUp,
  }
}
