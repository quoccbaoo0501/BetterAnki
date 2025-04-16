"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FlashcardItem from "@/components/flashcard-item"
import { Button } from "@/components/ui/button"
import { Trash2, BookX, ChevronLeft, ChevronRight, Clock, Settings2, PlusCircle } from "lucide-react"
import type { Flashcard } from "@/types/flashcard"
import type { Deck } from "@/types/deck"
import {
  getSavedFlashcards,
  getAvailableLanguagePairs,
  deleteFlashcards,
  getDueFlashcards,
  getDecks,
  getFlashcardCountByDeck,
} from "@/lib/storage"
import LanguagePairSelector from "@/components/language-pair-selector"
import AddFlashcardDialog from "@/components/add-flashcard-dialog"
import SpacedRepetitionSettings from "@/components/spaced-repetition-settings"
import SpacedRepetitionReview from "@/components/spaced-repetition-review"
import EditFlashcardDialog from "@/components/edit-flashcard-dialog"
import DeckSelector from "@/components/deck-selector"
import MoveToDialog from "@/components/move-to-deck-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import DeckManagement from "@/components/deck-management"
import CreateDeckDialog from "@/components/create-deck-dialog"

export default function LearnPage() {
  const searchParams = useSearchParams()
  const initialNative = searchParams.get("native") || ""
  const initialTarget = searchParams.get("target") || ""
  const initialDeckId = searchParams.get("deck") || ""

  const [nativeLanguage, setNativeLanguage] = useState(initialNative)
  const [targetLanguage, setTargetLanguage] = useState(initialTarget)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [dueFlashcards, setDueFlashcards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(new Set())
  const [availablePairs, setAvailablePairs] = useState<{ native: string; target: string }[]>([])
  const [isReviewMode, setIsReviewMode] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [currentEditCard, setCurrentEditCard] = useState<Flashcard | null>(null)
  const [decks, setDecks] = useState<Deck[]>([])
  const [selectedDeckId, setSelectedDeckId] = useState(initialDeckId)
  const [deckManagementOpen, setDeckManagementOpen] = useState(false)
  const [cardCounts, setCardCounts] = useState<Record<string, number>>({})

  // Check if this is definition mode (same language for native and target)
  const isDefinitionMode = nativeLanguage === targetLanguage

  // Load available language pairs - only once on initial render
  useEffect(() => {
    if (typeof window !== "undefined") {
      const pairs = getAvailableLanguagePairs()
      setAvailablePairs(pairs)

      // If no language pair is selected but pairs exist, select the first one
      if ((!nativeLanguage || !targetLanguage) && pairs.length > 0) {
        setNativeLanguage(pairs[0].native)
        setTargetLanguage(pairs[0].target)
      }

      setIsLoading(false)
    }
  }, []) // Empty dependency array to run only once

  // Load decks when language pair changes
  useEffect(() => {
    if (typeof window !== "undefined" && nativeLanguage && targetLanguage) {
      // Get all decks
      const availableDecks = getDecks(nativeLanguage, targetLanguage)
      setDecks(availableDecks)

      // If decks exist and no deck is selected or the selected deck doesn't exist, select the first one
      if (availableDecks.length > 0) {
        if (!selectedDeckId || !availableDecks.some((deck) => deck.id === selectedDeckId)) {
          setSelectedDeckId(availableDecks[0].id)
        }
      } else {
        // No decks exist
        setSelectedDeckId("")
      }

      // Get card counts for each deck
      const counts = getFlashcardCountByDeck(nativeLanguage, targetLanguage)
      setCardCounts(counts)
    }
  }, [nativeLanguage, targetLanguage, selectedDeckId])

  // Load flashcards when deck changes
  useEffect(() => {
    if (typeof window !== "undefined" && nativeLanguage && targetLanguage && selectedDeckId) {
      // Get flashcards for the selected deck
      const savedCards = getSavedFlashcards(nativeLanguage, targetLanguage, selectedDeckId)
      setFlashcards(savedCards)

      // Get cards due for review in this deck
      const due = getDueFlashcards(nativeLanguage, targetLanguage, selectedDeckId)
      setDueFlashcards(due)

      setCurrentIndex(0)
      setSelectedForDeletion(new Set())
      setIsDeleteMode(false)
      setIsReviewMode(false)
    }
  }, [nativeLanguage, targetLanguage, selectedDeckId])

  const refreshFlashcards = () => {
    if (typeof window !== "undefined" && nativeLanguage && targetLanguage && selectedDeckId) {
      // Get flashcards for the selected deck
      const savedCards = getSavedFlashcards(nativeLanguage, targetLanguage, selectedDeckId)
      setFlashcards(savedCards)

      // Get cards due for review in this deck
      const due = getDueFlashcards(nativeLanguage, targetLanguage, selectedDeckId)
      setDueFlashcards(due)

      // Update card counts
      const counts = getFlashcardCountByDeck(nativeLanguage, targetLanguage)
      setCardCounts(counts)
    }
  }

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const toggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode)
    setSelectedForDeletion(new Set())
  }

  const toggleCardForDeletion = (id: string) => {
    setSelectedForDeletion((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const selectAllForDeletion = () => {
    setSelectedForDeletion(new Set(flashcards.map((card) => card.id)))
  }

  const deselectAllForDeletion = () => {
    setSelectedForDeletion(new Set())
  }

  const deleteSelectedCards = () => {
    if (selectedForDeletion.size === 0) return

    const idsToDelete = Array.from(selectedForDeletion)
    deleteFlashcards(idsToDelete, nativeLanguage, targetLanguage)

    // Update the flashcards list
    const updatedFlashcards = flashcards.filter((card) => !selectedForDeletion.has(card.id))
    setFlashcards(updatedFlashcards)
    setSelectedForDeletion(new Set())
    setCurrentIndex(0)

    // If all cards were deleted, exit delete mode
    if (updatedFlashcards.length === 0) {
      setIsDeleteMode(false)
    }

    // Refresh due cards and card counts
    const due = getDueFlashcards(nativeLanguage, targetLanguage, selectedDeckId)
    setDueFlashcards(due)

    const counts = getFlashcardCountByDeck(nativeLanguage, targetLanguage)
    setCardCounts(counts)
  }

  const handleLanguagePairChange = (native: string, target: string) => {
    setNativeLanguage(native)
    setTargetLanguage(target)
  }

  const handleDeckChange = (deckId: string) => {
    setSelectedDeckId(deckId)
  }

  const startReview = () => {
    setIsReviewMode(true)
  }

  const endReview = () => {
    setIsReviewMode(false)
    refreshFlashcards()
  }

  const handleEditCard = (card: Flashcard) => {
    setCurrentEditCard(card)
    setEditDialogOpen(true)
  }

  const handleDeckUpdated = () => {
    // Refresh decks list
    const updatedDecks = getDecks(nativeLanguage, targetLanguage)
    setDecks(updatedDecks)

    // Update card counts
    const counts = getFlashcardCountByDeck(nativeLanguage, targetLanguage)
    setCardCounts(counts)

    // If the current deck was deleted, select the first available deck
    if (updatedDecks.length > 0 && !updatedDecks.some((deck) => deck.id === selectedDeckId)) {
      setSelectedDeckId(updatedDecks[0].id)
    }
  }

  const handleMoveComplete = () => {
    // Refresh flashcards for the current deck
    const savedCards = getSavedFlashcards(nativeLanguage, targetLanguage, selectedDeckId)
    setFlashcards(savedCards)

    // Reset selection
    setSelectedForDeletion(new Set())

    // Update card counts
    const counts = getFlashcardCountByDeck(nativeLanguage, targetLanguage)
    setCardCounts(counts)
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto text-center py-12">
        <p className="text-slate-600">Loading your flashcards...</p>
      </div>
    )
  }

  if (availablePairs.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto text-center py-12">
        <BookX className="h-12 w-12 mx-auto text-slate-400 mb-4" />
        <h2 className="text-xl font-semibold text-slate-800 mb-2">No flashcards yet</h2>
        <p className="text-slate-600 mb-6">
          You haven't created any flashcards yet. Go to the Create tab to generate some!
        </p>
        <Button asChild>
          <a href="/">Create Flashcards</a>
        </Button>
      </div>
    )
  }

  if (decks.length === 0 && nativeLanguage && targetLanguage) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="mb-6">
          <LanguagePairSelector
            availablePairs={availablePairs}
            selectedNative={nativeLanguage}
            selectedTarget={targetLanguage}
            onChange={handleLanguagePairChange}
          />
        </div>

        <div className="text-center py-8">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-blue-400 mb-4">
            No Decks Available
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            You need to create a deck before you can add or view flashcards.
          </p>

          <CreateDeckDialog
            nativeLanguage={nativeLanguage}
            targetLanguage={targetLanguage}
            onDeckCreated={handleDeckUpdated}
            trigger={
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create First Deck
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  if (flashcards.length === 0 && nativeLanguage && targetLanguage) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="mb-6">
          <LanguagePairSelector
            availablePairs={availablePairs}
            selectedNative={nativeLanguage}
            selectedTarget={targetLanguage}
            onChange={handleLanguagePairChange}
          />
        </div>

        <div className="mb-6">
          <DeckSelector
            nativeLanguage={nativeLanguage}
            targetLanguage={targetLanguage}
            selectedDeckId={selectedDeckId}
            onChange={handleDeckChange}
          />
        </div>

        <div className="text-center py-8">
          <BookX className="h-12 w-12 mx-auto text-slate-400 mb-4" />
          <h2 className="text-xl font-semibold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-blue-400 mb-2">
            No flashcards in this deck
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">You don't have any flashcards in this deck yet.</p>

          <div className="flex flex-col space-y-4 items-center">
            <Button asChild>
              <a
                href={`/?nativeLanguage=${encodeURIComponent(nativeLanguage)}&targetLanguage=${encodeURIComponent(targetLanguage)}`}
              >
                Create{" "}
                {isDefinitionMode
                  ? `${nativeLanguage} Vocabulary`
                  : `${nativeLanguage} to ${targetLanguage} Flashcards`}
              </a>
            </Button>

            <AddFlashcardDialog
              nativeLanguage={nativeLanguage}
              targetLanguage={targetLanguage}
              onFlashcardAdded={refreshFlashcards}
              defaultDeckId={selectedDeckId}
            />
          </div>
        </div>
      </div>
    )
  }

  // Show review mode if active
  if (isReviewMode) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="mb-6">
          <Button variant="outline" size="sm" onClick={endReview}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Learn
          </Button>
        </div>

        <div className="space-y-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-blue-400">
            Spaced Repetition Review
          </h1>

          <SpacedRepetitionReview
            flashcards={dueFlashcards}
            nativeLanguage={nativeLanguage}
            targetLanguage={targetLanguage}
            onComplete={endReview}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-blue-400">
            Learn Flashcards
          </h1>

          <div className="flex space-x-2">
            <Dialog open={deckManagementOpen} onOpenChange={setDeckManagementOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="h-4 w-4 mr-2" />
                  Manage Decks
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Deck Management</DialogTitle>
                </DialogHeader>
                <DeckManagement
                  decks={decks}
                  nativeLanguage={nativeLanguage}
                  targetLanguage={targetLanguage}
                  onDeckUpdated={handleDeckUpdated}
                  cardCounts={cardCounts}
                />
              </DialogContent>
            </Dialog>

            <Button variant={isDeleteMode ? "destructive" : "outline"} size="sm" onClick={toggleDeleteMode}>
              {isDeleteMode ? (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <LanguagePairSelector
            availablePairs={availablePairs}
            selectedNative={nativeLanguage}
            selectedTarget={targetLanguage}
            onChange={handleLanguagePairChange}
          />
        </div>

        <DeckSelector
          nativeLanguage={nativeLanguage}
          targetLanguage={targetLanguage}
          selectedDeckId={selectedDeckId}
          onChange={handleDeckChange}
        />

        <div className="flex justify-between items-center">
          <AddFlashcardDialog
            nativeLanguage={nativeLanguage}
            targetLanguage={targetLanguage}
            onFlashcardAdded={refreshFlashcards}
            defaultDeckId={selectedDeckId}
          />

          {dueFlashcards.length > 0 && (
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-700 dark:hover:bg-amber-600"
              onClick={startReview}
            >
              <Clock className="h-4 w-4 mr-2" />
              Review {dueFlashcards.length} Cards
            </Button>
          )}
        </div>

        {dueFlashcards.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 dark:bg-amber-950/20 dark:border-amber-900/50">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-500 mr-2" />
              <span className="text-amber-800 dark:text-amber-400 font-medium">
                {dueFlashcards.length} cards due for review
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <SpacedRepetitionSettings />
        </div>

        {isDeleteMode ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={selectAllForDeletion}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAllForDeletion}>
                  Deselect All
                </Button>
              </div>

              <div className="flex space-x-2">
                <MoveToDialog
                  nativeLanguage={nativeLanguage}
                  targetLanguage={targetLanguage}
                  selectedCardIds={Array.from(selectedForDeletion)}
                  currentDeckId={selectedDeckId}
                  onMoveComplete={handleMoveComplete}
                />

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deleteSelectedCards}
                  disabled={selectedForDeletion.size === 0}
                >
                  Delete {selectedForDeletion.size} Cards
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flashcards.map((card) => (
                <FlashcardItem
                  key={card.id}
                  flashcard={card}
                  isSelected={selectedForDeletion.has(card.id)}
                  onToggle={() => toggleCardForDeletion(card.id)}
                  showCheckbox={true}
                  targetLanguage={targetLanguage}
                  isDefinitionMode={isDefinitionMode}
                />
              ))}
            </div>
          </div>
        ) : (
          <Tabs defaultValue="study" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="study">Study Mode</TabsTrigger>
              <TabsTrigger value="browse">Browse All</TabsTrigger>
            </TabsList>

            <TabsContent value="study" className="space-y-6">
              {flashcards.length > 0 && (
                <>
                  <div className="text-center mb-2">
                    <p className="text-slate-600">
                      {currentIndex + 1} of {flashcards.length} cards
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <FlashcardItem
                      flashcard={flashcards[currentIndex]}
                      isSelected={true}
                      onToggle={() => {}}
                      showCheckbox={false}
                      targetLanguage={targetLanguage}
                      onEdit={handleEditCard}
                      isDefinitionMode={isDefinitionMode}
                    />
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={prevCard} disabled={currentIndex === 0}>
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <Button variant="default" onClick={nextCard} disabled={currentIndex === flashcards.length - 1}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="browse">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {flashcards.map((card) => (
                  <FlashcardItem
                    key={card.id}
                    flashcard={card}
                    isSelected={false}
                    onToggle={() => {}}
                    showCheckbox={false}
                    targetLanguage={targetLanguage}
                    onEdit={handleEditCard}
                    isDefinitionMode={isDefinitionMode}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Edit Dialog */}
      <EditFlashcardDialog
        flashcard={currentEditCard}
        nativeLanguage={nativeLanguage}
        targetLanguage={targetLanguage}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onFlashcardUpdated={refreshFlashcards}
        isDefinitionMode={isDefinitionMode}
      />
    </div>
  )
}
