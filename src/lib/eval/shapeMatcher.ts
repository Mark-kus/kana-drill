import {
  dilateMask,
  countOnes,
  countIntersection,
  DEFAULT_GRID_SIZE,
  DEFAULT_DILATE_RADIUS,
  defaultMaxDistance,
} from "./raster"

export interface ShapeMatchResult {
  score: number
  precision: number
  recall: number
}

export interface CombinedMatchResult {
  score: number
  f1: number
  chamfer: number
}

const CHAMFER_WEIGHT = 0.6
const F1_WEIGHT = 0.4

export function f1Score(
  userMask: Uint8Array,
  userDilated: Uint8Array,
  templateMask: Uint8Array,
  templateDilated: Uint8Array
): number {
  const userCount = countOnes(userMask)
  const templateCount = countOnes(templateMask)
  if (userCount === 0 || templateCount === 0) return 0

  const userInTemplate = countIntersection(userMask, templateDilated)
  const templateInUser = countIntersection(templateMask, userDilated)

  const precision = userInTemplate / userCount
  const recall = templateInUser / templateCount
  if (precision + recall === 0) return 0
  return (2 * precision * recall) / (precision + recall)
}

export function symmetricF1(
  userMask: Uint8Array,
  templateMask: Uint8Array,
  size: number = DEFAULT_GRID_SIZE,
  dilateRadius: number = DEFAULT_DILATE_RADIUS
): ShapeMatchResult {
  const userDilated = dilateMask(userMask, size, dilateRadius)
  const templateDilated = dilateMask(templateMask, size, dilateRadius)

  const userCount = countOnes(userMask)
  const templateCount = countOnes(templateMask)

  if (userCount === 0 || templateCount === 0) {
    return { score: 0, precision: 0, recall: 0 }
  }

  const userInTemplate = countIntersection(userMask, templateDilated)
  const templateInUser = countIntersection(templateMask, userDilated)

  const precision = userInTemplate / userCount
  const recall = templateInUser / templateCount
  const score = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall)

  return { score, precision, recall }
}

export function chamferScore(
  aMask: Uint8Array,
  aDt: Float32Array,
  bMask: Uint8Array,
  bDt: Float32Array,
  maxDist: number
): number {
  let sumAB = 0
  let countA = 0
  let sumBA = 0
  let countB = 0

  for (let i = 0; i < aMask.length; i++) {
    if (aMask[i]) {
      sumAB += bDt[i]
      countA++
    }
    if (bMask[i]) {
      sumBA += aDt[i]
      countB++
    }
  }

  if (countA === 0 || countB === 0) return 0

  const meanDist = (sumAB / countA + sumBA / countB) / 2
  return Math.max(0, 1 - meanDist / maxDist)
}

export function combinedScore(
  userMask: Uint8Array,
  userDilated: Uint8Array,
  userDt: Float32Array,
  templateMask: Uint8Array,
  templateDilated: Uint8Array,
  templateDt: Float32Array,
  size: number = DEFAULT_GRID_SIZE
): CombinedMatchResult {
  const f1 = f1Score(userMask, userDilated, templateMask, templateDilated)
  const chamfer = chamferScore(userMask, userDt, templateMask, templateDt, defaultMaxDistance(size))
  const score = CHAMFER_WEIGHT * chamfer + F1_WEIGHT * f1
  return { score, f1, chamfer }
}
