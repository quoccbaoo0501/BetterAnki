import type { Flashcard, RepetitionConfig } from "@/types/flashcard"
import type { Deck } from "@/types/deck"
import { v4 as uuidv4 } from "uuid"

// Base storage key
const BASE_STORAGE_KEY = "languageLang"

// Storage keys for different data types
const PROMPT_HISTORY_KEY = `${BASE_STORAGE_KEY}_promptHistory`
const LANGUAGE_PAIRS_HISTORY_KEY = `${BASE_STORAGE_KEY}_languagePairsHistory`
const REPETITION_CONFIG_KEY = `${BASE_STORAGE_KEY}_repetitionConfig`
const DECKS_KEY = `${BASE_STORAGE_KEY}_decks`
const API_KEY_STORAGE_KEY = `${BASE_STORAGE_KEY}_apiKey`

// Get storage key for a specific language pair
function getStorageKey(nativeLanguage: string, targetLanguage: string): string {
  return `${BASE_STORAGE_KEY}_${nativeLanguage}_${targetLanguage}`
}

// Get storage key for a specific deck
function getDeckStorageKey(nativeLanguage: string, targetLanguage: string, deckId: string): string {
  return `${BASE_STORAGE_KEY}_${nativeLanguage}_${targetLanguage}_deck_${deckId}`
}

// Remove the getOrCreateDefaultDeck function and replace it with a function that only gets decks
export function getDefaultDeck(nativeLanguage: string, targetLanguage: string): Deck | null {
  if (typeof window === "undefined") return null

  try {
    const decks = getDecks(nativeLanguage, targetLanguage)
    return decks.length > 0 ? decks[0] : null
  } catch (error) {
    console.error("Error getting default deck:", error)
    return null
  }
}

// Get or create default deck
export function getDecks(nativeLanguage: string, targetLanguage: string): Deck[] {
  if (typeof window === "undefined") return []

  try {
    const storageKey = `${DECKS_KEY}_${nativeLanguage}_${targetLanguage}`
    const savedData = localStorage.getItem(storageKey)
    if (!savedData) return []

    return JSON.parse(savedData) as Deck[]
  } catch (error) {
    console.error("Error retrieving decks:", error)
    return []
  }
}

// Save decks for a language pair
export function saveDecks(decks: Deck[], nativeLanguage: string, targetLanguage: string): void {
  if (typeof window === "undefined") return

  try {
    const storageKey = `${DECKS_KEY}_${nativeLanguage}_${targetLanguage}`
    localStorage.setItem(storageKey, JSON.stringify(decks))
  } catch (error) {
    console.error("Error saving decks:", error)
  }
}

