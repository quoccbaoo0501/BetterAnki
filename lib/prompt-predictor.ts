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
  // If there's no API key or history, return some default suggestions
  if (!apiKey || history.length === 0) {
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

Generate 3 new, creative prompt suggestions that would be useful for language learning. Each suggestion should be concise (under 50 characters if possible) and different from the previous prompts. Return ONLY the 3 suggestions in a JSON array format like this:
["suggestion 1", "suggestion 2", "suggestion 3"]`

    // Make request to Gemini API
    const response = await fetch(`${endpoint}?key=${apiKey}`, {
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

    // Find the JSON array in the response
    const jsonMatch = generatedText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from Gemini response")
    }

    // Parse the JSON array
    const suggestions: string[] = JSON.parse(jsonMatch[0])
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
