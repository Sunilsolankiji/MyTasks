
"use client";

import { useState, useEffect } from 'react';

export type OnDeviceAIState = 'unsupported' | 'checking' | 'ready' | 'error';

export function useOnDeviceAI() {
  const [rewriterState, setRewriterState] = useState<OnDeviceAIState>('checking');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
        async function checkAI() {
            if (typeof window === 'undefined' || !window.ai) {
                console.log("On-device AI not supported by this browser.");
                setRewriterState('unsupported');
                return;
            }

            // Check for rewriter
            if (window.ai.canCreateTextRewriter) {
                try {
                    const state = await window.ai.canCreateTextRewriter();
                    console.log("On-device AI rewriter availability state:", state);
                    if (state === 'readily') {
                        setRewriterState('ready');
                    } else {
                        setRewriterState('unsupported');
                    }
                } catch (e) {
                    console.error("Error checking on-device AI rewriter:", e);
                    setRewriterState('error');
                }
            } else {
                setRewriterState('unsupported');
            }
        }
        checkAI();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

  return { rewriterState };
}
