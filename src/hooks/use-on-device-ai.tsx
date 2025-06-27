"use client";

import { useState, useEffect } from 'react';

export type OnDeviceAIState = 'unsupported' | 'checking' | 'ready' | 'error';

export function useOnDeviceAI() {
  const [aiState, setAiState] = useState<OnDeviceAIState>('checking');

  useEffect(() => {
    async function checkAI() {
      if (typeof window === 'undefined' || !window.ai || !window.ai.canCreateTextSession) {
        setAiState('unsupported');
        return;
      }
      
      try {
        const state = await window.ai.canCreateTextSession();
        if (state === 'readily') {
          setAiState('ready');
        } else {
          setAiState('unsupported');
        }
      } catch (e) {
        console.error("Error checking on-device AI:", e);
        setAiState('error');
      }
    }
    
    const timeoutId = setTimeout(checkAI, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  return { aiState };
}
