import type { PromptMode } from '../types/domain';

const modeInstructions: Record<PromptMode, string> = {
  gpt: 'Optimiere fuer GPT-Modelle mit klarer Rolle, Kontext, Aufgabe, Constraints und Ausgabeformat.',
  claude: 'Optimiere fuer Claude mit ausfuehrlichem Kontext, klaren Kriterien und hilfreicher Schrittfolge.',
  midjourney: 'Erzeuge einen praezisen Midjourney-Prompt mit Motiv, Stil, Licht, Kamera, Komposition und Parametern.',
  coding: 'Erzeuge einen Coding-Prompt mit Ziel, Codebasis-Kontext, Akzeptanzkriterien, Tests und Randbedingungen.',
  marketing: 'Erzeuge einen Marketing-Prompt mit Zielgruppe, Angebot, Tonalitaet, Kanal, CTA und Varianten.'
};

export async function optimizeWithOpenAI(apiKey: string, content: string, mode: PromptMode, model = 'gpt-4.1-mini') {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content:
            'Du bist ein professioneller Prompt Engineer. Antworte nur mit dem optimierten Prompt, ohne Vorrede.'
        },
        {
          role: 'user',
          content: `${modeInstructions[mode]}\n\nAusgangsprompt:\n${content}`
        }
      ]
    })
  });

  if (!response.ok) throw new Error(`OpenAI Anfrage fehlgeschlagen (${response.status}).`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

export function optimizeLocally(content: string, mode: PromptMode) {
  return [
    `Rolle: Du bist ein erfahrener Spezialist fuer ${modeInstructions[mode].toLowerCase()}`,
    '',
    'Kontext:',
    content,
    '',
    'Aufgabe:',
    'Formuliere eine hochwertige Antwort mit klarer Struktur, konkreten Details und pruefbaren Ergebnissen.',
    '',
    'Ausgabeformat:',
    '- Ziel',
    '- Vorgehen',
    '- Anforderungen',
    '- Ergebnis'
  ].join('\n');
}
