import { generateText } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import type { Flashcard } from "@/types/flashcard"

export async function generateFlashcards(
  nativeLanguage: string,
  targetLanguage: string,
  prompt: string,
  apiKey: string | null,
): Promise<Flashcard[]> {
  if (!apiKey) {
    console.warn("API key is missing. Please provide your Gemini API key in the settings.")
    // Optionally, you could throw an error or return a specific error state
    // throw new Error("API key is missing.");
    return [] // Return empty array if no key
  }

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

    // Create the provider instance with the API key
    const googleProvider = createGoogleGenerativeAI({ apiKey })

    const { text } = await generateText({
      // Use the provider instance and specify the model
      model: googleProvider("models/gemini-2.5-pro-exp-03-25"),
      system: systemPrompt,
      prompt: prompt,
    })

    console.log("Raw AI Response Text:", text); // Keep this for debugging temporarily

    // Clean the response: Remove markdown fences if they exist
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.substring(7); // Remove ```json
    }
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.substring(0, cleanedText.length - 3); // Remove ```
    }
    cleanedText = cleanedText.trim(); // Trim any remaining whitespace

    // Parse the cleaned response as JSON
    const flashcards: Flashcard[] = JSON.parse(cleanedText)

    console.log("Parsed Flashcards:", flashcards); // Keep for debugging
    
    return flashcards
  } catch (error) {
    console.error("Error generating flashcards:", error)

    // Return an empty array or re-throw the error if preferred
    return []
  }
}
