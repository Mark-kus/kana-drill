/**
 * Multi-resolution zone-density kana recognition with aspect ratio
 * preservation, adaptive dilation, and directional histograms.
 *
 * Feature vector (per image):
 *   1. Multi-res binary density (5×5 + 10×10 = 125 binary dims)
 *   2. Aspect ratio bucket (3 binary dims: tall / square / wide)
 *   3. Directional histogram (8 direction bins, binarized = 8 dims)
 * Total: 136 binary dims, compared with Jaccard similarity.
 *
 * Flow:
 * 1. Render reference kana on an offscreen canvas
 * 2. For both reference and user drawing:
 *    a. Find bounding box of ink pixels
 *    b. Preserve aspect ratio info as feature
 *    c. Normalize to square for zone grid computation
 *    d. At each resolution, divide into NxN grid, compute density
 *    e. Compute directional histogram from pixel gradients
 *    f. Binarize and concatenate all features
 * 3. Compare concatenated binary vectors with Jaccard similarity
 */

import type { KanaStrokeRange } from "@/lib/kana-data"

const ZONE_LEVELS = [5, 10] // coarse (5×5=25) + fine (10×10=100) = 125 dims
const RENDER_SIZE = 128
const ALPHA_THRESHOLD = 30
const DENSITY_BIN_THRESHOLD = 0.08 // zone density above this → 1, below → 0
const DIR_BINS = 8 // 8 direction bins (0°, 45°, 90°, ... 315°)
const DIR_BIN_THRESHOLD = 0.05 // direction bin above this fraction → 1

// Adaptive dilation: fewer strokes → more dilation per stroke
const DILATE_BASE = 8 // radius for 1-stroke kana
const DILATE_MIN = 3 // minimum radius for many-stroke kana

export const MIN_SHAPE_SCORE = 0.35

export interface ShapeMatchResult {
  kana: string
  score: number
}

export interface CandidateKana {
  kana: string
  strokeRange: KanaStrokeRange
}

export type DrawingHintType = "more-strokes" | "fewer-strokes" | "more-precision" | null

export interface DrawingEvalResult {
  isCorrect: boolean
  bestMatch: string | null
  hintType: DrawingHintType
  expectedStrokeRange: string | null
}

// ── Cache ────────────────────────────────────────────────────────

const kanaProfileCache = new Map<string, number[]>()

// ── Public API ───────────────────────────────────────────────────

/**
 * Compare the user's canvas drawing against a set of candidate kana.
 * `strokeCount` is used for adaptive dilation of the user drawing.
 * Returns results sorted by score descending (best match first).
 */
export function matchDrawingShape(
  drawingCanvas: HTMLCanvasElement,
  candidates: string[],
  strokeCount: number
): ShapeMatchResult[] {
  const userProfile = extractUserProfile(drawingCanvas, strokeCount)
  if (!userProfile) return []

  const results: ShapeMatchResult[] = []
  for (const kana of candidates) {
    const ref = getKanaProfile(kana)
    const score = jaccardSimilarity(userProfile, ref)
    results.push({ kana, score })
  }

  results.sort((a, b) => b.score - a.score)
  return results
}

// ── Reference kana profile ───────────────────────────────────────

function getKanaProfile(kana: string): number[] {
  const cached = kanaProfileCache.get(kana)
  if (cached) return cached

  const canvas = document.createElement("canvas")
  canvas.width = RENDER_SIZE
  canvas.height = RENDER_SIZE
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!

  ctx.fillStyle = "black"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.font = `${Math.round(RENDER_SIZE * 0.82)}px ${getJapaneseFont()}`
  ctx.fillText(kana, RENDER_SIZE / 2, RENDER_SIZE / 2)

  const { data } = ctx.getImageData(0, 0, RENDER_SIZE, RENDER_SIZE)
  const profile = buildFeatureVector(data, RENDER_SIZE, RENDER_SIZE)

  kanaProfileCache.set(kana, profile)
  return profile
}

function getJapaneseFont(): string {
  try {
    const val = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-noto-jp")
      .trim()
    if (val) return `${val}, "Noto Sans JP", sans-serif`
  } catch {
    /* SSR or test env */
  }
  return '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif'
}

// ── User drawing extraction ──────────────────────────────────────

function extractUserProfile(
  canvas: HTMLCanvasElement,
  strokeCount: number
): number[] | null {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return null

  const w = canvas.width
  const h = canvas.height
  const { data } = ctx.getImageData(0, 0, w, h)

  let hasPixels = false
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > ALPHA_THRESHOLD) {
      hasPixels = true
      break
    }
  }
  if (!hasPixels) return null

  // Adaptive dilation: fewer strokes → larger radius
  const radius = Math.max(
    DILATE_MIN,
    Math.round(DILATE_BASE / Math.sqrt(Math.max(1, strokeCount)))
  )
  const dilated = dilateImageAlpha(data, w, h, radius)

  return buildFeatureVector(dilated, w, h)
}

// ── Feature vector construction ──────────────────────────────────

