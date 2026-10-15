import { describe, it, expect } from "vitest"
import {
  computeGroupBoundingBox,
  rasterizeStrokes,
  dilateMask,
  countOnes,
  countIntersection,
  rotateMask,
  distanceTransform,
  type Stroke,
} from "../src/lib/eval/raster"

describe("raster", () => {
  it("computes group bounding box across all strokes", () => {
    const strokes: Stroke[] = [
      [{ x: 10, y: 20 }, { x: 30, y: 40 }],
      [{ x: 5, y: 50 }, { x: 60, y: 10 }],
    ]
    const bb = computeGroupBoundingBox(strokes)
    expect(bb).not.toBeNull()
    expect(bb!.minX).toBe(5)
    expect(bb!.minY).toBe(10)
    expect(bb!.maxX).toBe(60)
    expect(bb!.maxY).toBe(50)
    expect(bb!.width).toBe(55)
    expect(bb!.height).toBe(40)
  })

  it("returns null for empty strokes", () => {
    expect(computeGroupBoundingBox([])).toBeNull()
  })

  it("rasterizes a horizontal line into a mask", () => {
    const strokes: Stroke[] = [[{ x: 0, y: 128 }, { x: 256, y: 128 }]]
    const mask = rasterizeStrokes(strokes, 64, 3)
    expect(mask).not.toBeNull()
    const count = countOnes(mask!)
    expect(count).toBeGreaterThan(50)
    expect(count).toBeLessThan(200)
  })

  it("produces identical masks for identical strokes", () => {
    const strokes: Stroke[] = [
      [
        { x: 50, y: 50 },
        { x: 200, y: 100 },
      ],
    ]
    const mask1 = rasterizeStrokes(strokes, 64, 3)
    const mask2 = rasterizeStrokes(strokes, 64, 3)
    expect(mask1).toEqual(mask2)
  })

  it("dilation increases mask pixel count", () => {
    const strokes: Stroke[] = [[{ x: 32, y: 32 }, { x: 33, y: 32 }]]
    const mask = rasterizeStrokes(strokes, 64, 3)!
    const dilated = dilateMask(mask, 64, 4)
    expect(countOnes(dilated)).toBeGreaterThan(countOnes(mask))
  })

  it("rotation preserves approximate pixel count", () => {
    const strokes: Stroke[] = [
      [
        { x: 32, y: 10 },
        { x: 32, y: 54 },
      ],
    ]
    const mask = rasterizeStrokes(strokes, 64, 3)!
    const rotated = rotateMask(mask, 64, Math.PI / 6)
    const originalCount = countOnes(mask)
    const rotatedCount = countOnes(rotated)
    expect(Math.abs(rotatedCount - originalCount)).toBeLessThan(originalCount * 0.3)
  })

  it("countIntersection matches overlapping region", () => {
    const a = new Uint8Array([1, 1, 0, 0])
    const b = new Uint8Array([1, 0, 1, 0])
    expect(countIntersection(a, b)).toBe(1)
  })

  it("distanceTransform is zero on set pixels", () => {
    const size = 8
    const mask = new Uint8Array(size * size)
    mask[3 * size + 3] = 1
    const dt = distanceTransform(mask, size)
    expect(dt[3 * size + 3]).toBe(0)
    expect(dt[3 * size + 4]).toBeCloseTo(1, 5)
    expect(dt[3 * size + 5]).toBeCloseTo(2, 5)
    expect(dt[4 * size + 4]).toBeCloseTo(Math.SQRT2, 4)
  })

  it("distanceTransform grows with distance on an empty mask edge", () => {
    const size = 8
    const mask = new Uint8Array(size * size)
    mask[0] = 1
    const dt = distanceTransform(mask, size)
    expect(dt[0]).toBe(0)
    expect(dt[size * 7 + 7]).toBeGreaterThan(dt[size * 3 + 3])
  })
})
