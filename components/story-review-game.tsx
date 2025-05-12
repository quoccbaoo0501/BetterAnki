"use client"

import React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingAnimation } from "@/components/loading-animation"
import { generateStoryWithBlanks } from "@/lib/ai"
import { updateFlashcardReview } from "@/lib/spaced-repetition"
import { AlertTriangle, RefreshCw, Volume2, ArrowRight } from "lucide-react"
import { speakText, isSpeechSynthesisSupported } from "@/lib/audio"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import type { Flashcard } from "@/types/flashcard"

interface StoryReviewGameProps {
  flashcards: Flashcard[]
  nativeLanguage: string
  targetLanguage: string
  onComplete: () => void
  apiKey?: string
}

export default function StoryReviewGame({
  flashcards,
  nativeLanguage,
  targetLanguage,
  onComplete,
  apiKey,
}: StoryReviewGameProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  // Story data
  const [originalStory, setOriginalStory] = useState("")
  const [blankedStory, setBlankedStory] = useState("")
  const [correctWordOrder, setCorrectWordOrder] = useState<string[]>([])

  // Game state
  const [availableWords, setAvailableWords] = useState<string[]>([])
  const [userPlacedWords, setUserPlacedWords] = useState<(string | null)[]>([])
  const [currentBlankIndex, setCurrentBlankIndex] = useState(0)
  const [isGameComplete, setIsGameComplete] = useState(false)
  const [isCheckingAnswers, setIsCheckingAnswers] = useState(false)
  const [results, setResults] = useState<boolean[]>([])
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const speechSupported = isSpeechSynthesisSupported()
  const storyContainerRef = useRef<HTMLDivElement>(null)
  const isDefinitionMode = nativeLanguage === targetLanguage

  // Generate the story when component mounts
  useEffect(() => {
    generateStory()
  }, [flashcards, isRetrying])

  // Function to generate the story
  const generateStory = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Limit to 10 flashcards to avoid overwhelming the API
      const limitedFlashcards = flashcards.slice(0, 10)

      // Generate story with blanks using the flashcards directly
      const result = await generateStoryWithBlanks(limitedFlashcards, nativeLanguage, targetLanguage, apiKey)

      if (result.error) {
        setError(result.error)
        return
      }

      setOriginalStory(result.story)
      setBlankedStory(result.blankedStory)
      setCorrectWordOrder(result.wordOrder)

      // Shuffle the words for the game
      const shuffledWords = [...result.wordOrder].sort(() => Math.random() - 0.5)
      setAvailableWords(shuffledWords)

      // Initialize user placed words array with nulls
      setUserPlacedWords(Array(result.wordOrder.length).fill(null))

      setCurrentBlankIndex(0)
      setIsGameComplete(false)
      setIsCheckingAnswers(false)
      setResults([])
    } catch (error) {
      console.error("Error in story generation:", error)
      setError("Failed to generate a story. Please try again with fewer cards.")
    } finally {
      setIsLoading(false)
      setIsRetrying(false)
    }
  }

  // Handle word selection
  const handleWordSelect = (word: string) => {
    if (isCheckingAnswers) return

    // Create a copy of the current state
    const newAvailableWords = [...availableWords]
    const newUserPlacedWords = [...userPlacedWords]

    // Remove the word from available words
    const wordIndex = newAvailableWords.indexOf(word)
    if (wordIndex !== -1) {
      newAvailableWords.splice(wordIndex, 1)
    }

    // Place the word in the current blank
    newUserPlacedWords[currentBlankIndex] = word

    // Update state
    setAvailableWords(newAvailableWords)
    setUserPlacedWords(newUserPlacedWords)

    // Move to the next blank if available
    const nextBlankIndex = findNextEmptyBlank(newUserPlacedWords, currentBlankIndex)
    setCurrentBlankIndex(nextBlankIndex)

    // Check if all blanks are filled
    if (!newUserPlacedWords.includes(null)) {
      setIsGameComplete(true)
    }
  }

  // Handle clicking on a placed word to remove it
  const handleRemoveWord = (index: number) => {
    if (isCheckingAnswers) return

    const word = userPlacedWords[index]
    if (word === null) return

    // Create a copy of the current state
    const newAvailableWords = [...availableWords, word]
    const newUserPlacedWords = [...userPlacedWords]

    // Remove the word from the blank
    newUserPlacedWords[index] = null

    // Update state
    setAvailableWords(newAvailableWords)
    setUserPlacedWords(newUserPlacedWords)

    // Set the current blank to this position
    setCurrentBlankIndex(index)

    // Game is no longer complete
    setIsGameComplete(false)
  }

  // Find the next empty blank
  const findNextEmptyBlank = (placedWords: (string | null)[], currentIndex: number): number => {
    // First try to find the next empty blank after the current index
    for (let i = currentIndex + 1; i < placedWords.length; i++) {
      if (placedWords[i] === null) {
        return i
      }
    }

    // If not found, try from the beginning
    for (let i = 0; i < currentIndex; i++) {
      if (placedWords[i] === null) {
        return i
      }
    }

    // If all blanks are filled, return the current index
    return currentIndex
  }

  // Check answers
  const checkAnswers = () => {
    setIsCheckingAnswers(true)

    // Compare user's answers with correct order
    const newResults = userPlacedWords.map((word, index) => {
      return word === correctWordOrder[index]
    })

    setResults(newResults)

    // Calculate score
    const correctCount = newResults.filter((result) => result).length
    setScore({
      correct: correctCount,
      total: correctWordOrder.length,
    })

    // Update flashcard review status based on results
    newResults.forEach((isCorrect, index) => {
      // Find the flashcard that matches this word
      // In definition mode, we need to match by nativeWord, otherwise by targetWord
      const flashcard = flashcards.find((card) =>
        isDefinitionMode ? card.nativeWord === correctWordOrder[index] : card.targetWord === correctWordOrder[index],
      )

      if (flashcard) {
        // Update the flashcard with appropriate interval
        // If correct, mark as "good", if wrong, mark as "again"
        updateFlashcardReview(flashcard, isCorrect ? "good" : "again", nativeLanguage, targetLanguage)
      }
    })

    // If all answers are correct, show confetti
    if (newResults.every((result) => result)) {
      triggerConfetti()
    }
  }

  // Trigger confetti animation
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })
  }

  // Render the blanked story with user's answers
  const renderStory = () => {
    if (!blankedStory) return null

    // Split the story by [BLANK] placeholders
    const parts = blankedStory.split("[BLANK]")

    return (
      <div className="text-lg leading-relaxed">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {index < userPlacedWords.length && (
              <span
                className={`inline-block min-w-16 px-1 mx-1 text-center border-b-2 cursor-pointer ${
                  userPlacedWords[index] ? "border-emerald-500" : "border-slate-300"
                } ${currentBlankIndex === index ? "bg-slate-100 dark:bg-slate-800" : ""} ${
                  isCheckingAnswers
                    ? results[index]
                      ? "bg-green-100 dark:bg-green-900/30 border-green-500"
                      : "bg-red-100 dark:bg-red-900/30 border-red-500"
                    : ""
                }`}
                onClick={() => userPlacedWords[index] && handleRemoveWord(index)}
              >
                {userPlacedWords[index] || ""}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    )
  }

  // Handle retry
  const handleRetry = () => {
    setIsRetrying(true)
  }

  // Handle speaking the story
  const handleSpeakStory = () => {
    if (speechSupported && originalStory) {
      speakText(originalStory, targetLanguage)
    }
  }

  // If loading, show loading animation
  if (isLoading) {
    return <LoadingAnimation />
  }

  // If error, show error message
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
        <div className="mt-4 flex space-x-2">
          <Button onClick={handleRetry} className="flex items-center">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" onClick={onComplete}>
            Back to Learn
          </Button>
        </div>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Story Fill-in-the-Blank</h2>
        {speechSupported && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSpeakStory}
            disabled={isCheckingAnswers && !isGameComplete}
          >
            <Volume2 className="h-4 w-4 mr-2" />
            Speak Story
          </Button>
        )}
      </div>

      <div className="space-y-4 mb-6">
        <h3 className="text-md font-medium">
          {isCheckingAnswers ? `Your Score: ${score.correct}/${score.total}` : "Drag words to fill in the blanks:"}
        </h3>

        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {availableWords.map((word, index) => (
              <motion.div
                key={`${word}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 dark:text-emerald-400"
                  onClick={() => handleWordSelect(word)}
                  disabled={isCheckingAnswers}
                >
                  {word}
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div ref={storyContainerRef} className="prose dark:prose-invert max-w-none">
            {renderStory()}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex justify-between pt-4">
          {isGameComplete ? (
            isCheckingAnswers ? (
              <div className="w-full">
                <div className="flex justify-between">
                  <Button variant="outline" onClick={onComplete}>
                    Back to Learn
                  </Button>

                  <Button onClick={handleRetry}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Another Story
                  </Button>
                </div>

                {!results.every((result) => result) && (
                  <div className="mt-4 p-4 border rounded-md bg-amber-50 dark:bg-amber-900/20">
                    <h4 className="font-medium mb-2">Correct Answers:</h4>
                    <ul className="space-y-1">
                      {correctWordOrder.map((word, index) => (
                        <li
                          key={index}
                          className={
                            results[index] ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                          }
                        >
                          Blank #{index + 1}: {word} {results[index] ? "✓" : `✗ (you put: ${userPlacedWords[index]})`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <Button className="ml-auto" onClick={checkAnswers}>
                Check Answers
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )
          ) : (
            <Button variant="outline" className="ml-auto" onClick={onComplete}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
