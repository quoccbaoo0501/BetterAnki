"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import type { Flashcard } from "@/types/flashcard"
import { addFlashcard, getDecks } from "@/lib/storage"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Deck } from "@/types/deck"
import CreateDeckDialog from "./create-deck-dialog"

interface AddFlashcardDialogProps {
  nativeLanguage: string
  targetLanguage: string
  onFlashcardAdded: () => void
  defaultDeckId?: string
}

export default function AddFlashcardDialog({
  nativeLanguage,
  targetLanguage,
  onFlashcardAdded,
  defaultDeckId,
}: AddFlashcardDialogProps) {
  const [open, setOpen] = useState(false)
  const [nativeWord, setNativeWord] = useState("")
  const [targetWord, setTargetWord] = useState("")
  const [nativeExample, setNativeExample] = useState("")
  const [targetExample, setTargetExample] = useState("")
  const [decks, setDecks] = useState<Deck[]>([])
  const [selectedDeckId, setSelectedDeckId] = useState<string>("")

  // Update the AddFlashcardDialog component to handle the case where no decks exist
  // Load decks when dialog opens
  useEffect(() => {
    if (open && typeof window !== "undefined") {
      const availableDecks = getDecks(nativeLanguage, targetLanguage)
      setDecks(availableDecks)

      // Use provided default deck ID or first deck if available
      if (availableDecks.length > 0) {
        setSelectedDeckId(defaultDeckId || availableDecks[0].id)
      } else {
        setSelectedDeckId("")
      }
    }
  }, [open, nativeLanguage, targetLanguage, defaultDeckId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!nativeWord.trim() || !targetWord.trim() || !selectedDeckId) {
      return
    }

    const newFlashcard: Flashcard = {
      id: uuidv4(),
      nativeWord: nativeWord.trim(),
      targetWord: targetWord.trim(),
      nativeExample: nativeExample.trim() || undefined,
      targetExample: targetExample.trim() || undefined,
      deckId: selectedDeckId,
    }

    addFlashcard(newFlashcard, nativeLanguage, targetLanguage)
    onFlashcardAdded()

    // Reset form
    setNativeWord("")
    setTargetWord("")
    setNativeExample("")
    setTargetExample("")
    setOpen(false)
  }

  // Update the UI to show a message when no decks exist
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Flashcard
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Flashcard</DialogTitle>
        </DialogHeader>

        {decks.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-slate-600 mb-4">You need to create a deck before adding flashcards.</p>
            <CreateDeckDialog
              nativeLanguage={nativeLanguage}
              targetLanguage={targetLanguage}
              onDeckCreated={() => {
                // Refresh decks
                const updatedDecks = getDecks(nativeLanguage, targetLanguage)
                setDecks(updatedDecks)
                if (updatedDecks.length > 0) {
                  setSelectedDeckId(updatedDecks[0].id)
                }
              }}
              trigger={<Button>Create First Deck</Button>}
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="deck-select">Deck</Label>
              <Select value={selectedDeckId} onValueChange={setSelectedDeckId} required>
                <SelectTrigger id="deck-select">
                  <SelectValue placeholder="Select a deck" />
                </SelectTrigger>
                <SelectContent>
                  {decks.map((deck) => (
                    <SelectItem key={deck.id} value={deck.id}>
                      {deck.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="native-word">{nativeLanguage} Word</Label>
              <Input
                id="native-word"
                value={nativeWord}
                onChange={(e) => setNativeWord(e.target.value)}
                placeholder="Enter word in your language"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-word">{targetLanguage} Word</Label>
              <Input
                id="target-word"
                value={targetWord}
                onChange={(e) => setTargetWord(e.target.value)}
                placeholder="Enter word in target language"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="native-example">Example in {nativeLanguage} (Optional)</Label>
              <Textarea
                id="native-example"
                value={nativeExample}
                onChange={(e) => setNativeExample(e.target.value)}
                placeholder="Example sentence in your language"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-example">Example in {targetLanguage} (Optional)</Label>
              <Textarea
                id="target-example"
                value={targetExample}
                onChange={(e) => setTargetExample(e.target.value)}
                placeholder="Example sentence in target language"
                rows={2}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit">Add Flashcard</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
