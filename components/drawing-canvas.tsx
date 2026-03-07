"use client"

import { useRef, useState, useEffect, useCallback, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { evaluateDrawing, type CandidateKana } from "@/lib/kana-recognition"
import { useLanguage } from "@/components/language-provider"

const CANVAS_SIZE = 320
const AUTO_VERIFY_DELAY_MS = 1000

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
  hintTooltip?: ReactNode
}

export function DrawingCanvas({
  targetKana,
  candidateKanas,
  onCorrect,
  onHintChange,
  disabled,
  feedbackType,
  showKanaShadow,
  hintTooltip,
}: DrawingCanvasProps) {
  const { t } = useLanguage()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const lastPosRef = useRef({ x: 0, y: 0 })
  const [strokeCount, setStrokeCount] = useState(0)
  const [hasDrawn, setHasDrawn] = useState(false)
  const autoVerifyRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const strokeCountRef = useRef(0)
  const strokeColorRef = useRef<string | null>(null)

  // Cache the stroke color and update it when the theme changes
  useEffect(() => {
    const updateColor = () => {
      const fg = getComputedStyle(document.documentElement)
        .getPropertyValue("--foreground")
        .trim()
      strokeColorRef.current = fg ? `hsl(${fg})` : "#1a1a2e"
    }
    updateColor()
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    mq.addEventListener("change", updateColor)
    const observer = new MutationObserver(updateColor)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => {
      mq.removeEventListener("change", updateColor)
      observer.disconnect()
    }
  }, [])

  const getStrokeColor = () => strokeColorRef.current ?? "#1a1a2e"

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

  /** Map an evaluation hint type to a localized string */
  const translateHint = (result: ReturnType<typeof evaluateDrawing>): string | null => {
    if (result.hintType === "more-strokes") return t.tryMoreStrokes(result.expectedStrokeRange!)
    if (result.hintType === "fewer-strokes") return t.tryFewerStrokes(result.expectedStrokeRange!)
    if (result.hintType === "more-precision") return t.tryMorePrecision
    return null
  }

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    strokeCountRef.current += 1
    setStrokeCount(strokeCountRef.current)

    clearAutoVerify()
    const currentStrokes = strokeCountRef.current
    autoVerifyRef.current = setTimeout(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const result = evaluateDrawing(canvas, targetKana, candidateKanas, currentStrokes)
      if (result.isCorrect) {
        onCorrect()
      } else {
        onHintChange({
          bestMatchKana: result.bestMatch,
          strokeHint: translateHint(result),
        })
      }
    }, AUTO_VERIFY_DELAY_MS)
  }

  // Cancel pending auto-verify on unmount
  useEffect(() => {
    return () => clearAutoVerify()
  }, [clearAutoVerify])

  return (
    <div className="w-full flex flex-col items-center gap-2 select-none" style={{ WebkitTouchCallout: 'none' }}>
      <div className="relative w-full aspect-square sm:w-56 select-none" style={{ WebkitTouchCallout: 'none' }}>
        {hintTooltip}
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center text-9xl font-bold pointer-events-none select-none",
            feedbackType === "correct" || showKanaShadow ? "opacity-20" : "opacity-0",
          )}
        >
          {targetKana}
        </span>
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className={cn(
            "absolute inset-0 w-full h-full rounded-2xl border-4 cursor-crosshair touch-none select-none transition-colors",
            feedbackType === "correct"
              ? "border-success bg-success/10"
              : feedbackType === "incorrect"
                ? "border-destructive bg-destructive/10"
                : "border-border bg-card",
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      </div>

      <div className="flex items-center gap-2 select-none">
        <span className="text-xs text-muted-foreground tabular-nums min-w-[4.5rem] select-none">
          {strokeCount} {strokeCount === 1 ? t.stroke : t.strokes}
        </span>
        <button
          onClick={clearCanvas}
          disabled={disabled || !hasDrawn}
          className={cn(
            "px-2 py-1 text-xs rounded-md transition-colors select-none",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {t.clear}
        </button>
      </div>
    </div>
  )
}
