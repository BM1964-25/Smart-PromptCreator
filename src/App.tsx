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
  HardDrive,
  HelpCircle,
  KeyRound,
  Library,
  Moon,
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

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  const selectedPrompt = prompts?.find((prompt) => prompt.id === store.selectedPromptId) || visiblePrompts[0];
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

  async function deletePrompt(prompt: Prompt) {
    if (!prompt.id) return;
    const confirmed = window.confirm(`Soll "${prompt.title}" wirklich aus der Prompt-Bibliothek geloescht werden?`);
    if (!confirmed) return;

    await db.prompts.delete(prompt.id);
    const remainingPrompts = (prompts || []).filter((item) => item.id !== prompt.id);
    const nextPrompt = remainingPrompts[0];
    store.setSelectedPrompt(nextPrompt?.id);
    toast.success('Eintrag geloescht');
  }

  async function deleteTab(tab: WorkspaceTab) {
    if (!tab.id) return;
    const confirmed = window.confirm(`Soll der Tab "${tab.name}" wirklich geloescht werden? Prompts bleiben erhalten und werden aus diesem Tab geloest.`);
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
    toast.success('Tab geloescht');
  }

  async function deleteCategory(category: Category) {
    if (!category.id) return;
    const confirmed = window.confirm(`Soll die Kategorie "${category.name}" wirklich geloescht werden? Prompts bleiben erhalten.`);
    if (!confirmed) return;

    await db.transaction('rw', db.categories, db.prompts, async () => {
      await db.categories.delete(category.id!);
      const categoryPrompts = await db.prompts.where({ categoryId: category.id }).toArray();
      await Promise.all(categoryPrompts.map((prompt) => db.prompts.update(prompt.id!, { categoryId: '' })));
    });

    if (store.activeCategoryId === category.id) store.setActiveCategory(undefined);
    toast.success('Kategorie geloescht');
  }

  return (
    <main className="flex h-screen bg-[#ebe8df] text-ink dark:bg-[#171717] dark:text-[#f3f0e8]">
      <aside
        className={`relative flex shrink-0 flex-col border-r border-line bg-panel transition-[width] duration-200 dark:border-[#333] dark:bg-[#20201f] ${
          sidebarCollapsed ? 'w-20' : 'w-80'
        }`}
      >
        <div className="border-b border-line p-4 dark:border-[#333]">
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <img
              src="/smart-promptcreator-icon.png"
              alt="SMART PromptCreator"
              className="h-9 w-9 rounded object-cover"
              draggable={false}
            />
            {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="whitespace-nowrap text-[22px] font-semibold tracking-normal">SMART PromptCreator</h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Lokale Prompt-Bibliothek</p>
            </div>
            )}
          </div>
        </div>

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
              onClick={() => createPrompt({ tabId: store.activeTabId, categoryId: store.activeCategoryId })}
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
            <button className={`sidebar-nav-row active ${sidebarCollapsed ? 'justify-center px-0' : ''}`} title="Bibliothek">
              <Library size={17} />
              {!sidebarCollapsed && <span>Bibliothek</span>}
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
            <button
              className={`icon-only mt-1 ${
                sidebarCollapsed ? 'mx-auto' : ''
              }`}
              title={sidebarCollapsed ? 'Sidebar ausklappen' : 'Sidebar einklappen'}
              onClick={() => setSidebarCollapsed((current) => !current)}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>

          {!sidebarCollapsed && (
            <>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Tabs</span>
                <button className="icon-only" title="Tab hinzufuegen" onClick={() => createTab()}>
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
                        onSelect={() => store.setActiveTab(tab.id)}
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
            onSelect={store.setActiveCategory}
            onCreate={() => store.activeTabId && createCategory(store.activeTabId)}
            onDelete={deleteCategory}
            collapsed={sidebarCollapsed}
          />
        </nav>

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
            <>
              <div className="rounded border border-line bg-white p-3 text-xs shadow-sm dark:border-[#3a3a38] dark:bg-[#151515]">
                <div className="mb-2 flex items-center gap-2 font-semibold text-neutral-700 dark:text-neutral-200">
                  <ShieldCheck size={15} />
                  Systemstatus
                </div>
                <div className="space-y-2">
                  <StatusRow icon={<KeyRound size={14} />} label="Lizenz" value={licenseStatus === 'active' ? 'Aktiv' : 'Nicht aktiviert'} active={licenseStatus === 'active'} />
                  <StatusRow icon={<Sparkles size={14} />} label="Anthropic" value={anthropicReady ? 'Konfiguriert' : 'API-Key fehlt'} active={anthropicReady} />
                  <StatusRow icon={<HardDrive size={14} />} label="Speicher" value="IndexedDB lokal" active />
                  <StatusRow icon={<FileText size={14} />} label="Prompt-Bibliothek" value={`${prompts?.length || 0}`} active />
                </div>
              </div>

              <footer className="space-y-2 text-center text-[11px] leading-5 text-neutral-500 dark:text-neutral-400">
                <div>
                  <p className="font-medium text-neutral-600 dark:text-neutral-300">© 2026 BuiltSmart AI</p>
                  <p>powered by BuiltSmart Hub</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                  <a className="hover:text-brand" href="https://www.built-smart-hub.com/impressum" target="_blank" rel="noreferrer">Impressum</a>
                  <span>|</span>
                  <a className="hover:text-brand" href="https://www.built-smart-hub.com/datenschutz" target="_blank" rel="noreferrer">Datenschutz</a>
                  <span>|</span>
                  <a className="hover:text-brand" href="https://www.built-smart-hub.com/agb" target="_blank" rel="noreferrer">AGB</a>
                  <a className="basis-full hover:text-brand" href="https://www.built-smart-hub.com/widerrufbelehrung" target="_blank" rel="noreferrer">Widerrufbelehrung</a>
                </div>
              </footer>
            </>
          )}
        </div>
      </aside>

      <section className="grid min-w-0 flex-1 grid-cols-[360px_minmax(0,1fr)]">
        <PromptList
          prompts={visiblePrompts}
          categories={categories || []}
          selectedId={selectedPrompt?.id}
          search={store.search}
          onSearchChange={store.setSearch}
          onSelect={store.setSelectedPrompt}
          onDelete={deletePrompt}
        />
        <PromptEditor prompt={selectedPrompt} settings={settings} categories={categories || []} onDelete={deletePrompt} />
      </section>

      {showSettings && <SettingsPanel settings={settings} onClose={() => setShowSettings(false)} />}
      {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}
    </main>
  );
}

function SortableTab({
  tab,
  active,
  onSelect,
  onDelete
}: {
  tab: WorkspaceTab;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: tab.id! });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="group flex items-center gap-1">
      <button {...attributes} {...listeners} onClick={onSelect} className={`nav-row min-w-0 flex-1 ${active ? 'active' : ''}`}>
        <Folder className="mr-2 shrink-0 text-neutral-500" size={16} />
        <span className="truncate">{tab.name}</span>
      </button>
      <button
        className="grid h-8 w-8 shrink-0 place-items-center rounded text-neutral-400 opacity-0 transition hover:bg-[#f3ece8] hover:text-[#a33a2d] group-hover:opacity-100 focus:opacity-100 dark:hover:bg-[#2b1714]"
        title="Tab loeschen"
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
