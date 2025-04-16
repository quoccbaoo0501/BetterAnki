import type { Flashcard } from "@/types/flashcard"
import { getSavedFlashcards, getSavedApiKey } from "./storage"
import { v4 as uuidv4 } from "uuid"

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

    // IMPORTANT: For large sets, emphasize proper JSON formatting
    systemPrompt += `\nVERY IMPORTANT: Return the result as a valid, well-formed JSON array of flashcard objects. Ensure the JSON is properly formatted with no syntax errors. For large sets, make sure the entire response is valid JSON.`

    systemPrompt += `\nThe JSON structure should be:`

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

    // For large requests, add a specific instruction about response size
    if (prompt.toLowerCase().includes("100") || prompt.toLowerCase().includes("many")) {
      systemPrompt += `\nIMPORTANT: You are generating a large set of flashcards. Ensure your response is a single, complete, valid JSON array. Do not include any text before or after the JSON array.`
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
          maxOutputTokens: 8192, // Increased for larger responses
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

    // Improved JSON extraction logic
    let flashcards: Flashcard[] = []
    try {
      // First try: Look for a JSON array using regex
      const jsonMatch = generatedText.match(/\[\s*\{[\s\S]*\}\s*\]/)
      if (jsonMatch) {
        flashcards = JSON.parse(jsonMatch[0])
      } else {
        // Second try: Look for markdown code blocks with JSON
        const markdownMatch = generatedText.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (markdownMatch && markdownMatch[1]) {
          flashcards = JSON.parse(markdownMatch[1])
        } else {
          // Third try: Assume the entire response is JSON
          flashcards = JSON.parse(generatedText)
        }
      }
    } catch (parseError) {
      console.error("JSON parsing error:", parseError)
      console.error("Response text:", generatedText)

      // Last resort: Try to manually fix common JSON issues and extract
      try {
        // Remove any non-JSON text before the first [ and after the last ]
        const cleanedText = generatedText.replace(/^[\s\S]*?(\[[\s\S]*\])[\s\S]*$/, "$1").trim()

        flashcards = JSON.parse(cleanedText)
      } catch (finalError) {
        throw new Error(`Could not extract JSON from Gemini response: ${finalError.message}`)
      }
    }

    // Validate the extracted flashcards
    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      throw new Error("Invalid or empty flashcards array extracted from response")
    }

    // Ensure all flashcards have unique IDs by adding a UUID if needed
    return flashcards.map((card) => {
      if (!card.id || existingFlashcards.some((existingCard) => existingCard.id === card.id)) {
        // If ID is missing or duplicated, generate a new unique ID
        return { ...card, id: uuidv4() }
      }
      return card
    })
  } catch (error) {
    console.error("Error generating flashcards:", error)
    throw error
  }
}

// Function to split large requests into smaller batches
export async function generateFlashcardsInBatches(
  nativeLanguage: string,
  targetLanguage: string,
  prompt: string,
  apiKey?: string,
  batchSize = 30,
): Promise<Flashcard[]> {
  // Check if this is likely a large request
  const isLargeRequest =
    prompt.toLowerCase().includes("100") ||
    prompt.toLowerCase().includes("many") ||
    prompt.toLowerCase().includes("all") ||
    prompt.length > 100

  if (!isLargeRequest) {
    // For normal-sized requests, use the standard function
    return generateFlashcards(nativeLanguage, targetLanguage, prompt, apiKey)
  }

  // For large requests, modify the prompt to request a specific batch size
  const modifiedPrompt = `${prompt} (Generate only ${batchSize} items and make sure they're high quality)`

  try {
    return await generateFlashcards(nativeLanguage, targetLanguage, modifiedPrompt, apiKey)
  } catch (error) {
    console.error("Error in batch generation:", error)

    // If the batch approach fails, try with an even smaller batch
    if (batchSize > 15) {
      console.log("Retrying with smaller batch size...")
      return generateFlashcardsInBatches(nativeLanguage, targetLanguage, prompt, apiKey, 15)
    }

    throw error
  }
}
