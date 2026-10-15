import { describe, it, expect } from "vitest"
import { composeFailureHint } from "../src/lib/eval/hints"
import { VerificationEngine } from "../src/lib/eval/verificationEngine"
import { translations } from "../lib/translations"
import { KANA_TEMPLATES } from "../src/lib/eval/templates/kanaTemplatesData"
import type { Stroke } from "../src/lib/eval/raster"
import type { VerificationResult } from "../src/lib/eval/verificationEngine"

const t = translations.en

function fakeResult(partial: Partial<VerificationResult>): VerificationResult {
  return {
    passed: false,
    score: 0,
    targetKana: "む",
    bestMatchKana: null,
    bestMatchScore: 0,
    confusion: null,
    strokeHint: null,
    ...partial,
  }
}

function templateToCanvasStrokes(kana: string): Stroke[] {
  const template = KANA_TEMPLATES.find((x) => x.kana === kana)!
  return template.strokes.map((s) => s.map((p) => ({ x: p.x * 320, y: p.y * 320 })))
}

describe("composeFailureHint", () => {
  it("stroke hint takes priority over confusion", () => {
    const hint = composeFailureHint(
      fakeResult({
        confusion: "ぬ",
        strokeHint: { userCount: 5, expectedMin: 4, expectedMax: 4, tooMany: true },
      }),
      t
    )
    expect(hint.bestMatchKana).toBeNull()
    expect(hint.strokeHint).toBe(t.tryFewerStrokes("4"))
  })

  it("too few strokes with a range uses tryMoreStrokes", () => {
    const hint = composeFailureHint(
      fakeResult({
        strokeHint: { userCount: 3, expectedMin: 3, expectedMax: 4, tooMany: false },
      }),
      t
    )
    expect(hint.strokeHint).toBe(t.tryMoreStrokes("3-4"))
  })

  it("shows best match when there is no stroke hint", () => {
    const hint = composeFailureHint(fakeResult({ confusion: "ぬ" }), t)
    expect(hint.bestMatchKana).toBe("ぬ")
    expect(hint.strokeHint).toBeNull()
  })

  it("falls back to tryMorePrecision when there is no other hint", () => {
    const hint = composeFailureHint(fakeResult({}), t)
    expect(hint.bestMatchKana).toBeNull()
    expect(hint.strokeHint).toBe(t.tryMorePrecision)
  })

  it("engine produces the silent-case result that needs the fallback", () => {
    const engine = new VerificationEngine({ difficulty: "medium" })
    const result = engine.evaluate(templateToCanvasStrokes("か"), "あ")
    expect(result.passed).toBe(false)
    expect(result.strokeHint).toBeNull()
    expect(result.confusion).toBeNull()
    const hint = composeFailureHint(result, t)
    expect(hint.strokeHint).toBe(t.tryMorePrecision)
  })

  it("cross-script drawing never silences the user", () => {
    const engine = new VerificationEngine({ difficulty: "medium" })
    const result = engine.evaluate(templateToCanvasStrokes("カ"), "あ")
    expect(result.passed).toBe(false)
    const hint = composeFailureHint(result, t)
    expect(hint.bestMatchKana ?? hint.strokeHint).not.toBeNull()
  })
})
