import type { OptimizerPreferences } from '../types/domain';

const goalLabels: Record<OptimizerPreferences['goal'], string> = {
  writing: 'Schreiben und redaktionelle Arbeit',
  coding: 'Softwareentwicklung und Code-Aufgaben',
  marketing: 'Marketing, Kampagnen und Verkauf',
  analysis: 'Analyse, Recherche und Entscheidungsunterstuetzung',
  image: 'Bildgenerierung und visuelle Prompts',
  automation: 'Automatisierung, Workflows und Agenten'
};

const audienceLabels: Record<OptimizerPreferences['audience'], string> = {
  general: 'allgemeine Nutzer',
  beginner: 'Einsteiger ohne Fachwissen',
  expert: 'Fachexperten',
  customer: 'Kunden oder externe Stakeholder',
  management: 'Management und Entscheider',
  developer: 'Entwickler und technische Teams'
};

const toneLabels: Record<OptimizerPreferences['tone'], string> = {
  precise: 'praezise und eindeutig',
  professional: 'professionell und ruhig',
  creative: 'kreativ und ideenreich',
  concise: 'kurz und direkt',
  detailed: 'ausfuehrlich und strukturiert',
  persuasive: 'ueberzeugend und aktivierend'
};

const formatLabels: Record<OptimizerPreferences['format'], string> = {
  markdown: 'Markdown mit klaren Abschnitten',
  list: 'kompakte Liste',
  table: 'Tabelle',
  json: 'valides JSON',
  steps: 'Schritt-fuer-Schritt-Anleitung',
  freeform: 'freier, gut lesbarer Prompt'
};

const strengthLabels: Record<OptimizerPreferences['strength'], string> = {
  fast: 'schnell verbessern, nur offensichtliche Luecken schliessen',
  balanced: 'ausgewogen optimieren, Struktur und Praezision verbessern',
  premium: 'maximal hochwertig optimieren, Rollen, Kontext, Kriterien, Beispiele und Ausgabeformat ergaenzen'
};

export const defaultOptimizerPreferences: OptimizerPreferences = {
  goal: 'writing',
  audience: 'general',
  tone: 'professional',
  format: 'markdown',
  strength: 'balanced',
  language: 'auto',
  askClarifyingQuestions: false
};

export function buildOptimizationPrompt(content: string, preferences: OptimizerPreferences) {
  const languageInstruction =
    preferences.language === 'auto'
      ? 'Erkenne die Sprache des Ausgangsprompts und behalte sie bei.'
      : preferences.language === 'de'
        ? 'Schreibe den optimierten Prompt auf Deutsch.'
        : 'Write the optimized prompt in English.';

  return [
    'Optimiere den folgenden Prompt so, dass ein KI-System damit bessere, verlaesslichere und konkretere Ergebnisse erzeugt.',
    '',
    `Ziel: ${goalLabels[preferences.goal]}`,
    `Zielgruppe: ${audienceLabels[preferences.audience]}`,
    `Stil: ${toneLabels[preferences.tone]}`,
    `Ausgabeformat: ${formatLabels[preferences.format]}`,
    `Optimierungsstaerke: ${strengthLabels[preferences.strength]}`,
    languageInstruction,
    preferences.askClarifyingQuestions
      ? 'Wenn wichtige Informationen fehlen, ergaenze am Ende einen kurzen Abschnitt "Rueckfragen".'
      : 'Triff sinnvolle Annahmen, wenn Details fehlen, und markiere sie knapp im Prompt.',
    '',
    'Der optimierte Prompt soll direkt nutzbar sein. Gib nur den verbesserten Prompt aus, keine Erklaerung.',
    '',
    'Ausgangsprompt:',
    content
  ].join('\n');
}

export async function optimizeWithOpenAI(apiKey: string, content: string, preferences: OptimizerPreferences, model = 'gpt-4.1-mini') {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: preferences.strength === 'premium' ? 0.5 : 0.35,
      messages: [
        {
          role: 'system',
          content:
            'Du bist ein professioneller Prompt Engineer. Antworte nur mit dem optimierten Prompt, ohne Vorrede.'
        },
        {
          role: 'user',
          content: buildOptimizationPrompt(content, preferences)
        }
      ]
    })
  });

  if (!response.ok) throw new Error(`OpenAI Anfrage fehlgeschlagen (${response.status}).`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

export function optimizeLocally(content: string, preferences: OptimizerPreferences) {
  return [
    `Rolle: Du bist ein erfahrener Prompt Engineer fuer ${goalLabels[preferences.goal]}.`,
    '',
    'Kontext:',
    content,
    '',
    'Aufgabe:',
    `Formuliere diesen Prompt ${toneLabels[preferences.tone]} fuer ${audienceLabels[preferences.audience]}.`,
    `Optimiere ihn ${strengthLabels[preferences.strength]}.`,
    '',
    'Ausgabeformat:',
    formatLabels[preferences.format],
    '',
    'Erwartetes Ergebnis:',
    '- Klare Rolle',
    '- Praeziser Kontext',
    '- Konkrete Aufgabe',
    '- Relevante Anforderungen',
    '- Eindeutiges Ausgabeformat'
  ].join('\n');
}
