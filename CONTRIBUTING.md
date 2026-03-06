# Guía para desarrolladores — Kana Drill

Documentación técnica para programadores que quieran continuar o contribuir al proyecto.

## Requisitos previos

- **Node.js** ≥ 18
- **pnpm** ≥ 9 (`npm install -g pnpm`)

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `pnpm dev` | Inicia el servidor de desarrollo con Turbopack |
| `pnpm build` | Genera el build de producción |
| `pnpm start` | Sirve el build de producción |
| `pnpm lint` | Ejecuta ESLint sobre el proyecto |

## Estructura del proyecto

```
app/
├── globals.css          # Variables CSS (tema claro/oscuro) y estilos base
├── layout.tsx           # Root layout: fuentes, ThemeProvider, LanguageProvider
└── page.tsx             # Página única, renderiza <KanaPractice />

components/
├── drawing-canvas.tsx       # Canvas de dibujo con detección de trazos
├── drawing-hint-tooltip.tsx # Tooltip que muestra pistas de dibujo
├── kana-practice.tsx        # Componente principal: orquesta quiz, canvas y grilla
├── kana-table.tsx           # Grilla de botones kana con soporte dakuten/handakuten
├── language-provider.tsx    # Context + Provider para idioma (en/es/pt)
├── language-toggle.tsx      # Botón que cicla entre idiomas
├── mode-selector.tsx        # Selector Hiragana / Katakana
├── quiz-prompt.tsx          # Muestra puntuación: correctas, total, racha
├── theme-provider.tsx       # Wrapper de next-themes
└── theme-toggle.tsx         # Botón que cicla entre temas (system/light/dark)

hooks/
├── use-long-press.ts    # Hook para detección de long press en móvil
└── use-quiz-state.ts    # Hook con toda la lógica de estado del quiz

lib/
├── kana-data.ts         # Datos estáticos: celdas kana, rangos de trazos
├── kana-recognition.ts  # Motor de reconocimiento de dibujos (zone-density + Jaccard)
├── translations.ts      # Traducciones en/es/pt
└── utils.ts             # Utilidades: cn() para clases y shuffleArray()
```

## Arquitectura y decisiones de diseño

### Flujo principal

1. `page.tsx` renderiza `<KanaPractice />`.
2. `KanaPractice` usa el hook `useQuizState()` que encapsula toda la lógica: kana actual, puntuación, feedback, timers.
3. El usuario puede responder de dos formas:
   - **Click en la grilla** (`KanaTable` → `handleKanaClick`)
   - **Dibujo en canvas** (`DrawingCanvas` → reconocimiento → `handleDrawingCorrect`)
4. Tras cada respuesta, se muestra feedback visual temporal (colores verde/rojo) y se avanza al siguiente kana.

### Reconocimiento de dibujos (`kana-recognition.ts`)

Sistema offline que no requiere servidor ni ML externo:

1. Renderiza el kana de referencia en un canvas offscreen usando la fuente Noto Sans JP.
2. Extrae un vector de características de 136 dimensiones binarias:
   - Densidad de zonas multi-resolución (5×5 + 10×10 = 125 dims)
   - Relación de aspecto (3 dims: alto / cuadrado / ancho)
   - Histograma direccional de 8 bins (8 dims)
3. Compara dibujo del usuario vs. referencia usando similitud de Jaccard.
4. Aplica dilatación adaptativa según número de trazos.
5. Filtra candidatos por rango de trazos antes de comparar formas.

### Sistema de variantes (dakuten / handakuten)

Cada `KanaCell` agrupa un kana base con sus variantes opcionales. En la grilla:
- **Desktop**: hover sobre el botón muestra las variantes.
- **Mobile**: long press (400ms) con indicador de progreso visual.

### Idiomas

- El `LanguageProvider` detecta el idioma del navegador al montar.
- Las traducciones son objetos tipados con `as const` para preservar los tipos literales.
- Funciones como `tryMoreStrokes(range)` reciben parámetros para interpolación.

### Temas

- Se usa `next-themes` con `attribute="class"` para aplicar clase `.dark` al `<html>`.
- Las variables CSS en `globals.css` definen los colores para cada tema.
- El ciclo es: system → light → dark → system.

