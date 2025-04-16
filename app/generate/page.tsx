import { Suspense } from "react"
import { redirect } from "next/navigation"
import FlashcardGenerator from "@/components/flashcard-generator"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function GeneratePage({
  searchParams,
}: {
  searchParams: { nativeLanguage: string; targetLanguage: string; prompt: string; apiKey: string }
}) {
  const { nativeLanguage, targetLanguage, prompt, apiKey } = searchParams

  // Validate required parameters
  if (!nativeLanguage || !targetLanguage || !prompt) {
    redirect("/")
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
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
            From {nativeLanguage} to {targetLanguage}
          </p>
          <p className="text-sm text-slate-500 mt-1">Prompt: {prompt}</p>
        </div>

        <Suspense fallback={<FlashcardLoading />}>
          <FlashcardGenerator
            nativeLanguage={nativeLanguage}
            targetLanguage={targetLanguage}
            prompt={prompt}
            apiKey={apiKey}
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
