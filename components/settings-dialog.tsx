"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Settings, ExternalLink, Clipboard, Save, Trash2 } from "lucide-react"
import { getSavedApiKey, saveApiKey, clearApiKey } from "@/lib/storage"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SettingsDialogProps {
  trigger?: React.ReactNode
  onApiKeySaved?: (apiKey: string) => void
}

export default function SettingsDialog({ trigger, onApiKeySaved }: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open && typeof window !== "undefined") {
      // Load saved API key
      const savedApiKey = getSavedApiKey()
      if (savedApiKey) {
        setApiKey(savedApiKey)
      }
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
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">API Key</h3>

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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
