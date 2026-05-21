import type { OptimizerPreferences } from '../types/domain';
import { buildOptimizationPrompt } from './openaiService';

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

export async function optimizeWithOllama(model: string, content: string, preferences: OptimizerPreferences) {
  const response = await fetch('http://127.0.0.1:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      prompt: buildOptimizationPrompt(content, preferences)
    })
  });
  if (!response.ok) throw new Error('Ollama konnte den Prompt nicht optimieren.');
  const data = await response.json();
  return data.response?.trim() || '';
}
