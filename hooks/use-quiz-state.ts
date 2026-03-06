"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import {
  HIRAGANA_CELLS,
  KATAKANA_CELLS,
  getKanaStrokeRange,
  getAllKana,
  type KanaEntry,
} from "@/lib/kana-data"
import type { CandidateKana } from "@/lib/kana-recognition"
import type { KanaMode } from "@/components/mode-selector"

const CORRECT_CLICK_DELAY = 600
const INCORRECT_CLICK_DELAY = 800
const CORRECT_DRAWING_DELAY = 1000
const GIVE_UP_DELAY = 1500

export function useQuizState() {
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
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

  // Cleanup pending feedback timer on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    }
  }, [])

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

        feedbackTimerRef.current = setTimeout(() => {
          setFeedbackKana(null)
          setFeedbackType(null)
          setCurrentKana(getRandomKana(currentKana.romaji))
          setIsProcessing(false)
        }, CORRECT_CLICK_DELAY)
      } else {
        setStreak(0)
        setFeedbackKana(entry.kana)
        setFeedbackType("incorrect")
        setCorrectKana(null)

        feedbackTimerRef.current = setTimeout(() => {
          setFeedbackKana(null)
          setFeedbackType(null)
          setIsProcessing(false)
        }, INCORRECT_CLICK_DELAY)
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

    feedbackTimerRef.current = setTimeout(() => {
      setFeedbackKana(null)
      setFeedbackType(null)
      setCurrentKana(getRandomKana(currentKana.romaji))
      setIsProcessing(false)
    }, CORRECT_DRAWING_DELAY)
  }, [isProcessing, currentKana, getRandomKana])

  const handleGiveUp = useCallback(() => {
    if (isProcessing) return
    setIsProcessing(true)
    setTotal((prev) => prev + 1)
    setStreak(0)
    setFeedbackType("incorrect")
    setFeedbackKana(null)
    setCorrectKana(currentKana.kana)

    feedbackTimerRef.current = setTimeout(() => {
      setFeedbackKana(null)
      setFeedbackType(null)
      setCorrectKana(null)
      setCurrentKana(getRandomKana(currentKana.romaji))
      setIsProcessing(false)
    }, GIVE_UP_DELAY)
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
