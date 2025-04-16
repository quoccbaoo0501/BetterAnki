"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Deck } from "@/types/deck"
import { updateDeck } from "@/lib/storage"

interface EditDeckDialogProps {
  deck: Deck | null
  nativeLanguage: string
  targetLanguage: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeckUpdated: () => void
}

export default function EditDeckDialog({
  deck,
  nativeLanguage,
  targetLanguage,
  open,
  onOpenChange,
  onDeckUpdated,
}: EditDeckDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  // Update form when deck changes
  useEffect(() => {
    if (deck) {
      setName(deck.name || "")
      setDescription(deck.description || "")
    }
  }, [deck])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!deck || !name.trim()) {
      return
    }

    const updatedDeck: Deck = {
      ...deck,
      name: name.trim(),
      description: description.trim(),
      updatedAt: Date.now(),
    }

    updateDeck(updatedDeck, nativeLanguage, targetLanguage)
    onDeckUpdated()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Deck</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="deck-name">Deck Name</Label>
            <Input
              id="deck-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter deck name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deck-description">Description (Optional)</Label>
            <Textarea
              id="deck-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter deck description"
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
