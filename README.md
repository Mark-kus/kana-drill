# Kana Drill

Aplicación web interactiva para practicar y aprender los caracteres japoneses **Hiragana** y **Katakana**.

## Características

- **Quiz interactivo**: Se muestra un romaji y debes seleccionar el kana correcto de una grilla desordenada.
- **Dibujo de kana**: Dibuja el kana en un canvas y el sistema evalúa tu trazo con un reconocimiento de formas determinista (ver [Reconocimiento de kana](docs/recognition.md)).
- **Pistas al fallar**: Si el trazo no es correcto, la app indica si sobran/faltan trazos, sugiere el kana más parecido o pide más precisión.
- **Dakuten y Handakuten**: Accede a variantes (゛y ゜) con hover en escritorio o long press en móvil.
- **Modo Hiragana / Katakana**: Cambia entre ambos alfabetos con un selector.
- **Tema claro / oscuro / sistema**: Alterna entre temas con un solo clic.
- **Multilenguaje**: Interfaz disponible en inglés, español y portugués, con detección automática del idioma del navegador.
- **Responsive**: Diseñado para funcionar en escritorio, tablet y móvil.

## Cómo usar

1. Visita la aplicación en tu navegador.
2. Observa el romaji mostrado (ej: "ka") y selecciona el kana correspondiente en la grilla, o dibújalo en el canvas.
3. Recibe feedback visual inmediato: verde si es correcto, rojo si es incorrecto.
4. Lleva el registro de tus respuestas correctas, totales y racha actual.

## Reconocimiento de kana

El modo de dibujo evalúa tu trazo sin usar red neuronal ni servicios externos:
rasteriza el dibujo, lo compara con plantillas de referencia (derivadas de KanjiVG)
probando varias rotaciones y combinando dos métricas de forma (F1 y chamfer), y
finalmente comprueba el número de trazos y los kana más confundibles.

Para todos los detalles del algoritmo, sus parámetros y limitaciones, consulta
[docs/recognition.md](docs/recognition.md).

## Estructura del proyecto

```
app/                    Rutas y layout de Next.js (App Router)
components/             Interfaz (quiz, canvas, tabla, selector de modo, tema, idioma)
hooks/                  Estado del quiz y long-press
lib/                    Datos de kana, traducciones y utilidades
src/lib/eval/           Motor de reconocimiento de trazos
  ├─ raster.ts          Rasterización, rotación, dilatación y distancia
  ├─ shapeMatcher.ts    Métricas de forma (F1 y chamfer)
  ├─ kanaReferences.ts  Plantillas de referencia, rotaciones y confundibles
  ├─ hints.ts           Composición de pistas al fallar
  ├─ verificationEngine.ts  Regla de aprobación por dificultad
  └─ templates/         Trazos de referencia de cada kana
tests/                  Pruebas unitarias (Vitest)
docs/                   Documentación
```

## Stack tecnológico

- [Next.js](https://nextjs.org/) 16 (App Router + Turbopack)
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) 3
- [Vitest](https://vitest.dev/) para las pruebas
- [pnpm](https://pnpm.io/) como gestor de paquetes

## Instalación local

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd kana-drill

# Instalar dependencias
pnpm install

# Iniciar en modo desarrollo
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Comandos

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo (Turbopack) |
| `pnpm build` | Build de producción |
| `pnpm start` | Sirve el build de producción |
| `pnpm test` | Ejecuta las pruebas unitarias (Vitest) |

## Contribuciones

¡Los Pull Requests son bienvenidos! Si quieres mejorar algo, corregir un bug o agregar una funcionalidad, no dudes en abrir un PR.

## Licencia

Este proyecto está bajo la licencia [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).

- **Uso personal**: Puedes usar, copiar y modificar el código libremente para fines personales y no comerciales.
- **Uso comercial prohibido**: No está permitido usar este código para generar ingresos sin autorización expresa del autor.
- **Atribución requerida**: Debes dar crédito al autor original en cualquier uso o redistribución.

Para uso comercial o cualquier otro permiso, contacta al autor.

## Versión

**2.0.0** — Ver [CHANGELOG](CHANGELOG.md) para el historial de cambios.
