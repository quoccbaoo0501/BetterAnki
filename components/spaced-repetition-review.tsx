"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Volume2, Edit2 } from "lucide-react"
import type { Flashcard } from "@/types/flashcard"
import { updateFlashcardReview } from "@/lib/spaced-repetition"
import { speakText, isSpeechSynthesisSupported } from "@/lib/audio"
import EditFlashcardDialog from "./edit-flashcard-dialog"

interface SpacedRepetitionReviewProps {
  flashcards: Flashcard[]
  nativeLanguage: string
  targetLanguage: string
  onComplete: () => void
}

export default function SpacedRepetitionReview({
  flashcards,
  nativeLanguage,
  targetLanguage,
  onComplete,
}: SpacedRepetitionReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isReviewComplete, setIsReviewComplete] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [currentEditCard, setCurrentEditCard] = useState<Flashcard | null>(null)
  const speechSupported = isSpeechSynthesisSupported()

  const currentCard = flashcards[currentIndex]

  useEffect(() => {
    if (currentIndex >= flashcards.length) {
      setIsReviewComplete(true)
    }
  }, [currentIndex, flashcards.length])

  const flipCard = () => {
    setIsFlipped(true)
  }

  const handleRating = (rating: "again" | "hard" | "good" | "easy") => {
    // Update the flashcard with the new review data
    updateFlashcardReview(currentCard, rating, nativeLanguage, targetLanguage)

    // Move to the next card
    setCurrentIndex((prev) => prev + 1)
    setIsFlipped(false)
  }

  const handleSpeakClick = () => {
    if (speechSupported) {
      speakText(currentCard.targetWord, targetLanguage)
    }
  }

  const handleEditClick = () => {
    setCurrentEditCard(currentCard)
    setEditDialogOpen(true)
  }

  if (isReviewComplete) {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-semibold mb-4">Review Complete!</h3>
        <p className="text-slate-600 mb-6">You've reviewed all the cards due for today.</p>
        <Button onClick={onComplete}>Back to Learn</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">
          Card {currentIndex + 1} of {flashcards.length}
        </p>
        <div className="flex space-x-2">
          {speechSupported && (
            <Button variant="outline" size="sm" onClick={handleSpeakClick} className="flex items-center gap-1">
              <Volume2 className="h-4 w-4" />
              Speak
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleEditClick} className="flex items-center gap-1">
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <Card className="h-60">
        <CardContent className="flex flex-col items-center justify-center h-full p-6">
          {!isFlipped ? (
            <div className="text-center">
              <p className="text-xl font-medium mb-4">{currentCard.nativeWord}</p>
              {currentCard.nativeExample && (
                <p className="text-sm text-slate-600 italic">{currentCard.nativeExample}</p>
              )}
              <Button variant="ghost" className="mt-6" onClick={flipCard}>
                Show Answer
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xl font-medium mb-4">{currentCard.targetWord}</p>
              {currentCard.targetExample && (
                <p className="text-sm text-slate-600 italic">{currentCard.targetExample}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {isFlipped && (
        <div className="grid grid-cols-4 gap-2">
          <Button
            variant="outline"
            className="border-red-200 bg-red-50 hover:bg-red-100 text-red-700"
            onClick={() => handleRating("again")}
          >
            Again
          </Button>
          <Button
            variant="outline"
            className="border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700"
            onClick={() => handleRating("hard")}
          >
            Hard
          </Button>
          <Button
            variant="outline"
            className="border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
            onClick={() => handleRating("good")}
          >
            Good
          </Button>
          <Button
            variant="outline"
            className="border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700"
            onClick={() => handleRating("easy")}
          >
            Easy
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <EditFlashcardDialog
        flashcard={currentEditCard}
        nativeLanguage={nativeLanguage}
        targetLanguage={targetLanguage}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onFlashcardUpdated={() => {
          // Refresh the current card data
          onComplete()
        }}
      />
    </div>
  )
}
