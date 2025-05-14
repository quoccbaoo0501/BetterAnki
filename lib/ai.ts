import type { Flashcard } from "@/types/flashcard"
import { getSavedFlashcards, getSavedApiKey, getWordsToAvoid } from "./storage"
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

    // Get words to avoid (both existing and deleted reviewed cards)
    const wordsToAvoid = getWordsToAvoid(nativeLanguage, targetLanguage)

    // Get the count of existing flashcards to help with ID generation
    const existingFlashcards = getSavedFlashcards(nativeLanguage, targetLanguage)
    const existingCardCount = existingFlashcards.length

    // Gemini API endpoint
    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent"

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

    // Add words to avoid if there are any
    if (wordsToAvoid.length > 0) {
      systemPrompt += `\nIMPORTANT: DO NOT include these words that the user already knows or has deleted after reviewing: ${wordsToAvoid.join(", ")}`
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
          maxOutputTokens: 16384, // Increased from 8192 to 16384 for larger responses
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

    // Improved JSON extraction with multiple fallback approaches
    let flashcards: Flashcard[] = []
    let extractionSuccessful = false

    try {
      // First try: Direct JSON parsing if it looks like valid JSON
      if (generatedText.trim().startsWith("[") && generatedText.trim().endsWith("]")) {
        try {
          flashcards = JSON.parse(generatedText.trim())
          extractionSuccessful = true
          console.log("Successfully parsed entire response as JSON")
        } catch (e) {
          console.log("Failed direct JSON parsing, trying other methods")
        }
      }

      // Second try: Look for a JSON array using regex
      if (!extractionSuccessful) {
        const jsonMatch = generatedText.match(/\[\s*\{[\s\S]*\}\s*\]/)
        if (jsonMatch) {
          try {
            flashcards = JSON.parse(jsonMatch[0])
            extractionSuccessful = true
            console.log("Successfully extracted JSON using regex")
          } catch (e) {
            console.log("Failed regex JSON extraction")
          }
        }
      }

      // Third try: Look for markdown code blocks with JSON
      if (!extractionSuccessful && (generatedText.includes("```json") || generatedText.includes("```"))) {
        const markdownMatch = generatedText.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (markdownMatch && markdownMatch[1]) {
          const jsonContent = markdownMatch[1].trim()
          if (jsonContent.startsWith("[") && jsonContent.endsWith("]")) {
            try {
              flashcards = JSON.parse(jsonContent)
              extractionSuccessful = true
              console.log("Successfully extracted JSON from code block")
            } catch (e) {
              console.log("Failed code block JSON extraction")
            }
          }
        }
      }

      // Fourth try: Manual cleanup and repair of JSON
      if (!extractionSuccessful) {
        // Remove any non-JSON text before the first [ and after the last ]
        let cleanedText = generatedText.replace(/^[\s\S]*?(\[[\s\S]*?\])[\s\S]*$/, "$1").trim()

        // Fix common JSON formatting issues
        cleanedText = cleanedText
          .replace(/,\s*\]/g, "]") // Remove trailing commas
          .replace(/\]\s*\[/g, "],[") // Fix adjacent arrays
          .replace(/\}\s*\{/g, "},{") // Fix adjacent objects
          .replace(/\\"/g, '"') // Fix escaped quotes
          .replace(/\\n/g, " ") // Replace newlines with spaces

        if (cleanedText.startsWith("[") && cleanedText.endsWith("]")) {
          try {
            flashcards = JSON.parse(cleanedText)
            extractionSuccessful = true
            console.log("Successfully parsed fixed JSON")
          } catch (e) {
            console.log("Failed fixed JSON parsing")
          }
        }
      }
    } catch (parseError) {
      console.error("JSON parsing error:", parseError)
      console.error("Response text:", generatedText)
    }

    // If extraction failed completely, throw an error
    if (!extractionSuccessful || !Array.isArray(flashcards) || flashcards.length === 0) {
      throw new Error("Failed to extract valid flashcards from the API response")
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

// Modify the generateFlashcardsInBatches function to better handle large requests

// Update the batch size detection logic in generateFlashcardsInBatches
export async function generateFlashcardsInBatches(
  nativeLanguage: string,
  targetLanguage: string,
  prompt: string,
  apiKey?: string,
  batchSize = 100, // Changed from 20 to 100 for larger batches
): Promise<Flashcard[]> {
  // Check if this is likely a large request - improve detection
  const isLargeRequest =
    prompt.toLowerCase().includes("100") ||
    prompt.toLowerCase().includes("99") || // Add specific check for 99
    prompt.toLowerCase().includes("many") ||
    prompt.toLowerCase().includes("all") ||
    /\b\d{2,}\b/.test(prompt) || // Match any 2+ digit number
    prompt.length > 100

  if (!isLargeRequest) {
    // For normal-sized requests, use the standard function
    return generateFlashcards(nativeLanguage, targetLanguage, prompt, apiKey)
  }

  // For large requests, modify the prompt to request a specific batch size
  const modifiedPrompt = `${prompt} (Generate only ${batchSize} high-quality items)`

  try {
    // First attempt with the specified batch size
    return await generateFlashcards(nativeLanguage, targetLanguage, modifiedPrompt, apiKey)
  } catch (error) {
    console.error("Error in batch generation:", error)

    // If the batch approach fails, try with an even smaller batch
    if (batchSize > 50) {
      console.log("Retrying with smaller batch size...")
      return generateFlashcardsInBatches(nativeLanguage, targetLanguage, prompt, apiKey, 50)
    } else if (batchSize > 20) {
      console.log("Retrying with minimal batch size...")
      return generateFlashcardsInBatches(nativeLanguage, targetLanguage, prompt, apiKey, 20)
    }

    // If we've already tried with the smallest batch size, try a different approach
    try {
      console.log("Trying with simplified prompt...")
      const simplifiedPrompt = `Generate ${batchSize} simple flashcards for ${prompt}. Focus on basic vocabulary only.`
      return await generateFlashcards(nativeLanguage, targetLanguage, simplifiedPrompt, apiKey)
    } catch (finalError) {
      throw finalError
    }
  }
}

// Function to generate a story with blanks for vocabulary practice
export async function generateStoryWithBlanks(
  flashcards: Flashcard[],
  nativeLanguage: string,
  targetLanguage: string,
  apiKey?: string,
): Promise<{
  story: string
  blankedStory: string
  wordOrder: string[]
  error?: string
}> {
  try {
    // Get the effective API key (passed in or from storage)
    const effectiveApiKey = apiKey || getSavedApiKey()

    // Check if API key is provided
    if (!effectiveApiKey) {
      throw new Error("API key is required for Gemini")
    }

    // Limit the number of flashcards to avoid overwhelming the API
    const limitedFlashcards = flashcards.slice(0, Math.min(7, flashcards.length))

    // Gemini API endpoint
    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent"

    // Check if this is a definition mode (same language for native and target)
    const isDefinitionMode = nativeLanguage === targetLanguage

    // Extract the appropriate words based on whether we're in definition mode or not
    const words = limitedFlashcards.map((card) => (isDefinitionMode ? card.nativeWord : card.targetWord))

    // Prepare a simplified prompt for Gemini that's more likely to produce valid JSON
    const systemPrompt = `Create a short story (about 100 words) that uses these ${words.length} ${
      isDefinitionMode ? nativeLanguage : targetLanguage
    } words: ${words.join(", ")}

The story should be in ${isDefinitionMode ? nativeLanguage : targetLanguage} and use each word exactly once.

Return ONLY a JSON object with these three fields:
1. "story": The complete story with all words included
2. "blankedStory": The same story but with each target word replaced with "[BLANK]"
3. "wordOrder": An array of the target words in the order they appear in the story

Example format:
{
  "story": "Once upon a time...",
  "blankedStory": "Once upon a [BLANK]...",
  "wordOrder": ["time", "other", "words"]
}

Do not include any explanations, markdown formatting, or text outside the JSON object.`

    // Make request to Gemini API with a lower temperature for more predictable output
    const response = await fetch(`${endpoint}?key=${effectiveApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: systemPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3, // Lower temperature for more predictable output
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
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

    // Log the full response for debugging
    console.log("Full Gemini response:", generatedText)

    // Try multiple approaches to extract valid JSON
    let result = null

    // Approach 1: Try to parse the entire response as JSON
    try {
      result = JSON.parse(generatedText.trim())
      console.log("Successfully parsed entire response as JSON")
    } catch (error) {
      console.log("Failed to parse entire response as JSON, trying other methods")
    }

    // Approach 2: Try to extract JSON using regex
    if (!result) {
      try {
        const jsonMatch = generatedText.match(/\{[\s\S]*"story"[\s\S]*"blankedStory"[\s\S]*"wordOrder"[\s\S]*\}/)
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0])
          console.log("Successfully extracted JSON using regex")
        }
      } catch (error) {
        console.log("Failed to extract JSON using regex")
      }
    }

    // Approach 3: Look for JSON in code blocks
    if (!result) {
      try {
        const codeBlockMatch = generatedText.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (codeBlockMatch && codeBlockMatch[1]) {
          result = JSON.parse(codeBlockMatch[1].trim())
          console.log("Successfully extracted JSON from code block")
        }
      } catch (error) {
        console.log("Failed to extract JSON from code block")
      }
    }

    // Approach 4: Try to fix common JSON formatting issues
    if (!result) {
      try {
        // Extract anything that looks like a JSON object
        const potentialJson = generatedText.replace(/^[\s\S]*?(\{[\s\S]*?\})[\s\S]*$/, "$1").trim()

        // Fix common JSON issues
        const fixedJson = potentialJson
          .replace(/,\s*\}/g, "}") // Remove trailing commas
          .replace(/\}\s*\{/g, "},{") // Fix adjacent objects
          .replace(/"\s*:\s*"/g, '":"') // Fix spacing in key-value pairs
          .replace(/"\s*,\s*"/g, '","') // Fix spacing in arrays
          .replace(/\\"/g, '"') // Fix escaped quotes
          .replace(/\\n/g, " ") // Replace newlines with spaces

        if (fixedJson.startsWith("{") && fixedJson.endsWith("}")) {
          result = JSON.parse(fixedJson)
          console.log("Successfully parsed fixed JSON")
        }
      } catch (error) {
        console.log("Failed to fix and parse JSON")
      }
    }

    // If all extraction methods fail, create a simple fallback story
    if (!result) {
      console.log("All JSON extraction methods failed, using fallback story")

      // Create a simple story using the words
      const fallbackStory = createFallbackStory(words, isDefinitionMode ? nativeLanguage : targetLanguage)

      // Create a blanked version
      let blankedStory = fallbackStory
      words.forEach((word) => {
        blankedStory = blankedStory.replace(word, "[BLANK]")
      })

      result = {
        story: fallbackStory,
        blankedStory: blankedStory,
        wordOrder: words,
      }
    }

    // Validate the response
    if (!result.story || !result.blankedStory || !result.wordOrder) {
      throw new Error("Invalid response format: missing required fields")
    }

    // Ensure all words are included in the wordOrder array
    const missingWords = words.filter((word) => !result.wordOrder.includes(word))
    if (missingWords.length > 0) {
      console.warn(`Some words are missing from the story: ${missingWords.join(", ")}`)

      // Fix the wordOrder array
      result.wordOrder = words

      // Try to fix the story if possible
      let fixedStory = result.story
      missingWords.forEach((word) => {
        // Add the missing word to the end of the story
        fixedStory += ` ${word}.`
      })
      result.story = fixedStory

      // Update blankedStory to match
      let fixedBlankedStory = result.blankedStory
      missingWords.forEach(() => {
        // Add a blank for each missing word
        fixedBlankedStory += " [BLANK]."
      })
      result.blankedStory = fixedBlankedStory
    }

    return result
  } catch (error) {
    console.error("Error generating story with blanks:", error)
    return {
      story: "",
      blankedStory: "",
      wordOrder: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// Helper function to create a fallback story when the API fails
function createFallbackStory(words: string[], language: string): string {
  // Simple templates that can incorporate the words
  const templates = [
    "One day, I was walking down the street when I saw {0}. It reminded me of {1}. I thought about {2} and decided to buy {3}. Later, I met a friend who likes {4}. We talked about {5} and enjoyed {6}.",
    "In my dream last night, I was in a place with {0}. There was {1} everywhere. I tried to find {2} but instead found {3}. Someone gave me {4} as a gift. I used it to get {5} and then I saw {6}.",
    "The story begins with {0}. The main character loves {1} but hates {2}. One day, they discover {3} in a strange place. They use {4} to solve a problem. Their friend brings {5} to help. In the end, they celebrate with {6}.",
    "My favorite memory is about {0}. I was with my family enjoying {1}. We didn't expect to see {2} there. Someone offered us {3} which was nice. We took photos of {4}. Later we found {5} and decided to keep {6} as a souvenir.",
  ]

  // Select a template based on the number of words
  const templateIndex = Math.min(templates.length - 1, Math.floor(words.length / 7))
  let template = templates[templateIndex]

  // Fill in the template with the words
  words.forEach((word, index) => {
    template = template.replace(`{${index}}`, word)
  })

  // If there are fewer words than placeholders, remove the unused parts
  for (let i = words.length; i < 7; i++) {
    template = template.replace(` {${i}}.`, ".")
    template = template.replace(` {${i}}`, "")
  }

  return template
}
