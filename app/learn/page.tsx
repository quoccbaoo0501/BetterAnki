"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FlashcardItem from "@/components/flashcard-item"
import { Button } from "@/components/ui/button"
import type { Flashcard } from "@/types/flashcard"
import { getSavedFlashcards, deleteFlashcards as deleteFlashcardsFromStorage } from "@/lib/storage"
import { BookX, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export default function LearnPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Load saved flashcards from storage
    const savedCards = getSavedFlashcards()
    setFlashcards(savedCards)
    setIsLoading(false)
    // Reset selection when flashcards load/change
    setSelectedIds(new Set())
  }, [])

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

  const deleteSelectedFlashcards = () => {
    const idsToDelete = Array.from(selectedIds)
    // Remove from local state
    setFlashcards((prev) => prev.filter((card) => !selectedIds.has(card.id)))
    // Remove from storage
    deleteFlashcardsFromStorage(idsToDelete)
    // Reset selection
    setSelectedIds(new Set())
    // Adjust current index if needed for study mode (optional, but good practice)
    if (currentIndex >= flashcards.length - idsToDelete.length) {
      setCurrentIndex(Math.max(0, flashcards.length - idsToDelete.length - 1))
    }
  }

  const isAllSelected = flashcards.length > 0 && selectedIds.size === flashcards.length

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto text-center py-12">
        <p className="text-slate-600">Loading your flashcards...</p>
      </div>
    )
  }

  if (flashcards.length === 0) {
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

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">Learn Flashcards</h1>
          <p className="text-slate-600 mt-2">
            {currentIndex + 1} of {flashcards.length} cards
          </p>
        </div>

        <Tabs defaultValue="study" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="study">Study Mode</TabsTrigger>
            <TabsTrigger value="browse">Browse All</TabsTrigger>
          </TabsList>

          <TabsContent value="study" className="space-y-6">
            <div className="flex justify-center">
              <FlashcardItem
                flashcard={flashcards[currentIndex]}
                isSelected={true}
                onToggle={() => {}}
                showCheckbox={false}
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevCard} disabled={currentIndex === 0}>
                Previous
              </Button>
              <Button variant="default" onClick={nextCard} disabled={currentIndex === flashcards.length - 1}>
                Next
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="browse" className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={isAllSelected}
                  onCheckedChange={(checked) => (checked ? selectAll() : deselectAll())}
                />
                <Label htmlFor="select-all" className="text-sm font-medium">
                  Select All ({selectedIds.size} / {flashcards.length})
                </Label>
              </div>
              <div className="ml-auto">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deleteSelectedFlashcards}
                  disabled={selectedIds.size === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
