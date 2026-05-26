import Dexie, { type Table } from 'dexie';
import { defaultAnthropicModel, normalizeAnthropicModel } from '../services/anthropicService';
import type { Category, Prompt, Settings, WorkspaceTab } from '../types/domain';

const now = () => new Date().toISOString();
const samplePromptSeedKey = 'spc.samplePrompts.v2';
const germanUmlautMigrationKey = 'spc.germanUmlauts.v1';

export class PromptManagerDatabase extends Dexie {
  prompts!: Table<Prompt, string>;
  categories!: Table<Category, string>;
  tabs!: Table<WorkspaceTab, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super('smart-prompt-creator');
    this.version(1).stores({
      prompts: 'id, title, categoryId, tabId, favorite, *tags, updatedAt',
      categories: 'id, name, tabId, position',
      tabs: 'id, name, position',
      settings: 'id'
    });
  }
}

export const db = new PromptManagerDatabase();

let seedingPromise: Promise<void> | undefined;

export async function seedDatabase() {
  if (seedingPromise) return seedingPromise;
  seedingPromise = seedDatabaseOnce();
  return seedingPromise;
}

async function seedDatabaseOnce() {
  const tabCount = await db.tabs.count();

  const tabId = 'default-library';
  const codingTabId = 'default-production';
  const marketingCategoryId = 'default-marketing';
  const codingCategoryId = 'default-coding';
  const analysisCategoryId = 'default-analysis';
  const productivityCategoryId = 'default-productivity';
  const strategyCategoryId = 'default-strategy';
  const imageCategoryId = 'default-image-prompts';

  if (tabCount > 0) {
    await ensureCurrentSettings();
    await seedSamplePromptsOnce({
      tabId,
      codingTabId,
      marketingCategoryId,
      codingCategoryId,
      analysisCategoryId,
      productivityCategoryId,
      strategyCategoryId,
      imageCategoryId
    });
    await normalizeExistingGermanText();
    return;
  }

  await db.transaction('rw', db.tabs, db.categories, db.prompts, db.settings, async () => {
    await db.tabs.bulkAdd([
      { id: tabId, name: 'Bibliothek', position: 0 },
      { id: codingTabId, name: 'Produktion', position: 1 }
    ]);

    await db.categories.bulkAdd([
      { id: marketingCategoryId, name: 'Marketing', color: '#8f3f64', tabId, position: 0 },
      { id: analysisCategoryId, name: 'Analyse', color: '#315f8f', tabId, position: 1 },
      { id: productivityCategoryId, name: 'Produktivität', color: '#8a6a2f', tabId, position: 2 },
      { id: strategyCategoryId, name: 'Strategie', color: '#6f4f8f', tabId, position: 3 },
      { id: imageCategoryId, name: 'Bildprompts', color: '#2f7f7a', tabId, position: 4 },
      { id: codingCategoryId, name: 'Coding', color: '#256f63', tabId, position: 5 }
    ]);

    await db.prompts.bulkAdd(
      createSamplePrompts({
        tabId,
        codingTabId,
        marketingCategoryId,
        codingCategoryId,
        analysisCategoryId,
        productivityCategoryId,
        strategyCategoryId,
        imageCategoryId
      })
    );

    await db.settings.put({
      id: 'app',
      apiKeys: {},
      theme: 'system',
      language: 'de',
      anthropicModel: defaultAnthropicModel,
      license: { status: 'inactive' },
      backup: { autoBackup: false }
    });
  });

  markSamplePromptsSeeded();
  await normalizeExistingGermanText();
}

async function ensureCurrentSettings() {
  const settings = await db.settings.get('app');
  if (!settings) {
    await db.settings.put({
      id: 'app',
      apiKeys: {},
      theme: 'system',
      language: 'de',
      anthropicModel: defaultAnthropicModel,
      license: { status: 'inactive' },
      backup: { autoBackup: false }
    });
    return;
  }

  const normalizedModel = normalizeAnthropicModel(settings.anthropicModel);
  if (settings.anthropicModel !== normalizedModel) {
    await db.settings.update('app', { anthropicModel: normalizedModel });
  }
}

