import { describe, it, expect } from "vitest"
import { symmetricF1 } from "../src/lib/eval/shapeMatcher"
import { rasterizeStrokes, type Stroke } from "../src/lib/eval/raster"

function makeHorizontalMask(): Uint8Array {
  const strokes: Stroke[] = [
    [
      { x: 10, y: 32 },
      { x: 54, y: 32 },
    ],
  ]
  return rasterizeStrokes(strokes, 64, 3)!
}

function makeVerticalMask(): Uint8Array {
  const strokes: Stroke[] = [
    [
      { x: 32, y: 10 },
      { x: 32, y: 54 },
    ],
  ]
  return rasterizeStrokes(strokes, 64, 3)!
}

function makeTiltedMask(): Uint8Array {
  const strokes: Stroke[] = [
    [
      { x: 10, y: 20 },
      { x: 54, y: 44 },
    ],
  ]
  return rasterizeStrokes(strokes, 64, 3)!
}

describe("shapeMatcher", () => {
  it("returns ~1.0 F1 for identical masks", () => {
    const mask = makeHorizontalMask()
    const result = symmetricF1(mask, mask, 64, 2)
    expect(result.score).toBeGreaterThan(0.95)
  })

  it("returns low F1 for perpendicular masks", () => {
    const hMask = makeHorizontalMask()
    const vMask = makeVerticalMask()
    const result = symmetricF1(hMask, vMask, 64, 2)
    expect(result.score).toBeLessThan(0.5)
  })

  it("rotation-tolerant F1 for slightly tilted line", () => {
    const horizontal = makeHorizontalMask()
    const tilted = makeTiltedMask()
    const result = symmetricF1(horizontal, tilted, 64, 6)
    expect(result.score).toBeGreaterThan(0.5)
  })

  it("precision and recall are both in [0,1]", () => {
    const maskA = makeHorizontalMask()
    const maskB = makeVerticalMask()
    const result = symmetricF1(maskA, maskB, 64, 3)
    expect(result.precision).toBeGreaterThanOrEqual(0)
    expect(result.precision).toBeLessThanOrEqual(1)
    expect(result.recall).toBeGreaterThanOrEqual(0)
    expect(result.recall).toBeLessThanOrEqual(1)
  })
})