// Create a new deck
export function createDeck(name: string, description: string, nativeLanguage: string, targetLanguage: string): Deck {
  if (typeof window === "undefined") {
    return {
      id: "new-deck",
      name,
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  }

  try {
    const decks = getDecks(nativeLanguage, targetLanguage)

    const newDeck: Deck = {
      id: uuidv4(),
      name,
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    saveDecks([...decks, newDeck], nativeLanguage, targetLanguage)

    return newDeck
  } catch (error) {
    console.error("Error creating deck:", error)
    return {
      id: "new-deck",
      name,
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  }
}

// Update a deck
export function updateDeck(deck: Deck, nativeLanguage: string, targetLanguage: string): void {
  if (typeof window === "undefined") return

  try {
    const decks = getDecks(nativeLanguage, targetLanguage)

    const updatedDecks = decks.map((d) => (d.id === deck.id ? { ...deck, updatedAt: Date.now() } : d))

    saveDecks(updatedDecks, nativeLanguage, targetLanguage)
  } catch (error) {
    console.error("Error updating deck:", error)
  }
}

// Delete a deck and its flashcards
export function deleteDeck(deckId: string, nativeLanguage: string, targetLanguage: string): void {
  if (typeof window === "undefined") return

  try {
    // Delete the deck
    const decks = getDecks(nativeLanguage, targetLanguage)
    const updatedDecks = decks.filter((d) => d.id !== deckId)
    saveDecks(updatedDecks, nativeLanguage, targetLanguage)

    // Delete the deck's flashcards
    const deckStorageKey = getDeckStorageKey(nativeLanguage, targetLanguage, deckId)
    localStorage.removeItem(deckStorageKey)

    // Also remove from the main storage if needed
    const allFlashcards = getSavedFlashcards(nativeLanguage, targetLanguage)
    const updatedFlashcards = allFlashcards.filter((card) => card.deckId !== deckId)

    const storageKey = getStorageKey(nativeLanguage, targetLanguage)
    localStorage.setItem(storageKey, JSON.stringify(updatedFlashcards))
  } catch (error) {
    console.error("Error deleting deck:", error)
  }
}

// Update the saveFlashcards function to not automatically create a default deck
export function saveFlashcards(
  flashcards: Flashcard[],
  nativeLanguage: string,
  targetLanguage: string,
  deckId?: string,
): void {
  if (typeof window === "undefined") return

  try {
    // Ensure a deckId is provided
    if (!deckId) {
      console.error("No deck ID provided for saving flashcards")
      return
    }

    // Ensure all flashcards have the correct deckId
    const cardsWithDeckId = flashcards.map((card) => ({
      ...card,
      deckId,
    }))

    // Get existing flashcards for this language pair
    const existingFlashcards = getSavedFlashcards(nativeLanguage, targetLanguage)

    // Combine with new flashcards (avoiding duplicates by ID)
    const allIds = new Set(existingFlashcards.map((card) => card.id))
    const newFlashcards = [...existingFlashcards]

    for (const card of cardsWithDeckId) {
      if (!allIds.has(card.id)) {
        newFlashcards.push(card)
        allIds.add(card.id)
      }
    }

    // Save to localStorage with language-specific key
    const storageKey = getStorageKey(nativeLanguage, targetLanguage)
    localStorage.setItem(storageKey, JSON.stringify(newFlashcards))

    // Also save this language pair to history
    saveLanguagePairToHistory(nativeLanguage, targetLanguage)
  } catch (error) {
    console.error("Error saving flashcards:", error)
  }
}

// Get saved flashcards for a specific language pair
export function getSavedFlashcards(nativeLanguage: string, targetLanguage: string, deckId?: string): Flashcard[] {
  if (typeof window === "undefined") return []

  try {
    const storageKey = getStorageKey(nativeLanguage, targetLanguage)
    const savedData = localStorage.getItem(storageKey)
    if (!savedData) return []

    const allFlashcards = JSON.parse(savedData) as Flashcard[]

    // If deckId is provided, filter by deck
    if (deckId) {
      return allFlashcards.filter((card) => card.deckId === deckId)
    }

    return allFlashcards
  } catch (error) {
    console.error("Error retrieving flashcards:", error)
    return []
  }
}

// Move flashcards to a different deck
export function moveFlashcardsToDeck(
  flashcardIds: string[],
  targetDeckId: string,
  nativeLanguage: string,
  targetLanguage: string,
): void {
  if (typeof window === "undefined") return

  try {
    // Get all flashcards
    const allFlashcards = getSavedFlashcards(nativeLanguage, targetLanguage)

    // Update the deckId for the specified flashcards
    const updatedFlashcards = allFlashcards.map((card) =>
      flashcardIds.includes(card.id) ? { ...card, deckId: targetDeckId } : card,
    )

    // Save the updated flashcards
    const storageKey = getStorageKey(nativeLanguage, targetLanguage)
    localStorage.setItem(storageKey, JSON.stringify(updatedFlashcards))
  } catch (error) {
    console.error("Error moving flashcards to deck:", error)
  }
}

// Update a specific flashcard
export function updateFlashcard(flashcard: Flashcard, nativeLanguage: string, targetLanguage: string): void {
  if (typeof window === "undefined") return

  try {
    // Get existing flashcards
    const existingFlashcards = getSavedFlashcards(nativeLanguage, targetLanguage)

    // Find and update the specific flashcard
    const updatedFlashcards = existingFlashcards.map((card) => (card.id === flashcard.id ? flashcard : card))

    // Save the updated list
    const storageKey = getStorageKey(nativeLanguage, targetLanguage)
    localStorage.setItem(storageKey, JSON.stringify(updatedFlashcards))
  } catch (error) {
    console.error("Error updating flashcard:", error)
  }
}

// Add a new flashcard
export function addFlashcard(flashcard: Flashcard, nativeLanguage: string, targetLanguage: string): void {
  if (typeof window === "undefined") return

  try {
    // Get existing flashcards
    const existingFlashcards = getSavedFlashcards(nativeLanguage, targetLanguage)

    // Add the new flashcard
    const updatedFlashcards = [...existingFlashcards, flashcard]

    // Save the updated list
    const storageKey = getStorageKey(nativeLanguage, targetLanguage)
    localStorage.setItem(storageKey, JSON.stringify(updatedFlashcards))

    // Also save this language pair to history
    saveLanguagePairToHistory(nativeLanguage, targetLanguage)
  } catch (error) {
    console.error("Error adding flashcard:", error)
  }
}

// Delete specific flashcards for a language pair
export function deleteFlashcards(flashcardIds: string[], nativeLanguage: string, targetLanguage: string): void {
  if (typeof window === "undefined") return

  try {
    // Get existing flashcards
    const existingFlashcards = getSavedFlashcards(nativeLanguage, targetLanguage)

    // Filter out the ones to delete
    const updatedFlashcards = existingFlashcards.filter((card) => !flashcardIds.includes(card.id))

    // Save the updated list
    const storageKey = getStorageKey(nativeLanguage, targetLanguage)
    localStorage.setItem(storageKey, JSON.stringify(updatedFlashcards))
  } catch (error) {
    console.error("Error deleting flashcards:", error)
  }
}

// Get all available language pairs
export function getAvailableLanguagePairs(): { native: string; target: string }[] {
  if (typeof window === "undefined") return []

  try {
    const pairs: { native: string; target: string }[] = []
    const prefix = BASE_STORAGE_KEY + "_"

    // Iterate through localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (
        key &&
        key.startsWith(prefix) &&
        !key.includes("History") &&
        !key.includes("deck_") &&
        !key.includes("_decks_")
      ) {
        // Extract language pair from key
        const languages = key.substring(prefix.length).split("_")
        if (languages.length === 2) {
          pairs.push({ native: languages[0], target: languages[1] })
        }
      }
    }

    return pairs
  } catch (error) {
    console.error("Error getting language pairs:", error)
    return []
  }
}

// Clear all flashcards for a specific language pair
export function clearLanguagePair(nativeLanguage: string, targetLanguage: string): void {
  if (typeof window === "undefined") return

  try {
    const storageKey = getStorageKey(nativeLanguage, targetLanguage)
    localStorage.removeItem(storageKey)

    // Also clear all decks for this language pair
    const decksKey = `${DECKS_KEY}_${nativeLanguage}_${targetLanguage}`
    localStorage.removeItem(decksKey)

    // Clear all deck-specific storage
    const decks = getDecks(nativeLanguage, targetLanguage)
    decks.forEach((deck) => {
      const deckStorageKey = getDeckStorageKey(nativeLanguage, targetLanguage, deck.id)
      localStorage.removeItem(deckStorageKey)
    })
  } catch (error) {
    console.error("Error clearing flashcards:", error)
  }
}

// Save prompt to history
export function savePromptToHistory(prompt: string, nativeLanguage: string, targetLanguage: string): void {
  if (typeof window === "undefined" || !prompt.trim()) return

  try {
    const history = getPromptHistory()

    // Create a new entry with prompt and language pair
    const newEntry = {
      prompt,
      nativeLanguage,
      targetLanguage,
      timestamp: Date.now(),
    }

    // Add to beginning of array (most recent first)
    const updatedHistory = [
      newEntry,
      ...history.filter(
        (entry) =>
          !(
            entry.prompt === prompt &&
            entry.nativeLanguage === nativeLanguage &&
            entry.targetLanguage === targetLanguage
          ),
      ),
    ].slice(0, 20) // Keep only the 20 most recent entries

    localStorage.setItem(PROMPT_HISTORY_KEY, JSON.stringify(updatedHistory))
  } catch (error) {
    console.error("Error saving prompt to history:", error)
  }
}

// Get prompt history
export function getPromptHistory(): Array<{
  prompt: string
  nativeLanguage: string
  targetLanguage: string
  timestamp: number
}> {
  if (typeof window === "undefined") return []

  try {
    const history = localStorage.getItem(PROMPT_HISTORY_KEY)
    if (!history) return []

    return JSON.parse(history)
  } catch (error) {
    console.error("Error retrieving prompt history:", error)
    return []
  }
}

// Save language pair to history
export function saveLanguagePairToHistory(nativeLanguage: string, targetLanguage: string): void {
  if (typeof window === "undefined") return

  try {
    const history = getLanguagePairHistory()

    // Create a new entry
    const newEntry = {
      nativeLanguage,
      targetLanguage,
      timestamp: Date.now(),
    }

    // Add to beginning of array (most recent first) and remove duplicates
    const updatedHistory = [
      newEntry,
      ...history.filter(
        (entry) => !(entry.nativeLanguage === nativeLanguage && entry.targetLanguage === targetLanguage),
      ),
    ].slice(0, 10) // Keep only the 10 most recent entries

    localStorage.setItem(LANGUAGE_PAIRS_HISTORY_KEY, JSON.stringify(updatedHistory))
  } catch (error) {
    console.error("Error saving language pair to history:", error)
  }
}

// Get language pair history
export function getLanguagePairHistory(): Array<{
  nativeLanguage: string
  targetLanguage: string
  timestamp: number
}> {
  if (typeof window === "undefined") return []

  try {
    const history = localStorage.getItem(LANGUAGE_PAIRS_HISTORY_KEY)
    if (!history) return []

    return JSON.parse(history)
  } catch (error) {
    console.error("Error retrieving language pair history:", error)
    return []
  }
}

// Get repetition config
export function getRepetitionConfig(): RepetitionConfig {
  if (typeof window === "undefined")
    return {
      again: 10, // 10 minutes
      hard: 1, // 1 hour
      good: 1, // 1 day
      easy: 4, // 4 days
    }

  try {
    const config = localStorage.getItem(REPETITION_CONFIG_KEY)
    if (!config)
      return {
        again: 10, // 10 minutes
        hard: 1, // 1 hour
        good: 1, // 1 day
        easy: 4, // 4 days
      }

    return JSON.parse(config) as RepetitionConfig
  } catch (error) {
    console.error("Error retrieving repetition config:", error)
    return {
      again: 10, // 10 minutes
      hard: 1, // 1 hour
      good: 1, // 1 day
      easy: 4, // 4 days
    }
  }
}

// Save repetition config
export function saveRepetitionConfig(config: RepetitionConfig): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(REPETITION_CONFIG_KEY, JSON.stringify(config))
  } catch (error) {
    console.error("Error saving repetition config:", error)
  }
}

