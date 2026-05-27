import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { DndContext, type DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Download,
  FileText,
  Filter,
  Folder,
  GripVertical,
  HardDrive,
  HelpCircle,
  KeyRound,
  Library,
  Moon,
  Pencil,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { db, seedDatabase } from './db/database';
import { useTheme } from './hooks/useTheme';
import { useAppStore } from './store/useAppStore';
import { createCategory, createPrompt, createTab, exportLibrary, filterPrompts, importLibrary } from './services/promptService';
import { PromptList } from './components/PromptList';
import { PromptEditor } from './components/PromptEditor';
import { SettingsPanel } from './components/SettingsPanel';
import { HelpPanel } from './components/HelpPanel';
import { CategoryNav } from './components/CategoryNav';
import type { Category, Prompt, WorkspaceTab } from './types/domain';

type NameDialogState = {
  kind: 'workspace-create' | 'workspace-rename' | 'category-create' | 'category-rename';
  title: string;
  label: string;
  initialValue: string;
  targetId?: string;
};

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [libraryCollapsed, setLibraryCollapsed] = useState(false);
  const [nameDialog, setNameDialog] = useState<NameDialogState>();
  const tabs = useLiveQuery(() => db.tabs.orderBy('position').toArray(), []);
  const categories = useLiveQuery(() => db.categories.orderBy('position').toArray(), []);
  const prompts = useLiveQuery(() => db.prompts.orderBy('updatedAt').reverse().toArray(), []);
  const settings = useLiveQuery(() => db.settings.get('app'), []);
  const store = useAppStore();
  useTheme(settings?.theme || 'system');

  useEffect(() => {
    seedDatabase();
  }, []);

  useEffect(() => {
    if (!store.activeTabId && tabs?.[0]?.id) store.setActiveTab(tabs[0].id);
  }, [tabs, store]);

  const visiblePrompts = useMemo(
    () => filterPrompts(prompts || [], store.search, store.favoriteOnly, store.activeCategoryId, store.activeTabId),
    [prompts, store.search, store.favoriteOnly, store.activeCategoryId, store.activeTabId]
  );
  const workspacePromptCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const prompt of prompts || []) {
      if (!prompt.tabId) continue;
      counts.set(prompt.tabId, (counts.get(prompt.tabId) || 0) + 1);
    }
    return counts;
  }, [prompts]);
  const categoryPromptCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const prompt of prompts || []) {
      if (!prompt.categoryId) continue;
      counts.set(prompt.categoryId, (counts.get(prompt.categoryId) || 0) + 1);
    }
    return counts;
  }, [prompts]);
  const activeWorkspacePromptCount = store.activeTabId ? workspacePromptCounts.get(store.activeTabId) || 0 : 0;

  const selectedPrompt = prompts?.find((prompt) => prompt.id === store.selectedPromptId) || visiblePrompts[0];
  const activeCategory = categories?.find((category) => category.id === store.activeCategoryId);
  const licenseStatus = settings?.license.status || 'inactive';
  const anthropicReady = Boolean(settings?.apiKeys.anthropic);

  async function handleExport() {
    const json = await exportLibrary();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `smart-prompt-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(file?: File) {
    if (!file) return;
    const payload = JSON.parse(await file.text());
    await importLibrary(payload, 'duplicate');
    toast.success('Bibliothek importiert');
  }

  async function reorderTabs(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !tabs) return;
    const oldIndex = tabs.findIndex((tab) => tab.id === active.id);
    const newIndex = tabs.findIndex((tab) => tab.id === over.id);
    const ordered = arrayMove(tabs, oldIndex, newIndex);
    await Promise.all(ordered.map((tab, position) => db.tabs.update(tab.id!, { position })));
  }

  function createWorkspaceTab() {
    setNameDialog({
      kind: 'workspace-create',
      title: 'Arbeitsbereich erstellen',
      label: 'Name des Arbeitsbereichs',
      initialValue: 'Neuer Arbeitsbereich'
    });
  }

  function renameTab(tab: WorkspaceTab) {
    if (!tab.id) return;
    setNameDialog({
      kind: 'workspace-rename',
      title: 'Arbeitsbereich umbenennen',
      label: 'Name des Arbeitsbereichs',
      initialValue: tab.name,
      targetId: tab.id
    });
  }

  function createNamedCategory() {
    if (!store.activeTabId) return;
    setNameDialog({
      kind: 'category-create',
      title: 'Kategorie erstellen',
      label: 'Name der Kategorie',
      initialValue: 'Neue Kategorie'
    });
  }

  function renameCategory(category: Category) {
    if (!category.id) return;
    setNameDialog({
      kind: 'category-rename',
      title: 'Kategorie umbenennen',
      label: 'Name der Kategorie',
      initialValue: category.name,
      targetId: category.id
    });
  }

  async function submitNameDialog(value: string) {
    if (!nameDialog) return;
    const name = value.trim();
    if (!name) return;

    if (nameDialog.kind === 'workspace-create') {
      const tab = await createTab(name);
      store.setActiveTab(tab.id);
      toast.success('Arbeitsbereich erstellt');
    }

    if (nameDialog.kind === 'workspace-rename' && nameDialog.targetId) {
      await db.tabs.update(nameDialog.targetId, { name });
      toast.success('Arbeitsbereich umbenannt');
    }

    if (nameDialog.kind === 'category-create' && store.activeTabId) {
      const category = await createCategory(store.activeTabId, name);
      store.setActiveCategory(category.id);
      toast.success('Kategorie erstellt');
    }

    if (nameDialog.kind === 'category-rename' && nameDialog.targetId) {
      await db.categories.update(nameDialog.targetId, { name });
      toast.success('Kategorie umbenannt');
    }

    setNameDialog(undefined);
  }

  async function deletePrompt(prompt: Prompt) {
    if (!prompt.id) return;
    const confirmed = window.confirm(`Soll "${prompt.title}" wirklich aus der Prompt-Bibliothek gelöscht werden?`);
    if (!confirmed) return;

    await db.prompts.delete(prompt.id);
    const remainingPrompts = (prompts || []).filter((item) => item.id !== prompt.id);
    const nextPrompt = remainingPrompts[0];
    store.setSelectedPrompt(nextPrompt?.id);
    toast.success('Eintrag gelöscht');
  }

  async function deleteTab(tab: WorkspaceTab) {
    if (!tab.id) return;
    const confirmed = window.confirm(`Soll der Arbeitsbereich "${tab.name}" wirklich gelöscht werden? Prompts bleiben erhalten und werden aus diesem Arbeitsbereich gelöst.`);
    if (!confirmed) return;

    const remainingTabs = (tabs || []).filter((item) => item.id !== tab.id);
    await db.transaction('rw', db.tabs, db.categories, db.prompts, async () => {
      await db.tabs.delete(tab.id!);
      await db.categories.where({ tabId: tab.id }).delete();
      const tabPrompts = await db.prompts.where({ tabId: tab.id }).toArray();
      await Promise.all(tabPrompts.map((prompt) => db.prompts.update(prompt.id!, { tabId: '', categoryId: '' })));
    });

    if (store.activeTabId === tab.id) {
      store.setActiveTab(remainingTabs[0]?.id);
      store.setActiveCategory(undefined);
    }
    toast.success('Arbeitsbereich gelöscht');
  }

  async function deleteCategory(category: Category) {
    if (!category.id) return;
    const confirmed = window.confirm(`Soll die Kategorie "${category.name}" wirklich gelöscht werden? Prompts bleiben erhalten.`);
    if (!confirmed) return;

    await db.transaction('rw', db.categories, db.prompts, async () => {
      await db.categories.delete(category.id!);
      const categoryPrompts = await db.prompts.where({ categoryId: category.id }).toArray();
      await Promise.all(categoryPrompts.map((prompt) => db.prompts.update(prompt.id!, { categoryId: '' })));
    });

    if (store.activeCategoryId === category.id) store.setActiveCategory(undefined);
    toast.success('Kategorie gelöscht');
  }

  function resetLibrarySelection() {
    store.setActiveCategory(undefined);
    store.setSearch('');
    store.setFavoriteOnly(false);
    store.setSelectedPrompt(undefined);
  }

  async function createPromptInActiveWorkspace() {
    const prompt = await createPrompt({ tabId: store.activeTabId, categoryId: store.activeCategoryId });
    store.setSelectedPrompt(prompt.id);
    toast.success('Prompt erstellt');
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#ebe8df] text-ink dark:bg-[#171717] dark:text-[#f3f0e8]">
      <header className="flex shrink-0 items-center justify-between gap-6 border-b border-line bg-panel px-5 py-4 dark:border-[#333] dark:bg-[#20201f]">
        <div className="flex min-w-0 items-center gap-4">
          <img
            src="/smart-promptcreator-icon.png"
            alt=""
            aria-hidden="true"
            className="h-12 w-12 shrink-0 rounded object-cover shadow-sm"
            draggable={false}
          />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">SMARTBUILT-AI</p>
            <h1 className="truncate text-2xl font-semibold tracking-normal">SMART PromptCreator</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Lokale Prompt-Werkstatt für bessere KI-Ergebnisse.</p>
          </div>
        </div>
        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <span className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 dark:border-[#3a3a38] dark:bg-[#151515] dark:text-neutral-300">
            Browser-Speicher aktiv
          </span>
          <span className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 dark:border-[#3a3a38] dark:bg-[#151515] dark:text-neutral-300">
            {anthropicReady ? 'API-Key gespeichert' : 'API-Key fehlt'}
          </span>
          <button className="icon-button" onClick={createPromptInActiveWorkspace}>
            <Plus size={16} /> Prompt erstellen
          </button>
        </div>
      </header>
      <main className="flex min-h-0 flex-1 overflow-hidden">
      <aside
        className={`relative flex shrink-0 flex-col border-r border-line bg-panel transition-[width] duration-200 dark:border-[#333] dark:bg-[#20201f] ${
          sidebarCollapsed ? 'w-20' : 'w-80'
        }`}
      >
        <div className="border-b border-line p-3 dark:border-[#333]">
          {!sidebarCollapsed && (
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
            <input
              value={store.search}
              onChange={(event) => store.setSearch(event.target.value)}
              className="h-10 w-full rounded border border-line bg-white pl-9 pr-3 text-sm outline-none focus:border-brand dark:border-[#3a3a38] dark:bg-[#151515]"
              placeholder="Titel, Inhalt oder Tags"
            />
          </div>
          )}
          <div className={sidebarCollapsed ? 'mt-3 grid gap-2' : 'mt-3 flex gap-2'}>
            <button
              className={`icon-button ${sidebarCollapsed ? 'w-full px-0' : 'flex-1'}`}
              title="Prompt erstellen"
              onClick={createPromptInActiveWorkspace}
            >
              <Plus size={16} /> {!sidebarCollapsed && 'Prompt'}
            </button>
            {!sidebarCollapsed && (
            <button className={`icon-button ${store.favoriteOnly ? 'active' : ''}`} title="Favoritenfilter" onClick={() => store.setFavoriteOnly(!store.favoriteOnly)}>
              <Filter size={16} />
            </button>
            )}
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-auto px-3">
          <div className="mb-5 space-y-1">
            <button className={`sidebar-nav-row active ${sidebarCollapsed ? 'justify-center px-0' : ''}`} title="Alle Prompts im aktiven Arbeitsbereich anzeigen" onClick={resetLibrarySelection}>
              <Library size={17} />
              {!sidebarCollapsed && <span>Alle Prompts im Arbeitsbereich</span>}
            </button>
            <button
              className={`sidebar-nav-row ${store.favoriteOnly ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
              title="Favoriten"
              onClick={() => store.setFavoriteOnly(!store.favoriteOnly)}
            >
              <Star size={17} />
              {!sidebarCollapsed && <span>Favoriten</span>}
            </button>
            <button className={`sidebar-nav-row ${sidebarCollapsed ? 'justify-center px-0' : ''}`} title="Einstellungen" onClick={() => setShowSettings(true)}>
              <Settings size={17} />
              {!sidebarCollapsed && <span>Einstellungen</span>}
            </button>
            <button className={`sidebar-nav-row ${sidebarCollapsed ? 'justify-center px-0' : ''}`} title="Hilfe" onClick={() => setShowHelp(true)}>
              <HelpCircle size={17} />
              {!sidebarCollapsed && <span>Hilfe</span>}
            </button>
          </div>

          {!sidebarCollapsed && (
            <>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Arbeitsbereiche</span>
                <button className="icon-only" title="Arbeitsbereich hinzufügen" onClick={createWorkspaceTab}>
                  <Plus size={15} />
                </button>
              </div>
              <DndContext collisionDetection={closestCenter} onDragEnd={reorderTabs}>
                <SortableContext items={(tabs || []).map((tab) => tab.id!)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1">
                    {tabs?.map((tab) => (
                      <SortableTab
                        key={tab.id}
                        tab={tab}
                        active={store.activeTabId === tab.id}
                        promptCount={workspacePromptCounts.get(tab.id!) || 0}
                        onSelect={() => store.setActiveTab(tab.id)}
                        onRename={() => renameTab(tab)}
                        onDelete={() => deleteTab(tab)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          )}
          <CategoryNav
            categories={(categories || []).filter((category) => category.tabId === store.activeTabId)}
            activeCategoryId={store.activeCategoryId}
            categoryPromptCounts={categoryPromptCounts}
            allPromptCount={activeWorkspacePromptCount}
            onSelect={store.setActiveCategory}
            onCreate={createNamedCategory}
            onRename={renameCategory}
            onDelete={deleteCategory}
            collapsed={sidebarCollapsed}
          />
        </nav>

        <div className="px-3 pb-3">
          <button
            className={`grid h-9 w-9 appearance-none place-items-center rounded bg-transparent p-0 text-neutral-500 transition hover:text-brand dark:text-neutral-400 dark:hover:text-[#f3f0e8] ${
              sidebarCollapsed ? 'mx-auto' : ''
            }`}
            title={sidebarCollapsed ? 'Sidebar ausklappen' : 'Sidebar einklappen'}
            onClick={() => setSidebarCollapsed((current) => !current)}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        <div className="space-y-3 border-t border-line p-3 dark:border-[#333]">
          <div className={`grid gap-2 ${sidebarCollapsed ? 'grid-cols-1' : 'grid-cols-4'}`}>
          <button className="icon-only" title="Export" onClick={handleExport}><Download size={17} /></button>
          <label className="icon-only cursor-pointer" title="Import">
            <Upload size={17} />
            <input className="hidden" type="file" accept="application/json" onChange={(event) => handleImport(event.target.files?.[0])} />
          </label>
          <button className="icon-only" title="Darstellung" onClick={() => db.settings.update('app', { theme: settings?.theme === 'dark' ? 'light' : 'dark' })}>
            <Moon size={17} />
          </button>
          <button className="icon-only" title="Einstellungen" onClick={() => setShowSettings(true)}><Settings size={17} /></button>
          </div>

          {!sidebarCollapsed && (
              <div className="rounded border border-line bg-white p-3 text-xs shadow-sm dark:border-[#3a3a38] dark:bg-[#151515]">
                <div className="mb-2 flex items-center gap-2 font-semibold text-neutral-700 dark:text-neutral-200">
                  <ShieldCheck size={15} />
                  Systemstatus
                </div>
                <div className="space-y-2">
                  <StatusRow icon={<KeyRound size={14} />} label="Lizenz" value={licenseStatus === 'active' ? 'Aktiv' : 'Nicht aktiviert'} active={licenseStatus === 'active'} />
                  <StatusRow icon={<Sparkles size={14} />} label="Anthropic" value={anthropicReady ? 'API-Key gespeichert' : 'API-Key fehlt'} active={anthropicReady} />
                  <StatusRow icon={<HardDrive size={14} />} label="Speicher" value="IndexedDB lokal" active />
                  <StatusRow icon={<FileText size={14} />} label="Prompt-Bibliothek" value={`${prompts?.length || 0}`} active />
                </div>
              </div>
          )}
        </div>
      </aside>

      <section
        className="grid min-w-0 flex-1 overflow-hidden transition-[grid-template-columns] duration-200"
        style={{ gridTemplateColumns: libraryCollapsed ? '56px minmax(0, 1fr)' : '360px minmax(0, 1fr)' }}
      >
        <PromptList
          prompts={visiblePrompts}
          categories={categories || []}
          selectedId={selectedPrompt?.id}
          activeCategory={activeCategory}
          favoriteOnly={store.favoriteOnly}
          search={store.search}
          onSearchChange={store.setSearch}
          onSelect={store.setSelectedPrompt}
          onDelete={deletePrompt}
          onResetFilters={resetLibrarySelection}
          collapsed={libraryCollapsed}
          onToggleCollapsed={() => setLibraryCollapsed((current) => !current)}
        />
        <PromptEditor
          prompt={selectedPrompt}
          settings={settings}
          tabs={tabs || []}
          categories={categories || []}
          onDelete={deletePrompt}
          emptyStateTitle="Dieser Arbeitsbereich ist noch leer"
          emptyStateDescription="Lege den ersten Prompt in diesem Arbeitsbereich an oder wähle links einen anderen Arbeitsbereich."
          onCreatePrompt={createPromptInActiveWorkspace}
          onFocusPromptLocation={(tabId, categoryId, promptId) => {
            store.setActiveTab(tabId);
            if (categoryId) store.setActiveCategory(categoryId);
            store.setSelectedPrompt(promptId);
          }}
        />
      </section>

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onClose={() => setShowSettings(false)}
          onOpenHelp={() => {
            setShowSettings(false);
            setShowHelp(true);
          }}
        />
      )}
      {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}
      <NameDialog dialog={nameDialog} onClose={() => setNameDialog(undefined)} onSubmit={submitNameDialog} />
      </main>
      <AppFooter />
    </div>
  );
}

function AppFooter() {
  return (
    <footer className="grid shrink-0 grid-cols-2 gap-4 border-t border-line bg-panel px-5 py-3 text-[11px] leading-5 text-neutral-500 dark:border-[#333] dark:bg-[#20201f] dark:text-neutral-400">
      <div className="flex min-w-0 items-start gap-3">
        <img
          src="/smart-promptcreator-icon.png"
          alt="SMART PromptCreator"
          className="h-9 w-9 shrink-0 rounded object-cover"
          draggable={false}
        />
        <div className="min-w-0">
          <p className="font-semibold text-neutral-700 dark:text-neutral-200">SMART PromptCreator</p>
          <p className="text-neutral-500 dark:text-neutral-400">Lokale Prompt-Werkstatt für bessere KI-Ergebnisse</p>
        </div>
      </div>
      <div className="min-w-0 text-right">
        <p className="font-medium text-neutral-600 dark:text-neutral-300">© 2026 SmartBuilt-AI · Powered by BuiltSmart Hub - Bernhard Metzger</p>
        <div className="flex flex-wrap items-center justify-end gap-x-1">
          <a className="hover:text-brand" href="https://www.built-smart-hub.com/impressum" target="_blank" rel="noreferrer">Impressum</a>
          <span>|</span>
          <a className="hover:text-brand" href="https://www.built-smart-hub.com/datenschutz" target="_blank" rel="noreferrer">Datenschutz</a>
          <span>|</span>
          <a className="hover:text-brand" href="https://www.built-smart-hub.com/agb" target="_blank" rel="noreferrer">AGB</a>
          <span>|</span>
          <a className="hover:text-brand" href="https://www.built-smart-hub.com/widerrufsbelehrung" target="_blank" rel="noreferrer">Widerrufsbelehrung</a>
        </div>
      </div>
    </footer>
  );
}

function NameDialog({
  dialog,
  onClose,
  onSubmit
}: {
  dialog?: NameDialogState;
  onClose: () => void;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState(dialog?.initialValue || '');

  useEffect(() => {
    setValue(dialog?.initialValue || '');
  }, [dialog]);

  if (!dialog) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-6">
      <form
        className="grid w-full max-w-md gap-4 rounded border border-line bg-[#fdfcf8] p-5 shadow-soft dark:border-[#333] dark:bg-[#20201f]"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(value);
        }}
      >
        <div>
          <h2 className="text-lg font-semibold">{dialog.title}</h2>
          <p className="text-xs text-neutral-500">Der Name wird direkt in der Sidebar angezeigt.</p>
        </div>
        <label className="grid gap-1 text-xs font-medium text-neutral-500">
          {dialog.label}
          <input
            autoFocus
            className="field"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onFocus={(event) => event.target.select()}
          />
        </label>
        <div className="flex justify-end gap-2">
          <button className="icon-button" type="button" onClick={onClose}>
            Abbrechen
          </button>
          <button className="icon-button ai-button" type="submit" disabled={!value.trim()}>
            Speichern
          </button>
        </div>
      </form>
    </div>
  );
}

function SortableTab({
  tab,
  active,
  promptCount,
  onSelect,
  onRename,
  onDelete
}: {
  tab: WorkspaceTab;
  active: boolean;
  promptCount: number;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: tab.id! });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="group flex items-center gap-1">
      <button
        {...attributes}
        {...listeners}
        className="grid h-8 w-6 shrink-0 cursor-grab place-items-center rounded text-neutral-300 transition hover:bg-[#ece8dc] hover:text-neutral-600 active:cursor-grabbing dark:hover:bg-[#2b2b29] dark:hover:text-neutral-200"
        title="Arbeitsbereich verschieben"
      >
        <GripVertical size={14} />
      </button>
      <button onClick={onSelect} className={`nav-row min-w-0 flex-1 ${active ? 'active' : ''}`}>
        <Folder className="mr-2 shrink-0 text-neutral-500" size={16} />
        <span className="truncate">{tab.name}</span>
        <span className="ml-2 shrink-0 tabular-nums text-neutral-500 dark:text-neutral-400">({promptCount})</span>
      </button>
      <button
        className="grid h-8 w-8 shrink-0 place-items-center rounded text-neutral-400 transition hover:bg-[#ece8dc] hover:text-brand dark:hover:bg-[#2b2b29]"
        title="Arbeitsbereich umbenennen"
        onClick={(event) => {
          event.stopPropagation();
          onRename();
        }}
      >
        <Pencil size={14} />
      </button>
      <button
        className="grid h-8 w-8 shrink-0 place-items-center rounded text-neutral-400 transition hover:bg-[#f3ece8] hover:text-[#a33a2d] dark:hover:bg-[#2b1714]"
        title="Arbeitsbereich löschen"
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

function StatusRow({ icon, label, value, active }: { icon: ReactNode; label: string; value: string; active?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line pt-2 first:border-t-0 first:pt-0 dark:border-[#2b2b29]">
      <span className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
        {icon}
        {label}
      </span>
      <span className={`rounded px-2 py-0.5 font-medium ${active ? 'bg-[#e3f1ed] text-brand dark:bg-[#123a34]' : 'bg-[#ece8dc] text-neutral-600 dark:bg-[#2b2b29] dark:text-neutral-300'}`}>
        {value}
      </span>
    </div>
  );
}
