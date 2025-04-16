import type { Flashcard } from "@/types/flashcard"
import { getSavedFlashcards } from "./storage"

export async function generateFlashcards(
  nativeLanguage: string,
  targetLanguage: string,
  prompt: string,
  apiKey?: string,
): Promise<Flashcard[]> {
  try {
    // Check if API key is provided
    if (!apiKey) {
      throw new Error("API key is required for Gemini")
    }

    // Get existing flashcards to avoid duplicates
    const existingFlashcards = getSavedFlashcards(nativeLanguage, targetLanguage)
    const existingWords = existingFlashcards.map((card) => card.targetWord)

    // Gemini API endpoint
    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-exp-03-25:generateContent"

    // Prepare the prompt for Gemini with instructions to avoid existing words
    let systemPrompt = `You are a language learning assistant that creates flashcards.
    Generate flashcards from ${nativeLanguage} to ${targetLanguage} based on the user's prompt.`

    // Add existing words to avoid if there are any
    if (existingWords.length > 0) {
      systemPrompt += `\nIMPORTANT: DO NOT include these words that the user already knows: ${existingWords.join(", ")}`
    }

    systemPrompt += `\nReturn the result as a valid JSON array of flashcard objects with the following structure:
    [
      {
        "id": "unique-id-1",
        "nativeWord": "word in ${nativeLanguage}",
        "targetWord": "word in ${targetLanguage}",
        "nativeExample": "example sentence in ${nativeLanguage} ",
        "targetExample": "example sentence in ${targetLanguage} "
      }
    ]`

    // Make request to Gemini API
    const response = await fetch(`${endpoint}?key=${apiKey}`, {
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
    return flashcards
  } catch (error) {
    console.error("Error generating flashcards:", error)

    // Return mock data for demonstration purposes
    return getMockFlashcards(nativeLanguage, targetLanguage)
  }
}

// Mock data for demonstration purposes
function getMockFlashcards(nativeLanguage: string, targetLanguage: string): Flashcard[] {
  if (targetLanguage === "French") {
    return [
      {
        id: "1",
        nativeWord: "Hello",
        targetWord: "Bonjour",
        nativeExample: "Hello, how are you?",
        targetExample: "Bonjour, comment allez-vous?",
      },
      {
        id: "2",
        nativeWord: "Good morning",
        targetWord: "Bon matin",
        nativeExample: "Good morning, did you sleep well?",
        targetExample: "Bon matin, avez-vous bien dormi?",
      },
      {
        id: "3",
        nativeWord: "Thank you",
        targetWord: "Merci",
        nativeExample: "Thank you for your help.",
        targetExample: "Merci pour votre aide.",
      },
      {
        id: "4",
        nativeWord: "Please",
        targetWord: "S'il vous plaît",
        nativeExample: "Please, can you help me?",
        targetExample: "S'il vous plaît, pouvez-vous m'aider?",
      },
      {
        id: "5",
        nativeWord: "Yes",
        targetWord: "Oui",
        nativeExample: "Yes, I understand.",
        targetExample: "Oui, je comprends.",
      },
      {
        id: "6",
        nativeWord: "No",
        targetWord: "Non",
        nativeExample: "No, I don't want to.",
        targetExample: "Non, je ne veux pas.",
      },
    ]
  } else {
    // Generic mock data for other languages
    return [
      {
        id: "1",
        nativeWord: "Hello",
        targetWord: "Hello in " + targetLanguage,
        nativeExample: "Hello, how are you?",
        targetExample: "Example in " + targetLanguage,
      },
      {
        id: "2",
        nativeWord: "Good morning",
        targetWord: "Good morning in " + targetLanguage,
        nativeExample: "Good morning, did you sleep well?",
        targetExample: "Example in " + targetLanguage,
      },
      {
        id: "3",
        nativeWord: "Thank you",
        targetWord: "Thank you in " + targetLanguage,
        nativeExample: "Thank you for your help.",
        targetExample: "Example in " + targetLanguage,
      },
    ]
  }
}
