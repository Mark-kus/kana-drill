"use client"

import { useState, useMemo, useRef, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import type { KanaEntry, KanaCell } from "@/lib/kana-data"
import { shuffleArray } from "@/lib/kana-data"

interface KanaTableProps {
  cells: KanaCell[]
  onKanaClick: (entry: KanaEntry) => void
  feedbackKana: string | null
  feedbackType: "correct" | "incorrect" | null
  correctKana: string | null
  disabled: boolean
  shuffleSeed: number
}

export function KanaTable({
  cells,
  onKanaClick,
  feedbackKana,
  feedbackType,
  correctKana,
  disabled,
  shuffleSeed,
}: KanaTableProps) {
  const shuffledCells = useMemo(() => {
    // We use the seed simply to trigger re-shuffle on mode change
    void shuffleSeed
    return shuffleArray(cells)
  }, [cells, shuffleSeed])

  return (
    <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-9 gap-1.5">
      {shuffledCells.map((cell, idx) => (
        <KanaCellButton
          key={`${cell.base.kana}-${idx}`}
          cell={cell}
          onKanaClick={onKanaClick}
          feedbackKana={feedbackKana}
          feedbackType={feedbackType}
          correctKana={correctKana}
          disabled={disabled}
        />
      ))}
    </div>
  )
}

function KanaCellButton({
  cell,
  onKanaClick,
  feedbackKana,
  feedbackType,
  correctKana,
  disabled,
}: {
  cell: KanaCell
  onKanaClick: (entry: KanaEntry) => void
  feedbackKana: string | null
  feedbackType: "correct" | "incorrect" | null
  correctKana: string | null
  disabled: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [isLongPressed, setIsLongPressed] = useState(false)
  const [longPressProgress, setLongPressProgress] = useState(0)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchStartPos = useRef<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const didLongPress = useRef(false)
  const isTouching = useRef(false)
  const hasVariants = !!cell.dakuten || !!cell.handakuten

  const LONG_PRESS_DURATION = 400 // ms

  const clearTimers = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    if (progressTimer.current) {
      clearInterval(progressTimer.current)
      progressTimer.current = null
    }
    setLongPressProgress(0)
  }, [])

  const startLongPress = useCallback(() => {
    if (!hasVariants || disabled) return
    didLongPress.current = false

    const startTime = Date.now()
    progressTimer.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      setLongPressProgress(Math.min(elapsed / LONG_PRESS_DURATION, 1))
    }, 16)

    longPressTimer.current = setTimeout(() => {
      setIsLongPressed(true)
      setLongPressProgress(0)
      if (progressTimer.current) clearInterval(progressTimer.current)
      didLongPress.current = true
    }, LONG_PRESS_DURATION)
  }, [hasVariants, disabled])

  const cancelLongPress = useCallback(() => {
    clearTimers()
  }, [clearTimers])

  // Close popup when clicking outside
  useEffect(() => {
    if (!isLongPressed) return
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      // Don't close if the touch/click is inside this cell (e.g. on variant buttons)
      if (containerRef.current && containerRef.current.contains(e.target as Node)) {
        return
      }
      setIsLongPressed(false)
    }
    // Delay to avoid immediately closing
    const timer = setTimeout(() => {
      document.addEventListener("touchstart", handleOutside)
      document.addEventListener("mousedown", handleOutside)
    }, 50)
    return () => {
      clearTimeout(timer)
      document.removeEventListener("touchstart", handleOutside)
      document.removeEventListener("mousedown", handleOutside)
    }
  }, [isLongPressed])

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      isTouching.current = true
      const touch = e.touches[0]
      touchStartPos.current = { x: touch.clientX, y: touch.clientY }
      startLongPress()
    },
    [startLongPress]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartPos.current) return
      const touch = e.touches[0]
      const dx = touch.clientX - touchStartPos.current.x
      const dy = touch.clientY - touchStartPos.current.y
      if (Math.sqrt(dx * dx + dy * dy) > 10) {
        cancelLongPress()
      }
    },
    [cancelLongPress]
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      cancelLongPress()
      if (didLongPress.current) {
        e.preventDefault() // prevent click after long press
      }
      // Clear touch flag after a short delay to suppress the synthetic mouseenter
      setTimeout(() => { isTouching.current = false }, 100)
    },
    [cancelLongPress]
  )

  const handleClick = useCallback(() => {
    if (didLongPress.current) {
      didLongPress.current = false
      return
    }
    onKanaClick(cell.base)
  }, [onKanaClick, cell.base])

  const getFeedback = (entry: KanaEntry) => {
    const isCorrect = feedbackKana === entry.kana && feedbackType === "correct"
    const isIncorrect = feedbackKana === entry.kana && feedbackType === "incorrect"
    const isCorrectAnswer = correctKana === entry.kana
    return { isCorrect, isIncorrect, isCorrectAnswer }
  }

  const baseFeedback = getFeedback(cell.base)
  const dakutenFeedback = cell.dakuten ? getFeedback(cell.dakuten) : null
  const handakutenFeedback = cell.handakuten ? getFeedback(cell.handakuten) : null

  // Show variants if hovered (desktop) or long-pressed (mobile) or if any variant has active feedback
  const showVariants =
    hasVariants &&
    (isHovered ||
      isLongPressed ||
      dakutenFeedback?.isCorrect ||
      dakutenFeedback?.isIncorrect ||
      dakutenFeedback?.isCorrectAnswer ||
      handakutenFeedback?.isCorrect ||
      handakutenFeedback?.isIncorrect ||
      handakutenFeedback?.isCorrectAnswer)

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => { if (!isTouching.current) setIsHovered(true) }}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Base kana button */}
      <button
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => {
          if (hasVariants && "ontouchstart" in window) e.preventDefault()
        }}
        disabled={disabled}
        className={cn(
          "w-full aspect-square rounded-lg flex items-center justify-center text-2xl sm:text-3xl font-medium transition-all duration-200 relative overflow-hidden select-none",
          "hover:scale-105 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          baseFeedback.isCorrect &&
            "bg-success text-success-foreground ring-2 ring-success scale-110",
          baseFeedback.isIncorrect &&
            "bg-destructive text-destructive-foreground ring-2 ring-destructive animate-shake",
          baseFeedback.isCorrectAnswer &&
            "bg-destructive text-destructive-foreground ring-2 ring-destructive scale-110",
          !baseFeedback.isCorrect &&
            !baseFeedback.isIncorrect &&
            !baseFeedback.isCorrectAnswer &&
            "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground",
          disabled &&
            !baseFeedback.isCorrect &&
            !baseFeedback.isIncorrect &&
            !baseFeedback.isCorrectAnswer &&
            "opacity-70 cursor-not-allowed",
          hasVariants && !baseFeedback.isCorrect && !baseFeedback.isIncorrect && !baseFeedback.isCorrectAnswer &&
            "max-sm:ring-1 max-sm:ring-primary/20"
        )}
        aria-label={`Kana ${cell.base.kana}, romaji ${cell.base.romaji}${hasVariants ? ". Mantener presionado para variantes" : ""}`}
      >
        {cell.base.kana}

        {/* Long-press progress indicator (fills from bottom) */}
        {hasVariants && longPressProgress > 0 && (
          <div
            className="absolute bottom-0 left-0 right-0 bg-primary/25 transition-none pointer-events-none"
            style={{ height: `${longPressProgress * 100}%` }}
          />
        )}
      </button>

      {/* Variant indicator — badges on mobile, subtle dots on desktop */}
      {hasVariants && !showVariants && (
        <>
          {/* Mobile: prominent badges */}
          <div className="absolute -top-1 -right-1 flex gap-px pointer-events-none sm:hidden">
            {cell.dakuten && (
              <span className="w-4 h-4 rounded-full bg-primary/80 text-primary-foreground flex items-center justify-center text-[8px] font-bold shadow-sm border border-background">
                ゛
              </span>
            )}
            {cell.handakuten && (
              <span className="w-4 h-4 rounded-full bg-accent-foreground/70 text-accent flex items-center justify-center text-[8px] font-bold shadow-sm border border-background">
                ゜
              </span>
            )}
          </div>
          {/* Desktop: original subtle dots */}
          <div className="hidden sm:flex absolute top-1.5 right-1.5 gap-px">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
            {cell.handakuten && (
              <div className="w-1.5 h-1.5 rounded-full bg-accent/40" />
            )}
          </div>
        </>
      )}

      {/* Dakuten / Handakuten variant overlay (desktop hover + mobile long-press) */}
      {hasVariants && showVariants && (
        <div
          className="absolute -top-2 -right-2 flex gap-0.5 z-10"
          onTouchStart={(e) => e.stopPropagation()}
        >
          {cell.dakuten && (
            <VariantButton
              entry={cell.dakuten}
              feedback={dakutenFeedback!}
              onClick={(entry) => {
                onKanaClick(entry)
                setIsLongPressed(false)
              }}
              disabled={disabled}
              label="゛"
            />
          )}
          {cell.handakuten && (
            <VariantButton
              entry={cell.handakuten}
              feedback={handakutenFeedback!}
              onClick={(entry) => {
                onKanaClick(entry)
                setIsLongPressed(false)
              }}
              disabled={disabled}
              label="゜"
            />
          )}
        </div>
      )}
    </div>
  )
}

