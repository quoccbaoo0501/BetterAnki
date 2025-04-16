import { Suspense } from "react"
import { redirect } from "next/navigation"
import FlashcardGenerator from "@/components/flashcard-generator"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getSavedApiKey } from "@/lib/storage"
import { LoadingAnimation } from "@/components/loading-animation"

export default function GeneratePage({
  searchParams,
}: {
  searchParams: { nativeLanguage: string; targetLanguage: string; prompt: string; apiKey?: string }
}) {
  const { nativeLanguage, targetLanguage, prompt, apiKey: urlApiKey } = searchParams

  // Use the API key from URL or fall back to the stored one
  const apiKey = urlApiKey || getSavedApiKey()

  // Check if this is definition mode (same language for native and target)
  const isDefinitionMode = nativeLanguage === targetLanguage

  // Validate required parameters
  if (!nativeLanguage || !targetLanguage || !prompt) {
    redirect("/")
  }

  // If no API key is available, redirect back to the home page
  if (!apiKey) {
    redirect("/?error=noApiKey")
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to create
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-blue-400">
            Generated Flashcards
          </h1>
          <p className="text-muted-foreground">
            {isDefinitionMode ? (
              <>Definitions in {nativeLanguage}</>
            ) : (
              <>
                From {nativeLanguage} to {targetLanguage}
              </>
            )}
          </p>
          <p className="text-sm text-muted-foreground/80 mt-1">Prompt: {prompt}</p>
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
  return <LoadingAnimation />
}
