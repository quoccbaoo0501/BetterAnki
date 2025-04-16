// Audio utility functions for text-to-speech

// Cache for audio URLs
const audioCache: Record<string, string> = {}

// Function to get speech synthesis voices for a language
export function getVoicesForLanguage(languageCode: string): SpeechSynthesisVoice[] {
  if (typeof window === "undefined") return []

  try {
    const voices = window.speechSynthesis.getVoices()
    // Filter voices by language code (e.g., 'fr' for French)
    return voices.filter((voice) => voice.lang.toLowerCase().startsWith(languageCode.toLowerCase()))
  } catch (error) {
    console.error("Error getting voices:", error)
    return []
  }
}

// Map common language names to language codes
export function getLanguageCode(language: string): string {
  const languageMap: Record<string, string> = {
    English: "en",
    Spanish: "es",
    French: "fr",
    German: "de",
    Italian: "it",
    Portuguese: "pt",
    Russian: "ru",
    Japanese: "ja",
    Chinese: "zh",
    Korean: "ko",
    Arabic: "ar",
  }

  return languageMap[language] || language
}

// Function to speak text
export function speakText(text: string, language: string): void {
  if (typeof window === "undefined") return

  try {
    const utterance = new SpeechSynthesisUtterance(text)
    const languageCode = getLanguageCode(language)

    // Try to find a voice for the language
    const voices = getVoicesForLanguage(languageCode)
    if (voices.length > 0) {
      utterance.voice = voices[0]
    }

    utterance.lang = languageCode
    window.speechSynthesis.speak(utterance)
  } catch (error) {
    console.error("Error speaking text:", error)
  }
}

// Function to check if speech synthesis is supported
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window
}
