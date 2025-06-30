
interface AI {
  canCreateTextSession(): Promise<'readily' | 'after-download' | 'no'>;
  createTextSession(options?: { temperature?: number }): Promise<AITextSession>;

  canCreateTextRewriter(): Promise<'readily' | 'after-download' | 'no'>;
  createTextRewriter(): Promise<AITextRewriter>;
}

interface AITextSession {
  prompt(prompt: string): Promise<string>;
  promptStreaming(prompt: string): ReadableStream<string>;
  destroy(): void;
}

interface AITextRewriter {
  rewrite(
    input: string,
    options?: {
      tone?: 'formal' | 'casual' | 'empathetic';
      length?: 'shorter' | 'longer' | 'unchanged';
    }
  ): Promise<string>;
  close(): void;
}

declare global {
  interface Window {
    ai?: AI;
  }
}

export {};
