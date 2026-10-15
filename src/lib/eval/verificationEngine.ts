import type { Stroke } from "./raster"
import {
  smoothStrokes,
  rasterizeStrokes,
  dilateMask,
  distanceTransform,
  DEFAULT_GRID_SIZE,
  DEFAULT_DILATE_RADIUS,
} from "./raster"
import {
  getKanaReference,
  getConfusables,
  computeMaxRotationScore,
} from "./kanaReferences"
import { getKanaStrokeRange } from "../../../lib/kana-data"

export type Difficulty = "easy" | "medium" | "hard"

export interface StrokeHint {
  userCount: number
  expectedMin: number
  expectedMax: number
  tooMany: boolean
}

export interface VerificationResult {
  passed: boolean
  score: number
  targetKana: string
  bestMatchKana: string | null
  bestMatchScore: number
  confusion: string | null
  strokeHint: StrokeHint | null
}

export interface VerificationEngineOptions {
  difficulty: Difficulty
}

const DIFFICULTY_THRESHOLDS: Record<Difficulty, number> = {
  easy: 0.6,
  medium: 0.7,
  hard: 0.84,
}

const HINT_FLOOR = 0.45
const STROKE_COUNT_PENALTY = 0.05

function strokePrior(userCount: number, kana: string): number {
  const { min, max } = getKanaStrokeRange(kana)
  return userCount >= min && userCount <= max ? 0 : -STROKE_COUNT_PENALTY
}

function buildStrokeHint(userCount: number, kana: string): StrokeHint | null {
  const { min, max } = getKanaStrokeRange(kana)
  if (userCount >= min && userCount <= max) return null
  return {
    userCount,
    expectedMin: min,
    expectedMax: max,
    tooMany: userCount > max,
  }
}

export class VerificationEngine {
  private difficulty: Difficulty

  constructor(options: VerificationEngineOptions) {
    this.difficulty = options.difficulty
  }

  evaluate(
    userStrokes: Stroke[],
    targetKana: string,
    candidateKanas?: string[]
  ): VerificationResult {
    const userCount = userStrokes.filter((s) => s.length > 0).length
    const smoothed = smoothStrokes(userStrokes, 3)
    const userMask = rasterizeStrokes(smoothed, DEFAULT_GRID_SIZE)

    if (!userMask) {
      return {
        passed: false,
        score: 0,
        targetKana,
        bestMatchKana: null,
        bestMatchScore: 0,
        confusion: null,
        strokeHint: null,
      }
    }

    const targetRef = getKanaReference(targetKana)

    if (!targetRef) {
      return {
        passed: false,
        score: 0,
        targetKana,
        bestMatchKana: null,
        bestMatchScore: 0,
        confusion: null,
        strokeHint: null,
      }
    }

    const userDt = distanceTransform(userMask, DEFAULT_GRID_SIZE)
    const userDilated = dilateMask(userMask, DEFAULT_GRID_SIZE, DEFAULT_DILATE_RADIUS)
    const targetResult = computeMaxRotationScore(userMask, userDilated, userDt, targetRef)
    const targetScore = targetResult.score
    const targetAdjusted = targetScore + strokePrior(userCount, targetKana)

    const confusableKanas = getConfusables(targetKana, candidateKanas, 5)

    let bestMatchKana = targetKana
    let bestMatchScore = targetScore
    let bestMatchAdjusted = targetAdjusted

    for (const candidateKana of confusableKanas) {
      const candidateRef = getKanaReference(candidateKana)
      if (!candidateRef) continue

      const candidateResult = computeMaxRotationScore(userMask, userDilated, userDt, candidateRef)
      const candidateAdjusted = candidateResult.score + strokePrior(userCount, candidateKana)

      if (candidateAdjusted > bestMatchAdjusted) {
        bestMatchAdjusted = candidateAdjusted
        bestMatchScore = candidateResult.score
        bestMatchKana = candidateKana
      }
    }

    const threshold = DIFFICULTY_THRESHOLDS[this.difficulty]
    const passed = bestMatchKana === targetKana && targetScore >= threshold

    let confusion: string | null = null
    if (!passed && bestMatchKana !== targetKana && bestMatchScore >= HINT_FLOOR) {
      confusion = bestMatchKana
    }

    return {
      passed,
      score: targetScore,
      targetKana,
      bestMatchKana: bestMatchKana === targetKana ? null : bestMatchKana,
      bestMatchScore,
      confusion,
      strokeHint: buildStrokeHint(userCount, targetKana),
    }
  }
}
