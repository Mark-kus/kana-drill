import type { Metadata, Viewport } from 'next'
import { Noto_Sans_JP, Geist } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { LanguageProvider } from '@/components/language-provider'

import './globals.css'

const _geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const _noto = Noto_Sans_JP({ subsets: ['latin'], variable: '--font-noto-jp', weight: ['400', '500', '700'] })

export const metadata: Metadata = {
  title: 'Kana Drill - Practica Hiragana y Katakana',
  description: 'Practica y aprende los kanas japoneses de Hiragana y Katakana de forma interactiva',
}

export const viewport: Viewport = {
  themeColor: '#d6336c',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${_geist.variable} ${_noto.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
