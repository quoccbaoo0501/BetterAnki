import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Navigation from "@/components/navigation"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Better Anki - AI Flashcard Generator",
  description: "Learn languages with AI-generated flashcards using spaced repetition. Like Anki, but better!"
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
          <div className="flex flex-col min-h-[100dvh] bg-gradient-to-b from-background to-muted/50">
            <Navigation />
            <main className="flex-1 p-3 md:p-6 w-full max-w-full overflow-x-hidden pt-4">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
