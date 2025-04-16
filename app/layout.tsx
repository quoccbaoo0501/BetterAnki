import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Navigation from "@/components/navigation"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "LanguageLang - AI Flashcard Generator",
  description: "Learn languages with AI-generated flashcards",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/50">
            <Navigation />
            <main className="flex-1 p-4 md:p-6">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'