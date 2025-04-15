"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FlashcardItem from "@/components/flashcard-item"
import { Button } from "@/components/ui/button"
import type { Flashcard } from "@/types/flashcard"
import {
  getFlashcardsForLanguagePair,
  deleteFlashcards as deleteFlashcardsFromStorage,
  getTargetLanguages,
  getNativeLanguagesForTarget,
} from "@/lib/storage"
import { BookX, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function LearnPage() {
  const [targetLanguages, setTargetLanguages] = useState<string[]>([])
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState<string | null>(null)
  const [nativeLanguages, setNativeLanguages] = useState<string[]>([])
  const [selectedNativeLanguage, setSelectedNativeLanguage] = useState<string | null>(null)

  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(true)
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setIsLoadingLanguages(true)
    const targets = getTargetLanguages()
    setTargetLanguages(targets)
    if (targets.length > 0) {
        // setSelectedTargetLanguage(targets[0]); // Let user select explicitly
    }
    setIsLoadingLanguages(false)
  }, [])

  useEffect(() => {
    if (selectedTargetLanguage) {
      const natives = getNativeLanguagesForTarget(selectedTargetLanguage)
      setNativeLanguages(natives)
      // Reset native selection when target changes
      setSelectedNativeLanguage(null)
      setFlashcards([]) // Clear flashcards when target changes
      setCurrentIndex(0)
      setSelectedIds(new Set())
      if (natives.length > 0) {
        // setSelectedNativeLanguage(natives[0]); // Let user select explicitly
      }
    } else {
      setNativeLanguages([])
      setSelectedNativeLanguage(null)
      setFlashcards([])
      setCurrentIndex(0)
      setSelectedIds(new Set())
    }
  }, [selectedTargetLanguage])

  useEffect(() => {
    if (selectedTargetLanguage && selectedNativeLanguage) {
      setIsLoadingFlashcards(true)
      const cards = getFlashcardsForLanguagePair(selectedTargetLanguage, selectedNativeLanguage)
      setFlashcards(cards)
      setIsLoadingFlashcards(false)
      // Reset state related to the card list
      setCurrentIndex(0)
      setSelectedIds(new Set())
    } else {
        setFlashcards([]) // Clear if no language pair is selected
    }
  }, [selectedTargetLanguage, selectedNativeLanguage])

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
    if (!selectedTargetLanguage || !selectedNativeLanguage) return // Should not happen if button is disabled

    const idsToDelete = Array.from(selectedIds)
    // Remove from local state
    setFlashcards((prev) => prev.filter((card) => !selectedIds.has(card.id)))

    // Remove from storage using the new function signature
    deleteFlashcardsFromStorage(selectedTargetLanguage, selectedNativeLanguage, idsToDelete)

    // Reset selection
    setSelectedIds(new Set())
    // Adjust current index if needed for study mode
    if (currentIndex >= flashcards.length - idsToDelete.length) {
      setCurrentIndex(Math.max(0, flashcards.length - idsToDelete.length - 1))
    }
  }

  const isAllSelected = flashcards.length > 0 && selectedIds.size === flashcards.length

  return (
    <div className="w-full max-w-lg mx-auto space-y-6 py-8">
      <h1 className="text-3xl font-bold text-slate-800 text-center">Learn Your Flashcards</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-md bg-slate-50">
        <div>
          <Label htmlFor="target-language-select" className="text-sm font-medium text-slate-700">Target Language (Learn)</Label>
          <Select
            value={selectedTargetLanguage ?? undefined}
            onValueChange={(value) => setSelectedTargetLanguage(value)}
            disabled={isLoadingLanguages || targetLanguages.length === 0}
          >
            <SelectTrigger id="target-language-select" className="mt-1">
              <SelectValue placeholder={isLoadingLanguages ? "Loading..." : "Select language..."} />
            </SelectTrigger>
            <SelectContent>
              {targetLanguages.map((lang) => (
                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {targetLanguages.length === 0 && !isLoadingLanguages && (
             <p className="text-xs text-slate-500 mt-1">No languages found. Create flashcards first.</p>
          )}
        </div>

        <div>
          <Label htmlFor="native-language-select" className="text-sm font-medium text-slate-700">Native Language (Help)</Label>
          <Select
            value={selectedNativeLanguage ?? undefined}
            onValueChange={(value) => setSelectedNativeLanguage(value)}
            disabled={!selectedTargetLanguage || nativeLanguages.length === 0}
          >
            <SelectTrigger id="native-language-select" className="mt-1">
              <SelectValue placeholder={!selectedTargetLanguage ? "Select target first" : "Select language..."} />
            </SelectTrigger>
            <SelectContent>
              {nativeLanguages.map((lang) => (
                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
              ))}
            </SelectContent>
          </Select>
           {selectedTargetLanguage && nativeLanguages.length === 0 && (
             <p className="text-xs text-slate-500 mt-1">No native languages found for {selectedTargetLanguage}.</p>
          )}
        </div>
      </div>

      {isLoadingFlashcards && (
        <div className="text-center py-6">
          <p className="text-slate-600">Loading flashcards...</p>
        </div>
      )}

      {selectedTargetLanguage && selectedNativeLanguage && !isLoadingFlashcards && (
        <>
          {flashcards.length === 0 ? (
             <div className="w-full max-w-md mx-auto text-center py-12">
              <BookX className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <h2 className="text-xl font-semibold text-slate-800 mb-2">No Flashcards Found</h2>
              <p className="text-slate-600 mb-6">
                No flashcards were found for {selectedTargetLanguage} / {selectedNativeLanguage}.
                Go to the Create tab to generate some!
              </p>
              <Button asChild>
                <a href="/">Create Flashcards</a>
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="study" className="w-full">
                <div className="flex justify-between items-center mb-4">
                 <p className="text-slate-600 text-sm">
                    {flashcards.length} card{flashcards.length === 1 ? '' : 's'} for {selectedTargetLanguage} / {selectedNativeLanguage}
                 </p>
                 <TabsList className="grid w-full grid-cols-2 max-w-xs">
                    <TabsTrigger value="study">Study</TabsTrigger>
                    <TabsTrigger value="browse">Browse</TabsTrigger>
                 </TabsList>
                </div>

              <TabsContent value="study" className="space-y-6">
                 <p className="text-center text-slate-600">
                    Card {currentIndex + 1} of {flashcards.length}
                 </p>
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
                      disabled={flashcards.length === 0}
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
                      disabled={flashcards.length === 0 || selectedIds.size === 0 || !selectedTargetLanguage || !selectedNativeLanguage}
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
          )}
        </>
      )}

      {!isLoadingLanguages && !selectedTargetLanguage && targetLanguages.length > 0 && (
        <div className="text-center py-12">
          <p className="text-slate-600">Please select a target language to begin learning.</p>
        </div>
      )}
      {!isLoadingLanguages && selectedTargetLanguage && !selectedNativeLanguage && nativeLanguages.length > 0 && (
        <div className="text-center py-12">
          <p className="text-slate-600">Please select a native language to view flashcards.</p>
        </div>
      )}

    </div>
  )
}
