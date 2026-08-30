import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import GlobalSidebar from '@/components/GlobalSidebar'
import './globals.css'

// Fonte limpa e moderna configurada via next/font
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'NudeNude | Premium Creator Ecosystem',
  description: 'The exclusive ecosystem for premium content creators.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Forçando a classe "dark" para manter a estética estritamente dark mode
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans min-h-screen flex bg-background selection:bg-primary/30`}>
        
        {/* Sidebar Global (Condicional) renderizada no Client Side */}
        <GlobalSidebar />

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col min-h-screen">
        
        {/* Navbar Premium - Mobile Only (No desktop a sidebar domina) */}
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md md:hidden">
          <div className="container mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 select-none cursor-pointer">
              <span className="text-xl font-bold tracking-tighter text-white">
                NudeNude<span className="text-primary">.</span>
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/login" className="h-9 px-5 flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-glow hover:bg-primary/90 transition-all">
                Entrar
              </Link>
            </div>
          </div>
        </header>

        {/* Conteúdo Principal (Alta escaneabilidade, margins generosos) */}
        <main className="flex-1 container mx-auto px-6 py-12 flex flex-col w-full max-w-5xl">
          {children}
        </main>

        {/* Footer Minimalista (Clean UI) */}
        <footer className="border-t border-white/10 mt-auto bg-background/30">
          <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground font-medium">
              © {new Date().getFullYear()} NudeNude. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground font-medium">
              <a href="#" className="hover:text-zinc-200 transition-colors">Termos</a>
              <a href="#" className="hover:text-zinc-200 transition-colors">Privacidade</a>
            </div>
          </div>
        </footer>

        </div>
      </body>
    </html>
  )
}
