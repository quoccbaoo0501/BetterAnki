"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

type LanguagePairSelectorProps = {
  availablePairs: { native: string; target: string }[]
  selectedNative: string
  selectedTarget: string
  onChange: (native: string, target: string) => void
}

export default function LanguagePairSelector({
  availablePairs,
  selectedNative,
  selectedTarget,
  onChange,
}: LanguagePairSelectorProps) {
  // Create a unique identifier for each language pair
  const getPairId = (native: string, target: string) => `${native}|${target}`

  // Get the current selected pair ID
  const selectedPairId = getPairId(selectedNative, selectedTarget)

  // Handle pair selection change
  const handlePairChange = (pairId: string) => {
    const [native, target] = pairId.split("|")
    onChange(native, target)
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="space-y-2">
          <Label htmlFor="language-pair">Language Pair</Label>
          <Select value={selectedPairId} onValueChange={handlePairChange}>
            <SelectTrigger id="language-pair">
              <SelectValue placeholder="Select a language pair" />
            </SelectTrigger>
            <SelectContent>
              {availablePairs.map((pair) => (
                <SelectItem key={getPairId(pair.native, pair.target)} value={getPairId(pair.native, pair.target)}>
                  {pair.native} → {pair.target}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
