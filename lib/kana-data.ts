export interface KanaEntry {
  kana: string
  romaji: string
}

export interface KanaStrokeRange {
  min: number
  max: number
}

export interface KanaCell {
  base: KanaEntry
  dakuten?: KanaEntry
  handakuten?: KanaEntry
}

// Hiragana: base kana with their dakuten/handakuten variants grouped together
export const HIRAGANA_CELLS: KanaCell[] = [
  // Vowels
  { base: { kana: "あ", romaji: "a" } },
  { base: { kana: "い", romaji: "i" } },
  { base: { kana: "う", romaji: "u" } },
  { base: { kana: "え", romaji: "e" } },
  { base: { kana: "お", romaji: "o" } },
  // K row -> G dakuten
  { base: { kana: "か", romaji: "ka" }, dakuten: { kana: "が", romaji: "ga" } },
  { base: { kana: "き", romaji: "ki" }, dakuten: { kana: "ぎ", romaji: "gi" } },
  { base: { kana: "く", romaji: "ku" }, dakuten: { kana: "ぐ", romaji: "gu" } },
  { base: { kana: "け", romaji: "ke" }, dakuten: { kana: "げ", romaji: "ge" } },
  { base: { kana: "こ", romaji: "ko" }, dakuten: { kana: "ご", romaji: "go" } },
  // S row -> Z dakuten
  { base: { kana: "さ", romaji: "sa" }, dakuten: { kana: "ざ", romaji: "za" } },
  { base: { kana: "し", romaji: "shi" }, dakuten: { kana: "じ", romaji: "ji" } },
  { base: { kana: "す", romaji: "su" }, dakuten: { kana: "ず", romaji: "zu" } },
  { base: { kana: "せ", romaji: "se" }, dakuten: { kana: "ぜ", romaji: "ze" } },
  { base: { kana: "そ", romaji: "so" }, dakuten: { kana: "ぞ", romaji: "zo" } },
  // T row -> D dakuten
  { base: { kana: "た", romaji: "ta" }, dakuten: { kana: "だ", romaji: "da" } },
  { base: { kana: "ち", romaji: "chi" }, dakuten: { kana: "ぢ", romaji: "di" } },
  { base: { kana: "つ", romaji: "tsu" }, dakuten: { kana: "づ", romaji: "du" } },
  { base: { kana: "て", romaji: "te" }, dakuten: { kana: "で", romaji: "de" } },
  { base: { kana: "と", romaji: "to" }, dakuten: { kana: "ど", romaji: "do" } },
  // N row
  { base: { kana: "な", romaji: "na" } },
  { base: { kana: "に", romaji: "ni" } },
  { base: { kana: "ぬ", romaji: "nu" } },
  { base: { kana: "ね", romaji: "ne" } },
  { base: { kana: "の", romaji: "no" } },
  // H row -> B dakuten, P handakuten
  { base: { kana: "は", romaji: "ha" }, dakuten: { kana: "ば", romaji: "ba" }, handakuten: { kana: "ぱ", romaji: "pa" } },
  { base: { kana: "ひ", romaji: "hi" }, dakuten: { kana: "び", romaji: "bi" }, handakuten: { kana: "ぴ", romaji: "pi" } },
  { base: { kana: "ふ", romaji: "fu" }, dakuten: { kana: "ぶ", romaji: "bu" }, handakuten: { kana: "ぷ", romaji: "pu" } },
  { base: { kana: "へ", romaji: "he" }, dakuten: { kana: "べ", romaji: "be" }, handakuten: { kana: "ぺ", romaji: "pe" } },
  { base: { kana: "ほ", romaji: "ho" }, dakuten: { kana: "ぼ", romaji: "bo" }, handakuten: { kana: "ぽ", romaji: "po" } },
  // M row
  { base: { kana: "ま", romaji: "ma" } },
  { base: { kana: "み", romaji: "mi" } },
  { base: { kana: "む", romaji: "mu" } },
  { base: { kana: "め", romaji: "me" } },
  { base: { kana: "も", romaji: "mo" } },
  // Y row
  { base: { kana: "や", romaji: "ya" } },
  { base: { kana: "ゆ", romaji: "yu" } },
  { base: { kana: "よ", romaji: "yo" } },
  // R row
  { base: { kana: "ら", romaji: "ra" } },
  { base: { kana: "り", romaji: "ri" } },
  { base: { kana: "る", romaji: "ru" } },
  { base: { kana: "れ", romaji: "re" } },
  { base: { kana: "ろ", romaji: "ro" } },
  // W row
  { base: { kana: "わ", romaji: "wa" } },
  { base: { kana: "を", romaji: "wo" } },
  // N standalone
  { base: { kana: "ん", romaji: "n" } },
]