/**
 * Build the full feature vector:
 *  [multi-res density (125)] + [aspect ratio (3)] + [direction histogram (8)]
 */
function buildFeatureVector(
  data: Uint8ClampedArray,
  width: number,
  height: number
): number[] {
  const bbox = findBoundingBox(data, width, height)
  if (!bbox) {
    const totalDims = ZONE_LEVELS.reduce((s, z) => s + z * z, 0) + 3 + DIR_BINS
    return new Array<number>(totalDims).fill(0)
  }

  const density = computeMultiResDensity(data, width, height, bbox)
  const aspect = computeAspectFeature(bbox)
  const direction = computeDirectionHistogram(data, width, height, bbox)

  return [...density, ...aspect, ...direction]
}

// ── Bounding box ─────────────────────────────────────────────────

interface BBox {
  minX: number; minY: number; maxX: number; maxY: number
}

function findBoundingBox(
  data: Uint8ClampedArray,
  width: number,
  height: number
): BBox | null {
  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > ALPHA_THRESHOLD) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX < minX) return null
  return { minX, minY, maxX, maxY }
}

// ── Aspect ratio feature ─────────────────────────────────────────

/** Encode aspect ratio as 3 binary dims: [tall, square, wide] */
function computeAspectFeature(bbox: BBox): number[] {
  const w = bbox.maxX - bbox.minX + 1
  const h = bbox.maxY - bbox.minY + 1
  const ratio = w / h // <1 = tall, >1 = wide

  if (ratio < 0.75) return [1, 0, 0] // tall
  if (ratio > 1.33) return [0, 0, 1] // wide
  return [0, 1, 0] // square-ish
}

// ── Dilation ─────────────────────────────────────────────────────

function dilateImageAlpha(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data.length)
  out.set(data)
  const r2 = radius * radius

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] <= ALPHA_THRESHOLD) continue
      const yMin = Math.max(0, y - radius)
      const yMax = Math.min(height - 1, y + radius)
      const xMin = Math.max(0, x - radius)
      const xMax = Math.min(width - 1, x + radius)
      for (let ny = yMin; ny <= yMax; ny++) {
        const dy = ny - y
        for (let nx = xMin; nx <= xMax; nx++) {
          const dx = nx - x
          if (dx * dx + dy * dy > r2) continue
          const idx = (ny * width + nx) * 4 + 3
          if (out[idx] < 255) out[idx] = 255
        }
      }
    }
  }
  return out
}

// ── Multi-resolution zone density ────────────────────────────────

function computeMultiResDensity(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  bbox: BBox
): number[] {
  // Pad slightly
  const bboxW = bbox.maxX - bbox.minX + 1
  const bboxH = bbox.maxY - bbox.minY + 1
  const pad = Math.max(2, Math.round(Math.max(bboxW, bboxH) * 0.05))
  const minX = Math.max(0, bbox.minX - pad)
  const minY = Math.max(0, bbox.minY - pad)
  const maxX = Math.min(width - 1, bbox.maxX + pad)
  const maxY = Math.min(height - 1, bbox.maxY + pad)

  // Make square (center shorter axis)
  const w2 = maxX - minX + 1
  const h2 = maxY - minY + 1
  const side = Math.max(w2, h2)
  const originX = minX - Math.round((side - w2) / 2)
  const originY = minY - Math.round((side - h2) / 2)

  const profile: number[] = []

  for (const zones of ZONE_LEVELS) {
    const zoneInk = new Array<number>(zones * zones).fill(0)
    const zoneTotal = new Array<number>(zones * zones).fill(0)

    for (let sy = 0; sy < side; sy++) {
      const srcY = originY + sy
      const zy = Math.min(Math.floor((sy / side) * zones), zones - 1)

      for (let sx = 0; sx < side; sx++) {
        const srcX = originX + sx
        const zx = Math.min(Math.floor((sx / side) * zones), zones - 1)
        const zi = zy * zones + zx

        zoneTotal[zi]++
        if (
          srcX >= 0 && srcX < width &&
          srcY >= 0 && srcY < height &&
          data[(srcY * width + srcX) * 4 + 3] > ALPHA_THRESHOLD
        ) {
          zoneInk[zi]++
        }
      }
    }

    for (let i = 0; i < zones * zones; i++) {
      const raw = zoneTotal[i] > 0 ? zoneInk[i] / zoneTotal[i] : 0
      profile.push(raw >= DENSITY_BIN_THRESHOLD ? 1 : 0)
    }
  }

  return profile
}

// ── Directional histogram ────────────────────────────────────────

/**
 * Compute an 8-bin directional histogram from the image gradients
 * within the bounding box. Each bin corresponds to a 45° range.
 * The histogram is normalized then binarized.
 *
 * Bins: 0=→, 1=↗, 2=↑, 3=↖, 4=←, 5=↙, 6=↓, 7=↘
 */
