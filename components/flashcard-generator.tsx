"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Flashcard } from "@/types/flashcard"
import type { Deck } from "@/types/deck"
import FlashcardItem from "@/components/flashcard-item"
import { Button } from "@/components/ui/button"
import { generateFlashcardsInBatches } from "@/lib/ai"
import { saveFlashcards, savePromptToHistory, getDecks, getSavedApiKey } from "@/lib/storage"
import { generateAndCachePredictions } from "@/lib/prompt-predictor"
import EditFlashcardDialog from "@/components/edit-flashcard-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import CreateDeckDialog from "./create-deck-dialog"
import { PlusCircle, AlertTriangle, RefreshCw } from "lucide-react"
import { LoadingAnimation } from "./loading-animation"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function FlashcardGenerator({
  nativeLanguage,
  targetLanguage,
  prompt,
  apiKey,
}: {
  nativeLanguage: string
  targetLanguage: string
  prompt: string
  apiKey?: string
}) {
  const router = useRouter()
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [currentEditCard, setCurrentEditCard] = useState<Flashcard | null>(null)
  const [decks, setDecks] = useState<Deck[]>([])
  const [selectedDeckId, setSelectedDeckId] = useState<string>("")
  const [isRetrying, setIsRetrying] = useState(false)

  // Check if this is definition mode (same language for native and target)
  const isDefinitionMode = nativeLanguage === targetLanguage

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        setError(null)

        if (typeof window !== "undefined") {
          // Load available decks
          const availableDecks = getDecks(nativeLanguage, targetLanguage)
          setDecks(availableDecks)

          // Only set a selected deck if decks exist
          if (availableDecks.length > 0) {
            setSelectedDeckId(availableDecks[0].id)
          } else {
            setSelectedDeckId("")
          }

          // Save the prompt to history first
          savePromptToHistory(prompt, nativeLanguage, targetLanguage)

          // Get the effective API key (passed in or from storage)
          const effectiveApiKey = apiKey || getSavedApiKey()

          try {
            // Generate flashcards directly
            const cards = await generateFlashcardsInBatches(nativeLanguage, targetLanguage, prompt, effectiveApiKey)

            // Set the flashcards and select all by default
            setFlashcards(cards)
            setSelectedIds(new Set(cards.map((card) => card.id)))
          } catch (error) {
            console.error("Failed to generate flashcards:", error)
            setError(`Failed to generate flashcards: ${error instanceof Error ? error.message : "Unknown error"}`)
          }
        }
      } catch (error) {
        console.error("Error in fetchData:", error)
        let errorMessage = "Error generating flashcards: "

        if (error instanceof Error) {
          errorMessage += error.message

          // Add more context for specific error types
          if (error.message.includes("JSON")) {
            errorMessage +=
              ". The AI generated an invalid response format. Please try again with a simpler prompt or request fewer cards."
          } else if (error.message.includes("API")) {
            errorMessage +=
              ". There was an issue connecting to the AI service. Please check your API key and try again."
          }
        } else {
          errorMessage += "Unknown error"
        }

        setError(errorMessage)
      } finally {
        setIsLoading(false)
        setIsRetrying(false)
      }
    }

    fetchData()
  }, [nativeLanguage, targetLanguage, prompt, apiKey, isRetrying])

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

    // Save to storage with language pair and deck ID
    saveFlashcards(selectedFlashcards, nativeLanguage, targetLanguage, selectedDeckId)

    // Generate predictions in the background after saving
    // This will update the cache for the next time the user visits the create page
    generateAndCachePredictions(nativeLanguage, targetLanguage, apiKey)

    // Navigate to learn page with language parameters
    router.push(
      `/learn?native=${encodeURIComponent(nativeLanguage)}&target=${encodeURIComponent(targetLanguage)}&deck=${encodeURIComponent(selectedDeckId)}`,
    )
  }

  const handleEditCard = (card: Flashcard) => {
    setCurrentEditCard(card)
    setEditDialogOpen(true)
  }

  const handleCardUpdated = () => {
    // Update the flashcard in the local state
    if (currentEditCard) {
      setFlashcards((prev) =>
        prev.map((card) => (card.id === currentEditCard.id ? { ...currentEditCard, ...card } : card)),
      )
    }
  }

  const handleDeckCreated = () => {
    // Refresh decks list
    const updatedDecks = getDecks(nativeLanguage, targetLanguage)
    setDecks(updatedDecks)

    // Select the newly created deck (last in the list)
    if (updatedDecks.length > 0) {
      setSelectedDeckId(updatedDecks[updatedDecks.length - 1].id)
    }
  }

  const handleRetry = () => {
    setIsRetrying(true)
  }

  if (isLoading) {
    return <LoadingAnimation />
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
        <div className="mt-4 flex space-x-2">
          <Button onClick={handleRetry} className="flex items-center">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" onClick={() => router.push("/")}>
            Go Back
          </Button>
        </div>
      </Alert>
    )
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
      </div>

      <div className="p-4 border rounded-lg bg-muted/50">
        {decks.length === 0 ? (
          <div className="text-center py-2">
            <p className="text-muted-foreground mb-4">You need to create a deck before saving flashcards.</p>
            <CreateDeckDialog
              nativeLanguage={nativeLanguage}
              targetLanguage={targetLanguage}
              onDeckCreated={handleDeckCreated}
              trigger={
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create First Deck
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-end mb-4">
              <div className="space-y-2 flex-grow mr-4">
                <Label htmlFor="save-to-deck">Save to Deck</Label>
                <Select value={selectedDeckId} onValueChange={setSelectedDeckId}>
                  <SelectTrigger id="save-to-deck">
                    <SelectValue placeholder="Select a deck" />
                  </SelectTrigger>
                  <SelectContent>
                    {decks.map((deck) => (
                      <SelectItem key={deck.id} value={deck.id}>
                        {deck.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <CreateDeckDialog
                nativeLanguage={nativeLanguage}
                targetLanguage={targetLanguage}
                onDeckCreated={handleDeckCreated}
                trigger={
                  <Button variant="ghost" size="sm" className="mb-1">
                    <PlusCircle className="h-4 w-4 mr-1" />
                    New Deck
                  </Button>
                }
              />
            </div>

            <Button
              variant="default"
              className="w-full"
              onClick={saveSelectedFlashcards}
              disabled={selectedIds.size === 0 || !selectedDeckId}
            >
              Save {selectedIds.size} Flashcards to Selected Deck
            </Button>
          </>
        )}
      </div>

      {prompt.toLowerCase().includes("99") || prompt.toLowerCase().includes("100") || /\b\d{2,}\b/.test(prompt) ? (
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/30">
          <AlertDescription>
            <p>
              <strong>Note:</strong> For very large requests (over 100 words), the system may automatically limit the
              response to a manageable batch of high-quality flashcards (up to 100). This ensures better quality and
              prevents errors.
            </p>
            <p className="mt-2 text-sm">
              If you need more than 100 cards, you can make multiple requests or be more specific about the type of
              vocabulary you need.
            </p>
          </AlertDescription>
        </Alert>
      ) : prompt.toLowerCase().includes("many") ? (
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/30">
          <AlertDescription>
            <p>
              <strong>Note:</strong> For large requests, the system can generate up to 100 flashcards at once. For best
              results, be specific about the type of vocabulary you need.
            </p>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {flashcards.map((card) => (
          <FlashcardItem
            key={card.id}
            flashcard={card}
            isSelected={selectedIds.has(card.id)}
            onToggle={() => toggleFlashcard(card.id)}
            showCheckbox={true}
            targetLanguage={targetLanguage}
            onEdit={handleEditCard}
            isDefinitionMode={isDefinitionMode}
          />
        ))}
      </div>

      {/* Edit Dialog */}
      <EditFlashcardDialog
        flashcard={currentEditCard}
        nativeLanguage={nativeLanguage}
        targetLanguage={targetLanguage}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onFlashcardUpdated={handleCardUpdated}
        isDefinitionMode={isDefinitionMode}
      />
    </div>
  )
}