type SamplePromptIds = {
  tabId: string;
  codingTabId: string;
  marketingCategoryId: string;
  codingCategoryId: string;
  analysisCategoryId: string;
  productivityCategoryId: string;
  strategyCategoryId: string;
  imageCategoryId: string;
};

async function seedSamplePromptsOnce(ids: SamplePromptIds) {
  if (areSamplePromptsSeeded()) return;

  await db.transaction('rw', db.tabs, db.categories, db.prompts, async () => {
    await db.tabs.bulkPut([
      { id: ids.tabId, name: 'Bibliothek', position: 0 },
      { id: ids.codingTabId, name: 'Produktion', position: 1 }
    ]);

    await db.categories.bulkPut([
      { id: ids.marketingCategoryId, name: 'Marketing', color: '#8f3f64', tabId: ids.tabId, position: 0 },
      { id: ids.analysisCategoryId, name: 'Analyse', color: '#315f8f', tabId: ids.tabId, position: 1 },
      { id: ids.productivityCategoryId, name: 'Produktivität', color: '#8a6a2f', tabId: ids.tabId, position: 2 },
      { id: ids.strategyCategoryId, name: 'Strategie', color: '#6f4f8f', tabId: ids.tabId, position: 3 },
      { id: ids.imageCategoryId, name: 'Bildprompts', color: '#2f7f7a', tabId: ids.tabId, position: 4 },
      { id: ids.codingCategoryId, name: 'Coding', color: '#256f63', tabId: ids.tabId, position: 5 }
    ]);

    for (const prompt of createSamplePrompts(ids)) {
      const exists = await db.prompts.get(prompt.id!);
      if (exists) {
        await db.prompts.update(prompt.id!, {
          tabId: prompt.tabId,
          categoryId: prompt.categoryId,
          updatedAt: prompt.updatedAt
        });
      } else {
        await db.prompts.add(prompt);
      }
    }
  });

  markSamplePromptsSeeded();
}

function areSamplePromptsSeeded() {
  return typeof localStorage !== 'undefined' && localStorage.getItem(samplePromptSeedKey) === 'done';
}

function markSamplePromptsSeeded() {
  if (typeof localStorage !== 'undefined') localStorage.setItem(samplePromptSeedKey, 'done');
}

async function normalizeExistingGermanText() {
  if (typeof localStorage !== 'undefined' && localStorage.getItem(germanUmlautMigrationKey) === 'done') return;

  const prompts = await db.prompts.toArray();
  await db.transaction('rw', db.prompts, async () => {
    for (const prompt of prompts) {
      const nextPrompt: Prompt = {
        ...prompt,
        title: normalizeGermanText(prompt.title),
        description: normalizeGermanText(prompt.description),
        content: normalizeGermanText(prompt.content),
        optimizedContent: normalizeGermanText(prompt.optimizedContent),
        variants: prompt.variants?.map((variant) => ({
          ...variant,
          title: normalizeGermanText(variant.title),
          description: normalizeGermanText(variant.description),
          content: normalizeGermanText(variant.content)
        })),
        history: prompt.history.map((revision) => ({
          ...revision,
          content: normalizeGermanText(revision.content),
          optimizedContent: normalizeGermanText(revision.optimizedContent)
        }))
      };

      if (JSON.stringify(nextPrompt) !== JSON.stringify(prompt)) {
        await db.prompts.put(nextPrompt);
      }
    }
  });

  if (typeof localStorage !== 'undefined') localStorage.setItem(germanUmlautMigrationKey, 'done');
}