function computeDirectionHistogram(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  bbox: BBox
): number[] {
  const bins = new Array<number>(DIR_BINS).fill(0)
  let total = 0

  // Use Sobel-like gradient on alpha channel within bbox
  for (let y = bbox.minY + 1; y < bbox.maxY; y++) {
    for (let x = bbox.minX + 1; x < bbox.maxX; x++) {
      const a = data[(y * width + x) * 4 + 3]
      if (a <= ALPHA_THRESHOLD) continue

      // Horizontal gradient (right - left)
      const aL = data[(y * width + (x - 1)) * 4 + 3]
      const aR = data[(y * width + (x + 1)) * 4 + 3]
      const gx = (aR > ALPHA_THRESHOLD ? 1 : 0) - (aL > ALPHA_THRESHOLD ? 1 : 0)

      // Vertical gradient (down - up)
      const aU = data[((y - 1) * width + x) * 4 + 3]
      const aD = data[((y + 1) * width + x) * 4 + 3]
      const gy = (aD > ALPHA_THRESHOLD ? 1 : 0) - (aU > ALPHA_THRESHOLD ? 1 : 0)

      if (gx === 0 && gy === 0) continue

      // atan2 → angle in [0, 2π), quantize to 8 bins
      let angle = Math.atan2(gy, gx)
      if (angle < 0) angle += Math.PI * 2
      const bin = Math.floor((angle / (Math.PI * 2)) * DIR_BINS) % DIR_BINS
      bins[bin]++
      total++
    }
  }

  // Normalize then binarize
  if (total === 0) return new Array<number>(DIR_BINS).fill(0)
  return bins.map((b) => (b / total) >= DIR_BIN_THRESHOLD ? 1 : 0)
}

// ── Similarity ───────────────────────────────────────────────────

/** Jaccard index for binary vectors: |A∩B| / |A∪B| */
function jaccardSimilarity(a: number[], b: number[]): number {
  let intersection = 0
  let union = 0
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) {
    if (a[i] || b[i]) union++
    if (a[i] && b[i]) intersection++
  }
  if (union === 0) return 0
  return intersection / union
}

// ── Drawing evaluation (moved from DrawingCanvas) ────────────────

/**
 * Evaluate a user's drawing against candidate kana.
 * Returns a structured result with correctness, best match, and hint type
 * (decoupled from translations — the caller maps hintType to translated strings).
 */
export function evaluateDrawing(
  canvas: HTMLCanvasElement,
  targetKana: string,
  candidateKanas: CandidateKana[],
  strokeCount: number,
): DrawingEvalResult {
  const targetEntry = candidateKanas.find((c) => c.kana === targetKana)

  const getStrokeHint = (): { hintType: DrawingHintType; expectedStrokeRange: string | null } => {
    if (!targetEntry) return { hintType: null, expectedStrokeRange: null }
    const { min, max } = targetEntry.strokeRange
    const range = min === max ? `${min}` : `${min}–${max}`
    if (strokeCount < min) return { hintType: "more-strokes", expectedStrokeRange: range }
    if (strokeCount > max) return { hintType: "fewer-strokes", expectedStrokeRange: range }
    return { hintType: null, expectedStrokeRange: null }
  }

  // Filter candidates whose stroke range includes the current stroke count
  const strokeMatches = candidateKanas.filter(
    (c) => strokeCount >= c.strokeRange.min && strokeCount <= c.strokeRange.max,
  )

  // No kana matches this stroke count — return stroke hint only
  if (strokeMatches.length === 0) {
    let bestMatch: string | null = null
    let bestDist = Infinity
    for (const c of candidateKanas) {
      if (c.kana === targetKana) continue
      const d = Math.min(
        Math.abs(strokeCount - c.strokeRange.min),
        Math.abs(strokeCount - c.strokeRange.max),
      )
      if (d < bestDist) {
        bestDist = d
        bestMatch = c.kana
      }
    }
    const hint = getStrokeHint()
    return { isCorrect: false, bestMatch, ...hint }
  }

  // Shape match among stroke-compatible candidates
  const results = matchDrawingShape(
    canvas,
    strokeMatches.map((c) => c.kana),
    strokeCount,
  )

  if (results.length === 0) {
    const hint = getStrokeHint()
    return { isCorrect: false, bestMatch: null, ...hint }
  }

  const best = results[0]
  const targetResult = results.find((r) => r.kana === targetKana)
  const SCORE_TOLERANCE = 0.05

  // Target is within tolerance of the best score and above minimum threshold
  if (
    targetResult &&
    targetResult.score >= MIN_SHAPE_SCORE &&
    best.score - targetResult.score <= SCORE_TOLERANCE
  ) {
    return { isCorrect: true, bestMatch: null, hintType: null, expectedStrokeRange: null }
  }

  // Target matched strokes but shape score too low
  if (targetResult && targetResult.score < MIN_SHAPE_SCORE) {
    return { isCorrect: false, bestMatch: null, hintType: "more-precision", expectedStrokeRange: null }
  }

  // Best match is a different kana
  const targetInStrokeMatches = strokeMatches.some((c) => c.kana === targetKana)
  const hint = targetInStrokeMatches
    ? { hintType: null as DrawingHintType, expectedStrokeRange: null }
    : getStrokeHint()
  return { isCorrect: false, bestMatch: best.kana, ...hint }
}
