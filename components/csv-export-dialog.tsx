"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, Check } from "lucide-react"
import { getSavedFlashcards } from "@/lib/storage"
import type { Flashcard } from "@/types/flashcard"

interface CSVExportDialogProps {
  nativeLanguage: string
  targetLanguage: string
  deckId: string
  deckName: string
}

export default function CSVExportDialog({ nativeLanguage, targetLanguage, deckId, deckName }: CSVExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [includeExamples, setIncludeExamples] = useState(true)
  const [success, setSuccess] = useState(false)

  const handleExport = () => {
    try {
      // Get flashcards for the specified deck
      const flashcards = getSavedFlashcards(nativeLanguage, targetLanguage, deckId)

      if (flashcards.length === 0) {
        alert("No flashcards to export in this deck")
        return
      }

      // Generate CSV content
      const csvContent = generateCSV(flashcards, includeExamples)

      // Create a blob and download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)

      // Create a temporary link and trigger download
      const link = document.createElement("a")
      const filename = `${sanitizeFilename(deckName)}_${nativeLanguage}_${targetLanguage}_flashcards.csv`

      link.href = url
      link.setAttribute("download", filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Show success message
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error("Error exporting flashcards:", error)
      alert("Failed to export flashcards")
    }
  }

  const generateCSV = (flashcards: Flashcard[], includeExamples: boolean): string => {
    // Create header row
    let csv = includeExamples
      ? `"${nativeLanguage}","${targetLanguage}","${nativeLanguage} Example","${targetLanguage} Example"\n`
      : `"${nativeLanguage}","${targetLanguage}"\n`

    // Add each flashcard as a row
    flashcards.forEach((card) => {
      // Escape quotes in fields by doubling them
      const nativeWord = escapeCSVField(card.nativeWord)
      const targetWord = escapeCSVField(card.targetWord)

      if (includeExamples) {
        const nativeExample = card.nativeExample ? escapeCSVField(card.nativeExample) : ""
        const targetExample = card.targetExample ? escapeCSVField(card.targetExample) : ""
        csv += `"${nativeWord}","${targetWord}","${nativeExample}","${targetExample}"\n`
      } else {
        csv += `"${nativeWord}","${targetWord}"\n`
      }
    })

    return csv
  }

  // Helper function to escape CSV fields
  const escapeCSVField = (field: string): string => {
    return field.replace(/"/g, '""')
  }

  // Helper function to sanitize filename
  const sanitizeFilename = (name: string): string => {
    return name.replace(/[^a-z0-9]/gi, "_").toLowerCase()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Flashcards to CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-examples"
              checked={includeExamples}
              onCheckedChange={(checked) => setIncludeExamples(checked === true)}
            />
            <Label htmlFor="include-examples">Include example sentences</Label>
          </div>

          <p className="text-sm text-slate-600">
            This will export all flashcards from the deck "{deckName}" as a CSV file that can be imported into Anki or
            other flashcard apps.
          </p>

          {success && (
            <Alert
              variant="default"
              className="bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/30"
            >
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <AlertDescription>Flashcards exported successfully!</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button onClick={handleExport} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
