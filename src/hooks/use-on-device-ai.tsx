
"use client";

import { useState, useEffect } from 'react';

export type OnDeviceAIState = 'unsupported' | 'checking' | 'ready' | 'error';

export function useOnDeviceAI() {
  const [aiState, setAiState] = useState<OnDeviceAIState>('checking');

  useEffect(() => {
    async function checkAI() {
      if (typeof window === 'undefined' || !window.ai || !window.ai.canCreateTextRewriter) {
        console.log("On-device AI rewriter not supported by this browser.");
        setAiState('unsupported');
        return;
      }
      
      try {
        const state = await window.ai.canCreateTextRewriter();
        console.log("On-device AI rewriter availability state:", state);
        if (state === 'readily') {
          setAiState('ready');
        } else {
          setAiState('unsupported');
        }
      } catch (e) {
        console.error("Error checking on-device AI rewriter:", e);
        setAiState('error');
      }
    }
    
    const timeoutId = setTimeout(checkAI, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  return { aiState };
}
