"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import type { KanaStrokeRange } from "@/lib/kana-data"
import { matchDrawingShape, MIN_SHAPE_SCORE } from "@/lib/kana-recognition"
import { useLanguage } from "@/components/language-provider"

interface CandidateKana {
  kana: string
  strokeRange: KanaStrokeRange
}

interface DrawingCanvasProps {
  targetKana: string
  candidateKanas: CandidateKana[]
  onCorrect: () => void
  onHintChange: (hint: {
    bestMatchKana: string | null
    strokeHint: string | null
  }) => void
  disabled: boolean
  feedbackType: "correct" | "incorrect" | null
  showKanaShadow?: boolean
}

export function DrawingCanvas({
  targetKana,
  candidateKanas,
  onCorrect,
  onHintChange,
  disabled,
  feedbackType,
  showKanaShadow,
}: DrawingCanvasProps) {
  const { t } = useLanguage()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const lastPosRef = useRef({ x: 0, y: 0 })
  const [strokeCount, setStrokeCount] = useState(0)
  const [hasDrawn, setHasDrawn] = useState(false)
  const autoVerifyRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const strokeCountRef = useRef(0)

  const getStrokeColor = () => {
    const style = getComputedStyle(document.documentElement)
    const fg = style.getPropertyValue("--foreground").trim()
    return fg ? `hsl(${fg})` : "#1a1a2e"
  }

  const clearAutoVerify = useCallback(() => {
    if (autoVerifyRef.current) {
      clearTimeout(autoVerifyRef.current)
      autoVerifyRef.current = null
    }
  }, [])

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setStrokeCount(0)
    strokeCountRef.current = 0
    setHasDrawn(false)
    clearAutoVerify()
    onHintChange({ bestMatchKana: null, strokeHint: null })
  }, [onHintChange, clearAutoVerify])

  useEffect(() => {
    clearCanvas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKana])

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!ctx || !canvas) return

    canvas.setPointerCapture(e.pointerId)
    const pos = getPos(e)
    lastPosRef.current = pos

    // Draw a small dot at the start so taps are visible
    ctx.fillStyle = getStrokeColor()
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2)
    ctx.fill()

    isDrawingRef.current = true
    setHasDrawn(true)
    clearAutoVerify()
    onHintChange({ bestMatchKana: null, strokeHint: null })
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || disabled) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!ctx) return

    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.lineWidth = 4
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = getStrokeColor()
    ctx.stroke()

    lastPosRef.current = pos
  }

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    strokeCountRef.current += 1
    setStrokeCount(strokeCountRef.current)

    clearAutoVerify()
    const currentStrokes = strokeCountRef.current
    autoVerifyRef.current = setTimeout(() => {
      const result = findBestMatch(currentStrokes)
      if (result.isCorrect) {
        onCorrect()
      } else {
        onHintChange({
          bestMatchKana: result.bestMatch,
          strokeHint: result.hint,
        })
      }
    }, 1000)
  }

  const findBestMatch = useCallback(
    (strokes: number) => {
      const targetEntry = candidateKanas.find((c) => c.kana === targetKana)

      // Helper: stroke hint for the target kana
      const getStrokeHint = (): string | null => {
        if (!targetEntry) return null
        const { min, max } = targetEntry.strokeRange
        const range = min === max ? `${min}` : `${min}–${max}`
        if (strokes < min) return t.tryMoreStrokes(range)
        if (strokes > max) return t.tryFewerStrokes(range)
        return null
      }

      // 1. Filter candidates by stroke count
      const strokeMatches = candidateKanas.filter(
        (c) => strokes >= c.strokeRange.min && strokes <= c.strokeRange.max
      )

      // 2. No kana matches this stroke count → stroke hint only
      if (strokeMatches.length === 0) {
        let bestMatch: string | null = null
        let bestDist = Infinity
        for (const c of candidateKanas) {
          if (c.kana === targetKana) continue
          const d =
            strokes >= c.strokeRange.min && strokes <= c.strokeRange.max
              ? 0
              : Math.min(
                  Math.abs(strokes - c.strokeRange.min),
                  Math.abs(strokes - c.strokeRange.max)
                )
          if (d < bestDist) {
            bestDist = d
            bestMatch = c.kana
          }
        }
        return { isCorrect: false, bestMatch, hint: getStrokeHint() }
      }

      // 3. Shape match among stroke-compatible candidates
      const canvas = canvasRef.current
      if (!canvas) {
        const targetIn = strokeMatches.some((c) => c.kana === targetKana)
        return { isCorrect: targetIn, bestMatch: null, hint: null }
      }

      const results = matchDrawingShape(
        canvas,
        strokeMatches.map((c) => c.kana),
        strokes
      )

      // Debug: log top 3 matches
      const top3 = results.slice(0, 3)
      console.log(
        `[KanaMatch] target=${targetKana} strokes=${strokes} top3:`,
        top3.map((r) => `${r.kana} (${r.score.toFixed(3)})`).join(", ")
      )

      if (results.length === 0) {
        return { isCorrect: false, bestMatch: null, hint: getStrokeHint() }
      }

      const best = results[0]

      // Find the target's score in results
      const targetResult = results.find((r) => r.kana === targetKana)
      const SCORE_TOLERANCE = 0.05

      // 4. Target is within tolerance of the best score and above minimum → correct
      if (
        targetResult &&
        targetResult.score >= MIN_SHAPE_SCORE &&
        best.score - targetResult.score <= SCORE_TOLERANCE
      ) {
        return { isCorrect: true, bestMatch: null, hint: null }
      }

      // 5. Target matched strokes but score too low
      if (targetResult && targetResult.score < MIN_SHAPE_SCORE) {
        return {
          isCorrect: false,
          bestMatch: null,
          hint: t.tryMorePrecision,
        }
      }

      // 6. Best match is a different kana (target too far from best or not in stroke matches)
      const targetIn = strokeMatches.some((c) => c.kana === targetKana)
      return {
        isCorrect: false,
        bestMatch: best.kana,
        hint: targetIn ? null : getStrokeHint(),
      }
    },
    [candidateKanas, targetKana]
  )

  // Cancel pending auto-verify on unmount
  useEffect(() => {
    return () => clearAutoVerify()
  }, [clearAutoVerify])

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-[130px] h-[130px] sm:w-40 sm:h-40">
        {/* Target kana shown behind the drawing when asserting */}
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center text-7xl font-bold pointer-events-none select-none z-0",
            (feedbackType === "correct" || showKanaShadow) ? "opacity-20" : "opacity-0"
          )}
        >
          {targetKana}
        </span>
        <canvas
          ref={canvasRef}
          width={160}
          height={160}
          className={cn(
            "absolute inset-0 w-full h-full rounded-2xl border-4 cursor-crosshair touch-none transition-all duration-300 z-10",
            feedbackType === "correct"
              ? "border-success bg-success/10"
              : feedbackType === "incorrect"
                ? "border-destructive bg-destructive/10"
                : "border-border bg-card"
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground tabular-nums min-w-[4.5rem]">
          {strokeCount} {strokeCount === 1 ? t.stroke : t.strokes}
        </span>
        <button
          onClick={clearCanvas}
          disabled={disabled || !hasDrawn}
          className={cn(
            "px-2 py-1 text-xs rounded-md transition-colors",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {t.clear}
        </button>
      </div>
    </div>
  )
}
