// This function generates predicted prompts using Gemini AI
export async function generatePredictedPrompts(
  history: Array<{
    prompt: string
    nativeLanguage: string
    targetLanguage: string
    timestamp: number
  }>,
  currentNativeLanguage?: string,
  currentTargetLanguage?: string,
  apiKey?: string,
): Promise<string[]> {
  // Get the effective API key (passed in or from storage)
  const effectiveApiKey = apiKey || getSavedApiKey()

  // If there's no API key or history, return some default suggestions
  if (!effectiveApiKey || history.length === 0) {
    return ["Add 20 most common greetings", "Basic travel phrases and vocabulary", "Food and restaurant vocabulary"]
  }

  try {
    // Gemini API endpoint
    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-exp-03-25:generateContent"

    // Filter history to prioritize the current language pair if provided
    let relevantHistory = history
    if (currentNativeLanguage && currentTargetLanguage) {
      const matchingHistory = history.filter(
        (item) => item.nativeLanguage === currentNativeLanguage && item.targetLanguage === currentTargetLanguage,
      )

      // If we have matching history items, use those; otherwise use all history
      if (matchingHistory.length > 0) {
        relevantHistory = matchingHistory
      }
    }

    // Format the history for the prompt
    const formattedHistory = relevantHistory
      .slice(0, 10) // Use only the 10 most recent prompts
      .map((item) => `- "${item.prompt}" (${item.nativeLanguage} to ${item.targetLanguage})`)
      .join("\n")

    // Create the prompt for Gemini
    const promptText = `You are an AI assistant helping with language learning flashcard generation.

Based on the user's previous prompts for flashcard generation, suggest 3 new, different prompts they might want to use next.

The user is currently learning ${currentTargetLanguage || "a language"} from ${currentNativeLanguage || "their native language"}.

Previous prompts:
${formattedHistory}

Generate 3 new, creative prompt suggestions that would be useful for language learning. Each suggestion should be concise (under 50 characters if possible) and different from the previous prompts.

IMPORTANT: Return ONLY a JSON array with 3 string suggestions, like this:
["suggestion 1", "suggestion 2", "suggestion 3"]

Do not include any explanations, markdown formatting, or additional text before or after the JSON array.`

    // Make request to Gemini API
    const response = await fetch(`${endpoint}?key=${effectiveApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: promptText }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
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
    let suggestions: string[] = []

    try {
      // Approach 1: Try to find a JSON array using regex
      const jsonMatch = generatedText.match(/\[\s*"[^"]*"(?:\s*,\s*"[^"]*")*\s*\]/)
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0])
      }
      // Approach 2: Look for markdown code blocks with JSON
      else if (generatedText.includes("```json")) {
        const markdownMatch = generatedText.match(/```json\s*([\s\S]*?)```/)
        if (markdownMatch && markdownMatch[1]) {
          suggestions = JSON.parse(markdownMatch[1])
        }
      }
      // Approach 3: Try to parse the entire response as JSON
      else if (generatedText.trim().startsWith("[") && generatedText.trim().endsWith("]")) {
        suggestions = JSON.parse(generatedText)
      }
      // Approach 4: Extract suggestions manually by looking for patterns
      else {
        // Look for numbered or bulleted list items
        const listItemMatches = generatedText.match(/(?:^|\n)(?:\d+\.\s*|\*\s*|-\s*)["'](.+?)["']/g)
        if (listItemMatches && listItemMatches.length > 0) {
          suggestions = listItemMatches
            .map((item) => {
              // Extract the text between quotes if present
              const quoteMatch = item.match(/["'](.+?)["']/)
              return quoteMatch ? quoteMatch[1] : item.replace(/(?:^|\n)(?:\d+\.\s*|\*\s*|-\s*)/, "").trim()
            })
            .filter((item) => item.length > 0)
            .slice(0, 3)
        }
      }
    } catch (error) {
      console.error("Error parsing Gemini response:", error, "Response text:", generatedText)
    }

    // If we couldn't extract suggestions, use fallback suggestions
    if (suggestions.length === 0) {
      console.warn("Could not extract suggestions from Gemini response, using fallbacks")
      return [
        "Common phrases for daily conversation",
        "Numbers and counting vocabulary",
        "Travel and transportation terms",
      ]
    }

    return suggestions.slice(0, 3) // Ensure we only return 3 suggestions
  } catch (error) {
    console.error("Error generating prompt predictions:", error)

    // Return fallback suggestions if Gemini fails
    return [
      "Common phrases for daily conversation",
      "Numbers and counting vocabulary",
      "Travel and transportation terms",
    ]
  }
}

// Store predicted prompts in memory for quick access
let cachedPredictions: string[] = []

// Save predictions to cache
export function savePredictedPrompts(predictions: string[]): void {
  cachedPredictions = predictions
}

// Get cached predictions
export function getCachedPredictions(): string[] {
  return cachedPredictions
}

// Generate predictions in the background and save to cache
export function generateAndCachePredictions(nativeLanguage: string, targetLanguage: string, apiKey?: string): void {
  if (typeof window === "undefined") return // Run this in the background without awaiting
  ;(async () => {
    try {
      const history = getPromptHistory()
      const predictions = await generatePredictedPrompts(history, nativeLanguage, targetLanguage, apiKey)
      savePredictedPrompts(predictions)
    } catch (error) {
      console.error("Background prediction generation failed:", error)
      // Use fallbacks if generation fails
      savePredictedPrompts([
        "Common phrases for daily conversation",
        "Numbers and counting vocabulary",
        "Travel and transportation terms",
      ])
    }
  })()
}

// Import getPromptHistory from storage
import { getSavedApiKey, getPromptHistory } from "./storage"