function normalizeGermanText(value: string) {
  const replacements: Array<[string, string]> = [
    ['ueber', 'über'],
    ['Ueber', 'Über'],
    ['fuer', 'für'],
    ['Fuer', 'Für'],
    ['Schluessel', 'Schlüssel'],
    ['schluessel', 'schlüssel'],
    ['verschluesselt', 'verschlüsselt'],
    ['gueltig', 'gültig'],
    ['ungueltig', 'ungültig'],
    ['geprueft', 'geprüft'],
    ['pruefen', 'prüfen'],
    ['pruefe', 'prüfe'],
    ['waehlen', 'wählen'],
    ['Waehle', 'Wähle'],
    ['ausfuehrlich', 'ausführlich'],
    ['Ausfuehrlich', 'Ausführlich'],
    ['ausschliesslich', 'ausschließlich'],
    ['ueberzeugend', 'überzeugend'],
    ['Unterstuetzung', 'Unterstützung'],
    ['praezise', 'präzise'],
    ['Praezise', 'Präzise'],
    ['Praezision', 'Präzision'],
    ['Luecken', 'Lücken'],
    ['ergaenzen', 'ergänzen'],
    ['ergaenze', 'ergänze'],
    ['verlaesslich', 'verlässlich'],
    ['Rueckfragen', 'Rückfragen'],
    ['Rueckfrage', 'Rückfrage'],
    ['Erklaerung', 'Erklärung'],
    ['Staerke', 'Stärke'],
    ['geloescht', 'gelöscht'],
    ['loeschen', 'löschen'],
    ['hinzufuegen', 'hinzufügen'],
    ['koennen', 'können'],
    ['benoetigt', 'benötigt'],
    ['duerfen', 'dürfen'],
    ['Vorschlaege', 'Vorschläge'],
    ['Regelmaessig', 'Regelmäßig'],
    ['groesseren', 'größeren'],
    ['Aufraeumarbeiten', 'Aufräumarbeiten'],
    ['sorgfaeltig', 'sorgfältig'],
    ['spaeter', 'später'],
    ['Eintraege', 'Einträge'],
    ['Faelligkeiten', 'Fälligkeiten'],
    ['naechste', 'nächste'],
    ['Massnahmen', 'Maßnahmen'],
    ['Gegenmassnahme', 'Gegenmaßnahme'],
    ['Fruehwarn', 'Frühwarn'],
    ['Rueckmelde', 'Rückmelde'],
    ['hoeflicher', 'höflicher'],
    ['Suchbeduerfnis', 'Suchbedürfnis'],
    ['Laenge', 'Länge'],
    ['Absaetze', 'Absätze']
  ];

  return replacements.reduce((text, [from, to]) => text.split(from).join(to), value);
}