function VariantButton({
  entry,
  feedback,
  onClick,
  disabled,
  label,
}: {
  entry: KanaEntry
  feedback: { isCorrect: boolean; isIncorrect: boolean; isCorrectAnswer: boolean }
  onClick: (entry: KanaEntry) => void
  disabled: boolean
  label: string
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick(entry)
      }}
      onTouchEnd={(e) => {
        e.stopPropagation()
      }}
      disabled={disabled}
      className={cn(
        "w-11 h-11 sm:w-10 sm:h-10 rounded-md flex items-center justify-center text-lg sm:text-base font-medium shadow-md border transition-all duration-150 select-none",
        "hover:scale-110 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        feedback.isCorrect &&
          "bg-success text-success-foreground border-success",
        feedback.isIncorrect &&
          "bg-destructive text-destructive-foreground border-destructive animate-shake",
        feedback.isCorrectAnswer &&
          "bg-destructive text-destructive-foreground border-destructive",
        !feedback.isCorrect &&
          !feedback.isIncorrect &&
          !feedback.isCorrectAnswer &&
          "bg-card text-foreground border-border hover:bg-primary hover:text-primary-foreground hover:border-primary"
      )}
      aria-label={`Kana ${entry.kana}, romaji ${entry.romaji}`}
      title={entry.kana}
    >
      {entry.kana}
    </button>
  )
}
