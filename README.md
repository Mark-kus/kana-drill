# Kana Drill

Aplicación web interactiva para practicar y aprender los caracteres japoneses **Hiragana** y **Katakana**.

## Características

- **Quiz interactivo**: Se muestra un romaji y debes seleccionar el kana correcto de una grilla desordenada.
- **Dibujo de kana**: Dibuja el kana en un canvas y el sistema evalúa tu trazo mediante reconocimiento de formas.
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

## Stack tecnológico

- [Next.js](https://nextjs.org/) 16 (App Router + Turbopack)
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) 3
- [pnpm](https://pnpm.io/) como gestor de paquetes

## Instalación local

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd kana-practice-app

# Instalar dependencias
pnpm install

# Iniciar en modo desarrollo
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Contribuciones

¡Los Pull Requests son bienvenidos! Si quieres mejorar algo, corregir un bug o agregar una funcionalidad, no dudes en abrir un PR.

## Licencia

Este proyecto está bajo la licencia [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).

- **Uso personal**: Puedes usar, copiar y modificar el código libremente para fines personales y no comerciales.
- **Uso comercial prohibido**: No está permitido usar este código para generar ingresos sin autorización expresa del autor.
- **Atribución requerida**: Debes dar crédito al autor original en cualquier uso o redistribución.

Para uso comercial o cualquier otro permiso, contacta al autor.
