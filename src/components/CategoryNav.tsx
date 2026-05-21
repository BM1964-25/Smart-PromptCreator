import { FolderOpen, Plus, Trash2 } from 'lucide-react';
import { DndContext, type DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { db } from '../db/database';
import type { Category } from '../types/domain';

interface CategoryNavProps {
  categories: Category[];
  activeCategoryId?: string;
  onSelect: (id?: string) => void;
  onCreate: () => void;
  onDelete: (category: Category) => void;
  collapsed?: boolean;
}

export function CategoryNav({ categories, activeCategoryId, onSelect, onCreate, onDelete, collapsed }: CategoryNavProps) {
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
        <button className="icon-only" title="Kategorie hinzufuegen" onClick={onCreate}>
          <Plus size={15} />
        </button>
      </div>
      <button className={`nav-row ${!activeCategoryId ? 'active' : ''}`} onClick={() => onSelect(undefined)}>
        <FolderOpen className="mr-2 shrink-0 text-neutral-500" size={16} />
        Prompt-Bibliothek
      </button>
      <DndContext collisionDetection={closestCenter} onDragEnd={reorderCategories}>
        <SortableContext items={categories.map((category) => category.id!)} strategy={verticalListSortingStrategy}>
          {categories.map((category) => (
            <SortableCategory
              key={category.id}
              category={category}
              active={activeCategoryId === category.id}
              onSelect={() => onSelect(category.id)}
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
  onSelect,
  onDelete
}: {
  category: Category;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category.id! });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="group flex items-center gap-1">
      <button {...attributes} {...listeners} className={`nav-row min-w-0 flex-1 ${active ? 'active' : ''}`} onClick={onSelect}>
        <span className="mr-2 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
        <span className="truncate">{category.name}</span>
      </button>
      <button
        className="grid h-8 w-8 shrink-0 place-items-center rounded text-neutral-400 opacity-0 transition hover:bg-[#f3ece8] hover:text-[#a33a2d] group-hover:opacity-100 focus:opacity-100 dark:hover:bg-[#2b1714]"
        title="Kategorie loeschen"
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
