"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import FlashcardGenerator from "@/components/flashcard-generator"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getSavedApiKey } from "@/lib/storage"
import { LoadingAnimation } from "@/components/loading-animation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import SettingsDialog from "@/components/settings-dialog"

export default function GeneratePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nativeLanguage = searchParams.get("nativeLanguage") || ""
  const targetLanguage = searchParams.get("targetLanguage") || ""
  const prompt = searchParams.get("prompt") || ""
  const urlApiKey = searchParams.get("apiKey") || ""

  const [apiKey, setApiKey] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if this is definition mode (same language for native and target)
  const isDefinitionMode = nativeLanguage === targetLanguage

  // Validate required parameters
  useEffect(() => {
    if (!nativeLanguage || !targetLanguage || !prompt) {
      router.push("/")
      return
    }

    // Check for API key on client side
    const savedApiKey = getSavedApiKey()
    if (urlApiKey) {
      setApiKey(urlApiKey)
      setIsLoading(false)
    } else if (savedApiKey) {
      setApiKey(savedApiKey)
      setIsLoading(false)
    } else {
      setError("noApiKey")
      setIsLoading(false)
    }
  }, [nativeLanguage, targetLanguage, prompt, urlApiKey, router])

  if (isLoading) {
    return <LoadingAnimation />
  }

  if (error === "noApiKey") {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="mb-6">
          <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to create
          </Link>
        </div>

        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            Please set your API key in the settings first.{" "}
            <SettingsDialog
              trigger={
                <Button variant="link" className="p-0 h-auto">
                  Open Settings
                </Button>
              }
            />
          </AlertDescription>
        </Alert>

        <div className="mt-4">
          <Button
            onClick={() => {
              // Check again after settings might have been updated
              const newApiKey = getSavedApiKey()
              if (newApiKey) {
                setApiKey(newApiKey)
                setError(null)
              } else {
                router.push("/?error=noApiKey")
              }
            }}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
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

        {apiKey && (
          <FlashcardGenerator
            nativeLanguage={nativeLanguage}
            targetLanguage={targetLanguage}
            prompt={prompt}
            apiKey={apiKey}
          />
        )}
      </div>
    </div>
  )
}
