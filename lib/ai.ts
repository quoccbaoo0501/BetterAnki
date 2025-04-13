import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { Flashcard } from "@/types/flashcard"

export async function generateFlashcards(
  nativeLanguage: string,
  targetLanguage: string,
  prompt: string,
): Promise<Flashcard[]> {
  try {
    // In a real implementation, you would use the Gemini AI here
    // For this example, we'll simulate the response with OpenAI

    const systemPrompt = `You are a language learning assistant that creates flashcards.
    Generate flashcards from ${nativeLanguage} to ${targetLanguage} based on the user's prompt.
    Return the result as a valid JSON array of flashcard objects with the following structure:
    [
      {
        "id": "unique-id-1",
        "nativeWord": "word in ${nativeLanguage}",
        "targetWord": "word in ${targetLanguage}",
        "nativeExample": "example sentence in ${nativeLanguage} (optional)",
        "targetExample": "example sentence in ${targetLanguage} (optional)"
      }
    ]`

    // In a real implementation, you would use Gemini AI here
    // This is a simulation using OpenAI
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: prompt,
    })

    // Parse the response as JSON
    const flashcards: Flashcard[] = JSON.parse(text)

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