## Dependencias clave

| Paquete | Propósito |
|---|---|
| `next` | Framework React con App Router |
| `react` / `react-dom` | UI library |
| `next-themes` | Gestión de tema claro/oscuro |
| `clsx` + `tailwind-merge` | Composición de clases CSS condicionales (`cn()`) |
| `lucide-react` | Iconos (solo `Sun`, `Moon`, `Monitor`) |
| `tailwindcss` | Framework CSS utility-first |
| `typescript` | Tipado estático |

## Tipos importantes

```typescript
// Datos de un kana individual
interface KanaEntry { kana: string; romaji: string }

// Celda de la grilla: base + variantes opcionales
interface KanaCell {
  base: KanaEntry
  dakuten?: KanaEntry
  handakuten?: KanaEntry
}

// Rango de trazos esperado para un kana
interface KanaStrokeRange { min: number; max: number }

// Candidato para reconocimiento de dibujo
interface CandidateKana { kana: string; strokeRange: KanaStrokeRange }

// Resultado de evaluación de dibujo
interface DrawingEvalResult {
  isCorrect: boolean
  bestMatch: string | null
  hintType: "more-strokes" | "fewer-strokes" | "more-precision" | null
  expectedStrokeRange: string | null
}

// Modos disponibles
type KanaMode = "hiragana" | "katakana"

// Idiomas soportados
type Language = "en" | "es" | "pt"
```

## Constantes configurables

| Archivo | Constante | Valor | Descripción |
|---|---|---|---|
| `use-quiz-state.ts` | `CORRECT_CLICK_DELAY` | 600ms | Delay tras respuesta correcta por click |
| `use-quiz-state.ts` | `INCORRECT_CLICK_DELAY` | 800ms | Delay tras respuesta incorrecta |
| `use-quiz-state.ts` | `CORRECT_DRAWING_DELAY` | 1000ms | Delay tras dibujo correcto |
| `use-quiz-state.ts` | `GIVE_UP_DELAY` | 1500ms | Delay tras usar "Skip" |
| `kana-practice.tsx` | `HINT_FADE_MS` | 5000ms | Tiempo que permanece visible la pista de dibujo |
| `kana-practice.tsx` | `MOBILE_BREAKPOINT` | 1024px | Breakpoint para lógica de scroll móvil |
| `drawing-canvas.tsx` | `AUTO_VERIFY_DELAY_MS` | 1000ms | Espera antes de verificar el dibujo automáticamente |
| `drawing-canvas.tsx` | `CANVAS_SIZE` | 160px | Resolución interna del canvas |
| `kana-recognition.ts` | `MIN_SHAPE_SCORE` | 0.35 | Umbral mínimo de similitud para aceptar un dibujo |
| `use-long-press.ts` | `duration` (default) | 400ms | Tiempo de long press para mostrar variantes |

## Cómo agregar un nuevo idioma

1. En `lib/translations.ts`, agrega el código al tipo `Language`: `"en" | "es" | "pt" | "xx"`.
2. Agrega el objeto de traducción completo en `translations`.
3. En `components/language-provider.tsx`, añade `"xx"` al array `LANGUAGE_ORDER` y agrega la detección en el `useEffect`.

## Cómo agregar nuevos kana

1. En `lib/kana-data.ts`, agrega la entrada a `HIRAGANA_CELLS` o `KATAKANA_CELLS`.
2. Asegúrate de agregar el rango de trazos correspondiente en `BASE_KANA_STROKE_RANGES`.
3. Las variantes dakuten/handakuten se calculan automáticamente sumando el bonus de trazos.

## Notas técnicas

- Todos los componentes usan `"use client"` porque dependen de hooks de estado/efectos o APIs del navegador.
- El reconocimiento de kana usa un cache (`kanaProfileCache`) para no re-renderizar la referencia cada vez.
- Los timeouts de feedback en `useQuizState` se limpian al desmontar mediante `feedbackTimerRef`.
- `shuffleSeed` se usa como invalidador artificial del `useMemo` en `KanaTable` para forzar re-shuffle sin pasar el seed como parámetro a la función.
