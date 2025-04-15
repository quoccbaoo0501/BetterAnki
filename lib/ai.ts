import { generateText } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import type { Flashcard } from "@/types/flashcard"
import { getFlashcardsForLanguagePair } from "./storage"

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
    // 1. Get existing flashcards for this language pair
    const existingFlashcards = getFlashcardsForLanguagePair(targetLanguage, nativeLanguage);
    const existingNativeWords = existingFlashcards.map(card => card.nativeWord);

    // 2. Construct the system prompt with exclusion instructions
    let systemPrompt = `You are a language learning assistant that creates flashcards.
    Generate flashcards from ${nativeLanguage} to ${targetLanguage} based on the user's prompt.
    Return the result as a valid JSON array of flashcard objects with the following structure:
    [
      {
        "id": "unique-string-id-using-uuidv4-format", // Important: IDs must be unique UUIDs
        "nativeWord": "word in ${nativeLanguage}",
        "targetWord": "word in ${targetLanguage}",
        "nativeExample": "e sentence in ${nativeLanguage} (optional)",
        "targetExample": "example xamplesentence in ${targetLanguage} (optional)"
      }
    ]
    
    IMPORTANT: Ensure each generated flashcard object has a unique 'id' field in UUID v4 format.
    
    AVOID GENERATING FLASHCARDS for the following ${nativeLanguage} words as they already exist:
    `;

    if (existingNativeWords.length > 0) {
      systemPrompt += `- ${existingNativeWords.join("\n- ")}`;
    } else {
      systemPrompt += "(No existing words to avoid)";
    }

    // 3. Create the provider instance and call the AI
    const googleProvider = createGoogleGenerativeAI({ apiKey })

    const { text } = await generateText({
      model: googleProvider("models/gemini-2.5-pro-exp-03-25"),
      system: systemPrompt,
      prompt: prompt,
    })

    console.log("Raw AI Response Text:", text); // Debugging

    // 4. Clean and parse the response
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.substring(7);
    }
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.substring(0, cleanedText.length - 3);
    }
    cleanedText = cleanedText.trim();

    // Add basic validation in case the AI returns non-JSON or empty string
    if (!cleanedText || !cleanedText.startsWith('[')) {
        console.error("AI returned invalid or non-JSON response:", cleanedText);
        return []; // Return empty if response is not a JSON array
    }

    const flashcards: Flashcard[] = JSON.parse(cleanedText)

    console.log("Parsed Flashcards:", flashcards); // Debugging
    
    // 5. Filter out any remaining duplicates just in case the AI didn't follow instructions perfectly
    const finalFlashcards = flashcards.filter(card => !existingNativeWords.includes(card.nativeWord));

    return finalFlashcards;

  } catch (error) {
    console.error("Error generating or processing flashcards:", error)
    return []
  }
}
