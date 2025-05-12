"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Edit2, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Deck } from "@/types/deck"
import { deleteDeck } from "@/lib/storage"
import EditDeckDialog from "./edit-deck-dialog"
import CSVExportDialog from "./csv-export-dialog"
import CSVImportDialog from "./csv-import-dialog"

interface DeckManagementProps {
  decks: Deck[]
  nativeLanguage: string
  targetLanguage: string
  onDeckUpdated: () => void
  cardCounts: Record<string, number>
}

export default function DeckManagement({
  decks,
  nativeLanguage,
  targetLanguage,
  onDeckUpdated,
  cardCounts,
}: DeckManagementProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deckToEdit, setDeckToEdit] = useState<Deck | null>(null)

  const handleDeleteClick = (deck: Deck) => {
    setDeckToDelete(deck)
    setDeleteDialogOpen(true)
  }

  const handleEditClick = (deck: Deck) => {
    setDeckToEdit(deck)
    setEditDialogOpen(true)
  }

  const confirmDelete = () => {
    if (deckToDelete) {
      deleteDeck(deckToDelete.id, nativeLanguage, targetLanguage)
      onDeckUpdated()
    }
    setDeleteDialogOpen(false)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Manage Decks</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {decks.map((deck) => (
          <Card key={deck.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{deck.name}</CardTitle>
                  <CardDescription className="mt-1">{cardCounts[deck.id] || 0} cards</CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEditClick(deck)} className="h-8 w-8 p-0">
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(deck)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{deck.description || "No description"}</p>
              <p className="text-xs text-slate-400 mt-2">
                Last updated: {new Date(deck.updatedAt).toLocaleDateString()}
              </p>

              <div className="flex space-x-2 mt-4">
                <CSVExportDialog
                  nativeLanguage={nativeLanguage}
                  targetLanguage={targetLanguage}
                  deckId={deck.id}
                  deckName={deck.name}
                />

                <CSVImportDialog
                  nativeLanguage={nativeLanguage}
                  targetLanguage={targetLanguage}
                  deckId={deck.id}
                  onImportComplete={onDeckUpdated}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deck</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deckToDelete?.name}"? This will permanently remove the deck and all its
              flashcards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Deck Dialog */}
      <EditDeckDialog
        deck={deckToEdit}
        nativeLanguage={nativeLanguage}
        targetLanguage={targetLanguage}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onDeckUpdated={onDeckUpdated}
      />
    </div>
  )
}
