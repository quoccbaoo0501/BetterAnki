"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { PenLine, BookOpen } from "lucide-react"
import SettingsDialog from "./settings-dialog"
import { ThemeToggle } from "./theme-toggle"

export default function Navigation() {
  const pathname = usePathname()

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-foreground">
            LanguageLang
          </Link>

          <div className="flex items-center">
            <nav className="flex mr-2">
              <Link
                href="/"
                className={`flex items-center px-3 py-2 rounded-md mr-2 ${
                  pathname === "/"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <PenLine className="h-4 w-4 mr-2" />
                <span>Create</span>
              </Link>
              <Link
                href="/learn"
                className={`flex items-center px-3 py-2 rounded-md ${
                  pathname === "/learn"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                <span>Learn</span>
              </Link>
            </nav>

            <ThemeToggle />
            <SettingsDialog />
          </div>
        </div>
      </div>
    </header>
  )
}
