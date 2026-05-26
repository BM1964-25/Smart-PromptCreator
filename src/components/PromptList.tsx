import { Library, PanelLeftClose, PanelLeftOpen, Search, Star, Trash2 } from 'lucide-react';
import type { Category, Prompt } from '../types/domain';

interface PromptListProps {
  prompts: Prompt[];
  categories: Category[];
  selectedId?: string;
  activeCategory?: Category;
  favoriteOnly?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (id?: string) => void;
  onDelete: (prompt: Prompt) => void;
  onResetFilters: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function PromptList({
  prompts,
  categories,
  selectedId,
  activeCategory,
  favoriteOnly,
  search,
  onSearchChange,
  onSelect,
  onDelete,
  onResetFilters,
  collapsed,
  onToggleCollapsed
}: PromptListProps) {
  const filterActive = Boolean(activeCategory || favoriteOnly || search.trim());
  const collapseButtonClass = 'icon-only !border-0 !bg-transparent !shadow-none hover:!bg-transparent dark:!bg-transparent';

  if (collapsed) {
    return (
      <div className="flex min-w-0 flex-col items-center border-r border-line bg-[#f9f8f3] py-3 dark:border-[#333] dark:bg-[#1c1c1b]">
        <button className={collapseButtonClass} title="Prompt-Bibliothek ausklappen" onClick={onToggleCollapsed}>
          <PanelLeftOpen size={16} />
        </button>
        <div className="mt-4 grid justify-items-center gap-3 text-neutral-500">
          <Library size={18} />
          <span className="vertical-label text-xs font-semibold tracking-normal">Prompt-Bibliothek</span>
          <span className="rounded bg-white px-2 py-1 text-[11px] font-medium text-neutral-600 dark:bg-[#151515] dark:text-neutral-300">{prompts.length}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 border-r border-line bg-[#f9f8f3] dark:border-[#333] dark:bg-[#1c1c1b]">
      <div className="grid min-h-[68px] gap-3 border-b border-line px-4 py-3 dark:border-[#333]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-normal">Prompt-Bibliothek</h2>
            <p className="text-xs text-neutral-500">
              {prompts.length} Einträge
              {activeCategory ? ` · Kategorie: ${activeCategory.name}` : ' · Alle Kategorien'}
              {favoriteOnly ? ' · Favoriten' : ''}
            </p>
          </div>
          <button className={`${collapseButtonClass} shrink-0`} title="Prompt-Bibliothek einklappen" onClick={onToggleCollapsed}>
            <PanelLeftClose size={16} />
          </button>
        </div>
        {filterActive && (
          <div className="flex items-center justify-between gap-2 rounded border border-brand/35 bg-[#eef7f4] px-3 py-2 text-xs text-[#256f63] dark:border-[#21564c] dark:bg-[#122520] dark:text-[#9dd1c5]">
            <span className="min-w-0 truncate">
              Auswahl aktiv{activeCategory ? `: ${activeCategory.name}` : ''}
            </span>
            <button className="shrink-0 font-semibold hover:text-brand dark:hover:text-[#f3f0e8]" type="button" onClick={onResetFilters}>
              Auswahl zurücksetzen
            </button>
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
          <input
            className="h-10 w-full rounded border border-line bg-white pl-9 pr-3 text-sm outline-none focus:border-brand dark:border-[#3a3a38] dark:bg-[#151515]"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Prompt-Bibliothek durchsuchen..."
          />
        </div>
      </div>
      <div className="h-[calc(100vh-116px)] overflow-auto p-2">
        {prompts.map((prompt) => {
          const category = categories.find((item) => item.id === prompt.categoryId);
          return (
            <article
              key={prompt.id}
              onClick={() => onSelect(prompt.id)}
              className={`mb-2 w-full rounded border p-3 text-left transition ${
                selectedId === prompt.id
                  ? 'border-brand bg-white shadow-soft dark:bg-[#151515]'
                  : 'border-transparent hover:border-line hover:bg-white dark:hover:border-[#333] dark:hover:bg-[#151515]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="line-clamp-2 text-xl font-semibold tracking-normal">{prompt.title}</h3>
                <div className="flex shrink-0 items-center gap-1">
                  {prompt.favorite && <Star className="fill-amber text-amber" size={15} />}
                  <button
                    className="grid h-7 w-7 place-items-center rounded text-neutral-400 transition hover:bg-[#f3ece8] hover:text-[#a33a2d] dark:hover:bg-[#2b1714]"
                    title="Prompt löschen"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(prompt);
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
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
            </article>
          );
        })}
      </div>
    </div>
  );
}
