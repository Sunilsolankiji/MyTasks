interface AI {
  canCreateTextSession(): Promise<'readily' | 'after-download' | 'no'>;
  createTextSession(options?: { temperature?: number }): Promise<AITextSession>;
}

interface AITextSession {
  prompt(prompt: string): Promise<string>;
  promptStreaming(prompt: string): ReadableStream<string>;
  destroy(): void;
}

declare global {
  interface Window {
    ai?: AI;
  }
}

export {};
