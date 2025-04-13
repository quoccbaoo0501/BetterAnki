"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Flashcard } from "@/types/flashcard"
import FlashcardItem from "@/components/flashcard-item"
import { Button } from "@/components/ui/button"
import { generateFlashcards } from "@/lib/ai"
import { saveFlashcards } from "@/lib/storage"
import { getApiKey } from "@/components/llm-api-settings"

// Define props type directly
interface FlashcardGeneratorProps {
  nativeLanguage: string
  targetLanguage: string
  prompt: string
}

export default function FlashcardGenerator({ nativeLanguage, targetLanguage, prompt }: FlashcardGeneratorProps) {
  const router = useRouter()
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFlashcards() {
      setIsLoading(true)
      setError(null)

      if (!prompt || prompt.trim() === '') {
        console.error("Prompt is missing or empty in search parameters.")
        setError("No prompt provided. Please go back and enter a topic or text.")
        setIsLoading(false)
        setFlashcards([])
        return
      }
 
      try {
        const apiKey = getApiKey()
        const cards = await generateFlashcards(
          nativeLanguage,
          targetLanguage,
          prompt,
          apiKey,
        )
        setFlashcards(cards)
        // By default, select all flashcards
        setSelectedIds(new Set(cards.map((card) => card.id)))
      } catch (error) {
        console.error("Failed to generate flashcards:", error)
        setFlashcards([])
        setError("Failed to generate flashcards. Please check your API key or try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchFlashcards()
  }, [nativeLanguage, targetLanguage, prompt])

  const toggleFlashcard = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const selectAll = () => {
    setSelectedIds(new Set(flashcards.map((card) => card.id)))
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  const saveSelectedFlashcards = () => {
    const selectedFlashcards = flashcards.filter((card) => selectedIds.has(card.id))
    // Save to storage
    saveFlashcards(selectedFlashcards)

    // Navigate to learn page
    router.push("/learn")
  }

  if (isLoading) {
    return <p className="text-slate-600">Generating flashcards with AI...</p>
  }

  if (error) {
    return <p className="text-red-600">Error: {error}</p>
  }

  if (!flashcards.length) {
    return <p className="text-slate-600">No flashcards were generated. Try modifying your prompt.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={selectAll}>
          Select All
        </Button>
        <Button variant="outline" size="sm" onClick={deselectAll}>
          Deselect All
        </Button>
        <div className="ml-auto">
          <Button variant="default" onClick={saveSelectedFlashcards} disabled={selectedIds.size === 0}>
            Save {selectedIds.size} Flashcards
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {flashcards.map((card) => (
          <FlashcardItem
            key={card.id}
            flashcard={card}
            isSelected={selectedIds.has(card.id)}
            onToggle={() => toggleFlashcard(card.id)}
            showCheckbox={true}
          />
        ))}
      </div>
    </div>
  )
}
