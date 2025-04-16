"use client"

import { useEffect, useState } from "react"

export function LoadingAnimation() {
  const [dots, setDots] = useState("")
  const [message, setMessage] = useState("Generating flashcards with AI")
  const messages = [
    "Generating flashcards with AI",
    "Analyzing language patterns",
    "Creating examples",
    "Optimizing for learning",
    "Almost there",
  ]

  useEffect(() => {
    // Animate the dots
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : ""))
    }, 500)

    // Change the message every few seconds
    const messageInterval = setInterval(() => {
      setMessage((prev) => {
        const currentIndex = messages.indexOf(prev)
        return messages[(currentIndex + 1) % messages.length]
      })
    }, 3000)

    return () => {
      clearInterval(dotsInterval)
      clearInterval(messageInterval)
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute top-0 w-full h-full border-4 border-muted rounded-full"></div>
        <div className="absolute top-0 w-full h-full border-4 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
      <p className="text-foreground font-medium animate-pulse">
        {message}
        <span className="inline-block w-8">{dots}</span>
      </p>
    </div>
  )
}
