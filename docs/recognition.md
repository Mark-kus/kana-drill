# Reconocimiento de kana

Este documento describe el funcionamiento real del motor de verificación de trazos
(`src/lib/eval/`). El reconocimiento es **determinista y geométrico**: no usa red
neuronal ni servicios externos. Rasteriza el dibujo del usuario y lo compara con
plantillas de referencia mediante una métrica combinada (F1 + chamfer), probando
varias rotaciones y teniendo en cuenta el número de trazos.

## 1. Flujo completo

```
trazos del canvas
   │
   ├─ smoothStrokes(strokes, 3)        suavizado media móvil (ventana 3)
   │
   ├─ rasterizeStrokes(...)            normaliza bbox, centra, dibuja con "pen"
   │
   ├─ distanceTransform(mask)          distancia de cada píxel al trazo más cercano
   ├─ dilateMask(mask, radio 4)        tolerancia a desplazamientos
   │
   ├─ computeMaxRotationScore          mejor score sobre 9 rotaciones
   │      └─ combinedScore = 0.6·chamfer + 0.4·F1
   │
   ├─ getConfusables(target, 5)        kana más parecidos (chamfer entre máscaras base)
   │
   └─ regla de aprobación              umbral de dificultad + penalización por trazos
```

## 2. Pasos

### 2.1 Suavizado
`raster.ts: smoothStrokes` aplica una media móvil de ventana 3 a cada trazo para
reducir el ruido del puntero/touch.

### 2.2 Rasterización y normalización
`raster.ts: rasterizeStrokes`:
- Calcula el bounding box del conjunto de trazos.
- Escala la figura para que encaje en `size · padding` (por defecto
  `DEFAULT_GRID_SIZE = 128`, `DEFAULT_PADDING = 0.85`; las plantillas usan `0.9`).
- Centra la figura en la rejilla.
- Dibuja discos a lo largo de cada segmento con radio `DEFAULT_PEN_WIDTH / 2`.

Consecuencia: la comparación es **invariante a posición y escala**. Se evalúa la
forma, no dónde ni con qué tamaño se dibujó.

### 2.3 Distancia y dilatación
- `distanceTransform` calcula una transformada de distancia con chamfer de dos
  pasadas (`D1 = 1`, `D2 = √2`) y devuelve un `Float32Array` con la distancia de
  cada píxel al trazo más cercano.
- `dilateMask` engorda la máscara un radio de `DEFAULT_DILATE_RADIUS = 4` píxeles,
  lo que da tolerancia a pequeños desvíos del trazo.

### 2.4 Puntuación de una plantilla
`shapeMatcher.ts: combinedScore`:

```
score = 0.6 · chamfer + 0.4 · F1
```

- **F1** (`f1Score`): combina precisión y recall solapando el trazo del usuario con
  la plantilla dilatada y viceversa.
  - `precision = píxeles(usuario ∩ plantilla dilatada) / píxeles(usuario)`
  - `recall    = píxeles(plantilla ∩ usuario dilatado) / píxeles(plantilla)`
- **Chamfer** (`chamferScore`): media bidireccional de las distancias medias a la
  plantilla más cercana, normalizada por `maxDist = DEFAULT_GRID_SIZE · 0.2`:
  - `chamfer = max(0, 1 − meanDist / maxDist)`

### 2.5 Búsqueda de rotación
`kanaReferences.ts: computeMaxRotationScore` prueba 9 ángulos
(`ROTATION_ANGLES = [-16, -12, -8, -4, 0, 4, 8, 12, 16]`) y se queda con la mejor
puntuación. Las máscaras rotadas y dilatadas se precalculan una vez por kana.

### 2.6 Conjunto de confusión
`kanaReferences.ts: getConfusables` puntúa la máscara base del kana objetivo contra
las de todos los kana del mismo silabario usando chamfer, ordena y devuelve los
`DEFAULT_CONFUSABLE_COUNT = 5` más parecidos. Se cachea por objetivo y conjunto de
candidatos.

### 2.7 Regla de aprobación
`verificationEngine.ts: VerificationEngine.evaluate`:
1. Cuenta los trazos no vacíos del usuario.
2. Compara el objetivo contra sí mismo y contra sus 5 confundibles.
3. Aplica una **penalización de 0.05** (`STROKE_COUNT_PENALTY`) cuando el número de
   trazos del usuario está fuera del rango esperado del kana (`strokePrior`).
