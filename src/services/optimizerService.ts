import type { OptimizerPreferences, PromptVariantTone } from '../types/domain';

const goalLabels: Record<OptimizerPreferences['goal'], string> = {
  writing: 'Schreiben und redaktionelle Arbeit',
  coding: 'Softwareentwicklung und Code-Aufgaben',
  marketing: 'Marketing, Kampagnen und Verkauf',
  analysis: 'Analyse, Recherche und Entscheidungsunterstützung',
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
  precise: 'präzise und eindeutig',
  professional: 'professionell und ruhig',
  creative: 'kreativ und ideenreich',
  concise: 'kurz und direkt',
  detailed: 'ausführlich und strukturiert',
  persuasive: 'überzeugend und aktivierend'
};

const formatLabels: Record<OptimizerPreferences['format'], string> = {
  markdown: 'Markdown mit klaren Abschnitten',
  list: 'kompakte Liste',
  table: 'Tabelle',
  json: 'valides JSON',
  steps: 'Schritt-für-Schritt-Anleitung',
  freeform: 'freier, gut lesbarer Prompt'
};

const strengthLabels: Record<OptimizerPreferences['strength'], string> = {
  fast: 'schnell verbessern, nur offensichtliche Lücken schließen',
  balanced: 'ausgewogen optimieren, Struktur und Präzision verbessern',
  premium: 'maximal hochwertig optimieren, Rollen, Kontext, Kriterien, Beispiele und Ausgabeformat ergänzen'
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
    'Optimiere den folgenden Prompt so, dass ein KI-System damit bessere, verlässlichere und konkretere Ergebnisse erzeugt.',
    '',
    `Ziel: ${goalLabels[preferences.goal]}`,
    `Zielgruppe: ${audienceLabels[preferences.audience]}`,
    `Stil: ${toneLabels[preferences.tone]}`,
    `Ausgabeformat: ${formatLabels[preferences.format]}`,
    `Optimierungsstärke: ${strengthLabels[preferences.strength]}`,
    languageInstruction,
    preferences.askClarifyingQuestions
      ? 'Wenn wichtige Informationen fehlen, ergänze am Ende einen kurzen Abschnitt "Rückfragen".'
      : 'Triff sinnvolle Annahmen, wenn Details fehlen, und markiere sie knapp im Prompt.',
    '',
    'Der optimierte Prompt soll direkt nutzbar sein. Gib nur den verbesserten Prompt aus, keine Erklärung.',
    '',
    'Ausgangsprompt:',
    content
  ].join('\n');
}

export function optimizeLocally(content: string, preferences: OptimizerPreferences) {
  return [
    `Rolle: Du bist ein erfahrener Prompt Engineer für ${goalLabels[preferences.goal]}.`,
    '',
    'Kontext:',
    content,
    '',
    'Aufgabe:',
    `Formuliere diesen Prompt ${toneLabels[preferences.tone]} für ${audienceLabels[preferences.audience]}.`,
    `Optimiere ihn ${strengthLabels[preferences.strength]}.`,
    '',
    'Ausgabeformat:',
    formatLabels[preferences.format],
    '',
    'Erwartetes Ergebnis:',
    '- Klare Rolle',
    '- Präziser Kontext',
    '- Konkrete Aufgabe',
    '- Relevante Anforderungen',
    '- Eindeutiges Ausgabeformat'
  ].join('\n');
}

