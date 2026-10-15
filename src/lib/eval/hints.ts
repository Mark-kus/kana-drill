import type { VerificationResult } from "./verificationEngine"

export interface HintTexts {
  tryMoreStrokes: (range: string) => string
  tryFewerStrokes: (range: string) => string
  tryMorePrecision: string
}

export interface DrawingHint {
  bestMatchKana: string | null
  strokeHint: string | null
}

function strokeRangeLabel(hint: { expectedMin: number; expectedMax: number }): string {
  return hint.expectedMin === hint.expectedMax
    ? `${hint.expectedMin}`
    : `${hint.expectedMin}-${hint.expectedMax}`
}

export function composeFailureHint(result: VerificationResult, t: HintTexts): DrawingHint {
  const strokeHint = result.strokeHint
  if (strokeHint) {
    return {
      bestMatchKana: null,
      strokeHint: strokeHint.tooMany
        ? t.tryFewerStrokes(strokeRangeLabel(strokeHint))
        : t.tryMoreStrokes(strokeRangeLabel(strokeHint)),
    }
  }

  if (result.confusion) {
    return { bestMatchKana: result.confusion, strokeHint: null }
  }

  return { bestMatchKana: null, strokeHint: t.tryMorePrecision }
}
