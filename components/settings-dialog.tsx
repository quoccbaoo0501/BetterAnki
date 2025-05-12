"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Settings, ExternalLink, Clipboard, Save, Trash2, RefreshCw, RotateCcw } from "lucide-react"
import {
  getSavedApiKey,
  saveApiKey,
  clearApiKey,
  getDeletedCards,
  clearDeletedCards,
  getAvailableLanguagePairs,
  getCardOrientationPreference,
  saveCardOrientationPreference,
  getCustomCardSides,
  saveCustomCardSides,
} from "@/lib/storage"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SettingsDialogProps {
  trigger?: React.ReactNode
  onApiKeySaved?: (apiKey: string) => void
}

export default function SettingsDialog({ trigger, onApiKeySaved }: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deletedCardsCount, setDeletedCardsCount] = useState<Record<string, number>>({})
  const [availablePairs, setAvailablePairs] = useState<{ native: string; target: string }[]>([])
  const [cardOrientation, setCardOrientation] = useState<"native-front" | "target-front" | "custom">("native-front")
  const [customCardSides, setCustomCardSides] = useState<{ front: string; back: string }>({
    front: "nativeWord",
    back: "targetWord",
  })

  useEffect(() => {
    if (open && typeof window !== "undefined") {
      // Load saved API key
      const savedApiKey = getSavedApiKey()
      if (savedApiKey) {
        setApiKey(savedApiKey)
      }

      // Load available language pairs
      const pairs = getAvailableLanguagePairs()
      setAvailablePairs(pairs)

      // Load deleted cards count for each pair
      const counts: Record<string, number> = {}
      pairs.forEach((pair) => {
        const deletedCards = getDeletedCards(pair.native, pair.target)
        const key = `${pair.native}-${pair.target}`
        counts[key] = deletedCards.length
      })
      setDeletedCardsCount(counts)

      // Load card orientation preference
      const orientationPref = getCardOrientationPreference()
      setCardOrientation(orientationPref)

      // Load custom card sides
      const sides = getCustomCardSides()
      setCustomCardSides(sides)
    }
  }, [open])

  const handlePasteApiKey = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setApiKey(text)
    } catch (error) {
      console.error("Failed to read clipboard:", error)
    }
  }

  const handleSaveApiKey = () => {
    if (apiKey) {
      setIsSaving(true)

      // Save the API key
      saveApiKey(apiKey)

      // Verify it was actually saved
      setTimeout(() => {
        const savedKey = getSavedApiKey()
        if (savedKey === apiKey) {
          setSaveMessage({ type: "success", text: "API key saved successfully!" })
          if (onApiKeySaved) {
            onApiKeySaved(apiKey)
          }
        } else {
          setSaveMessage({ type: "error", text: "Failed to save API key. Please try again." })
        }
        setIsSaving(false)

        // Clear the message after 3 seconds
        setTimeout(() => {
          setSaveMessage(null)
        }, 3000)
      }, 500)
    } else {
      setSaveMessage({ type: "error", text: "Please enter an API key" })
    }
  }

  const handleClearApiKey = () => {
    clearApiKey()
    setApiKey("")
    setSaveMessage({ type: "success", text: "API key cleared successfully!" })

    // Clear the message after 3 seconds
    setTimeout(() => {
      setSaveMessage(null)
    }, 3000)
  }

  const handleClearDeletedCards = (nativeLanguage: string, targetLanguage: string) => {
    clearDeletedCards(nativeLanguage, targetLanguage)

    // Update the count
    setDeletedCardsCount((prev) => {
      const key = `${nativeLanguage}-${targetLanguage}`
      return { ...prev, [key]: 0 }
    })

    setSaveMessage({
      type: "success",
      text: `Cleared deleted cards for ${nativeLanguage} → ${targetLanguage}`,
    })

    // Clear the message after 3 seconds
    setTimeout(() => {
      setSaveMessage(null)
    }, 3000)
  }

  const handleSaveCardOrientation = () => {
    saveCardOrientationPreference(cardOrientation)
    setSaveMessage({ type: "success", text: "Display settings saved successfully!" })

    // Clear the message after 3 seconds
    setTimeout(() => {
      setSaveMessage(null)
    }, 3000)
  }

  const handleSaveCustomCardSides = () => {
    saveCustomCardSides(customCardSides)
    setSaveMessage({ type: "success", text: "Custom card sides saved successfully!" })

    // Clear the message after 3 seconds
    setTimeout(() => {
      setSaveMessage(null)
    }, 3000)
  }

  const handleResetCustomCardSides = () => {
    setCustomCardSides({ front: "nativeWord", back: "targetWord" })
    saveCustomCardSides({ front: "nativeWord", back: "targetWord" })
    setSaveMessage({ type: "success", text: "Custom card sides reset to default!" })

    // Clear the message after 3 seconds
    setTimeout(() => {
      setSaveMessage(null)
    }, 3000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="api-key" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="api-key">API Key</TabsTrigger>
            <TabsTrigger value="display">Display</TabsTrigger>
            <TabsTrigger value="deleted-cards">Deleted Cards</TabsTrigger>
          </TabsList>

          <TabsContent value="api-key" className="space-y-6 py-4">
            {saveMessage && (
              <Alert variant={saveMessage.type === "success" ? "default" : "destructive"} className="mb-4">
                <AlertDescription>{saveMessage.text}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="api-key" className="text-sm font-medium text-slate-700">
                Gemini API Key
              </Label>
              <div className="flex">
                <Input
                  type="password"
                  id="api-key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="flex-1 mr-2"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handlePasteApiKey}
                  title="Paste from clipboard"
                >
                  <Clipboard className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-500">Required to generate flashcards with Gemini AI</p>
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open("https://aistudio.google.com/apikey", "_blank")}
                className="flex items-center"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Get API Key
              </Button>

              <div className="space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveApiKey}
                  className="flex items-center"
                  disabled={isSaving}
                >
                  {isSaving ? <span className="animate-spin mr-2">⏳</span> : <Save className="h-4 w-4 mr-2" />}
                  Save Key
                </Button>

                {getSavedApiKey() && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearApiKey}
                    className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Key
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="display" className="space-y-6 py-4">
            {saveMessage && (
              <Alert variant={saveMessage.type === "success" ? "default" : "destructive"} className="mb-4">
                <AlertDescription>{saveMessage.text}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-700">Card Orientation</h3>
              <RadioGroup value={cardOrientation} onValueChange={(value) => setCardOrientation(value as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="native-front" id="native-front" />
                  <Label htmlFor="native-front">Native language on front (default)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="target-front" id="target-front" />
                  <Label htmlFor="target-front">Target language on front</Label>
                </div>
              </RadioGroup>

              {cardOrientation === "custom" && (
                <div className="mt-4 p-4 border rounded-md space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="front-side">Front Side</Label>
                    <Select
                      value={customCardSides.front}
                      onValueChange={(value) => setCustomCardSides({ ...customCardSides, front: value })}
                    >
                      <SelectTrigger id="front-side">
                        <SelectValue placeholder="Select front side content" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nativeWord">Native Word</SelectItem>
                        <SelectItem value="targetWord">Target Word</SelectItem>
                        <SelectItem value="nativeExample">Native Example</SelectItem>
                        <SelectItem value="targetExample">Target Example</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="back-side">Back Side</Label>
                    <Select
                      value={customCardSides.back}
                      onValueChange={(value) => setCustomCardSides({ ...customCardSides, back: value })}
                    >
                      <SelectTrigger id="back-side">
                        <SelectValue placeholder="Select back side content" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nativeWord">Native Word</SelectItem>
                        <SelectItem value="targetWord">Target Word</SelectItem>
                        <SelectItem value="nativeExample">Native Example</SelectItem>
                        <SelectItem value="targetExample">Target Example</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetCustomCardSides}
                    className="flex items-center"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Default
                  </Button>
                </div>
              )}

              <div className="flex justify-end mt-4">
                <Button onClick={handleSaveCardOrientation}>Save Display Settings</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="deleted-cards" className="space-y-6 py-4">
            {saveMessage && (
              <Alert variant={saveMessage.type === "success" ? "default" : "destructive"} className="mb-4">
                <AlertDescription>{saveMessage.text}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-700">Reviewed & Deleted Cards</h3>
              <p className="text-xs text-slate-500">
                These are cards you've reviewed at least once and then deleted. The AI will avoid generating these words
                again.
              </p>

              {availablePairs.length === 0 ? (
                <p className="text-sm text-slate-600">No language pairs available.</p>
              ) : (
                <div className="space-y-3">
                  {availablePairs.map((pair, index) => {
                    const key = `${pair.native}-${pair.target}`
                    const count = deletedCardsCount[key] || 0

                    return (
                      <div key={index} className="flex justify-between items-center p-2 border rounded-md">
                        <div className="flex items-center">
                          <span className="text-sm">
                            {pair.native} → {pair.target}
                          </span>
                          <Badge variant="outline" className="ml-2">
                            {count} {count === 1 ? "card" : "cards"}
                          </Badge>
                        </div>

                        {count > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleClearDeletedCards(pair.native, pair.target)}
                            className="h-8 w-8 p-0 text-red-500"
                          >
                            <RefreshCw className="h-4 w-4" />
                            <span className="sr-only">Reset</span>
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              <p className="text-xs text-slate-500 mt-2">Resetting will allow the AI to generate these words again.</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
