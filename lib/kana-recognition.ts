/**
 * Multi-resolution zone-density kana recognition.
 *
 * Instead of comparing raw pixels (filled glyph vs thin strokes),
 * we divide each image into grids at multiple resolutions, compute
 * the ink density per zone, binarize, concatenate the vectors, and
 * compare using Jaccard similarity.
 *
 * Multi-resolution: a coarse grid (5×5) captures overall structure
 * while a fine grid (10×10) discriminates details. The concatenated
 * binary vector (25 + 100 = 125 dims) is compared as a single unit.
 *
 * Flow:
 * 1. Render reference kana on an offscreen canvas
 * 2. For both reference and user drawing:
 *    a. Find bounding box of ink pixels
 *    b. Normalize to square (center shorter axis)
 *    c. At each resolution, divide into NxN grid, compute density
 *    d. Binarize and concatenate all resolutions
 * 3. Compare concatenated binary vectors with Jaccard similarity
 */

const ZONE_LEVELS = [5, 10] // coarse (5×5=25) + fine (10×10=100) = 125 dims
const RENDER_SIZE = 128
const ALPHA_THRESHOLD = 30
const USER_DILATE_RADIUS = 6 // fatten user strokes before density calc
const DENSITY_BIN_THRESHOLD = 0.08 // zone density above this → 1, below → 0

export const MIN_SHAPE_SCORE = 0.55

export interface ShapeMatchResult {
  kana: string
  score: number
}

// ── Cache ────────────────────────────────────────────────────────

const kanaProfileCache = new Map<string, number[]>()

export function clearMaskCache() {
  kanaProfileCache.clear()
}

// ── Public API ───────────────────────────────────────────────────

/**
 * Compare the user's canvas drawing against a set of candidate kana.
 * Returns results sorted by score descending (best match first).
 */
export function matchDrawingShape(
  drawingCanvas: HTMLCanvasElement,
  candidates: string[]
): ShapeMatchResult[] {
  const userProfile = extractDensityProfile(drawingCanvas)
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
  const ctx = canvas.getContext("2d")!

  ctx.fillStyle = "black"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.font = `${Math.round(RENDER_SIZE * 0.82)}px ${getJapaneseFont()}`
  ctx.fillText(kana, RENDER_SIZE / 2, RENDER_SIZE / 2)

  const { data } = ctx.getImageData(0, 0, RENDER_SIZE, RENDER_SIZE)
  const profile = computeMultiResProfile(data, RENDER_SIZE, RENDER_SIZE)

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

function extractDensityProfile(
  canvas: HTMLCanvasElement
): number[] | null {
  const ctx = canvas.getContext("2d")
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

  // Dilate (fatten) user strokes so thin lines produce comparable
  // zone density to the filled reference glyphs
  const dilated = dilateImageAlpha(data, w, h, USER_DILATE_RADIUS)

  return computeMultiResProfile(dilated, w, h)
}

// ── Dilation ─────────────────────────────────────────────────────

/**
 * Expand non-transparent pixels by `radius` using a circular kernel.
 * Returns a new Uint8ClampedArray with dilated alpha values.
 */
function dilateImageAlpha(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data.length)
  // Copy RGB channels as-is; we only care about alpha for density
  out.set(data)
  const r2 = radius * radius

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] <= ALPHA_THRESHOLD) continue
      // Spread this pixel's "ink" to its neighbours
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

// ── Zone density computation ─────────────────────────────────────

/**
 * Compute a multi-resolution binary density profile:
 * 1. Find bounding box of ink pixels
 * 2. Pad + extend to a square (centering the short axis)
 * 3. For each resolution level, divide into NxN grid, compute
 *    zone density, binarize, and append to the output vector
 */
function computeMultiResProfile(
  data: Uint8ClampedArray,
  width: number,
  height: number
): number[] {
  // Find bounding box
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

  const totalDims = ZONE_LEVELS.reduce((s, z) => s + z * z, 0)
  if (maxX < minX) return new Array<number>(totalDims).fill(0)

  // Small padding
  const bboxW = maxX - minX + 1
  const bboxH = maxY - minY + 1
  const pad = Math.max(2, Math.round(Math.max(bboxW, bboxH) * 0.05))
  minX = Math.max(0, minX - pad)
  minY = Math.max(0, minY - pad)
  maxX = Math.min(width - 1, maxX + pad)
  maxY = Math.min(height - 1, maxY + pad)

  // Make square (center shorter axis)
  const w2 = maxX - minX + 1
  const h2 = maxY - minY + 1
  const side = Math.max(w2, h2)
  const originX = minX - Math.round((side - w2) / 2)
  const originY = minY - Math.round((side - h2) / 2)

  // Build concatenated profile across all resolution levels
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

// ── Similarity ───────────────────────────────────────────────────

/** Jaccard index for binary vectors: |A∩B| / |A∪B| */
function jaccardSimilarity(a: number[], b: number[]): number {
  let intersection = 0
  let union = 0
  for (let i = 0; i < a.length; i++) {
    if (a[i] || b[i]) union++
    if (a[i] && b[i]) intersection++
  }
  if (union === 0) return 0
  return intersection / union
}
