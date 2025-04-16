import type { Flashcard } from "@/types/flashcard"
import { getSavedFlashcards, getSavedApiKey } from "./storage"

export async function generateFlashcards(
  nativeLanguage: string,
  targetLanguage: string,
  prompt: string,
  apiKey?: string,
): Promise<Flashcard[]> {
  try {
    // Get the effective API key (passed in or from storage)
    const effectiveApiKey = apiKey || getSavedApiKey()

    // Check if API key is provided
    if (!effectiveApiKey) {
      throw new Error("API key is required for Gemini")
    }

    // Get existing flashcards to avoid duplicates
    const existingFlashcards = getSavedFlashcards(nativeLanguage, targetLanguage)
    const existingWords = existingFlashcards.map((card) => card.targetWord)

    // Get the count of existing flashcards to help with ID generation
    const existingCardCount = existingFlashcards.length

    // Gemini API endpoint
    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-exp-03-25:generateContent"

    // Check if this is a definition request (same language for native and target)
    const isDefinitionMode = nativeLanguage === targetLanguage

    // Prepare the prompt for Gemini with instructions to avoid existing words
    let systemPrompt = `You are a language learning assistant that creates flashcards.`

    if (isDefinitionMode) {
      systemPrompt += `
      Generate vocabulary flashcards in ${nativeLanguage} based on the user's prompt.
      For each word, provide:
      1. The word itself
      2. Its definition
      3. An example sentence using the word
      4. A second example sentence using the word in a different context if possible`
    } else {
      systemPrompt += `
      Generate flashcards from ${nativeLanguage} to ${targetLanguage} based on the user's prompt.`
    }

    // Add existing words to avoid if there are any
    if (existingWords.length > 0) {
      systemPrompt += `\nIMPORTANT: DO NOT include these words that the user already knows: ${existingWords.join(", ")}`
    }

    // Add information about existing card count to avoid ID conflicts
    systemPrompt += `\nIMPORTANT: There are currently ${existingCardCount} flashcards in the system. To avoid ID conflicts, use unique IDs starting from ${existingCardCount + 1} (e.g., "id-${existingCardCount + 1}", "id-${existingCardCount + 2}", etc.).`

    systemPrompt += `\nReturn the result as a valid JSON array of flashcard objects with the following structure:`

    if (isDefinitionMode) {
      systemPrompt += `
      [
        {
          "id": "id-${existingCardCount + 1}",
          "nativeWord": "word in ${nativeLanguage}",
          "targetWord": "definition of the word",
          "nativeExample": "example sentence using the word",
          "targetExample": "second example sentence using the word in a different context"
        }
      ]`
    } else {
      systemPrompt += `
      [
        {
          "id": "id-${existingCardCount + 1}",
          "nativeWord": "word in ${nativeLanguage}",
          "targetWord": "word in ${targetLanguage}",
          "nativeExample": "example sentence in ${nativeLanguage}",
          "targetExample": "example sentence in ${targetLanguage}"
        }
      ]`
    }

    // Make request to Gemini API
    const response = await fetch(`${endpoint}?key=${effectiveApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: systemPrompt }, { text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()

    // Extract the text from Gemini's response
    const generatedText = data.candidates[0].content.parts[0].text

    // Find the JSON array in the response
    const jsonMatch = generatedText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from Gemini response")
    }

    // Parse the JSON array
    const flashcards: Flashcard[] = JSON.parse(jsonMatch[0])

    // Ensure all flashcards have unique IDs by adding a UUID if needed
    return flashcards.map((card, index) => {
      if (!card.id || existingFlashcards.some((existingCard) => existingCard.id === card.id)) {
        // If ID is missing or duplicated, generate a new unique ID
        const { v4: uuidv4 } = require("uuid")
        return { ...card, id: uuidv4() }
      }
      return card
    })
  } catch (error) {
    console.error("Error generating flashcards:", error)
    throw error
  }
}
