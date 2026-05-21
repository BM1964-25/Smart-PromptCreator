import { Search, Star } from 'lucide-react';
import type { Category, Prompt } from '../types/domain';

interface PromptListProps {
  prompts: Prompt[];
  categories: Category[];
  selectedId?: string;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (id?: string) => void;
}

export function PromptList({ prompts, categories, selectedId, search, onSearchChange, onSelect }: PromptListProps) {
  return (
    <div className="min-w-0 border-r border-line bg-[#f9f8f3] dark:border-[#333] dark:bg-[#1c1c1b]">
      <div className="grid gap-3 border-b border-line px-4 py-3 dark:border-[#333]">
        <div>
          <h2 className="text-sm font-semibold">Prompts</h2>
          <p className="text-xs text-neutral-500">{prompts.length} Eintraege · Suche in Titel, Text und Tags</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
          <input
            className="h-10 w-full rounded border border-line bg-white pl-9 pr-3 text-sm outline-none focus:border-brand dark:border-[#3a3a38] dark:bg-[#151515]"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Prompts suchen..."
          />
        </div>
      </div>
      <div className="h-[calc(100vh-116px)] overflow-auto p-2">
        {prompts.map((prompt) => {
          const category = categories.find((item) => item.id === prompt.categoryId);
          return (
            <button
              key={prompt.id}
              onClick={() => onSelect(prompt.id)}
              className={`mb-2 w-full rounded border p-3 text-left transition ${
                selectedId === prompt.id
                  ? 'border-brand bg-white shadow-soft dark:bg-[#151515]'
                  : 'border-transparent hover:border-line hover:bg-white dark:hover:border-[#333] dark:hover:bg-[#151515]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="line-clamp-2 text-sm font-semibold">{prompt.title}</h3>
                {prompt.favorite && <Star className="shrink-0 fill-amber text-amber" size={15} />}
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                {prompt.description || prompt.content || 'Noch kein Inhalt'}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {category && (
                  <span className="rounded px-2 py-1 text-xs text-white" style={{ backgroundColor: category.color }}>
                    {category.name}
                  </span>
                )}
                {prompt.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded bg-[#ece8dc] px-2 py-1 text-xs text-neutral-600 dark:bg-[#2b2b29] dark:text-neutral-300">
                    #{tag}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
