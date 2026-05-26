import { db } from '../db/database';
import type { Category, ImportPayload, Prompt, WorkspaceTab } from '../types/domain';

const now = () => new Date().toISOString();

export async function createPrompt(input: Partial<Prompt>) {
  const fallbackTab = await db.tabs.orderBy('position').first();
  const fallbackCategory = fallbackTab ? await db.categories.where({ tabId: fallbackTab.id }).first() : undefined;
  const prompt: Prompt = {
    id: crypto.randomUUID(),
    title: input.title || 'Neuer Prompt',
    description: input.description || '',
    content: input.content || '',
    optimizedContent: input.optimizedContent || '',
    variants: input.variants || [],
    categoryId: input.categoryId || fallbackCategory?.id || '',
    tabId: input.tabId || fallbackTab?.id || '',
    tags: input.tags || [],
    favorite: input.favorite || false,
    version: 1,
    history: [],
    createdAt: now(),
    updatedAt: now()
  };
  await db.prompts.add(prompt);
  return prompt;
}

export async function updatePrompt(id: string, changes: Partial<Prompt>) {
  const existing = await db.prompts.get(id);
  if (!existing) return;
  const revisionChanged = hasPromptChanged(existing, changes);

  await db.prompts.update(id, {
    ...changes,
    version: revisionChanged ? existing.version + 1 : existing.version,
    history: revisionChanged
      ? [
          ...existing.history,
          {
            id: crypto.randomUUID(),
            title: existing.title,
            description: existing.description,
            content: existing.content,
            optimizedContent: existing.optimizedContent,
            variants: existing.variants || [],
            categoryId: existing.categoryId,
            tabId: existing.tabId,
            tags: existing.tags,
            favorite: existing.favorite,
            version: existing.version,
            createdAt: now()
          }
        ].slice(-25)
      : existing.history,
    updatedAt: now()
  });
}

export async function undoLastPromptChange(id: string) {
  const existing = await db.prompts.get(id);
  const previous = existing?.history.at(-1);
  if (!existing || !previous) return false;

  await db.prompts.update(id, {
    title: previous.title ?? existing.title,
    description: previous.description ?? existing.description,
    content: previous.content,
    optimizedContent: previous.optimizedContent,
    variants: previous.variants ?? existing.variants ?? [],
    categoryId: previous.categoryId ?? existing.categoryId,
    tabId: previous.tabId ?? existing.tabId,
    tags: previous.tags ?? existing.tags,
    favorite: previous.favorite ?? existing.favorite,
    version: previous.version ?? Math.max(1, existing.version - 1),
    history: existing.history.slice(0, -1),
    updatedAt: now()
  });

  return true;
}

function hasPromptChanged(existing: Prompt, changes: Partial<Prompt>) {
  const trackedKeys: Array<keyof Prompt> = ['title', 'description', 'content', 'optimizedContent', 'variants', 'categoryId', 'tabId', 'tags', 'favorite'];
  return trackedKeys.some((key) => {
    if (changes[key] === undefined) return false;
    return JSON.stringify(changes[key]) !== JSON.stringify(existing[key]);
  });
}

export async function duplicatePrompt(prompt: Prompt) {
  return createPrompt({
    ...prompt,
    id: undefined,
    title: `${prompt.title} Kopie`,
    favorite: false,
    history: []
  });
}

export async function createTab(name = 'Neuer Tab') {
  const count = await db.tabs.count();
  const tab: WorkspaceTab = { id: crypto.randomUUID(), name, position: count };
  await db.tabs.add(tab);
  return tab;
}

export async function createCategory(tabId: string, name = 'Neue Kategorie') {
  const count = await db.categories.where({ tabId }).count();
  const category: Category = { id: crypto.randomUUID(), name, color: '#256f63', tabId, position: count };
  await db.categories.add(category);
  return category;
}

export async function findOrCreateCategory(tabId: string, name: string) {
  const normalized = name.trim().toLowerCase();
  const existing = await db.categories
    .where({ tabId })
    .filter((category) => category.name.trim().toLowerCase() === normalized)
    .first();
  if (existing) return existing;
  return createCategory(tabId, name.trim() || 'Allgemein');
}

export function filterPrompts(prompts: Prompt[], query: string, favoriteOnly: boolean, categoryId?: string, tabId?: string) {
  const normalized = query.trim().toLowerCase();
  return prompts.filter((prompt) => {
    const text = [prompt.title, prompt.description || '', prompt.content, prompt.optimizedContent, prompt.tags.join(' ')].join(' ').toLowerCase();
    return (
      (!tabId || prompt.tabId === tabId) &&
      (!categoryId || prompt.categoryId === categoryId) &&
      (!favoriteOnly || prompt.favorite) &&
      (!normalized || text.includes(normalized))
    );
  });
}

export async function exportLibrary(promptIds?: string[]) {
  const prompts = promptIds ? await db.prompts.bulkGet(promptIds) : await db.prompts.toArray();
  const payload = {
    version: '1.0',
    exportedAt: now(),
    prompts: prompts.filter(Boolean),
    categories: await db.categories.toArray(),
    tabs: await db.tabs.toArray()
  };
  return JSON.stringify(payload, null, 2);
}

export async function importLibrary(payload: ImportPayload, conflictMode: 'duplicate' | 'overwrite' = 'duplicate') {
  if (!payload.version || !Array.isArray(payload.prompts)) {
    throw new Error('Die Importdatei ist keine gültige Prompt-Bibliothek.');
  }

  await db.transaction('rw', db.tabs, db.categories, db.prompts, async () => {
    if (payload.tabs?.length) {
      await db.tabs.bulkPut(payload.tabs.map((tab, index) => ({ ...tab, id: tab.id || crypto.randomUUID(), position: tab.position ?? index })));
    }
    if (payload.categories?.length) {
      await db.categories.bulkPut(
        payload.categories.map((category, index) => ({ ...category, id: category.id || crypto.randomUUID(), position: category.position ?? index }))
      );
    }

    for (const input of payload.prompts) {
      const existing = input.id ? await db.prompts.get(input.id) : undefined;
      const id = conflictMode === 'overwrite' && existing ? input.id : crypto.randomUUID();
      await db.prompts.put({
        id,
        title: input.title || 'Importierter Prompt',
        description: input.description || '',
        content: input.content || '',
        optimizedContent: input.optimizedContent || input.optimized || '',
        variants: input.variants || [],
        categoryId: input.categoryId || '',
        tabId: input.tabId || '',
        tags: input.tags || [],
        favorite: input.favorite || false,
        version: input.version || 1,
        history: input.history || [],
        createdAt: input.createdAt || now(),
        updatedAt: now()
      });
    }
  });
}
