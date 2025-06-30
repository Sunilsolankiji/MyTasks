
"use client";

import { useState, useEffect } from 'react';

export type OnDeviceAIState = 'unsupported' | 'checking' | 'ready' | 'error';

export function useOnDeviceAI() {
  const [rewriterState, setRewriterState] = useState<OnDeviceAIState>('checking');
  const [sessionState, setSessionState] = useState<OnDeviceAIState>('checking');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
        async function checkAI() {
            if (typeof window === 'undefined' || !window.ai) {
                console.log("On-device AI not supported by this browser.");
                setRewriterState('unsupported');
                setSessionState('unsupported');
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

            // Check for text session
            if (window.ai.canCreateTextSession) {
                try {
                    const state = await window.ai.canCreateTextSession();
                    console.log("On-device AI text session availability state:", state);
                    if (state === 'readily') {
                        setSessionState('ready');
                    } else {
                        setSessionState('unsupported');
                    }
                } catch (e) {
                    console.error("Error checking on-device AI text session:", e);
                    setSessionState('error');
                }
            } else {
                setSessionState('unsupported');
            }
        }
        checkAI();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

  return { rewriterState, sessionState };
}