4. **Aprueba** si el mejor candidato es el objetivo y su `score` alcanza el umbral
   de dificultad:

   | Dificultad | Umbral |
   |-----------|--------|
   | fácil     | 0.60   |
   | medio     | 0.70   |
   | difícil   | 0.84   |

Si no aprueba, el resultado puede incluir:
- `confusion`: el kana más parecido (si el mejor candidato no es el objetivo y su
  score ≥ `HINT_FLOOR = 0.45`).
- `strokeHint`: aviso si el número de trazos está fuera del rango esperado.

## 3. Datos y cachés

| Elemento | Ubicación |
|----------|-----------|
| Plantillas de trazos (normalizadas 0..1, derivadas de KanjiVG) | `src/lib/eval/templates/kanaTemplatesData.ts` |
| Referencias por kana (máscara base, DT y rotaciones) | `referenceCache` en `kanaReferences.ts` |
| Confundibles por objetivo | `confusionCache` en `kanaReferences.ts` |
| Rangos de trazos esperados | `lib/kana-data.ts` (`getKanaStrokeRange`) |

La primera evaluación de un kana construye su referencia (rotaciones + máscaras),
lo que puede tardar unos milisegundos; luego queda cacheada.

## 4. Respuesta y pistas

`VerificationResult`:

| Campo | Significado |
|-------|-------------|
| `passed` | ¿El dibujo se acepta como el kana objetivo? |
| `score` | Puntuación del objetivo (0..1) |
| `targetKana` | Kana objetivo |
| `bestMatchKana` | Mejor coincidencia si difiere del objetivo; si no, `null` |
| `bestMatchScore` | Puntuación del mejor candidato |
| `confusion` | Kana confundible sugerido (o `null`) |
| `strokeHint` | Aviso de número de trazos (o `null`) |

`hints.ts: composeFailureHint` decide qué mostrar, por prioridad:
1. Pista de número de trazos (`tryMoreStrokes` / `tryFewerStrokes`).
2. Mejor coincidencia (`bestMatchKana`).
3. `tryMorePrecision` (pedir más precisión).

## 5. Integración en la interfaz

`components/drawing-canvas.tsx` monta un canvas de `320×320`. Al terminar cada
trazo programa la evaluación automática tras `700 ms`; si el resultado no aprueba,
emite la pista a través de `onHintChange`. `components/kana-practice.tsx` muestra la
pista en `components/drawing-hint-tooltip.tsx`.

## 6. Parámetros clave

| Constante | Valor | Archivo |
|-----------|-------|---------|
| `DEFAULT_GRID_SIZE` | 128 | `raster.ts` |
| `DEFAULT_PEN_WIDTH` | 5 | `raster.ts` |
| `DEFAULT_DILATE_RADIUS` | 4 | `raster.ts` |
| `DEFAULT_PADDING` | 0.85 | `raster.ts` |
| `maxDist` | `size · 0.2` | `raster.ts` |
| `CHAMFER_WEIGHT` / `F1_WEIGHT` | 0.6 / 0.4 | `shapeMatcher.ts` |
| `ROTATION_ANGLES` | −16..16 (paso 4) | `kanaReferences.ts` |
| `DEFAULT_CONFUSABLE_COUNT` | 5 | `kanaReferences.ts` |
| Umbrales | 0.60 / 0.70 / 0.84 | `verificationEngine.ts` |
| `HINT_FLOOR` / `STROKE_COUNT_PENALTY` | 0.45 / 0.05 | `verificationEngine.ts` |
| `AUTO_VERIFY_DELAY_MS` | 700 | `drawing-canvas.tsx` |

## 7. Pruebas

Ejecuta `pnpm test` (Vitest). Cubren:

- `tests/raster.test.ts`: bounding box, rasterización, dilatación, rotación, DT.
- `tests/shapeMatcher.test.ts`: F1 simétrico y chamfer.
- `tests/verificationEngine.test.ts`: aprobación/rechazo y pistas.
- `tests/composeHint.test.ts`: prioridad de pistas y casos límite.

## 8. Limitaciones conocidas

- La normalización por bounding box ignora la posición dentro del lienzo: un kana
  bien formado pero muy pequeño o descentrado puede aceptarse.
- Trazos que se salen del lienzo se recortan (`drawDisc` solo pinta dentro).
- Dibujos incompletos que casualmente se parezcan al objetivo pueden colarse si su
  puntuación supera el umbral.
