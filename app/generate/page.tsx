import { Suspense } from "react"
import { redirect } from "next/navigation"
import FlashcardGenerator from "@/components/flashcard-generator"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function GeneratePage({
  searchParams,
}: {
  searchParams: { nativeLanguage: string; targetLanguage: string; prompt: string }
}) {
  // Validate required parameters directly from searchParams
  if (!searchParams.nativeLanguage || !searchParams.targetLanguage || !searchParams.prompt) {
    redirect("/")
  }

  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/" className="flex items-center text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to create
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Generated Flashcards</h1>
          <p className="text-slate-600">
            From {searchParams.nativeLanguage} to {searchParams.targetLanguage}
          </p>
          <p className="text-sm text-slate-500 mt-1">Prompt: {searchParams.prompt}</p>
        </div>

        <Suspense fallback={<FlashcardLoading />}>
          <FlashcardGenerator
            nativeLanguage={searchParams.nativeLanguage}
            targetLanguage={searchParams.targetLanguage}
            prompt={searchParams.prompt}
          />
        </Suspense>
      </div>
    </div>
  )
}

function FlashcardLoading() {
  return (
    <div className="space-y-4">
      <p className="text-slate-600">Generating flashcards with AI...</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-40 rounded-lg bg-slate-200 animate-pulse" />
        ))}
      </div>
    </div>
  )
}
