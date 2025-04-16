"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { getLanguagePairHistory } from "@/lib/storage"
import { Clock } from "lucide-react"

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
  "Vietnamese",
]

interface LanguageSelectorProps {
  nativeLanguage: string
  targetLanguage: string
  onNativeChange: (language: string) => void
  onTargetChange: (language: string) => void
}

export default function LanguageSelector({
  nativeLanguage,
  targetLanguage,
  onNativeChange,
  onTargetChange,
}: LanguageSelectorProps) {
  const [recentPairs, setRecentPairs] = useState<
    Array<{
      nativeLanguage: string
      targetLanguage: string
      timestamp: number
    }>
  >([])

  useEffect(() => {
    // Only run on the client side
    if (typeof window !== "undefined") {
      // Load recent language pairs
      const history = getLanguagePairHistory()
      setRecentPairs(history)
    }
  }, [])

  const handleQuickPairSelect = (native: string, target: string) => {
    onNativeChange(native)
    onTargetChange(target)
  }

  return (
    <div className="space-y-4">
      {recentPairs.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center text-sm text-slate-600">
            <Clock className="h-4 w-4 mr-1" />
            <span>Recent language pairs</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentPairs.map((pair, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-slate-100"
                onClick={() => handleQuickPairSelect(pair.nativeLanguage, pair.targetLanguage)}
              >
                {pair.nativeLanguage} → {pair.targetLanguage}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="native-language">I speak</Label>
        <Select name="nativeLanguage" value={nativeLanguage} onValueChange={onNativeChange}>
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
        <Select name="targetLanguage" value={targetLanguage} onValueChange={onTargetChange}>
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
