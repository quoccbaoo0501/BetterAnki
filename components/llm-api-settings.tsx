'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast' // Assuming you have shadcn/ui toast

const STORAGE_KEY = 'gemini_api_key'

// Function to retrieve the API key (can be imported elsewhere)
export function getApiKey(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY)
  }
  return null
}

export function LLMApiSettings() {
  const [apiKey, setApiKey] = useState('')
  const [isKeySaved, setIsKeySaved] = useState(false) // New state
  const { toast } = useToast()

  // Load existing key and set saved status on component mount
  useEffect(() => {
    const storedKey = getApiKey()
    if (storedKey) {
      setApiKey(storedKey) // Still load to state for potential edit/clear
      setIsKeySaved(true)
    } else {
      setIsKeySaved(false)
    }
  }, [])

  const handleSaveKey = () => {
    if (typeof window !== 'undefined' && apiKey.trim()) {
      localStorage.setItem(STORAGE_KEY, apiKey)
      setIsKeySaved(true) // Set saved status
      toast({
        title: 'API Key Saved',
        description: 'Your Gemini API key has been saved locally.',
      })
    } else if (!apiKey.trim()) {
      toast({
        title: 'Error',
        description: 'API Key cannot be empty.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Error',
        description: 'Local storage is not available.',
        variant: 'destructive',
      })
    }
  }

  const handleClearKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
      setApiKey('') // Clear the input state
      setIsKeySaved(false) // Set saved status to false
      toast({
        title: 'API Key Cleared',
        description: 'Your Gemini API key has been removed from local storage.',
      })
    } else {
       toast({
        title: 'Error',
        description: 'Local storage is not available.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-4 p-4 border rounded-md">
      <div className="flex justify-between items-start">
        <div>
           <h3 className="text-lg font-medium">Gemini API Key</h3>
           <p className="text-sm text-muted-foreground">
            {isKeySaved
              ? "Your API key is stored locally in your browser."
              : "Enter your Google AI Studio API key."}
          </p>
        </div>
        {isKeySaved && (
            <Button variant="outline" size="sm" onClick={handleClearKey}>Clear Key</Button>
        )}
       </div>

      {!isKeySaved && (
        <div className="flex items-end space-x-2">
          <div className="flex-grow space-y-1">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password" // Use password type to obscure the key
              placeholder="Enter your Gemini API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <Button onClick={handleSaveKey}>Save Key</Button>
        </div>
      )}
       <p className="text-xs text-muted-foreground">
         Note: For production applications, API keys should be handled securely on the server-side, not stored in the browser.
      </p>
    </div>
  )
} 