import type { Flashcard } from "@/types/flashcard"

// Define the structure for storing flashcards by language
interface LanguageFlashcards {
  [targetLanguage: string]: {
    [nativeLanguage: string]: Flashcard[]
  }
}

const STORAGE_KEY = "languageLang_flashcards_v2" // Use a new key to avoid conflicts with old format

// Helper function to safely get the storage data
function getStorageData(): LanguageFlashcards {
  if (typeof window === "undefined") return {}
  try {
    const savedData = localStorage.getItem(STORAGE_KEY)
    return savedData ? JSON.parse(savedData) : {}
  } catch (error) {
    console.error("Error retrieving flashcard data:", error)
    return {}
  }
}

// Helper function to safely save the storage data
function saveStorageData(data: LanguageFlashcards): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error("Error saving flashcard data:", error)
  }
}

/**
 * Saves a single flashcard to the appropriate language category.
 * If the language category or card ID already exists, it won't duplicate.
 */
export function saveFlashcard(card: Flashcard): void {
  if (!card.targetLanguage || !card.nativeLanguage) {
      console.error("Flashcard is missing target or native language:", card);
      return; // Don't save cards without language info
  }

  const data = getStorageData()

  // Ensure the target language object exists
  if (!data[card.targetLanguage]) {
    data[card.targetLanguage] = {}
  }

  // Ensure the native language array exists
  if (!data[card.targetLanguage][card.nativeLanguage]) {
    data[card.targetLanguage][card.nativeLanguage] = []
  }

  // Check if the card ID already exists in this specific list
  const existingIds = new Set(data[card.targetLanguage][card.nativeLanguage].map(c => c.id));
  if (!existingIds.has(card.id)) {
    data[card.targetLanguage][card.nativeLanguage].push(card)
    saveStorageData(data)
  } else {
      console.warn(`Flashcard with ID ${card.id} already exists for ${card.targetLanguage}/${card.nativeLanguage}. Skipping save.`);
  }
}

/**
 * Retrieves flashcards for a specific target and native language pair.
 */
export function getFlashcardsForLanguagePair(targetLanguage: string, nativeLanguage: string): Flashcard[] {
  const data = getStorageData()
  return data[targetLanguage]?.[nativeLanguage] || []
}

/**
 * Retrieves all target languages for which flashcards are stored.
 */
export function getTargetLanguages(): string[] {
  const data = getStorageData()
  return Object.keys(data)
}

/**
 * Retrieves all native languages associated with a specific target language.
 */
export function getNativeLanguagesForTarget(targetLanguage: string): string[] {
  const data = getStorageData()
  return data[targetLanguage] ? Object.keys(data[targetLanguage]) : []
}


/**
 * Deletes specific flashcards identified by their IDs from a given language pair.
 */
export function deleteFlashcards(targetLanguage: string, nativeLanguage: string, idsToDelete: string[]): void {
  if (typeof window === "undefined") return

  try {
    const data = getStorageData()
    if (data[targetLanguage]?.[nativeLanguage]) {
      data[targetLanguage][nativeLanguage] = data[targetLanguage][nativeLanguage].filter(
        (card) => !idsToDelete.includes(card.id)
      )

      // Optional: Clean up empty arrays/objects if desired
      // if (data[targetLanguage][nativeLanguage].length === 0) {
      //   delete data[targetLanguage][nativeLanguage];
      //   if (Object.keys(data[targetLanguage]).length === 0) {
      //     delete data[targetLanguage];
      //   }
      // }

      saveStorageData(data)
    }
  } catch (error) {
    console.error("Error deleting flashcards:", error)
  }
}

/**
 * Clears all flashcards from storage.
 */
export function clearFlashcards(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error("Error clearing flashcards:", error)
  }
}

// --- Old functions (to be removed or migrated) ---
/*
export function saveFlashcards(flashcards: Flashcard[]): void {
  // ... old implementation ...
}

export function getSavedFlashcards(): Flashcard[] {
  // ... old implementation ...
}

export function deleteFlashcards(idsToDelete: string[]): void {
 // ... old implementation ...
}
*/
