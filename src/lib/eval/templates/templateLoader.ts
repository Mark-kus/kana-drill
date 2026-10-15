import type { KanaTemplate } from "./templateTypes"
import { KANA_TEMPLATES } from "./kanaTemplatesData"

export function loadHiraganaTemplates(): KanaTemplate[] {
  return KANA_TEMPLATES.filter(
    (t) => t.kana.charCodeAt(0) >= 0x3041 && t.kana.charCodeAt(0) <= 0x309f
  )
}

export function loadKatakanaTemplates(): KanaTemplate[] {
  return KANA_TEMPLATES.filter(
    (t) => t.kana.charCodeAt(0) >= 0x30a1 && t.kana.charCodeAt(0) <= 0x30ff
  )
}

export function loadAllTemplates(): { hiragana: KanaTemplate[]; katakana: KanaTemplate[] } {
  return {
    hiragana: loadHiraganaTemplates(),
    katakana: loadKatakanaTemplates(),
  }
}
