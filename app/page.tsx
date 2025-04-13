import LanguageSelector from "@/components/language-selector"
import PromptInput from "@/components/prompt-input"
import { Button } from "@/components/ui/button"
import { LLMApiSettings } from "@/components/llm-api-settings"
import { Toaster } from "@/components/ui/toaster"

export default function Home() {
  return (
    <div className="w-full max-w-md mx-auto py-8 px-4">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">Create Flashcards</h1>
          <p className="text-slate-600 mt-2">Generate AI-powered language flashcards</p>
        </div>

        <LLMApiSettings />

        <form action="/generate" className="space-y-6">
          <LanguageSelector />
          <PromptInput />

          <Button
            type="submit"
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            Generate Flashcards
          </Button>
        </form>
      </div>
      <Toaster />
    </div>
  )
}
