import Dexie, { type Table } from 'dexie';
import type { Category, Prompt, Settings, WorkspaceTab } from '../types/domain';

const now = () => new Date().toISOString();

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
  if (tabCount > 0) return;

  const tabId = 'default-library';
  const codingTabId = 'default-production';
  const marketingCategoryId = 'default-marketing';
  const codingCategoryId = 'default-coding';

  await db.transaction('rw', db.tabs, db.categories, db.prompts, db.settings, async () => {
    await db.tabs.bulkAdd([
      { id: tabId, name: 'Bibliothek', position: 0 },
      { id: codingTabId, name: 'Produktion', position: 1 }
    ]);

    await db.categories.bulkAdd([
      { id: marketingCategoryId, name: 'Marketing', color: '#8f3f64', tabId, position: 0 },
      { id: codingCategoryId, name: 'Coding', color: '#256f63', tabId: codingTabId, position: 0 }
    ]);

    await db.prompts.add({
      id: crypto.randomUUID(),
      title: 'SEO Blog Prompt',
      description: 'Prompt fuer einen professionellen SEO-Blogartikel ueber lokale Datensicherheit.',
      content: 'Schreibe einen SEO Artikel über lokale Datensicherheit.',
      optimizedContent:
        'Erstelle einen professionellen, suchmaschinenoptimierten Blogartikel über lokale Datensicherheit. Definiere Zielgruppe, Suchintention, Gliederung, Tonalität, Meta-Daten und konkrete Beispiele.',
      categoryId: marketingCategoryId,
      tabId,
      tags: ['seo', 'blog', 'datenschutz'],
      favorite: true,
      version: 1,
      history: [],
      createdAt: now(),
      updatedAt: now()
    });

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
}
