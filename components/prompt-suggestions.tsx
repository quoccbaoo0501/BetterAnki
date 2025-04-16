"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"

interface PromptSuggestionsProps {
  history: Array<{
    prompt: string
    nativeLanguage: string
    targetLanguage: string
    timestamp: number
  }>
  onSelect: (prompt: string) => void
  currentLanguages: {
    native: string
    target: string
  }
}

export default function PromptSuggestions({ history, onSelect, currentLanguages }: PromptSuggestionsProps) {
  // Filter history to prioritize prompts matching the current language pair
  const sortedHistory = [...history].sort((a, b) => {
    // First prioritize matching language pairs
    const aMatches = a.nativeLanguage === currentLanguages.native && a.targetLanguage === currentLanguages.target
    const bMatches = b.nativeLanguage === currentLanguages.native && b.targetLanguage === currentLanguages.target

    if (aMatches && !bMatches) return -1
    if (!aMatches && bMatches) return 1

    // Then sort by timestamp (most recent first)
    return b.timestamp - a.timestamp
  })

  return (
    <ScrollArea className="h-32 rounded-md border">
      <div className="p-2 space-y-2">
        {sortedHistory.map((item, index) => (
          <div key={index} className="flex flex-col space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-2 px-3 justify-start text-left font-normal"
              onClick={() => onSelect(item.prompt)}
            >
              <div className="truncate">{item.prompt}</div>
            </Button>
            <div className="flex justify-between text-xs text-slate-500 px-3">
              <span>
                {item.nativeLanguage} → {item.targetLanguage}
              </span>
              <span>{formatDistanceToNow(item.timestamp, { addSuffix: true })}</span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