// Get due flashcards for review
export function getDueFlashcards(nativeLanguage: string, targetLanguage: string, deckId?: string): Flashcard[] {
  if (typeof window === "undefined") return []

  try {
    // Get flashcards, optionally filtered by deck
    const allFlashcards = getSavedFlashcards(nativeLanguage, targetLanguage, deckId)
    const now = Date.now()

    // Filter cards that are due for review or have never been reviewed
    return allFlashcards.filter(
      (card) =>
        !card.nextReview || // Never reviewed
        card.nextReview <= now, // Due for review
    )
  } catch (error) {
    console.error("Error getting due flashcards:", error)
    return []
  }
}

// Get flashcard count by deck
export function getFlashcardCountByDeck(nativeLanguage: string, targetLanguage: string): Record<string, number> {
  if (typeof window === "undefined") return {}

  try {
    const allFlashcards = getSavedFlashcards(nativeLanguage, targetLanguage)
    const counts: Record<string, number> = {}

    allFlashcards.forEach((card) => {
      const deckId = card.deckId || "unassigned"
      counts[deckId] = (counts[deckId] || 0) + 1
    })

    return counts
  } catch (error) {
    console.error("Error getting flashcard counts by deck:", error)
    return {}
  }
}

// Function to get or create default deck
export function getOrCreateDefaultDeck(nativeLanguage: string, targetLanguage: string): Deck {
  if (typeof window === "undefined") {
    return {
      id: "default-deck",
      name: "Default",
      description: "Default deck for flashcards",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  }

  try {
    let decks = getDecks(nativeLanguage, targetLanguage)

    // If no decks exist, create a default deck
    if (decks.length === 0) {
      const newDeck: Deck = {
        id: uuidv4(),
        name: "Default",
        description: "Default deck for flashcards",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      saveDecks([newDeck], nativeLanguage, targetLanguage)
      decks = [newDeck]
    }

    return decks[0]
  } catch (error) {
    console.error("Error getting or creating default deck:", error)
    return {
      id: "default-deck",
      name: "Default",
      description: "Default deck for flashcards",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  }
}

// Save API key
export function saveApiKey(apiKey: string): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey)
  } catch (error) {
    console.error("Error saving API key:", error)
  }
}

// Get saved API key
export function getSavedApiKey(): string {
  if (typeof window === "undefined") return ""

  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || ""
  } catch (error) {
    console.error("Error retrieving API key:", error)
    return ""
  }
}

// Clear saved API key
export function clearApiKey(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY)
  } catch (error) {
    console.error("Error clearing API key:", error)
  }
}
