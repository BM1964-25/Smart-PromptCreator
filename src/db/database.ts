import Dexie, { type Table } from 'dexie';
import type { Category, Prompt, Settings, WorkspaceTab } from '../types/domain';

const now = () => new Date().toISOString();
const samplePromptSeedKey = 'spc.samplePrompts.v2';

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
      anthropicModel: 'claude-3-5-haiku-latest',
      license: { status: 'inactive' },
      backup: { autoBackup: false }
    });
  });

  markSamplePromptsSeeded();
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
        'Erstelle einen professionellen SEO-Blogartikel zum Thema [Thema] fuer die Zielgruppe [Zielgruppe]. Analysiere zuerst Suchintention, Hauptkeyword, Nebenkeywords und Leserbeduerfnis. Erstelle danach eine klare H1/H2/H3-Gliederung, Meta-Title, Meta-Description, Einleitung, Hauptteil mit Beispielen, FAQ-Bereich und Fazit mit Handlungsaufforderung. Schreibe praezise, gut scanbar und ohne Keyword-Stuffing.',
      categoryId: ids.marketingCategoryId,
      tabId: ids.tabId,
      tags: ['seo', 'blog', 'marketing', 'content']
    },
    {
      ...base,
      id: 'sample-linkedin-thought-leadership',
      title: 'LinkedIn Thought-Leadership-Post',
      description: 'Formuliert einen pointierten LinkedIn-Beitrag mit Hook, Perspektive und CTA.',
      content: 'Erstelle einen LinkedIn-Post ueber [Thema] fuer [Zielgruppe].',
      optimizedContent:
        'Schreibe einen LinkedIn Thought-Leadership-Post ueber [Thema] fuer [Zielgruppe]. Beginne mit einem starken Hook, formuliere eine klare These, erklaere den Nutzen anhand eines konkreten Beispiels und schliesse mit einer Frage oder einem dezenten CTA. Ton: professionell, klar, meinungsstark. Laenge: 1.200 bis 1.800 Zeichen. Verwende kurze Absaetze und maximal drei passende Hashtags.',
      categoryId: ids.marketingCategoryId,
      tabId: ids.tabId,
      tags: ['linkedin', 'social-media', 'positionierung']
    },
    {
      ...base,
      id: 'sample-customer-email',
      title: 'Professionelle Kunden-E-Mail',
      description: 'Schreibt eine klare, freundliche Kunden-E-Mail fuer schwierige oder wichtige Situationen.',
      content: 'Formuliere eine Kunden-E-Mail zu folgender Situation: [Situation]. Ziel: [Ziel].',
      optimizedContent:
        'Formuliere eine professionelle Kunden-E-Mail zur Situation [Situation]. Ziel der E-Mail ist [Ziel]. Schreibe freundlich, verbindlich und klar. Struktur: Betreff, kurze Einordnung, Kernaussage, konkrete naechste Schritte, Termin- oder Rueckmeldewunsch, hoeflicher Abschluss. Vermeide Schuldzuweisungen, Floskeln und unklare Formulierungen.',
      categoryId: ids.productivityCategoryId,
      tabId: ids.tabId,
      tags: ['e-mail', 'kundenkommunikation', 'produktivität']
    },
    {
      ...base,
      id: 'sample-meeting-summary',
      title: 'Meeting-Protokoll mit To-dos',
      description: 'Verdichtet Notizen zu Entscheidungen, Aufgaben, Risiken und naechsten Schritten.',
      content: 'Erstelle aus diesen Meeting-Notizen ein strukturiertes Protokoll: [Notizen].',
      optimizedContent:
        'Wandle die folgenden Meeting-Notizen in ein strukturiertes Protokoll um: [Notizen]. Gliedere das Ergebnis in: Kurzfazit, besprochene Punkte, Entscheidungen, offene Fragen, Risiken, Aufgaben mit Verantwortlichen und Faelligkeiten sowie naechste Schritte. Markiere unklare Informationen als Rueckfrage. Schreibe sachlich, knapp und umsetzungsorientiert.',
      categoryId: ids.productivityCategoryId,
      tabId: ids.tabId,
      tags: ['meeting', 'protokoll', 'todo', 'organisation']
    },
    {
      ...base,
      id: 'sample-project-risk-analysis',
      title: 'Projekt-Risikoanalyse',
      description: 'Identifiziert Projektrisiken mit Eintrittswahrscheinlichkeit, Auswirkung und Massnahmen.',
      content: 'Analysiere die Risiken fuer folgendes Projekt: [Projektbeschreibung].',
      optimizedContent:
        'Analysiere die Risiken fuer folgendes Projekt: [Projektbeschreibung]. Erstelle eine Tabelle mit Risiko, Ursache, Eintrittswahrscheinlichkeit, Auswirkung, Fruehwarnindikator, Gegenmassnahme, Verantwortlichem und Rest-Risiko. Priorisiere die Top-5-Risiken und formuliere konkrete Handlungsempfehlungen fuer die naechsten zwei Wochen.',
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
        'Erstelle ein praezises Strategie-Briefing zu [Thema] fuer ein Management-Publikum. Struktur: Ausgangslage, Zielbild, relevante Annahmen, Chancen, Risiken, drei Handlungsoptionen mit Vor- und Nachteilen, empfohlene Option, Entscheidungsbedarf und naechste Schritte. Schreibe knapp, faktenorientiert und entscheidungsreif.',
      categoryId: ids.strategyCategoryId,
      tabId: ids.tabId,
      tags: ['strategie', 'management', 'briefing', 'entscheidung']
    },
    {
      ...base,
      id: 'sample-feature-specification',
      title: 'Feature-Spezifikation',
      description: 'Beschreibt ein Software-Feature mit Nutzerziel, Akzeptanzkriterien und Randfaellen.',
      content: 'Erstelle eine Feature-Spezifikation fuer: [Feature-Idee].',
      optimizedContent:
        'Erstelle eine produktionsnahe Feature-Spezifikation fuer [Feature-Idee]. Beschreibe Zielgruppe, Problem, Nutzerziel, User Stories, funktionale Anforderungen, Nicht-Ziele, Akzeptanzkriterien, Randfaelle, Fehlermeldungen, Datenschutzaspekte und offene Fragen. Formatiere klar in Markdown und priorisiere Muss-/Soll-/Kann-Anforderungen.',
      categoryId: ids.codingCategoryId,
      tabId: ids.tabId,
      tags: ['produkt', 'spezifikation', 'requirements', 'software']
    },
    {
      ...base,
      id: 'sample-code-review',
      title: 'Code-Review-Assistent',
      description: 'Prueft Code auf Fehler, Wartbarkeit, Sicherheit und fehlende Tests.',
      content: 'Fuehre ein Code Review fuer folgenden Code durch: [Code].',
      optimizedContent:
        'Fuehre ein strenges Code Review fuer den folgenden Code durch: [Code]. Priorisiere konkrete Bugs, Sicherheitsrisiken, Regressionen, Performance-Probleme, Wartbarkeit und fehlende Tests. Gib Findings nach Schweregrad sortiert aus. Nenne Datei/Zeile, erklaere die Auswirkung und schlage eine konkrete Korrektur vor. Verzichte auf Stilfragen ohne echten Nutzen.',
      categoryId: ids.codingCategoryId,
      tabId: ids.tabId,
      tags: ['code-review', 'qualität', 'tests', 'security']
    },
    {
      ...base,
      id: 'sample-debugging',
      title: 'Debugging-Analyse',
      description: 'Hilft bei der systematischen Ursachenanalyse fuer Fehler und unerwartetes Verhalten.',
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
      title: 'Bildprompt fuer KI-Generatoren',
      description: 'Erzeugt praezise Bildprompts mit Motiv, Stil, Licht, Kamera und Negativvorgaben.',
      content: 'Erstelle einen Bildprompt fuer folgendes Motiv: [Motiv].',
      optimizedContent:
        'Erstelle einen hochwertigen Bildprompt fuer [Motiv]. Beschreibe Hauptmotiv, Umgebung, Komposition, Perspektive, Lichtstimmung, Farbwelt, Materialitaet, Detailgrad und Stilreferenz. Fuege technische Angaben wie Seitenverhaeltnis, Kamerablick, Schaerfentiefe und Qualitaetsniveau hinzu. Ergaenze eine kurze Negativliste fuer unerwuenschte Elemente wie Textartefakte, Verzerrungen oder unruhige Hintergruende.',
      categoryId: ids.imageCategoryId,
      tabId: ids.tabId,
      tags: ['bildprompt', 'midjourney', 'design', 'ki-bild']
    }
  ];
}