function createSamplePrompts(ids: SamplePromptIds): Prompt[] {
  const timestamp = now();
  const base = {
    favorite: false,
    version: 1,
    history: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };

  return [
    {
      ...base,
      id: 'sample-seo-blog-article',
      title: 'SEO-Blogartikel erstellen',
      description: 'Erzeugt einen strukturierten SEO-Blogartikel mit Suchintention, Gliederung und Meta-Daten.',
      content: 'Schreibe einen SEO-Blogartikel zu folgendem Thema: [Thema]. Zielgruppe: [Zielgruppe].',
      optimizedContent:
        'Erstelle einen professionellen SEO-Blogartikel zum Thema [Thema] für die Zielgruppe [Zielgruppe]. Analysiere zuerst Suchintention, Hauptkeyword, Nebenkeywords und Leserbeduerfnis. Erstelle danach eine klare H1/H2/H3-Gliederung, Meta-Title, Meta-Description, Einleitung, Hauptteil mit Beispielen, FAQ-Bereich und Fazit mit Handlungsaufforderung. Schreibe präzise, gut scanbar und ohne Keyword-Stuffing.',
      categoryId: ids.marketingCategoryId,
      tabId: ids.tabId,
      tags: ['seo', 'blog', 'marketing', 'content']
    },
    {
      ...base,
      id: 'sample-linkedin-thought-leadership',
      title: 'LinkedIn Thought-Leadership-Post',
      description: 'Formuliert einen pointierten LinkedIn-Beitrag mit Hook, Perspektive und CTA.',
      content: 'Erstelle einen LinkedIn-Post über [Thema] für [Zielgruppe].',
      optimizedContent:
        'Schreibe einen LinkedIn Thought-Leadership-Post über [Thema] für [Zielgruppe]. Beginne mit einem starken Hook, formuliere eine klare These, erklaere den Nutzen anhand eines konkreten Beispiels und schliesse mit einer Frage oder einem dezenten CTA. Ton: professionell, klar, meinungsstark. Länge: 1.200 bis 1.800 Zeichen. Verwende kurze Absätze und maximal drei passende Hashtags.',
      categoryId: ids.marketingCategoryId,
      tabId: ids.tabId,
      tags: ['linkedin', 'social-media', 'positionierung']
    },
    {
      ...base,
      id: 'sample-customer-email',
      title: 'Professionelle Kunden-E-Mail',
      description: 'Schreibt eine klare, freundliche Kunden-E-Mail für schwierige oder wichtige Situationen.',
      content: 'Formuliere eine Kunden-E-Mail zu folgender Situation: [Situation]. Ziel: [Ziel].',
      optimizedContent:
        'Formuliere eine professionelle Kunden-E-Mail zur Situation [Situation]. Ziel der E-Mail ist [Ziel]. Schreibe freundlich, verbindlich und klar. Struktur: Betreff, kurze Einordnung, Kernaussage, konkrete nächste Schritte, Termin- oder Rückmeldewunsch, höflicher Abschluss. Vermeide Schuldzuweisungen, Floskeln und unklare Formulierungen.',
      categoryId: ids.productivityCategoryId,
      tabId: ids.tabId,
      tags: ['e-mail', 'kundenkommunikation', 'produktivität']
    },
    {
      ...base,
      id: 'sample-meeting-summary',
      title: 'Meeting-Protokoll mit To-dos',
      description: 'Verdichtet Notizen zu Entscheidungen, Aufgaben, Risiken und nächsten Schritten.',
      content: 'Erstelle aus diesen Meeting-Notizen ein strukturiertes Protokoll: [Notizen].',
      optimizedContent:
        'Wandle die folgenden Meeting-Notizen in ein strukturiertes Protokoll um: [Notizen]. Gliedere das Ergebnis in: Kurzfazit, besprochene Punkte, Entscheidungen, offene Fragen, Risiken, Aufgaben mit Verantwortlichen und Fälligkeiten sowie nächste Schritte. Markiere unklare Informationen als Rückfrage. Schreibe sachlich, knapp und umsetzungsorientiert.',
      categoryId: ids.productivityCategoryId,
      tabId: ids.tabId,
      tags: ['meeting', 'protokoll', 'todo', 'organisation']
    },
    {
      ...base,
      id: 'sample-project-risk-analysis',
      title: 'Projekt-Risikoanalyse',
      description: 'Identifiziert Projektrisiken mit Eintrittswahrscheinlichkeit, Auswirkung und Maßnahmen.',
      content: 'Analysiere die Risiken für folgendes Projekt: [Projektbeschreibung].',
      optimizedContent:
        'Analysiere die Risiken für folgendes Projekt: [Projektbeschreibung]. Erstelle eine Tabelle mit Risiko, Ursache, Eintrittswahrscheinlichkeit, Auswirkung, Frühwarnindikator, Gegenmaßnahme, Verantwortlichem und Rest-Risiko. Priorisiere die Top-5-Risiken und formuliere konkrete Handlungsempfehlungen für die nächsten zwei Wochen.',
      categoryId: ids.analysisCategoryId,
      tabId: ids.tabId,
      tags: ['risikoanalyse', 'projektmanagement', 'bewertung']
    },
    {
      ...base,
      id: 'sample-strategy-briefing',
      title: 'Strategie-Briefing vorbereiten',
      description: 'Erstellt ein Management-Briefing mit Lagebild, Optionen und Empfehlung.',
      content: 'Erstelle ein Strategie-Briefing zu folgendem Thema: [Thema].',
      optimizedContent:
        'Erstelle ein präzises Strategie-Briefing zu [Thema] für ein Management-Publikum. Struktur: Ausgangslage, Zielbild, relevante Annahmen, Chancen, Risiken, drei Handlungsoptionen mit Vor- und Nachteilen, empfohlene Option, Entscheidungsbedarf und nächste Schritte. Schreibe knapp, faktenorientiert und entscheidungsreif.',
      categoryId: ids.strategyCategoryId,
      tabId: ids.tabId,
      tags: ['strategie', 'management', 'briefing', 'entscheidung']
    },
    {
      ...base,
      id: 'sample-feature-specification',
      title: 'Feature-Spezifikation',
      description: 'Beschreibt ein Software-Feature mit Nutzerziel, Akzeptanzkriterien und Randfaellen.',
      content: 'Erstelle eine Feature-Spezifikation für: [Feature-Idee].',
      optimizedContent:
        'Erstelle eine produktionsnahe Feature-Spezifikation für [Feature-Idee]. Beschreibe Zielgruppe, Problem, Nutzerziel, User Stories, funktionale Anforderungen, Nicht-Ziele, Akzeptanzkriterien, Randfaelle, Fehlermeldungen, Datenschutzaspekte und offene Fragen. Formatiere klar in Markdown und priorisiere Muss-/Soll-/Kann-Anforderungen.',
      categoryId: ids.codingCategoryId,
      tabId: ids.tabId,
      tags: ['produkt', 'spezifikation', 'requirements', 'software']
    },
    {
      ...base,
      id: 'sample-code-review',
      title: 'Code-Review-Assistent',
      description: 'Prueft Code auf Fehler, Wartbarkeit, Sicherheit und fehlende Tests.',
      content: 'Fuehre ein Code Review für folgenden Code durch: [Code].',
      optimizedContent:
        'Fuehre ein strenges Code Review für den folgenden Code durch: [Code]. Priorisiere konkrete Bugs, Sicherheitsrisiken, Regressionen, Performance-Probleme, Wartbarkeit und fehlende Tests. Gib Findings nach Schweregrad sortiert aus. Nenne Datei/Zeile, erklaere die Auswirkung und schlage eine konkrete Korrektur vor. Verzichte auf Stilfragen ohne echten Nutzen.',
      categoryId: ids.codingCategoryId,
      tabId: ids.tabId,
      tags: ['code-review', 'qualität', 'tests', 'security']
    },
    {
      ...base,
      id: 'sample-debugging',
      title: 'Debugging-Analyse',
      description: 'Hilft bei der systematischen Ursachenanalyse für Fehler und unerwartetes Verhalten.',
      content: 'Hilf mir beim Debugging dieses Problems: [Fehlerbeschreibung].',
      optimizedContent:
        'Analysiere folgendes Softwareproblem systematisch: [Fehlerbeschreibung]. Frage zuerst nach fehlenden Informationen, falls Ursache, Umgebung oder Reproduktionsschritte unklar sind. Erstelle dann Hypothesen nach Wahrscheinlichkeit, konkrete Pruefschritte, moegliche Fixes und Tests zur Verifikation. Trenne Beobachtung, Annahme und Empfehlung klar voneinander.',
      categoryId: ids.codingCategoryId,
      tabId: ids.tabId,
      tags: ['debugging', 'analyse', 'entwicklung']
    },
    {
      ...base,
      id: 'sample-image-prompt',
      title: 'Bildprompt für KI-Generatoren',
      description: 'Erzeugt präzise Bildprompts mit Motiv, Stil, Licht, Kamera und Negativvorgaben.',
      content: 'Erstelle einen Bildprompt für folgendes Motiv: [Motiv].',
      optimizedContent:
        'Erstelle einen hochwertigen Bildprompt für [Motiv]. Beschreibe Hauptmotiv, Umgebung, Komposition, Perspektive, Lichtstimmung, Farbwelt, Materialitaet, Detailgrad und Stilreferenz. Fuege technische Angaben wie Seitenverhältnis, Kamerablick, Schaerfentiefe und Qualitaetsniveau hinzu. Ergänze eine kurze Negativliste für unerwuenschte Elemente wie Textartefakte, Verzerrungen oder unruhige Hintergruende.',
      categoryId: ids.imageCategoryId,
      tabId: ids.tabId,
      tags: ['bildprompt', 'midjourney', 'design', 'ki-bild']
    }
  ];
}
