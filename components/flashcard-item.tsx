"use client"

import { useState } from "react"
import type { Flashcard } from "@/types/flashcard"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { RefreshCw } from "lucide-react"

export default function FlashcardItem({
  flashcard,
  isSelected,
  onToggle,
  showCheckbox = true,
}: {
  flashcard: Flashcard
  isSelected: boolean
  onToggle: () => void
  showCheckbox?: boolean
}) {
  const [isFlipped, setIsFlipped] = useState(false)

  const toggleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  return (
    <div className="relative">
      {showCheckbox && (
        <div className="absolute top-2 left-2 z-10">
          <Checkbox checked={isSelected} onCheckedChange={onToggle} id={`select-${flashcard.id}`} />
        </div>
      )}

      <Card
        className={`h-40 cursor-pointer transition-all duration-300 ${isSelected && showCheckbox ? "ring-2 ring-emerald-500" : ""}`}
        onClick={toggleFlip}
      >
        <CardContent className="p-6 h-full flex flex-col justify-center items-center relative">
          <div className="absolute top-2 right-2">
            <RefreshCw className="h-4 w-4 text-slate-400" />
          </div>

          {isFlipped ? (
            <div className="text-center">
              <p className="text-lg font-medium text-slate-800">{flashcard.targetWord}</p>
              <p className="text-sm text-slate-500 mt-2">
                {flashcard.targetExample && <span className="italic">{flashcard.targetExample}</span>}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-lg font-medium text-slate-800">{flashcard.nativeWord}</p>
              <p className="text-sm text-slate-500 mt-2">
                {flashcard.nativeExample && <span className="italic">{flashcard.nativeExample}</span>}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
