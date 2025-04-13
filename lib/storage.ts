import type { Flashcard } from "@/types/flashcard"

const STORAGE_KEY = "languageLang_flashcards"

export function saveFlashcards(flashcards: Flashcard[]): void {
  if (typeof window === "undefined") return

  try {
    // Get existing flashcards
    const existingFlashcards = getSavedFlashcards()

    // Combine with new flashcards (avoiding duplicates by ID)
    const allIds = new Set(existingFlashcards.map((card) => card.id))
    const newFlashcards = [...existingFlashcards]

    for (const card of flashcards) {
      if (!allIds.has(card.id)) {
        newFlashcards.push(card)
        allIds.add(card.id)
      }
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newFlashcards))
  } catch (error) {
    console.error("Error saving flashcards:", error)
  }
}

export function getSavedFlashcards(): Flashcard[] {
  if (typeof window === "undefined") return []

  try {
    const savedData = localStorage.getItem(STORAGE_KEY)
    if (!savedData) return []

    return JSON.parse(savedData) as Flashcard[]
  } catch (error) {
    console.error("Error retrieving flashcards:", error)
    return []
  }
}

export function clearFlashcards(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error("Error clearing flashcards:", error)
  }
}
