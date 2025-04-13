"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"

export default function PromptInput() {
  const [prompt, setPrompt] = useState("")

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

      <Textarea
        id="prompt"
        name="prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe what flashcards you want to generate..."
        className="min-h-[120px]"
        required
      />
    </div>
  )
}
