export interface Point {
  x: number
  y: number
}

export type Stroke = Point[]

export interface BoundingBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

export const DEFAULT_GRID_SIZE = 128
export const DEFAULT_PEN_WIDTH = 5
export const DEFAULT_DILATE_RADIUS = 4
export const DEFAULT_PADDING = 0.85

export function defaultMaxDistance(size: number): number {
  return size * 0.2
}

function smoothStroke(stroke: Stroke, windowSize: number): Stroke {
  if (stroke.length < 3 || windowSize <= 1) return stroke
  const half = Math.floor(windowSize / 2)
  return stroke.map((_, i) => {
    let sumX = 0
    let sumY = 0
    let count = 0
    for (let j = -half; j <= half; j++) {
      const idx = i + j
      if (idx >= 0 && idx < stroke.length) {
        sumX += stroke[idx].x
        sumY += stroke[idx].y
        count++
      }
    }
    return { x: sumX / count, y: sumY / count }
  })
}

export function smoothStrokes(strokes: Stroke[], windowSize = 3): Stroke[] {
  return strokes.map((s) => smoothStroke(s, windowSize))
}

export function computeGroupBoundingBox(strokes: Stroke[]): BoundingBox | null {
  if (strokes.length === 0) return null

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const stroke of strokes) {
    for (const p of stroke) {
      if (p.x < minX) minX = p.x
      if (p.y < minY) minY = p.y
      if (p.x > maxX) maxX = p.x
      if (p.y > maxY) maxY = p.y
    }
  }

  if (minX === Infinity) return null

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

export function createMask(size: number): Uint8Array {
  return new Uint8Array(size * size)
}

export function rasterizeStrokes(
  strokes: Stroke[],
  size: number = DEFAULT_GRID_SIZE,
  penWidth: number = DEFAULT_PEN_WIDTH,
  padding: number = DEFAULT_PADDING
): Uint8Array | null {
  const mask = createMask(size)
  const bb = computeGroupBoundingBox(strokes)

  if (!bb) return null

  const safeWidth = Math.max(bb.width, 1)
  const safeHeight = Math.max(bb.height, 1)

  const targetSize = size * padding
  const scale = Math.min(targetSize / safeWidth, targetSize / safeHeight)
  const offsetX = (size - bb.width * scale) / 2
  const offsetY = (size - bb.height * scale) / 2

  const toCanvas = (p: Point): Point => ({
    x: (p.x - bb.minX) * scale + offsetX,
    y: (p.y - bb.minY) * scale + offsetY,
  })

  const radius = penWidth / 2

  for (const stroke of strokes) {
    if (stroke.length === 0) continue

    const points = stroke.map(toCanvas)

    for (let i = 1; i < points.length; i++) {
      drawLine(mask, size, points[i - 1], points[i], radius)
    }

    if (points.length === 1) {
      drawDisc(mask, size, points[0], radius)
    }
  }

  return mask
}

function drawLine(mask: Uint8Array, size: number, a: Point, b: Point, radius: number): void {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const steps = Math.max(1, Math.ceil(dist * 2))

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = a.x + dx * t
    const y = a.y + dy * t
    drawDisc(mask, size, { x, y }, radius)
  }
}

function drawDisc(mask: Uint8Array, size: number, center: Point, radius: number): void {
  const cx = Math.round(center.x)
  const cy = Math.round(center.y)
  const r = Math.ceil(radius)

  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > radius * radius) continue
      const x = cx + dx
      const y = cy + dy
      if (x >= 0 && x < size && y >= 0 && y < size) {
        mask[y * size + x] = 1
      }
    }
  }
}

export function dilateMask(mask: Uint8Array, size: number, radius: number): Uint8Array {
  const result = createMask(size)
  const r = Math.ceil(radius)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (mask[y * size + x] === 0) continue

      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy > radius * radius) continue
          const nx = x + dx
          const ny = y + dy
          if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
            result[ny * size + nx] = 1
          }
        }
      }
    }
  }

  return result
}

export function countOnes(mask: Uint8Array): number {
  let count = 0
  for (let i = 0; i < mask.length; i++) {
    if (mask[i]) count++
  }
  return count
}

export function countIntersection(a: Uint8Array, b: Uint8Array): number {
  let count = 0
  for (let i = 0; i < a.length; i++) {
    if (a[i] && b[i]) count++
  }
  return count
}

export function rotateMask(mask: Uint8Array, size: number, angleRad: number): Uint8Array {
  const result = createMask(size)
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)
  const cx = size / 2
  const cy = size / 2

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!mask[y * size + x]) continue

      const dx = x - cx
      const dy = y - cy
      const nx = Math.round(dx * cos + dy * sin + cx)
      const ny = Math.round(-dx * sin + dy * cos + cy)

      if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
        result[ny * size + nx] = 1
      }
    }
  }

  return result
}

export function distanceTransform(mask: Uint8Array, size: number): Float32Array {
  const INF = 1e12
  const d = new Float32Array(size * size)
  for (let i = 0; i < d.length; i++) {
    d[i] = mask[i] ? 0 : INF
  }

  const D1 = 1
  const D2 = Math.SQRT2

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x
      let v = d[i]
      if (y > 0 && d[i - size] + D1 < v) v = d[i - size] + D1
      if (x > 0 && d[i - 1] + D1 < v) v = d[i - 1] + D1
      if (x > 0 && y > 0 && d[i - size - 1] + D2 < v) v = d[i - size - 1] + D2
      if (x < size - 1 && y > 0 && d[i - size + 1] + D2 < v) v = d[i - size + 1] + D2
      d[i] = v
    }
  }

  for (let y = size - 1; y >= 0; y--) {
    for (let x = size - 1; x >= 0; x--) {
      const i = y * size + x
      let v = d[i]
      if (y < size - 1 && d[i + size] + D1 < v) v = d[i + size] + D1
      if (x < size - 1 && d[i + 1] + D1 < v) v = d[i + 1] + D1
      if (x < size - 1 && y < size - 1 && d[i + size + 1] + D2 < v) v = d[i + size + 1] + D2
      if (x > 0 && y < size - 1 && d[i + size - 1] + D2 < v) v = d[i + size - 1] + D2
      d[i] = v
    }
  }

  return d
}
