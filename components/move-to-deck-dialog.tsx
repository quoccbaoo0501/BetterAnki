"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FolderInput } from "lucide-react"
import { getDecks, moveFlashcardsToDeck } from "@/lib/storage"
import type { Deck } from "@/types/deck"

interface MoveToDialogProps {
  nativeLanguage: string
  targetLanguage: string
  selectedCardIds: string[]
  currentDeckId: string
  onMoveComplete: () => void
}

export default function MoveToDialog({
  nativeLanguage,
  targetLanguage,
  selectedCardIds,
  currentDeckId,
  onMoveComplete,
}: MoveToDialogProps) {
  const [open, setOpen] = useState(false)
  const [decks, setDecks] = useState<Deck[]>([])
  const [selectedDeckId, setSelectedDeckId] = useState<string>("")

  // Load decks
  useEffect(() => {
    if (typeof window !== "undefined" && nativeLanguage && targetLanguage) {
      const availableDecks = getDecks(nativeLanguage, targetLanguage)
      // Filter out the current deck
      setDecks(availableDecks.filter((deck) => deck.id !== currentDeckId))
    }
  }, [nativeLanguage, targetLanguage, currentDeckId, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDeckId || selectedCardIds.length === 0) {
      return
    }

    moveFlashcardsToDeck(selectedCardIds, selectedDeckId, nativeLanguage, targetLanguage)
    onMoveComplete()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          disabled={selectedCardIds.length === 0 || decks.length === 0}
        >
          <FolderInput className="h-4 w-4" />
          Move to Deck
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Move {selectedCardIds.length} Cards to Deck</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="target-deck">Select Target Deck</Label>
            <Select value={selectedDeckId} onValueChange={setSelectedDeckId} required>
              <SelectTrigger id="target-deck">
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

          <div className="flex justify-end">
            <Button type="submit" disabled={!selectedDeckId}>
              Move Cards
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
