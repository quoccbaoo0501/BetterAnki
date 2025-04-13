"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

const languages = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Russian",
  "Japanese",
  "Chinese",
  "Korean",
  "Arabic",
]

export default function LanguageSelector() {
  const [nativeLanguage, setNativeLanguage] = useState<string>("")
  const [targetLanguage, setTargetLanguage] = useState<string>("")

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="native-language">I speak</Label>
        <Select name="nativeLanguage" value={nativeLanguage} onValueChange={setNativeLanguage}>
          <SelectTrigger id="native-language" className="w-full">
            <SelectValue placeholder="Select your native language" />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={`native-${lang}`} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="target-language">I want to learn</Label>
        <Select name="targetLanguage" value={targetLanguage} onValueChange={setTargetLanguage}>
          <SelectTrigger id="target-language" className="w-full">
            <SelectValue placeholder="Select language to learn" />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={`target-${lang}`} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