export const KATAKANA_CELLS: KanaCell[] = [
  // Vowels
  { base: { kana: "ア", romaji: "a" } },
  { base: { kana: "イ", romaji: "i" } },
  { base: { kana: "ウ", romaji: "u" }, dakuten: { kana: "ヴ", romaji: "vu" } },
  { base: { kana: "エ", romaji: "e" } },
  { base: { kana: "オ", romaji: "o" } },
  // K row -> G dakuten
  { base: { kana: "カ", romaji: "ka" }, dakuten: { kana: "ガ", romaji: "ga" } },
  { base: { kana: "キ", romaji: "ki" }, dakuten: { kana: "ギ", romaji: "gi" } },
  { base: { kana: "ク", romaji: "ku" }, dakuten: { kana: "グ", romaji: "gu" } },
  { base: { kana: "ケ", romaji: "ke" }, dakuten: { kana: "ゲ", romaji: "ge" } },
  { base: { kana: "コ", romaji: "ko" }, dakuten: { kana: "ゴ", romaji: "go" } },
  // S row -> Z dakuten
  { base: { kana: "サ", romaji: "sa" }, dakuten: { kana: "ザ", romaji: "za" } },
  { base: { kana: "シ", romaji: "shi" }, dakuten: { kana: "ジ", romaji: "ji" } },
  { base: { kana: "ス", romaji: "su" }, dakuten: { kana: "ズ", romaji: "zu" } },
  { base: { kana: "セ", romaji: "se" }, dakuten: { kana: "ゼ", romaji: "ze" } },
  { base: { kana: "ソ", romaji: "so" }, dakuten: { kana: "ゾ", romaji: "zo" } },
  // T row -> D dakuten
  { base: { kana: "タ", romaji: "ta" }, dakuten: { kana: "ダ", romaji: "da" } },
  { base: { kana: "チ", romaji: "chi" }, dakuten: { kana: "ヂ", romaji: "di" } },
  { base: { kana: "ツ", romaji: "tsu" }, dakuten: { kana: "ヅ", romaji: "du" } },
  { base: { kana: "テ", romaji: "te" }, dakuten: { kana: "デ", romaji: "de" } },
  { base: { kana: "ト", romaji: "to" }, dakuten: { kana: "ド", romaji: "do" } },
  // N row
  { base: { kana: "ナ", romaji: "na" } },
  { base: { kana: "ニ", romaji: "ni" } },
  { base: { kana: "ヌ", romaji: "nu" } },
  { base: { kana: "ネ", romaji: "ne" } },
  { base: { kana: "ノ", romaji: "no" } },
  // H row -> B dakuten, P handakuten
  { base: { kana: "ハ", romaji: "ha" }, dakuten: { kana: "バ", romaji: "ba" }, handakuten: { kana: "パ", romaji: "pa" } },
  { base: { kana: "ヒ", romaji: "hi" }, dakuten: { kana: "ビ", romaji: "bi" }, handakuten: { kana: "ピ", romaji: "pi" } },
  { base: { kana: "フ", romaji: "fu" }, dakuten: { kana: "ブ", romaji: "bu" }, handakuten: { kana: "プ", romaji: "pu" } },
  { base: { kana: "ヘ", romaji: "he" }, dakuten: { kana: "ベ", romaji: "be" }, handakuten: { kana: "ペ", romaji: "pe" } },
  { base: { kana: "ホ", romaji: "ho" }, dakuten: { kana: "ボ", romaji: "bo" }, handakuten: { kana: "ポ", romaji: "po" } },
  // M row
  { base: { kana: "マ", romaji: "ma" } },
  { base: { kana: "ミ", romaji: "mi" } },
  { base: { kana: "ム", romaji: "mu" } },
  { base: { kana: "メ", romaji: "me" } },
  { base: { kana: "モ", romaji: "mo" } },
  // Y row
  { base: { kana: "ヤ", romaji: "ya" } },
  { base: { kana: "ユ", romaji: "yu" } },
  { base: { kana: "ヨ", romaji: "yo" } },
  // R row
  { base: { kana: "ラ", romaji: "ra" } },
  { base: { kana: "リ", romaji: "ri" } },
  { base: { kana: "ル", romaji: "ru" } },
  { base: { kana: "レ", romaji: "re" } },
  { base: { kana: "ロ", romaji: "ro" } },
  // W row
  { base: { kana: "ワ", romaji: "wa" } },
  { base: { kana: "ヲ", romaji: "wo" } },
  // N standalone
  { base: { kana: "ン", romaji: "n" } },
]

