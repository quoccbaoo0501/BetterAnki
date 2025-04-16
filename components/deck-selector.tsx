"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { getDecks, getFlashcardCountByDeck } from "@/lib/storage"
import type { Deck } from "@/types/deck"
import CreateDeckDialog from "./create-deck-dialog"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

type DeckSelectorProps = {
  nativeLanguage: string
  targetLanguage: string
  selectedDeckId: string
  onChange: (deckId: string) => void
  showCreateButton?: boolean
}

export default function DeckSelector({
  nativeLanguage,
  targetLanguage,
  selectedDeckId,
  onChange,
  showCreateButton = true,
}: DeckSelectorProps) {
  const [decks, setDecks] = useState<Deck[]>([])
  const [cardCounts, setCardCounts] = useState<Record<string, number>>({})
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Load decks and card counts
  useEffect(() => {
    if (typeof window !== "undefined" && nativeLanguage && targetLanguage) {
      // Get all decks
      const availableDecks = getDecks(nativeLanguage, targetLanguage)
      setDecks(availableDecks)

      // Get card counts for each deck
      const counts = getFlashcardCountByDeck(nativeLanguage, targetLanguage)
      setCardCounts(counts)

      // If no deck is selected or the selected deck doesn't exist, select the first one if available
      if (
        availableDecks.length > 0 &&
        (!selectedDeckId || !availableDecks.some((deck) => deck.id === selectedDeckId))
      ) {
        onChange(availableDecks[0].id)
      }
    }
  }, [nativeLanguage, targetLanguage, selectedDeckId, onChange])

  const handleDeckCreated = () => {
    // Refresh decks list
    const updatedDecks = getDecks(nativeLanguage, targetLanguage)
    setDecks(updatedDecks)

    // Update card counts
    const counts = getFlashcardCountByDeck(nativeLanguage, targetLanguage)
    setCardCounts(counts)

    // Select the newly created deck
    if (updatedDecks.length > 0) {
      onChange(updatedDecks[updatedDecks.length - 1].id)
    }

    setCreateDialogOpen(false)
  }

  // If no decks exist, show a message and create button
  if (decks.length === 0) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="text-center py-4">
            <p className="text-slate-600 mb-4">No decks available. Create your first deck to get started.</p>
            <CreateDeckDialog
              nativeLanguage={nativeLanguage}
              targetLanguage={targetLanguage}
              onDeckCreated={handleDeckCreated}
              open={createDialogOpen}
              onOpenChange={setCreateDialogOpen}
              trigger={
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create First Deck
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex justify-between items-center mb-3">
          <Label htmlFor="deck-selector">Select Deck</Label>
          {showCreateButton && (
            <CreateDeckDialog
              nativeLanguage={nativeLanguage}
              targetLanguage={targetLanguage}
              onDeckCreated={handleDeckCreated}
              trigger={
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <PlusCircle className="h-4 w-4 mr-1" />
                  New Deck
                </Button>
              }
            />
          )}
        </div>
        <Select value={selectedDeckId} onValueChange={onChange}>
          <SelectTrigger id="deck-selector" className="w-full">
            <SelectValue placeholder="Select a deck" />
          </SelectTrigger>
          <SelectContent>
            {decks.map((deck) => (
              <SelectItem key={deck.id} value={deck.id}>
                {deck.name} {cardCounts[deck.id] ? `(${cardCounts[deck.id]})` : "(0)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}
