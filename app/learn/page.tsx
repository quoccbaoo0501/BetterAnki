"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FlashcardItem from "@/components/flashcard-item"
import { Button } from "@/components/ui/button"
import type { Flashcard } from "@/types/flashcard"
import { getSavedFlashcards } from "@/lib/storage"
import { BookX } from "lucide-react"

export default function LearnPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load saved flashcards from storage
    const savedCards = getSavedFlashcards()
    setFlashcards(savedCards)
    setIsLoading(false)
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

          <TabsContent value="browse">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flashcards.map((card) => (
                <FlashcardItem
                  key={card.id}
                  flashcard={card}
                  isSelected={false}
                  onToggle={() => {}}
                  showCheckbox={false}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
