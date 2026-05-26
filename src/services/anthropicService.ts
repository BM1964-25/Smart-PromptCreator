import type { Category, OptimizerPreferences } from '../types/domain';
import { localApiUrl, parseProxyError } from './localProxy';
import { buildOptimizationPrompt } from './optimizerService';

const testModel = 'claude-3-5-haiku-latest';

export interface AnthropicTestResult {
  ok: boolean;
  message: string;
}

export interface PromptMetadataSuggestion {
  title?: string;
  description?: string;
  categoryName: string;
  tags: string[];
}

async function postAnthropicMessage(apiKey: string, payload: Record<string, unknown>) {
  const response = await fetch(localApiUrl('/api/anthropic/messages'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: apiKey.trim(), payload })
  });

  if (!response.ok) {
    throw new Error(await parseProxyError(response));
  }

  return response.json();
}

export async function optimizeWithAnthropic(apiKey: string, content: string, preferences: OptimizerPreferences, model = testModel) {
  const data = await postAnthropicMessage(apiKey, {
    model,
    max_tokens: preferences.strength === 'premium' ? 1800 : 1000,
    temperature: preferences.strength === 'premium' ? 0.5 : 0.35,
    system: 'Du bist ein professioneller Prompt Engineer. Antworte nur mit dem optimierten Prompt, ohne Vorrede.',
    messages: [
      {
        role: 'user',
        content: buildOptimizationPrompt(content, preferences)
      }
    ]
  });
  return data?.content?.[0]?.text?.trim() || '';
}

export async function testAnthropicConnection(apiKey: string): Promise<AnthropicTestResult> {
  if (!apiKey.trim()) {
    return { ok: false, message: 'Bitte zuerst einen Anthropic API-Schlüssel eingeben.' };
  }

  try {
    const data = await postAnthropicMessage(apiKey, {
      model: testModel,
      max_tokens: 16,
      messages: [
        {
          role: 'user',
          content: 'Reply with exactly: connection-ok'
        }
      ]
    });
    const text = data?.content?.[0]?.text || '';
    return {
      ok: text.toLowerCase().includes('connection-ok'),
      message: text ? 'Verbindung erfolgreich geprüft.' : 'Verbindung hergestellt, aber ohne Testantwort.'
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Netzwerkfehler';
    const corsHint = message.toLowerCase().includes('failed to fetch')
      ? 'Der lokale KI-Proxy ist nicht erreichbar. Bitte die App über den Starter oder mit npm start starten.'
      : message;
    return { ok: false, message: corsHint };
  }
}

export async function suggestPromptMetadataWithAnthropic(
  apiKey: string,
  content: string,
  optimizedContent: string,
  categories: Category[],
  model = testModel
): Promise<PromptMetadataSuggestion> {
  const knownCategories = categories.map((category) => category.name).join(', ') || 'keine vorhandenen Kategorien';
  const data = await postAnthropicMessage(apiKey, {
    model,
    max_tokens: 450,
    temperature: 0.2,
    system:
      'Du kategorisierst Prompts für eine lokale Prompt-Bibliothek. Antworte ausschließlich mit validem JSON ohne Markdown.',
    messages: [
      {
        role: 'user',
        content: [
          'Analysiere diesen Prompt und schlage passende Speicher-Metadaten vor.',
          `Vorhandene Kategorien: ${knownCategories}`,
          '',
          'Regeln:',
          '- Wähle wenn sinnvoll eine vorhandene Kategorie.',
          '- Wenn keine vorhandene Kategorie passt, schlage eine kurze neue Kategorie vor.',
          '- Erzeuge eine knappe Beschreibung in einem Satz.',
          '- Erzeuge 3 bis 6 kurze Tags, lowercase, ohne #, keine Duplikate.',
          '- Erzeuge einen kurzen, klaren Titel.',
          '',
          'JSON-Format:',
          '{"title":"...","description":"...","categoryName":"...","tags":["tag","tag"]}',
          '',
          'Originalprompt:',
          content,
          '',
          'Optimierter Prompt, falls vorhanden:',
          optimizedContent || 'Nicht vorhanden'
        ].join('\n')
      }
    ]
  });
  const text = String(data?.content?.[0]?.text || '').trim();
  const parsed = JSON.parse(text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, ''));

  return {
    title: typeof parsed.title === 'string' ? parsed.title.trim() : undefined,
    description: typeof parsed.description === 'string' ? parsed.description.trim() : undefined,
    categoryName: typeof parsed.categoryName === 'string' ? parsed.categoryName.trim() : 'Allgemein',
    tags: Array.isArray(parsed.tags)
      ? parsed.tags
          .map((tag: unknown) => String(tag).trim().replace(/^#/, '').toLowerCase())
          .filter(Boolean)
          .slice(0, 8)
      : []
  };
}
