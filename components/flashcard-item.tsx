"use client"

import type React from "react"

import { useState } from "react"
import type { Flashcard } from "@/types/flashcard"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { RefreshCw, Volume2, Edit2 } from "lucide-react"
import { speakText, isSpeechSynthesisSupported } from "@/lib/audio"
import { formatTimeUntilReview } from "@/lib/spaced-repetition"

export default function FlashcardItem({
  flashcard,
  isSelected,
  onToggle,
  showCheckbox = true,
  targetLanguage,
  onEdit,
  isDefinitionMode = false,
}: {
  flashcard: Flashcard
  isSelected: boolean
  onToggle: () => void
  showCheckbox?: boolean
  targetLanguage?: string
  onEdit?: (flashcard: Flashcard) => void
  isDefinitionMode?: boolean
}) {
  const [isFlipped, setIsFlipped] = useState(false)
  const speechSupported = isSpeechSynthesisSupported()

  const toggleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleSpeakClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card flip
    if (targetLanguage && speechSupported) {
      speakText(isDefinitionMode ? flashcard.nativeWord : flashcard.targetWord, targetLanguage)
    }
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card flip
    if (onEdit) {
      onEdit(flashcard)
    }
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
              {isDefinitionMode ? (
                <>
                  <p className="text-md font-medium text-foreground">{flashcard.targetWord}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {flashcard.targetExample && <span className="italic">{flashcard.targetExample}</span>}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium text-foreground">{flashcard.targetWord}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {flashcard.targetExample && <span className="italic">{flashcard.targetExample}</span>}
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-lg font-medium text-foreground">{flashcard.nativeWord}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {flashcard.nativeExample && <span className="italic">{flashcard.nativeExample}</span>}
              </p>
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
