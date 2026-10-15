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
| `pnpm test` | Ejecuta las pruebas unitarias (Vitest) |

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
├── translations.ts      # Traducciones en/es/pt
└── utils.ts             # Utilidades: cn() para clases

src/lib/eval/            # Motor de reconocimiento de trazos
├── raster.ts            # Rasterización, rotación, dilatación y transformada de distancia
├── shapeMatcher.ts      # Métricas de forma: F1 simétrico y chamfer
├── kanaReferences.ts    # Referencias por kana, rotaciones, cachés y confundibles
├── hints.ts             # Composición de pistas al fallar
├── verificationEngine.ts# Regla de aprobación por dificultad
└── templates/           # Trazos de referencia de cada kana (0..1) y tipos

tests/                   # Pruebas unitarias con Vitest
docs/recognition.md      # Documentación detallada del reconocimiento
```

## Arquitectura y decisiones de diseño

### Flujo principal

1. `page.tsx` renderiza `<KanaPractice />`.
2. `KanaPractice` usa el hook `useQuizState()` que encapsula toda la lógica: kana actual, puntuación, feedback, timers.
3. El usuario puede responder de dos formas:
   - **Click en la grilla** (`KanaTable` → `handleKanaClick`)
   - **Dibujo en canvas** (`DrawingCanvas` → reconocimiento → `handleDrawingCorrect`)
4. Tras cada respuesta, se muestra feedback visual temporal (colores verde/rojo) y se avanza al siguiente kana.

### Reconocimiento de dibujos (`src/lib/eval/`)

Sistema offline, determinista y geométrico que no requiere servidor ni ML externo.
El detalle completo está en [docs/recognition.md](docs/recognition.md); resumen:

1. `raster.ts` suaviza los trazos, los normaliza por bounding box (invariante a
   posición y escala) y los rasteriza en una rejilla de 128×128.
2. Calcula la transformada de distancia (chamfer) y dilata la máscara para tolerar
   pequeños desvíos.
3. `shapeMatcher.ts` puntúa cada plantilla como `0.6·chamfer + 0.4·F1`.
4. `kanaReferences.ts` prueba 9 rotaciones y se queda con la mejor; además calcula
   los 5 kana más confundibles del silabario (chamfer entre máscaras base).
5. `verificationEngine.ts` compara el objetivo contra sus confundibles, aplica una
   penalización por número de trazos y aprueba según el umbral de dificultad
   (0.60 / 0.70 / 0.84). `hints.ts` decide qué pista mostrar al fallar.

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

// Un trazo: lista de puntos en coordenadas de píxel del canvas
type Point = { x: number; y: number }
type Stroke = Point[]

// Nivel de dificultad del reconocimiento
type Difficulty = "easy" | "medium" | "hard"

// Aviso de número de trazos
interface StrokeHint {
  userCount: number
  expectedMin: number
  expectedMax: number
  tooMany: boolean
}

// Resultado de la evaluación de un dibujo
interface VerificationResult {
  passed: boolean
  score: number
  targetKana: string
  bestMatchKana: string | null
  bestMatchScore: number
  confusion: string | null
  strokeHint: StrokeHint | null
}

// Pista lista para mostrar en la interfaz
interface DrawingHint {
  bestMatchKana: string | null
  strokeHint: string | null
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
| `drawing-canvas.tsx` | `AUTO_VERIFY_DELAY_MS` | 700ms | Espera antes de verificar el dibujo automáticamente |
| `drawing-canvas.tsx` | `CANVAS_SIZE` | 320px | Resolución interna del canvas |
| `raster.ts` | `DEFAULT_GRID_SIZE` | 128 | Rejilla de rasterización del reconocimiento |
| `raster.ts` | `DEFAULT_PEN_WIDTH` / `DEFAULT_DILATE_RADIUS` | 5 / 4 | Grosor de trazo y radio de dilatación |
| `shapeMatcher.ts` | `CHAMFER_WEIGHT` / `F1_WEIGHT` | 0.6 / 0.4 | Pesos de la puntuación combinada |
| `kanaReferences.ts` | `ROTATION_ANGLES` / `DEFAULT_CONFUSABLE_COUNT` | −16..16 / 5 | Rotaciones probadas y nº de confundibles |
| `verificationEngine.ts` | Umbrales por dificultad | 0.60 / 0.70 / 0.84 | Score mínimo para aprobar (easy/medium/hard) |
| `verificationEngine.ts` | `HINT_FLOOR` / `STROKE_COUNT_PENALTY` | 0.45 / 0.05 | Umbral de pista y penalización por trazos |
| `use-long-press.ts` | `duration` (default) | 400ms | Tiempo de long press para mostrar variantes |

## Cómo agregar un nuevo idioma

1. En `lib/translations.ts`, agrega el código al tipo `Language`: `"en" | "es" | "pt" | "xx"`.
2. Agrega el objeto de traducción completo en `translations`.
3. En `components/language-provider.tsx`, añade `"xx"` al array `LANGUAGE_ORDER` y agrega la detección en el `useEffect`.

## Cómo agregar nuevos kana

1. En `lib/kana-data.ts`, agrega la entrada a `HIRAGANA_CELLS` o `KATAKANA_CELLS`.
2. Asegúrate de agregar el rango de trazos correspondiente en `BASE_KANA_STROKE_RANGES`.
3. Agrega la plantilla de referencia de trazos en
   `src/lib/eval/templates/kanaTemplatesData.ts` (trazos normalizados 0..1); sin ella
   `getKanaReference` devuelve `null` y el dibujo no se puede evaluar.
4. Las variantes dakuten/handakuten se calculan automáticamente sumando el bonus de trazos.

## Notas técnicas

- Todos los componentes usan `"use client"` porque dependen de hooks de estado/efectos o APIs del navegador.
- El reconocimiento cachea las referencias por kana (`referenceCache`) y los
  confundibles por objetivo (`confusionCache`) para no recalcular rotaciones ni
  máscaras en cada evaluación.
- Los timeouts de feedback en `useQuizState` se limpian al desmontar mediante `feedbackTimerRef`.
- `shuffleSeed` se usa como invalidador artificial del `useMemo` en `KanaTable` para forzar re-shuffle sin pasar el seed como parámetro a la función.
