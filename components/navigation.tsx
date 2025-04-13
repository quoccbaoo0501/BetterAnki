"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { PenLine, BookOpen } from "lucide-react"

export default function Navigation() {
  const pathname = usePathname()

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-slate-800">
            LanguageLang
          </Link>

          <nav className="flex">
            <Link
              href="/"
              className={`flex items-center px-3 py-2 rounded-md mr-2 ${
                pathname === "/" ? "bg-emerald-100 text-emerald-700" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <PenLine className="h-4 w-4 mr-2" />
              <span>Create</span>
            </Link>
            <Link
              href="/learn"
              className={`flex items-center px-3 py-2 rounded-md ${
                pathname === "/learn" ? "bg-emerald-100 text-emerald-700" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              <span>Learn</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
