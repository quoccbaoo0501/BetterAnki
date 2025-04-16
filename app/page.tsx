"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import LanguageSelector from "@/components/language-selector"
import PromptInput from "@/components/prompt-input"
import { Button } from "@/components/ui/button"
import { ExternalLink, Clipboard, LightbulbIcon } from "lucide-react"
import { getPromptHistory } from "@/lib/storage"
import PromptSuggestions from "@/components/prompt-suggestions"

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [apiKey, setApiKey] = useState("")
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

  const handlePasteApiKey = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setApiKey(text)
    } catch (error) {
      console.error("Failed to read clipboard:", error)
    }
  }

  const handlePromptSelect = (selectedPrompt: string) => {
    setPrompt(selectedPrompt)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!nativeLanguage || !targetLanguage || !prompt || !apiKey) {
      alert("Please fill in all fields")
      return
    }

    const params = new URLSearchParams()
    params.set("nativeLanguage", nativeLanguage)
    params.set("targetLanguage", targetLanguage)
    params.set("prompt", prompt)
    params.set("apiKey", apiKey)

    router.push(`/generate?${params.toString()}`)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">Create Flashcards</h1>
          <p className="text-slate-600 mt-2">Generate AI-powered language flashcards</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="api-key" className="block text-sm font-medium text-amber-800">
                API Key
              </label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                  onClick={handlePasteApiKey}
                >
                  <Clipboard className="h-3 w-3 mr-1" />
                  Paste
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                  onClick={() => window.open("https://aistudio.google.com/apikey", "_blank")}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Get API Key
                </Button>
              </div>
            </div>
            <input
              type="password"
              id="api-key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
              className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="mt-1 text-xs text-amber-700">Required to generate flashcards with Gemini AI</p>
          </div>

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
