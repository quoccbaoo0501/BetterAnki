"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, AlertTriangle, Check } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import type { Flashcard } from "@/types/flashcard"
import { addFlashcard } from "@/lib/storage"

interface CSVImportDialogProps {
  nativeLanguage: string
  targetLanguage: string
  deckId: string
  onImportComplete: () => void
}

export default function CSVImportDialog({
  nativeLanguage,
  targetLanguage,
  deckId,
  onImportComplete,
}: CSVImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ imported: number; skipped: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setError(null)
      setSuccess(null)
    }
  }

  const handleImport = async () => {
    if (!file) {
      setError("Please select a CSV file to import")
      return
    }

    setIsProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      const text = await file.text()
      const { imported, skipped } = await processCSV(text)

      setSuccess({ imported, skipped })
      onImportComplete()

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import CSV file")
    } finally {
      setIsProcessing(false)
    }
  }

  const processCSV = async (csvText: string): Promise<{ imported: number; skipped: number }> => {
    return new Promise((resolve, reject) => {
      try {
        // Split by lines and filter out empty lines
        const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "")

        if (lines.length === 0) {
          reject(new Error("The CSV file is empty"))
          return
        }

        let imported = 0
        let skipped = 0

        // Process each line
        for (let i = 0; i < lines.length; i++) {
          // Skip header row if present (check if first line contains headers)
          if (i === 0 && (lines[i].toLowerCase().includes("front") || lines[i].toLowerCase().includes("native"))) {
            continue
          }

          // Parse the CSV line
          // We support various formats:
          // 1. Simple: nativeWord,targetWord
          // 2. With examples: nativeWord,targetWord,nativeExample,targetExample
          // 3. Anki format: front,back (maps to native,target)

          // First, handle quoted fields properly
          const parsedLine = parseCSVLine(lines[i])

          if (parsedLine.length < 2) {
            skipped++
            continue
          }

          const flashcard: Flashcard = {
            id: uuidv4(),
            nativeWord: parsedLine[0].trim(),
            targetWord: parsedLine[1].trim(),
            nativeExample: parsedLine[2]?.trim() || undefined,
            targetExample: parsedLine[3]?.trim() || undefined,
            deckId: deckId,
          }

          // Skip if either native or target word is empty
          if (!flashcard.nativeWord || !flashcard.targetWord) {
            skipped++
            continue
          }

          // Add the flashcard
          addFlashcard(flashcard, nativeLanguage, targetLanguage)
          imported++
        }

        resolve({ imported, skipped })
      } catch (error) {
        reject(error)
      }
    })
  }

  // Helper function to parse CSV line handling quoted fields
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        result.push(current)
        current = ""
      } else {
        current += char
      }
    }

    // Add the last field
    result.push(current)

    // Remove quotes from fields
    return result.map((field) => field.replace(/^"(.*)"$/, "$1"))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Flashcards from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input id="csv-file" type="file" accept=".csv,text/csv" onChange={handleFileChange} ref={fileInputRef} />
            <p className="text-xs text-slate-500">CSV format: nativeWord,targetWord,nativeExample,targetExample</p>
            <p className="text-xs text-slate-500">Anki format: front,back is also supported</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert
              variant="default"
              className="bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/30"
            >
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <AlertDescription>
                Successfully imported {success.imported} flashcards
                {success.skipped > 0 && ` (${success.skipped} entries skipped)`}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button onClick={handleImport} disabled={!file || isProcessing} className="flex items-center gap-2">
              {isProcessing ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
