"use client"

import type React from "react"

import { useState } from "react"
import type { Flashcard } from "@/types/flashcard"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { RefreshCw, Volume2, Edit2 } from "lucide-react"
import { speakText, isSpeechSynthesisSupported } from "@/lib/audio"
import { formatTimeUntilReview } from "@/lib/spaced-repetition"
import { getCardOrientationPreference, getCustomCardSides } from "@/lib/storage"

export default function FlashcardItem({
  flashcard,
  isSelected,
  onToggle,
  showCheckbox = true,
  targetLanguage,
  onEdit,
  isDefinitionMode = false,
  cardOrientation,
}: {
  flashcard: Flashcard
  isSelected: boolean
  onToggle: () => void
  showCheckbox?: boolean
  targetLanguage?: string
  onEdit?: (flashcard: Flashcard) => void
  isDefinitionMode?: boolean
  cardOrientation?: "native-front" | "target-front" | "custom"
}) {
  const [isFlipped, setIsFlipped] = useState(false)
  const speechSupported = isSpeechSynthesisSupported()

  // Get card orientation preference if not provided as prop
  const effectiveCardOrientation = cardOrientation || getCardOrientationPreference()

  // Get custom card sides if using custom orientation
  const customSides =
    effectiveCardOrientation === "custom" ? getCustomCardSides() : { front: "nativeWord", back: "targetWord" }

  const toggleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleSpeakClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card flip
    if (targetLanguage && speechSupported) {
      // Determine which word to speak based on card orientation
      let wordToSpeak = ""

      if (isDefinitionMode) {
        wordToSpeak = flashcard.nativeWord
      } else if (effectiveCardOrientation === "native-front") {
        wordToSpeak = isFlipped ? flashcard.targetWord : flashcard.nativeWord
      } else if (effectiveCardOrientation === "target-front") {
        wordToSpeak = isFlipped ? flashcard.nativeWord : flashcard.targetWord
      } else if (effectiveCardOrientation === "custom") {
        // For custom orientation, always speak the target word
        wordToSpeak = flashcard.targetWord
      }

      speakText(wordToSpeak, targetLanguage)
    }
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card flip
    if (onEdit) {
      onEdit(flashcard)
    }
  }

  // Function to get content for a specific side based on custom settings
  const getCardContent = (side: string) => {
    switch (side) {
      case "nativeWord":
        return flashcard.nativeWord
      case "targetWord":
        return flashcard.targetWord
      case "nativeExample":
        return flashcard.nativeExample || "No example available"
      case "targetExample":
        return flashcard.targetExample || "No example available"
      default:
        return flashcard.nativeWord
    }
  }

  // Determine what to show on front and back based on orientation
  let frontContent, frontExample, backContent, backExample

  if (effectiveCardOrientation === "native-front") {
    // Default: Native on front, target on back
    frontContent = flashcard.nativeWord
    frontExample = flashcard.nativeExample
    backContent = flashcard.targetWord
    backExample = flashcard.targetExample
  } else if (effectiveCardOrientation === "target-front") {
    // Reversed: Target on front, native on back
    frontContent = flashcard.targetWord
    frontExample = flashcard.targetExample
    backContent = flashcard.nativeWord
    backExample = flashcard.nativeExample
  } else if (effectiveCardOrientation === "custom") {
    // Custom: Use user-defined sides
    frontContent = getCardContent(customSides.front)
    backContent = getCardContent(customSides.back)

    // For examples, use corresponding examples if the main content is a word
    if (customSides.front === "nativeWord") frontExample = flashcard.nativeExample
    else if (customSides.front === "targetWord") frontExample = flashcard.targetExample
    else frontExample = undefined

    if (customSides.back === "nativeWord") backExample = flashcard.nativeExample
    else if (customSides.back === "targetWord") backExample = flashcard.targetExample
    else backExample = undefined
  }

  return (
    <div className="relative">
      {showCheckbox && (
        <div className="absolute top-2 left-2 z-10">
          <Checkbox checked={isSelected} onCheckedChange={onToggle} id={`select-${flashcard.id}`} />
        </div>
      )}

      <Card
        className={`h-40 cursor-pointer transition-all duration-300 ${isSelected && showCheckbox ? "ring-2 ring-emerald-500 dark:ring-emerald-400" : ""}`}
        onClick={toggleFlip}
      >
        <CardContent className="p-6 h-full flex flex-col justify-center items-center relative">
          <div className="absolute top-2 right-2 flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            {speechSupported && targetLanguage && (
              <button onClick={handleSpeakClick} className="p-1 rounded-full hover:bg-muted" aria-label="Speak word">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            {onEdit && (
              <button onClick={handleEditClick} className="p-1 rounded-full hover:bg-muted" aria-label="Edit flashcard">
                <Edit2 className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {isFlipped ? (
            <div className="text-center overflow-y-auto max-h-full">
              <p className="text-lg font-medium text-foreground">{backContent}</p>
              {backExample && <p className="text-sm text-muted-foreground mt-2 italic">{backExample}</p>}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-lg font-medium text-foreground">{frontContent}</p>
              {frontExample && <p className="text-sm text-muted-foreground mt-2 italic">{frontExample}</p>}
            </div>
          )}

          {flashcard.nextReview && (
            <div className="absolute bottom-2 left-2 text-xs text-muted-foreground">
              Next review: {formatTimeUntilReview(flashcard.nextReview)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
