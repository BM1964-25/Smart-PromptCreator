import type { PromptMode } from '../types/domain';

export async function checkOllama() {
  try {
    const response = await fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(1200) });
    if (!response.ok) return { available: false, models: [] as string[] };
    const data = await response.json();
    return { available: true, models: data.models?.map((model: { name: string }) => model.name) || [] };
  } catch {
    return { available: false, models: [] as string[] };
  }
}

export async function optimizeWithOllama(model: string, content: string, mode: PromptMode) {
  const response = await fetch('http://127.0.0.1:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      prompt: `Optimiere diesen Prompt fuer ${mode}. Antworte nur mit dem verbesserten Prompt.\n\n${content}`
    })
  });
  if (!response.ok) throw new Error('Ollama konnte den Prompt nicht optimieren.');
  const data = await response.json();
  return data.response?.trim() || '';
}