const BASE_KANA_STROKE_RANGES: Record<string, KanaStrokeRange> = {
  "あ": { min: 3, max: 3 },
  "い": { min: 2, max: 2 },
  "う": { min: 2, max: 2 },
  "え": { min: 2, max: 2 },
  "お": { min: 3, max: 3 },
  "か": { min: 3, max: 3 },
  "き": { min: 3, max: 4 },
  "く": { min: 1, max: 1 },
  "け": { min: 3, max: 3 },
  "こ": { min: 2, max: 2 },
  "さ": { min: 3, max: 3 },
  "し": { min: 1, max: 1 },
  "す": { min: 2, max: 2 },
  "せ": { min: 3, max: 3 },
  "そ": { min: 1, max: 2 },
  "た": { min: 4, max: 4 },
  "ち": { min: 2, max: 2 },
  "つ": { min: 1, max: 1 },
  "て": { min: 1, max: 1 },
  "と": { min: 2, max: 2 },
  "な": { min: 4, max: 4 },
  "に": { min: 3, max: 3 },
  "ぬ": { min: 2, max: 2 },
  "ね": { min: 2, max: 2 },
  "の": { min: 1, max: 1 },
  "は": { min: 3, max: 3 },
  "ひ": { min: 1, max: 1 },
  "ふ": { min: 4, max: 4 },
  "へ": { min: 1, max: 1 },
  "ほ": { min: 4, max: 4 },
  "ま": { min: 3, max: 3 },
  "み": { min: 2, max: 2 },
  "む": { min: 3, max: 3 },
  "め": { min: 2, max: 2 },
  "も": { min: 3, max: 3 },
  "や": { min: 3, max: 3 },
  "ゆ": { min: 2, max: 2 },
  "よ": { min: 2, max: 2 },
  "ら": { min: 2, max: 2 },
  "り": { min: 2, max: 2 },
  "る": { min: 1, max: 1 },
  "れ": { min: 1, max: 1 },
  "ろ": { min: 1, max: 1 },
  "わ": { min: 2, max: 2 },
  "を": { min: 3, max: 3 },
  "ん": { min: 1, max: 1 },
  "ア": { min: 2, max: 2 },
  "イ": { min: 2, max: 2 },
  "ウ": { min: 3, max: 3 },
  "エ": { min: 3, max: 3 },
  "オ": { min: 3, max: 3 },
  "カ": { min: 2, max: 2 },
  "キ": { min: 3, max: 3 },
  "ク": { min: 1, max: 1 },
  "ケ": { min: 3, max: 3 },
  "コ": { min: 2, max: 2 },
  "サ": { min: 3, max: 3 },
  "シ": { min: 3, max: 3 },
  "ス": { min: 2, max: 2 },
  "セ": { min: 2, max: 2 },
  "ソ": { min: 2, max: 2 },
  "タ": { min: 3, max: 3 },
  "チ": { min: 3, max: 3 },
  "ツ": { min: 3, max: 3 },
  "テ": { min: 3, max: 3 },
  "ト": { min: 2, max: 2 },
  "ナ": { min: 2, max: 2 },
  "ニ": { min: 2, max: 2 },
  "ヌ": { min: 2, max: 2 },
  "ネ": { min: 4, max: 4 },
  "ノ": { min: 1, max: 1 },
  "ハ": { min: 2, max: 2 },
  "ヒ": { min: 2, max: 2 },
  "フ": { min: 1, max: 1 },
  "ヘ": { min: 1, max: 1 },
  "ホ": { min: 4, max: 4 },
  "マ": { min: 2, max: 2 },
  "ミ": { min: 3, max: 3 },
  "ム": { min: 2, max: 2 },
  "メ": { min: 2, max: 2 },
  "モ": { min: 3, max: 3 },
  "ヤ": { min: 2, max: 2 },
  "ユ": { min: 2, max: 2 },
  "ヨ": { min: 3, max: 3 },
  "ラ": { min: 2, max: 2 },
  "リ": { min: 2, max: 2 },
  "ル": { min: 2, max: 2 },
  "レ": { min: 1, max: 1 },
  "ロ": { min: 3, max: 3 },
  "ワ": { min: 2, max: 2 },
  "ヲ": { min: 3, max: 3 },
  "ン": { min: 2, max: 2 },
}

