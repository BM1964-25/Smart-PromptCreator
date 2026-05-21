import { FolderOpen, Plus } from 'lucide-react';
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
  collapsed?: boolean;
}

export function CategoryNav({ categories, activeCategoryId, onSelect, onCreate }: CategoryNavProps) {
  async function reorderCategories(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex((category) => category.id === active.id);
    const newIndex = categories.findIndex((category) => category.id === over.id);
    const ordered = arrayMove(categories, oldIndex, newIndex);
    await Promise.all(ordered.map((category, position) => db.categories.update(category.id!, { position })));
  }

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
        Promptbibliothek
      </button>
      <DndContext collisionDetection={closestCenter} onDragEnd={reorderCategories}>
        <SortableContext items={categories.map((category) => category.id!)} strategy={verticalListSortingStrategy}>
          {categories.map((category) => (
            <SortableCategory
              key={category.id}
              category={category}
              active={activeCategoryId === category.id}
              onSelect={() => onSelect(category.id)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableCategory({ category, active, onSelect }: { category: Category; active: boolean; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category.id! });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <button ref={setNodeRef} style={style} {...attributes} {...listeners} className={`nav-row ${active ? 'active' : ''}`} onClick={onSelect}>
      <span className="mr-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
      {category.name}
    </button>
  );
}
