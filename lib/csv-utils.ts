import type { Flashcard } from "@/types/flashcard"

/**
 * Parses a CSV string into an array of flashcard data
 * @param csvText The CSV text to parse
 * @returns Array of parsed flashcard data
 */
export function parseCSV(csvText: string): Array<{
  nativeWord: string
  targetWord: string
  nativeExample?: string
  targetExample?: string
}> {
  // Split by lines and filter out empty lines
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "")

  if (lines.length === 0) {
    throw new Error("The CSV file is empty")
  }

  const results: Array<{
    nativeWord: string
    targetWord: string
    nativeExample?: string
    targetExample?: string
  }> = []

  // Process each line
  for (let i = 0; i < lines.length; i++) {
    // Skip header row if present (check if first line contains headers)
    if (i === 0 && (lines[i].toLowerCase().includes("front") || lines[i].toLowerCase().includes("native"))) {
      continue
    }

    // Parse the CSV line
    const parsedLine = parseCSVLine(lines[i])

    if (parsedLine.length < 2) {
      continue
    }

    const flashcardData = {
      nativeWord: parsedLine[0].trim(),
      targetWord: parsedLine[1].trim(),
      nativeExample: parsedLine[2]?.trim(),
      targetExample: parsedLine[3]?.trim(),
    }

    // Skip if either native or target word is empty
    if (!flashcardData.nativeWord || !flashcardData.targetWord) {
      continue
    }

    results.push(flashcardData)
  }

  return results
}

/**
 * Generates CSV content from flashcards
 * @param flashcards Array of flashcards to convert to CSV
 * @param includeExamples Whether to include example sentences
 * @param nativeLanguage Name of native language for header
 * @param targetLanguage Name of target language for header
 * @returns CSV string
 */
export function generateCSV(
  flashcards: Flashcard[],
  includeExamples: boolean,
  nativeLanguage: string,
  targetLanguage: string,
): string {
  // Create header row
  let csv = includeExamples
    ? `"${nativeLanguage}","${targetLanguage}","${nativeLanguage} Example","${targetLanguage} Example"\n`
    : `"${nativeLanguage}","${targetLanguage}"\n`

  // Add each flashcard as a row
  flashcards.forEach((card) => {
    // Escape quotes in fields by doubling them
    const nativeWord = escapeCSVField(card.nativeWord)
    const targetWord = escapeCSVField(card.targetWord)

    if (includeExamples) {
      const nativeExample = card.nativeExample ? escapeCSVField(card.nativeExample) : ""
      const targetExample = card.targetExample ? escapeCSVField(card.targetExample) : ""
      csv += `"${nativeWord}","${targetWord}","${nativeExample}","${targetExample}"\n`
    } else {
      csv += `"${nativeWord}","${targetWord}"\n`
    }
  })

  return csv
}

/**
 * Helper function to parse a CSV line handling quoted fields
 * @param line CSV line to parse
 * @returns Array of parsed fields
 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current)
      current = ""
    } else {
      current += char
    }
  }

  // Add the last field
  result.push(current)

  // Remove quotes from fields
  return result.map((field) => field.replace(/^"(.*)"$/, "$1"))
}

/**
 * Helper function to escape CSV fields
 * @param field Field to escape
 * @returns Escaped field
 */
export function escapeCSVField(field: string): string {
  return field.replace(/"/g, '""')
}

/**
 * Helper function to sanitize filename
 * @param name Filename to sanitize
 * @returns Sanitized filename
 */
export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, "_").toLowerCase()
}
