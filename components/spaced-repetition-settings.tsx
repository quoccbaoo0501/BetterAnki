"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Settings } from "lucide-react"
import type { RepetitionConfig } from "@/types/flashcard"
import { getRepetitionConfig, saveRepetitionConfig } from "@/lib/storage"

export default function SpacedRepetitionSettings() {
  const [open, setOpen] = useState(false)
  const [config, setConfig] = useState<RepetitionConfig>({
    again: 10,
    hard: 1,
    good: 1,
    easy: 4,
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedConfig = getRepetitionConfig()
      setConfig(savedConfig)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveRepetitionConfig(config)
    setOpen(false)
  }

  const handleChange = (key: keyof RepetitionConfig, value: string) => {
    const numValue = Number.parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 0) {
      setConfig((prev) => ({ ...prev, [key]: numValue }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Review Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Spaced Repetition Settings</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="again">Again (minutes)</Label>
            <Input
              id="again"
              type="number"
              min="1"
              value={config.again}
              onChange={(e) => handleChange("again", e.target.value)}
              placeholder="Minutes until review"
            />
            <p className="text-xs text-slate-500">How long to wait before reviewing cards you don't know</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hard">Hard (hours)</Label>
            <Input
              id="hard"
              type="number"
              min="1"
              value={config.hard}
              onChange={(e) => handleChange("hard", e.target.value)}
              placeholder="Hours until review"
            />
            <p className="text-xs text-slate-500">How long to wait for cards that were difficult</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="good">Good (days)</Label>
            <Input
              id="good"
              type="number"
              min="1"
              value={config.good}
              onChange={(e) => handleChange("good", e.target.value)}
              placeholder="Days until review"
            />
            <p className="text-xs text-slate-500">How long to wait for cards you knew well</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="easy">Easy (days)</Label>
            <Input
              id="easy"
              type="number"
              min="1"
              value={config.easy}
              onChange={(e) => handleChange("easy", e.target.value)}
              placeholder="Days until review"
            />
            <p className="text-xs text-slate-500">How long to wait for cards you knew perfectly</p>
          </div>

          <div className="flex justify-end">
            <Button type="submit">Save Settings</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
