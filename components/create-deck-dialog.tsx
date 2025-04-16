"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle } from "lucide-react"
import { createDeck } from "@/lib/storage"

interface CreateDeckDialogProps {
  nativeLanguage: string
  targetLanguage: string
  onDeckCreated: () => void
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function CreateDeckDialog({
  nativeLanguage,
  targetLanguage,
  onDeckCreated,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: CreateDeckDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  // Use either controlled or internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = setControlledOpen || setInternalOpen

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      return
    }

    createDeck(name.trim(), description.trim(), nativeLanguage, targetLanguage)
    onDeckCreated()

    // Reset form
    setName("")
    setDescription("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Create Deck
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Deck</DialogTitle>
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
            <Button type="submit">Create Deck</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
