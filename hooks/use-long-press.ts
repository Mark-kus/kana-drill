"use client"

import { useState, useRef, useCallback, useEffect } from "react"

interface UseLongPressOptions {
  duration?: number
  disabled?: boolean
  enabled?: boolean
}

export function useLongPress(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options: UseLongPressOptions = {},
) {
  const { duration = 400, disabled = false, enabled = true } = options

  const [isLongPressed, setIsLongPressed] = useState(false)
  const [longPressProgress, setLongPressProgress] = useState(0)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchStartPos = useRef<{ x: number; y: number } | null>(null)
  const didLongPress = useRef(false)
  const isTouching = useRef(false)

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
    if (!enabled || disabled) return
    didLongPress.current = false

    const startTime = Date.now()
    progressTimer.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      setLongPressProgress(Math.min(elapsed / duration, 1))
    }, 16)

    longPressTimer.current = setTimeout(() => {
      setIsLongPressed(true)
      setLongPressProgress(0)
      if (progressTimer.current) clearInterval(progressTimer.current)
      didLongPress.current = true
    }, duration)
  }, [enabled, disabled, duration])

  const cancelLongPress = useCallback(() => {
    clearTimers()
  }, [clearTimers])

  // Close popup when clicking outside
  useEffect(() => {
    if (!isLongPressed) return
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return
      setIsLongPressed(false)
    }
    const timer = setTimeout(() => {
      document.addEventListener("touchstart", handleOutside)
      document.addEventListener("mousedown", handleOutside)
    }, 50)
    return () => {
      clearTimeout(timer)
      document.removeEventListener("touchstart", handleOutside)
      document.removeEventListener("mousedown", handleOutside)
    }
  }, [isLongPressed, containerRef])

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      isTouching.current = true
      const touch = e.touches[0]
      touchStartPos.current = { x: touch.clientX, y: touch.clientY }
      startLongPress()
    },
    [startLongPress],
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
    [cancelLongPress],
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      cancelLongPress()
      if (didLongPress.current) {
        e.preventDefault()
      }
      setTimeout(() => {
        isTouching.current = false
      }, 100)
    },
    [cancelLongPress],
  )

  return {
    isLongPressed,
    setIsLongPressed,
    longPressProgress,
    didLongPress,
    isTouching,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  }
}