export function buildVariantOptimizationPrompt(content: string, preferences: OptimizerPreferences, tone: PromptVariantTone) {
  const variantInstruction =
    tone === 'compact'
      ? [
          'Erzeuge eine KOMPAKTE Prompt-Variante.',
          'Reduziere auf das Wesentliche, entferne Wiederholungen und mache Ziel, Aufgabe und Ausgabe eindeutig.',
          'Nutze genau diese Struktur: Rolle, Ziel, Aufgaben, Ausgabeformat, Qualitätsanforderungen.',
          'Schreibe Abschnittsüberschriften immer alleinstehend mit Doppelpunkt, z. B. "Rolle:" und den dazugehörigen Text erst in der nächsten Zeile.',
          'Halte den Prompt kurz und direkt kopierbar.'
        ]
      : [
          'Erzeuge eine PREMIUM Prompt-Variante nach dieser Masterstruktur:',
          'Rolle: Du bist ...',
          'Ziel: Erstelle / analysiere / entwickle [konkretes Ergebnis], damit [Nutzen/Entscheidung/Anwendung].',
          'Kontext: Branche, Zielgruppe, Projekt, Hintergrund, Rahmenbedingungen.',
          'Aufgaben: 1., 2., 3.',
          'Ausgabeformat: Format, Länge, Stil, Sprache.',
          'Qualitätsanforderungen: präzise, analytisch, professionell, keine Floskeln, Annahmen kennzeichnen, fehlende Informationen als Rückfragen ausgeben, keine erfundenen Fakten.',
          'Der Abschnitt Ziel muss explizit vorhanden und konkret formuliert sein.',
          'Schreibe Abschnittsüberschriften immer alleinstehend mit Doppelpunkt, z. B. "Rolle:" und den dazugehörigen Text erst in der nächsten Zeile.',
          'Verwende keine Markdown-Überschriften mit # oder ##.'
        ];

  return [
    ...variantInstruction,
    '',
    `Fachlicher Zweck: ${goalLabels[preferences.goal]}`,
    `Zielgruppe: ${audienceLabels[preferences.audience]}`,
    `Gewünschter Stil: ${toneLabels[preferences.tone]}`,
    `Gewünschtes Ausgabeformat: ${formatLabels[preferences.format]}`,
    '',
    'Ausgangsprompt:',
    content
  ].join('\n');
}

export function optimizeVariantLocally(content: string, preferences: OptimizerPreferences, tone: PromptVariantTone) {
  if (tone === 'compact') {
    return [
      'Rolle:',
      `Du bist ein erfahrener Prompt Engineer für ${goalLabels[preferences.goal]}.`,
      '',
      'Ziel:',
      `Erstelle einen klaren, direkt nutzbaren Prompt für ${audienceLabels[preferences.audience]}, damit das gewünschte Ergebnis ohne Nachfragen erzeugt werden kann.`,
      '',
      'Aufgaben:',
      '1. Schärfe die Ausgangsidee auf eine konkrete Aufgabe.',
      '2. Entferne Unschärfen, Wiederholungen und unnötige Details.',
      '3. Formuliere die erwartete Ausgabe eindeutig.',
      '',
      'Ausgabeformat:',
      `- Format: ${formatLabels[preferences.format]}`,
      '- Länge: kompakt',
      `- Stil: ${toneLabels[preferences.tone]}`,
      `- Sprache: ${preferences.language === 'en' ? 'Englisch' : preferences.language === 'de' ? 'Deutsch' : 'wie Ausgangsprompt'}`,
      '',
      'Qualitätsanforderungen:',
      '- präzise',
      '- professionell',
      '- keine Floskeln',
      '- direkt kopierbar',
      '',
      'Ausgangsprompt:',
      content
    ].join('\n');
  }

  return [
    `Rolle:\nDu bist ein erfahrener Prompt Engineer für ${goalLabels[preferences.goal]}.`,
    '',
    'Ziel:',
    `Erstelle einen hochwertigen Prompt für ${audienceLabels[preferences.audience]}, damit ein KI-System ein belastbares, konkret nutzbares Ergebnis liefern kann.`,
    '',
    'Kontext:',
    '- Branche: [falls relevant ergänzen]',
    `- Zielgruppe: ${audienceLabels[preferences.audience]}`,
    '- Projekt: [Projekt oder Anwendungsfall ergänzen]',
    '- Hintergrund: [wichtige Ausgangslage ergänzen]',
    '- Rahmenbedingungen: [Constraints, Tools, Datenlage oder Grenzen ergänzen]',
    '',
    'Aufgaben:',
    '1. Analysiere den Ausgangsprompt und identifiziere das gewünschte Ergebnis.',
    '2. Formuliere daraus einen klaren Arbeitsauftrag mit explizitem Ziel.',
    '3. Ergänze Anforderungen, Annahmen und Rückfragen, damit die Ausgabe zuverlässig wird.',
    '',
    'Ausgabeformat:',
    `- Format: ${formatLabels[preferences.format]}`,
    '- Länge: ausführlich genug für ein hochwertiges Ergebnis',
    `- Stil: ${toneLabels[preferences.tone]}`,
    `- Sprache: ${preferences.language === 'en' ? 'Englisch' : preferences.language === 'de' ? 'Deutsch' : 'wie Ausgangsprompt'}`,
    '',
    'Qualitätsanforderungen:',
    '- präzise',
    '- analytisch',
    '- professionell',
    '- keine Floskeln',
    '- Annahmen kennzeichnen',
    '- fehlende Informationen als Rückfragen ausgeben',
    '- keine erfundenen Fakten',
    '',
    'Ausgangsprompt:',
    content
  ].join('\n');
}
