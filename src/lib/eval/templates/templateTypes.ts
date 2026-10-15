export interface Point {
  x: number
  y: number
}

export type Stroke = Point[]

export interface KanaTemplate {
  kana: string
  strokes: Stroke[]
  source: "kanjivg"
}
