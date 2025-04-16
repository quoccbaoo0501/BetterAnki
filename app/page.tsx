"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import LanguageSelector from "@/components/language-selector"
import PromptInput from "@/components/prompt-input"
import { Button } from "@/components/ui/button"
import { LightbulbIcon } from "lucide-react"
import { getPromptHistory, getSavedApiKey } from "@/lib/storage"
import PromptSuggestions from "@/components/prompt-suggestions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import SettingsDialog from "@/components/settings-dialog"

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get("error")
  const [nativeLanguage, setNativeLanguage] = useState(searchParams.get("nativeLanguage") || "")
  const [targetLanguage, setTargetLanguage] = useState(searchParams.get("targetLanguage") || "")
  const [prompt, setPrompt] = useState("")
  const [promptHistory, setPromptHistory] = useState<
    Array<{
      prompt: string
      nativeLanguage: string
      targetLanguage: string
      timestamp: number
    }>
  >([])

  useEffect(() => {
    // Only run on the client side
    if (typeof window !== "undefined") {
      // Load prompt history
      const history = getPromptHistory()
      setPromptHistory(history)
    }
  }, [])

  const handlePromptSelect = (selectedPrompt: string) => {
    setPrompt(selectedPrompt)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!nativeLanguage || !targetLanguage || !prompt) {
      alert("Please fill in all fields")
      return
    }

    // Check if API key is available
    const apiKey = getSavedApiKey()
    if (!apiKey) {
      alert("Please set your API key in the settings first")
      return
    }

    const params = new URLSearchParams()
    params.set("nativeLanguage", nativeLanguage)
    params.set("targetLanguage", targetLanguage)
    params.set("prompt", prompt)

    router.push(`/generate?${params.toString()}`)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-6">
        {errorParam === "noApiKey" && (
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
        )}
        <div className="text-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-blue-400">
            Create Flashcards
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Generate AI-powered language flashcards</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <LanguageSelector
            nativeLanguage={nativeLanguage}
            targetLanguage={targetLanguage}
            onNativeChange={setNativeLanguage}
            onTargetChange={setTargetLanguage}
          />

          <PromptInput
            value={prompt}
            onChange={setPrompt}
            nativeLanguage={nativeLanguage}
            targetLanguage={targetLanguage}
          />

          {promptHistory.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center text-sm text-slate-600">
                <LightbulbIcon className="h-4 w-4 mr-1 text-amber-500" />
                <span>Previous prompts</span>
              </div>
              <PromptSuggestions
                history={promptHistory}
                onSelect={handlePromptSelect}
                currentLanguages={{ native: nativeLanguage, target: targetLanguage }}
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            Generate Flashcards
          </Button>
        </form>
      </div>
    </div>
  )
}
