"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Volume2, Edit2 } from "lucide-react"
import type { Flashcard } from "@/types/flashcard"
import { updateFlashcardReview } from "@/lib/spaced-repetition"
import { speakText, isSpeechSynthesisSupported } from "@/lib/audio"
import EditFlashcardDialog from "./edit-flashcard-dialog"
import { getCardOrientationPreference, getCustomCardSides } from "@/lib/storage"

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

  // Check if this is definition mode (same language for native and target)
  const isDefinitionMode = nativeLanguage === targetLanguage

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

  // Get card orientation preference
  const cardOrientation = getCardOrientationPreference()
  const customSides = cardOrientation === "custom" ? getCustomCardSides() : { front: "nativeWord", back: "targetWord" }

  // Function to get content for a specific side based on custom settings
  const getCardContent = (side: string) => {
    if (!currentCard) return ""

    switch (side) {
      case "nativeWord":
        return currentCard.nativeWord
      case "targetWord":
        return currentCard.targetWord
      case "nativeExample":
        return currentCard.nativeExample || "No example available"
      case "targetExample":
        return currentCard.targetExample || "No example available"
      default:
        return currentCard.nativeWord
    }
  }

  // Determine what to show on front and back based on orientation
  let frontContent, frontExample, backContent, backExample

  if (currentCard) {
    if (cardOrientation === "native-front") {
      // Default: Native on front, target on back
      frontContent = currentCard.nativeWord
      frontExample = currentCard.nativeExample
      backContent = currentCard.targetWord
      backExample = currentCard.targetExample
    } else if (cardOrientation === "target-front") {
      // Reversed: Target on front, native on back
      frontContent = currentCard.targetWord
      frontExample = currentCard.targetExample
      backContent = currentCard.nativeWord
      backExample = currentCard.nativeExample
    } else if (cardOrientation === "custom") {
      // Custom: Use user-defined sides
      frontContent = getCardContent(customSides.front)
      backContent = getCardContent(customSides.back)

      // For examples, use corresponding examples if the main content is a word
      if (customSides.front === "nativeWord") frontExample = currentCard.nativeExample
      else if (customSides.front === "targetWord") frontExample = currentCard.targetExample
      else frontExample = undefined

      if (customSides.back === "nativeWord") backExample = currentCard.nativeExample
      else if (customSides.back === "targetWord") backExample = currentCard.targetExample
      else backExample = undefined
    }
  }

  const handleSpeakClick = () => {
    if (speechSupported && currentCard) {
      // Determine which word to speak based on card orientation
      let wordToSpeak = ""

      if (isDefinitionMode) {
        wordToSpeak = currentCard.nativeWord
      } else if (cardOrientation === "native-front") {
        wordToSpeak = isFlipped ? currentCard.targetWord : currentCard.nativeWord
      } else if (cardOrientation === "target-front") {
        wordToSpeak = isFlipped ? currentCard.nativeWord : currentCard.targetWord
      } else if (cardOrientation === "custom") {
        // For custom orientation, always speak the target word
        wordToSpeak = currentCard.targetWord
      }

      speakText(wordToSpeak, targetLanguage)
    }
  }

  const handleEditClick = () => {
    setCurrentEditCard(currentCard)
    setEditDialogOpen(true)
  }

  if (isReviewComplete) {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-semibold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-blue-400 mb-4">
          Review Complete!
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6">You've reviewed all the cards due for today.</p>
        <Button onClick={onComplete}>Back to Learn</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!isReviewComplete && currentCard && (
        <>
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
                  <p className="text-xl font-medium mb-4">{frontContent}</p>
                  {frontExample && <p className="text-sm text-slate-600 italic">{frontExample}</p>}
                  <Button variant="ghost" className="mt-6" onClick={flipCard}>
                    Show {isDefinitionMode ? "Definition" : "Answer"}
                  </Button>
                </div>
              ) : (
                <div className="text-center overflow-y-auto max-h-full">
                  <p className="text-lg font-medium mb-4">{backContent}</p>
                  {backExample && <p className="text-sm text-slate-600 italic mt-2">{backExample}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {isFlipped && (
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant="outline"
                className="border-red-200 bg-red-50 hover:bg-red-100 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:hover:bg-red-900/50 dark:text-red-400"
                onClick={() => handleRating("again")}
              >
                Again
              </Button>
              <Button
                variant="outline"
                className="border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 dark:border-orange-900 dark:bg-orange-950/30 dark:hover:bg-orange-900/50 dark:text-orange-400"
                onClick={() => handleRating("hard")}
              >
                Hard
              </Button>
              <Button
                variant="outline"
                className="border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400"
                onClick={() => handleRating("good")}
              >
                Good
              </Button>
              <Button
                variant="outline"
                className="border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:hover:bg-blue-900/50 dark:text-blue-400"
                onClick={() => handleRating("easy")}
              >
                Easy
              </Button>
            </div>
          )}
        </>
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
        isDefinitionMode={isDefinitionMode}
      />
    </div>
  )
}
