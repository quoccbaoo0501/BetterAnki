"use client"

import React, { createContext, useState, useContext, ReactNode } from 'react';
import type { Flashcard } from "@/types/flashcard";

interface GenerationState {
  nativeLanguage: string | null;
  targetLanguage: string | null;
  prompt: string | null;
  generatedFlashcards: Flashcard[] | null;
  generationStatus: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
}

// Define the parameter type for clarity
interface GenerationParams {
    nativeLanguage: string;
    targetLanguage: string;
    prompt: string;
}

interface GenerationContextProps extends GenerationState {
  // Remove setGenerationParams if startGeneration handles setting params
  // setGenerationParams: (params: GenerationParams) => void;
  startGeneration: (params: GenerationParams) => void; // Updated signature
  setFlashcards: (flashcards: Flashcard[]) => void;
  setStatus: (status: GenerationState['generationStatus']) => void;
  setError: (error: string | null) => void;
  resetGeneration: () => void;
}

const GenerationContext = createContext<GenerationContextProps | undefined>(undefined);

const initialState: GenerationState = {
  nativeLanguage: null,
  targetLanguage: null,
  prompt: null,
  generatedFlashcards: null,
  generationStatus: 'idle',
  error: null,
};

export const GenerationProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<GenerationState>(initialState);

  // This function might become redundant if startGeneration sets the params
  // const setGenerationParams = (params: GenerationParams) => {
  //   setState(prev => ({ ...prev, ...params, generatedFlashcards: null, generationStatus: 'idle', error: null }));
  // };

  // Updated startGeneration to accept params
  const startGeneration = (params: GenerationParams) => {
    // Check passed params directly
    if (params.nativeLanguage && params.targetLanguage && params.prompt) {
       // Set state including params, status, and reset previous results/errors
       setState(prev => ({ 
           ...prev, 
           ...params, // Set languages and prompt
           generationStatus: 'loading', 
           generatedFlashcards: null, // Clear previous cards
           error: null // Clear previous errors
        }));
    } else {
        // Log the params that were received
        console.log("Attempted startGeneration with:", params);
        console.error("Cannot start generation without required parameters.");
        // Update state to reflect the error
        setState(prev => ({ 
            ...prev, 
            error: "Missing required parameters for generation.",
            generationStatus: 'error'
        }));
    }
  };

  const setFlashcards = (flashcards: Flashcard[]) => {
    setState(prev => ({ ...prev, generatedFlashcards: flashcards, generationStatus: 'success', error: null }));
  };

  const setStatus = (status: GenerationState['generationStatus']) => {
    setState(prev => ({ ...prev, generationStatus: status }));
  };

 const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error: error, generationStatus: error ? 'error' : prev.generationStatus }));
    if (error) {
       setState(prev => ({ ...prev, generationStatus: 'error'}));
    }
  };

  const resetGeneration = () => {
      setState(initialState);
  }

  // Update the context provider value
  return (
    <GenerationContext.Provider value={{ ...state, /* setGenerationParams, */ startGeneration, setFlashcards, setStatus, setError, resetGeneration }}>
      {children}
    </GenerationContext.Provider>
  );
};

export const useGenerationContext = () => {
  const context = useContext(GenerationContext);
  if (context === undefined) {
    throw new Error('useGenerationContext must be used within a GenerationProvider');
  }
  return context;
}; 