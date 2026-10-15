import { describe, it, expect } from "vitest"
import { VerificationEngine } from "../src/lib/eval/verificationEngine"
import { KANA_TEMPLATES } from "../src/lib/eval/templates/kanaTemplatesData"
import type { Stroke } from "../src/lib/eval/raster"

function templateToCanvasStrokes(kana: string): Stroke[] {
  const template = KANA_TEMPLATES.find((t) => t.kana === kana)
  if (!template) throw new Error(`Template not found: ${kana}`)
  return template.strokes.map((s) => s.map((p) => ({ x: p.x * 256, y: p.y * 256 })))
}

describe("verificationEngine", () => {
  it("passes when drawing matches the target kana", { timeout: 30000 }, () => {
    const engine = new VerificationEngine({ difficulty: "medium" })
    const strokes = templateToCanvasStrokes("あ")
    const result = engine.evaluate(strokes, "あ")
    expect(result.passed).toBe(true)
    expect(result.score).toBeGreaterThan(0.7)
  })

  it("fails when drawing a different kana", () => {
    const engine = new VerificationEngine({ difficulty: "medium" })
    const strokes = templateToCanvasStrokes("あ")
    const result = engine.evaluate(strokes, "う")
    expect(result.passed).toBe(false)
    expect(result.confusion).not.toBeNull()
  })

  it("returns null bestMatchKana when passed", () => {
    const engine = new VerificationEngine({ difficulty: "medium" })
    const strokes = templateToCanvasStrokes("か")
    const result = engine.evaluate(strokes, "か")
    expect(result.passed).toBe(true)
    expect(result.bestMatchKana).toBeNull()
  })

  it("handles empty strokes gracefully", () => {
    const engine = new VerificationEngine({ difficulty: "medium" })
    const result = engine.evaluate([], "あ")
    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
  })

  it("passes on easy difficulty with medium-quality match", () => {
    const engine = new VerificationEngine({ difficulty: "easy" })
    const strokes = templateToCanvasStrokes("い")
    const result = engine.evaluate(strokes, "い")
    expect(result.passed).toBe(true)
  })

  it("single-stroke kana (く) verifies correctly", () => {
    const engine = new VerificationEngine({ difficulty: "medium" })
    const strokes = templateToCanvasStrokes("く")
    const result = engine.evaluate(strokes, "く")
    expect(result.passed).toBe(true)
  })

  it("katakana works the same way", () => {
    const engine = new VerificationEngine({ difficulty: "medium" })
    const strokes = templateToCanvasStrokes("カ")
    const result = engine.evaluate(strokes, "カ")
    expect(result.passed).toBe(true)
  })

  it("no stroke hint when stroke count matches the target", () => {
    const engine = new VerificationEngine({ difficulty: "medium" })
    const result = engine.evaluate(templateToCanvasStrokes("あ"), "あ")
    expect(result.strokeHint).toBeNull()
  })

  it("twin pair: drawing ぱ as target ぱ passes with no hint", () => {
    const engine = new VerificationEngine({ difficulty: "medium" })
    const result = engine.evaluate(templateToCanvasStrokes("ぱ"), "ぱ")
    expect(result.passed).toBe(true)
    expect(result.strokeHint).toBeNull()
  })

  it("twin pair: drawing ば as target ぱ fails with 'too many strokes' hint", () => {
    const engine = new VerificationEngine({ difficulty: "medium" })
    const result = engine.evaluate(templateToCanvasStrokes("ば"), "ぱ")
    expect(result.passed).toBe(false)
    expect(result.strokeHint).not.toBeNull()
    expect(result.strokeHint!.tooMany).toBe(true)
    expect(result.strokeHint!.userCount).toBe(5)
    expect(result.strokeHint!.expectedMin).toBe(4)
    expect(result.strokeHint!.expectedMax).toBe(4)
  })

  it("twin pair: drawing ぱ as target ば fails with 'too few strokes' hint", () => {
    const engine = new VerificationEngine({ difficulty: "medium" })
    const result = engine.evaluate(templateToCanvasStrokes("ぱ"), "ば")
    expect(result.passed).toBe(false)
    expect(result.strokeHint).not.toBeNull()
    expect(result.strokeHint!.tooMany).toBe(false)
    expect(result.strokeHint!.userCount).toBe(4)
    expect(result.strokeHint!.expectedMin).toBe(5)
    expect(result.strokeHint!.expectedMax).toBe(5)
  })

  it("twin pair katakana: パ vs バ separated by stroke count", () => {
    const engine = new VerificationEngine({ difficulty: "medium" })
    const pa = engine.evaluate(templateToCanvasStrokes("パ"), "パ")
    expect(pa.passed).toBe(true)
    const ba = engine.evaluate(templateToCanvasStrokes("パ"), "バ")
    expect(ba.passed).toBe(false)
    expect(ba.strokeHint?.tooMany).toBe(false)
  })

  it("accepts a sloppy む that deviates from the canonical template", () => {
    const engine = new VerificationEngine({ difficulty: "medium" })
    const template = KANA_TEMPLATES.find((t) => t.kana === "む")!
    let seed = 12345
    const randn = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      const u = seed / 0x7fffffff
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      const v = seed / 0x7fffffff
      return Math.sqrt(-2 * Math.log(u || 1e-9)) * Math.cos(2 * Math.PI * v)
    }
    const sigma = 0.07
    const strokes = template.strokes.map((s) =>
      s.map((p) => ({ x: (p.x + randn() * sigma) * 320, y: (p.y + randn() * sigma) * 320 }))
    )
    const result = engine.evaluate(strokes, "む")
    expect(result.passed).toBe(true)
    expect(result.confusion).not.toBe("ぬ")
  })
})
