import { FolderOpen, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { DndContext, type DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { db } from '../db/database';
import type { Category } from '../types/domain';

interface CategoryNavProps {
  categories: Category[];
  activeCategoryId?: string;
  categoryPromptCounts: Map<string, number>;
  allPromptCount: number;
  onSelect: (id?: string) => void;
  onCreate: () => void;
  onRename: (category: Category) => void;
  onDelete: (category: Category) => void;
  collapsed?: boolean;
}

export function CategoryNav({
  categories,
  activeCategoryId,
  categoryPromptCounts,
  allPromptCount,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  collapsed
}: CategoryNavProps) {
  async function reorderCategories(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex((category) => category.id === active.id);
    const newIndex = categories.findIndex((category) => category.id === over.id);
    const ordered = arrayMove(categories, oldIndex, newIndex);
    await Promise.all(ordered.map((category, position) => db.categories.update(category.id!, { position })));
  }

  if (collapsed) return null;

  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Kategorien</span>
        <button className="icon-only" title="Kategorie hinzufügen" onClick={onCreate}>
          <Plus size={15} />
        </button>
      </div>
      <button className={`nav-row ${!activeCategoryId ? 'active' : ''}`} onClick={() => onSelect(undefined)}>
        <FolderOpen className="mr-2 shrink-0 text-neutral-500" size={16} />
        <span className="truncate">Alle Kategorien</span>
        <span className="ml-2 shrink-0 tabular-nums text-neutral-500 dark:text-neutral-400">({allPromptCount})</span>
      </button>
      <DndContext collisionDetection={closestCenter} onDragEnd={reorderCategories}>
        <SortableContext items={categories.map((category) => category.id!)} strategy={verticalListSortingStrategy}>
          {categories.map((category) => (
            <SortableCategory
              key={category.id}
              category={category}
              active={activeCategoryId === category.id}
              promptCount={categoryPromptCounts.get(category.id!) || 0}
              onSelect={() => onSelect(category.id)}
              onRename={() => onRename(category)}
              onDelete={() => onDelete(category)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableCategory({
  category,
  active,
  promptCount,
  onSelect,
  onRename,
  onDelete
}: {
  category: Category;
  active: boolean;
  promptCount: number;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category.id! });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="group flex items-center gap-1">
      <button
        {...attributes}
        {...listeners}
        className="grid h-8 w-6 shrink-0 cursor-grab place-items-center rounded text-neutral-300 transition hover:bg-[#ece8dc] hover:text-neutral-600 active:cursor-grabbing dark:hover:bg-[#2b2b29] dark:hover:text-neutral-200"
        title="Kategorie verschieben"
      >
        <GripVertical size={14} />
      </button>
      <button className={`nav-row min-w-0 flex-1 ${active ? 'active' : ''}`} onClick={onSelect}>
        <span className="mr-2 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
        <span className="truncate">{category.name}</span>
        <span className="ml-2 shrink-0 tabular-nums text-neutral-500 dark:text-neutral-400">({promptCount})</span>
      </button>
      <button
        className="grid h-8 w-8 shrink-0 place-items-center rounded text-neutral-400 transition hover:bg-[#ece8dc] hover:text-brand dark:hover:bg-[#2b2b29]"
        title="Kategorie umbenennen"
        onClick={(event) => {
          event.stopPropagation();
          onRename();
        }}
      >
        <Pencil size={14} />
      </button>
      <button
        className="grid h-8 w-8 shrink-0 place-items-center rounded text-neutral-400 transition hover:bg-[#f3ece8] hover:text-[#a33a2d] dark:hover:bg-[#2b1714]"
        title="Kategorie löschen"
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
