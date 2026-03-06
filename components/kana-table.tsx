"use client"

import { useState, useMemo } from "react"
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
  const hasVariants = !!cell.dakuten || !!cell.handakuten

  const getFeedback = (entry: KanaEntry) => {
    const isCorrect = feedbackKana === entry.kana && feedbackType === "correct"
    const isIncorrect = feedbackKana === entry.kana && feedbackType === "incorrect"
    return { isCorrect, isIncorrect }
  }

  const baseFeedback = getFeedback(cell.base)
  const dakutenFeedback = cell.dakuten ? getFeedback(cell.dakuten) : null
  const handakutenFeedback = cell.handakuten ? getFeedback(cell.handakuten) : null

  // Show variants if hovered or if any variant has active feedback
  const showVariants =
    hasVariants &&
    (isHovered ||
      dakutenFeedback?.isCorrect ||
      dakutenFeedback?.isIncorrect ||
      handakutenFeedback?.isCorrect ||
      handakutenFeedback?.isIncorrect)

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Base kana button */}
      <button
        onClick={() => onKanaClick(cell.base)}
        disabled={disabled}
        className={cn(
          "w-full aspect-square rounded-lg flex items-center justify-center text-xl sm:text-2xl font-medium transition-all duration-200",
          "hover:scale-105 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          baseFeedback.isCorrect &&
            "bg-success text-success-foreground ring-2 ring-success scale-110",
          baseFeedback.isIncorrect &&
            "bg-destructive text-destructive-foreground ring-2 ring-destructive animate-shake",
          !baseFeedback.isCorrect &&
            !baseFeedback.isIncorrect &&
            "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground",
          disabled &&
            !baseFeedback.isCorrect &&
            !baseFeedback.isIncorrect &&
            "opacity-70 cursor-not-allowed"
        )}
        aria-label={`Kana ${cell.base.kana}, romaji ${cell.base.romaji}`}
      >
        {cell.base.kana}
      </button>

      {/* Dakuten / Handakuten variant overlays */}
      {hasVariants && showVariants && (
        <div className="absolute -top-2 -right-2 flex gap-0.5 z-10">
          {cell.dakuten && (
            <VariantButton
              entry={cell.dakuten}
              feedback={dakutenFeedback!}
              onClick={onKanaClick}
              disabled={disabled}
              label="゛"
            />
          )}
          {cell.handakuten && (
            <VariantButton
              entry={cell.handakuten}
              feedback={handakutenFeedback!}
              onClick={onKanaClick}
              disabled={disabled}
              label="゜"
            />
          )}
        </div>
      )}

      {/* Small indicator dot if cell has variants */}
      {hasVariants && !showVariants && (
        <div className="absolute top-0.5 right-0.5 flex gap-px">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
          {cell.handakuten && (
            <div className="w-1.5 h-1.5 rounded-full bg-accent/40" />
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
  feedback: { isCorrect: boolean; isIncorrect: boolean }
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
      disabled={disabled}
      className={cn(
        "w-8 h-8 sm:w-9 sm:h-9 rounded-md flex items-center justify-center text-xs sm:text-sm font-medium shadow-md border transition-all duration-150",
        "hover:scale-110 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        feedback.isCorrect &&
          "bg-success text-success-foreground border-success",
        feedback.isIncorrect &&
          "bg-destructive text-destructive-foreground border-destructive animate-shake",
        !feedback.isCorrect &&
          !feedback.isIncorrect &&
          "bg-card text-foreground border-border hover:bg-primary hover:text-primary-foreground hover:border-primary"
      )}
      aria-label={`Kana ${entry.kana}, romaji ${entry.romaji}`}
      title={entry.kana}
    >
      {label === "゛" ? entry.kana : entry.kana}
    </button>
  )
}
