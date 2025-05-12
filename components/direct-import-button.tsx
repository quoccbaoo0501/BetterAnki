"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import type { Flashcard } from "@/types/flashcard"
import { addFlashcard } from "@/lib/storage"
import { parseCSV } from "@/lib/csv-utils"

interface DirectImportButtonProps {
  nativeLanguage: string
  targetLanguage: string
  deckId: string
  onImportComplete: () => void
}

export default function DirectImportButton({
  nativeLanguage,
  targetLanguage,
  deckId,
  onImportComplete,
}: DirectImportButtonProps) {
  const [isImporting, setIsImporting] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    setIsImporting(true)

    try {
      const text = await file.text()
      const parsedData = parseCSV(text)

      let importCount = 0

      // Add each flashcard to the deck
      for (const data of parsedData) {
        const flashcard: Flashcard = {
          id: uuidv4(),
          nativeWord: data.nativeWord,
          targetWord: data.targetWord,
          nativeExample: data.nativeExample,
          targetExample: data.targetExample,
          deckId: deckId,
        }

        addFlashcard(flashcard, nativeLanguage, targetLanguage)
        importCount++
      }

      // Show success message
      if (importCount > 0) {
        alert(`Successfully imported ${importCount} flashcards`)
        onImportComplete()
      } else {
        alert("No valid flashcards found in the file")
      }
    } catch (error) {
      console.error("Import error:", error)
      alert("Failed to import flashcards. Please check the file format.")
    } finally {
      setIsImporting(false)
      // Reset the input
      e.target.value = ""
    }
  }

  return (
    <div className="relative">
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isImporting}
      />
      <Button variant="outline" size="sm" className="flex items-center gap-2" disabled={isImporting}>
        <Upload className="h-4 w-4" />
        {isImporting ? "Importing..." : "Quick Import CSV"}
      </Button>
    </div>
  )
}
