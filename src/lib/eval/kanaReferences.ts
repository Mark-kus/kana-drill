import { KANA_TEMPLATES } from "./templates/kanaTemplatesData"
import {
  HIRAGANA_CELLS,
  KATAKANA_CELLS,
  getAllKana,
} from "../../../lib/kana-data"
import {
  rasterizeStrokes,
  rotateMask,
  dilateMask,
  distanceTransform,
  DEFAULT_GRID_SIZE,
  DEFAULT_PEN_WIDTH,
  DEFAULT_DILATE_RADIUS,
  defaultMaxDistance,
} from "./raster"
import { chamferScore, combinedScore } from "./shapeMatcher"
import type { Stroke } from "./raster"

export const ROTATION_ANGLES = [-16, -12, -8, -4, 0, 4, 8, 12, 16]
export const DEFAULT_CONFUSABLE_COUNT = 5

export type ScriptName = "hiragana" | "katakana"

export interface KanaReference {
  kana: string
  baseMask: Uint8Array
  baseDt: Float32Array
  rotatedMasks: Uint8Array[]
  rotatedDilated: Uint8Array[]
}

const referenceCache = new Map<string, KanaReference>()
const confusionCache = new Map<string, string[]>()

function scriptOf(kana: string): ScriptName {
  return kana.charCodeAt(0) >= 0x30a1 && kana.charCodeAt(0) <= 0x30ff ? "katakana" : "hiragana"
}

function scaleTemplateStrokes(
  strokes: { x: number; y: number }[][],
  gridSize: number
): Stroke[] {
  return strokes.map((stroke) =>
    stroke.map((p) => ({ x: p.x * gridSize, y: p.y * gridSize }))
  )
}

function buildSingleReference(kana: string): KanaReference | null {
  const template = KANA_TEMPLATES.find((t) => t.kana === kana)
  if (!template) return null

  const strokes = scaleTemplateStrokes(template.strokes, DEFAULT_GRID_SIZE)
  const baseMask = rasterizeStrokes(strokes, DEFAULT_GRID_SIZE, DEFAULT_PEN_WIDTH, 0.9)
  if (!baseMask) return null

  const baseDt = distanceTransform(baseMask, DEFAULT_GRID_SIZE)
  const rotatedMasks = ROTATION_ANGLES.map((deg) => {
    const rad = (deg * Math.PI) / 180
    return rotateMask(baseMask, DEFAULT_GRID_SIZE, rad)
  })
  const rotatedDilated = rotatedMasks.map((m) =>
    dilateMask(m, DEFAULT_GRID_SIZE, DEFAULT_DILATE_RADIUS)
  )

  return { kana, baseMask, baseDt, rotatedMasks, rotatedDilated }
}

export function getKanaReference(kana: string): KanaReference | null {
  const cached = referenceCache.get(kana)
  if (cached) return cached

  const ref = buildSingleReference(kana)
  if (ref) referenceCache.set(kana, ref)
  return ref
}

export function getKanaNames(script?: ScriptName): string[] {
  if (!script) {
    return KANA_TEMPLATES.map((t) => t.kana)
  }
  const cells = script === "katakana" ? KATAKANA_CELLS : HIRAGANA_CELLS
  return getAllKana(cells).map((entry) => entry.kana)
}

function poolHash(pool: string[]): string {
  let h = 5381
  for (const k of pool) {
    for (let i = 0; i < k.length; i++) {
      h = ((h << 5) + h + k.charCodeAt(i)) | 0
    }
  }
  return `${pool.length}:${h}`
}

export function getConfusables(
  targetKana: string,
  pool?: string[],
  count: number = DEFAULT_CONFUSABLE_COUNT
): string[] {
  const candidates = pool && pool.length > 0 ? pool : getKanaNames(scriptOf(targetKana))
  const cacheKey = `${targetKana}|${poolHash(candidates)}`

  const cached = confusionCache.get(cacheKey)
  if (cached) return cached

  const targetRef = getKanaReference(targetKana)
  if (!targetRef) return []

  const maxDist = defaultMaxDistance(DEFAULT_GRID_SIZE)
  const scored: { kana: string; score: number }[] = []

  for (const otherKana of candidates) {
    if (otherKana === targetKana) continue

    const otherRef = getKanaReference(otherKana)
    if (!otherRef) continue

    const score = chamferScore(
      targetRef.baseMask,
      targetRef.baseDt,
      otherRef.baseMask,
      otherRef.baseDt,
      maxDist
    )
    scored.push({ kana: otherKana, score })
  }

  scored.sort((a, b) => b.score - a.score)
  const result = scored.slice(0, count).map((s) => s.kana)
  confusionCache.set(cacheKey, result)
  return result
}

export function computeMaxRotationScore(
  userMask: Uint8Array,
  userDilated: Uint8Array,
  userDt: Float32Array,
  reference: KanaReference,
  size: number = DEFAULT_GRID_SIZE
): { score: number; bestAngleIndex: number } {
  let bestScore = -1
  let bestAngleIndex = 0

  for (let i = 0; i < reference.rotatedMasks.length; i++) {
    const rotated = reference.rotatedMasks[i]
    const rotatedDilated = reference.rotatedDilated[i]
    const rotatedDt = distanceTransform(rotated, size)
    const { score } = combinedScore(
      userMask,
      userDilated,
      userDt,
      rotated,
      rotatedDilated,
      rotatedDt,
      size
    )
    if (score > bestScore) {
      bestScore = score
      bestAngleIndex = i
    }
  }

  return { score: bestScore, bestAngleIndex }
}
