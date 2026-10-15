# Changelog

Todas las versiones notables de este proyecto se documentan en este archivo.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el
versionado es [SemVer](https://semver.org/lang/es/).

## [2.0.0] - 2026-10-15

### Changed
- Motor de reconocimiento determinista basado en rasterizado y comparación de
  formas (F1 + chamfer) con búsqueda de rotación, en lugar del enfoque anterior.
- Selección del mejor candidato usando un conjunto de kana confundibles.
- Pistas al fallar: número de trazos (sobran/faltan), kana más parecido y aviso de
  precisión, con feedback siempre visible.
- Se documenta el funcionamiento del reconocimiento en `docs/recognition.md`.

### Removed
- Código muerto: `templateLoader.ts`, `verifyDrawing`, `resetCache` y la
  re-exportación `getKanaNames`, además de imports y API no utilizados.
- Archivos temporales de investigación (`tests/_*.test.ts` y volcados `.txt`).

### Fixed
- El `tsconfig.tsbuildinfo` generado deja de rastrearse en git.

## [1.0.0]

### Added
- Selector de tema (claro/oscuro/sistema).
- Soporte multilenguaje (inglés, español, portugués) con detección automática.
- Licencia CC BY-NC 4.0.

## [0.2.0]

### Added
- Quiz de selección y modo de dibujo de kana.
- Dakuten y handakuten.
- Selector de modo hiragana/katakana.
