"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { HelpCircle, Sparkles } from "lucide-react"
import { getCachedPredictions } from "@/lib/prompt-predictor"

interface PromptInputProps {
  value: string
  onChange: (value: string) => void
  nativeLanguage?: string
  targetLanguage?: string
}

export default function PromptInput({ value, onChange, nativeLanguage, targetLanguage }: PromptInputProps) {
  const [predictedPrompts, setPredictedPrompts] = useState<string[]>([])

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Get cached predictions when component mounts or updates
      const predictions = getCachedPredictions()
      if (predictions.length > 0) {
        setPredictedPrompts(predictions)
      }

      // Set up an interval to check for new predictions
      const interval = setInterval(() => {
        const latestPredictions = getCachedPredictions()
        if (latestPredictions.length > 0 && JSON.stringify(latestPredictions) !== JSON.stringify(predictedPrompts)) {
          setPredictedPrompts(latestPredictions)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [predictedPrompts])

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="prompt">Prompt</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-slate-400" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Example: "Add 20 most common words in French, like Hello, Good Morning, Thanks, ..."</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="relative">
        <Textarea
          id="prompt"
          name="prompt"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe what flashcards you want to generate..."
          className="min-h-[120px] pr-2"
        />

        {predictedPrompts.length > 0 && (
          <div className="absolute bottom-2 right-2 flex flex-col space-y-1">
            <TooltipProvider>
              {predictedPrompts.map((prompt, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onChange(prompt)
                      }}
                    >
                      <Sparkles className="h-3 w-3 mr-1 text-amber-500" />
                      {prompt.length > 15 ? prompt.substring(0, 15) + "..." : prompt}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[200px]">
                    <p>{prompt}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        )}
      </div>
    </div>
  )
}