const DAKUTEN_STROKE_BONUS: KanaStrokeRange = { min: 2, max: 2 }
const HANDAKUTEN_STROKE_BONUS: KanaStrokeRange = { min: 1, max: 1 }

function addStrokeBonus(
  strokeRange: KanaStrokeRange,
  bonus: KanaStrokeRange
): KanaStrokeRange {
  return {
    min: strokeRange.min + bonus.min,
    max: strokeRange.max + bonus.max,
  }
}

function buildStrokeRangeMap(cells: KanaCell[]): Record<string, KanaStrokeRange> {
  const ranges: Record<string, KanaStrokeRange> = {}

  for (const cell of cells) {
    const baseRange = BASE_KANA_STROKE_RANGES[cell.base.kana]
    if (!baseRange) {
      throw new Error(`Missing stroke range for kana: ${cell.base.kana}`)
    }

    ranges[cell.base.kana] = baseRange

    if (cell.dakuten) {
      ranges[cell.dakuten.kana] = addStrokeBonus(baseRange, DAKUTEN_STROKE_BONUS)
    }

    if (cell.handakuten) {
      ranges[cell.handakuten.kana] = addStrokeBonus(baseRange, HANDAKUTEN_STROKE_BONUS)
    }
  }

  return ranges
}

export const HIRAGANA_STROKE_RANGES = buildStrokeRangeMap(HIRAGANA_CELLS)
export const KATAKANA_STROKE_RANGES = buildStrokeRangeMap(KATAKANA_CELLS)

export function getKanaStrokeRange(kana: string): KanaStrokeRange {
  return HIRAGANA_STROKE_RANGES[kana] ?? KATAKANA_STROKE_RANGES[kana] ?? { min: 1, max: 6 }
}

/** Get all individual kana entries (base + variants) from a cell list */
export function getAllKana(cells: KanaCell[]): KanaEntry[] {
  const entries: KanaEntry[] = []
  for (const cell of cells) {
    entries.push(cell.base)
    if (cell.dakuten) entries.push(cell.dakuten)
    if (cell.handakuten) entries.push(cell.handakuten)
  }
  return entries
}

/** Shuffle an array using Fisher-Yates */
export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
