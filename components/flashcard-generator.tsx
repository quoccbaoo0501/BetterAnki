"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Flashcard } from "@/types/flashcard"
import type { Deck } from "@/types/deck"
import FlashcardItem from "@/components/flashcard-item"
import { Button } from "@/components/ui/button"
import { generateFlashcards } from "@/lib/ai"
import { saveFlashcards, savePromptToHistory, getPromptHistory, getDecks, getSavedApiKey } from "@/lib/storage"
import { generatePredictedPrompts, savePredictedPrompts } from "@/lib/prompt-predictor"
import EditFlashcardDialog from "@/components/edit-flashcard-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import CreateDeckDialog from "./create-deck-dialog"
import { PlusCircle, AlertTriangle } from "lucide-react"
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

          // Start both requests in parallel
          const [flashcardsPromise, predictionsPromise] = await Promise.allSettled([
            // Request 1: Generate flashcards
            generateFlashcards(nativeLanguage, targetLanguage, prompt, effectiveApiKey),

            // Request 2: Predict next prompts
            (async () => {
              const history = getPromptHistory()
              const predictions = await generatePredictedPrompts(
                history,
                nativeLanguage,
                targetLanguage,
                effectiveApiKey,
              )
              // Save predictions to cache for use in the UI
              savePredictedPrompts(predictions)
              return predictions
            })(),
          ])

          // Handle flashcards result
          if (flashcardsPromise.status === "fulfilled") {
            const cards = flashcardsPromise.value
            setFlashcards(cards)
            // By default, select all flashcards
            setSelectedIds(new Set(cards.map((card) => card.id)))
          } else {
            console.error("Failed to generate flashcards:", flashcardsPromise.reason)
            setError(`Failed to generate flashcards: ${flashcardsPromise.reason.message || "Unknown error"}`)
          }

          // Handle predictions result (logging only, UI updates via cache)
          if (predictionsPromise.status === "rejected") {
            console.error("Failed to generate prompt predictions:", predictionsPromise.reason)
          }
        }
      } catch (error) {
        console.error("Error in fetchData:", error)
        setError(`Error generating flashcards: ${error instanceof Error ? error.message : "Unknown error"}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [nativeLanguage, targetLanguage, prompt, apiKey])

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

  if (isLoading) {
    return <LoadingAnimation />
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
        <div className="mt-4">
          <Button onClick={() => router.push("/")}>Go Back</Button>
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
