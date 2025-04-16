import type { Flashcard, RepetitionInterval, RepetitionConfig } from "@/types/flashcard"
import { updateFlashcard, getRepetitionConfig } from "./storage"

// Calculate next review time based on repetition level and interval
export function calculateNextReview(
  flashcard: Flashcard,
  interval: RepetitionInterval,
  config: RepetitionConfig,
): Flashcard {
  const now = Date.now()
  let nextReview: number
  let repetitionLevel = flashcard.repetitionLevel || 0

  switch (interval) {
    case "again":
      // Convert minutes to milliseconds
      nextReview = now + config.again * 60 * 1000
      repetitionLevel = Math.max(0, repetitionLevel - 1)
      break
    case "hard":
      // Convert hours to milliseconds
      nextReview = now + config.hard * 60 * 60 * 1000
      // Keep the same repetition level
      break
    case "good":
      // Convert days to milliseconds
      nextReview = now + config.good * 24 * 60 * 60 * 1000
      repetitionLevel = repetitionLevel + 1
      break
    case "easy":
      // Convert days to milliseconds
      nextReview = now + config.easy * 24 * 60 * 60 * 1000
      repetitionLevel = repetitionLevel + 2
      break
  }

  return {
    ...flashcard,
    lastReviewed: now,
    nextReview,
    repetitionLevel,
  }
}

// Update flashcard with new review data
export function updateFlashcardReview(
  flashcard: Flashcard,
  interval: RepetitionInterval,
  nativeLanguage: string,
  targetLanguage: string,
): void {
  if (typeof window === "undefined") return

  try {
    const config = getRepetitionConfig()
    const updatedCard = calculateNextReview(flashcard, interval, config)
    updateFlashcard(updatedCard, nativeLanguage, targetLanguage)
  } catch (error) {
    console.error("Error updating flashcard review:", error)
  }
}

// Format time until next review
export function formatTimeUntilReview(nextReview: number): string {
  if (!nextReview) return "Not reviewed yet"

  const now = Date.now()
  const diff = nextReview - now

  if (diff <= 0) return "Due now"

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days > 0) return `${days} day${days > 1 ? "s" : ""}`
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`
  return `${minutes} minute${minutes > 1 ? "s" : ""}`
}
