export interface Flashcard {
  id: string
  nativeWord: string
  targetWord: string
  nativeExample?: string
  targetExample?: string
  // New fields for spaced repetition
  lastReviewed?: number
  nextReview?: number
  repetitionLevel?: number
  // Audio cache
  audioUrl?: string
  // Deck association
  deckId: string
}

export type RepetitionInterval = "again" | "hard" | "good" | "easy"

export interface RepetitionConfig {
  again: number // Minutes
  hard: number // Hours
  good: number // Days
  easy: number // Days
}

export const DEFAULT_REPETITION_CONFIG: RepetitionConfig = {
  again: 10, // 10 minutes
  hard: 1, // 1 hour
  good: 1, // 1 day
  easy: 4, // 4 days
}
