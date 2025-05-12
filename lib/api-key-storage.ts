// lib/api-key-storage.ts

// Storage key for API key
const API_KEY_STORAGE_KEY = "languageLang_apiKey"

// Get saved API key
export function getSavedApiKey(): string {
  if (typeof window === "undefined") return ""

  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || ""
  } catch (error) {
    console.error("Error retrieving API key:", error)
    return ""
  }
}
