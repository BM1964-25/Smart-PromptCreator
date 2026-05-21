import { CheckCircle2, Copy, Save, Settings2, Sparkles, Star, Tags, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { optimizeWithAnthropic, suggestPromptMetadataWithAnthropic } from '../services/anthropicService';
import { defaultOptimizerPreferences, optimizeLocally } from '../services/optimizerService';
import { duplicatePrompt, findOrCreateCategory, updatePrompt } from '../services/promptService';
import type { AiProvider, Category, OptimizerPreferences, Prompt, Settings } from '../types/domain';
import { decryptSecret } from '../utils/crypto';

interface PromptEditorProps {
  prompt?: Prompt;
  settings?: Settings;
  categories: Category[];
  onDelete: (prompt: Prompt) => void;
}

export function PromptEditor({ prompt, settings, categories, onDelete }: PromptEditorProps) {
  const [provider, setProvider] = useState<AiProvider>('anthropic');
  const [anthropicModel, setAnthropicModel] = useState(settings?.anthropicModel || 'claude-3-5-haiku-latest');
  const [showExpertOptions, setShowExpertOptions] = useState(false);
  const [optimizerPreferences, setOptimizerPreferences] = useState<OptimizerPreferences>(defaultOptimizerPreferences);
  const [busy, setBusy] = useState(false);
  const [metadataBusy, setMetadataBusy] = useState(false);
  const promptDescription = prompt?.description || '';
  const contentStats = getTextStats(prompt?.content || '');
  const optimizedStats = getTextStats(prompt?.optimizedContent || '');

  if (!prompt) {
    return <div className="grid place-items-center text-sm text-neutral-500">Erstelle oder importiere einen Eintrag in der Promptbibliothek.</div>;
  }

  async function optimize() {
    if (!prompt) return;
    setBusy(true);
    try {
      let optimized = '';
      if (provider === 'anthropic') {
        const apiKey = await decryptSecret(settings?.apiKeys.anthropic);
        if (!apiKey) throw new Error('Anthropic API-Key fehlt.');
        optimized = await optimizeWithAnthropic(apiKey, prompt.content, optimizerPreferences, anthropicModel);
      } else {
        optimized = optimizeLocally(prompt.content, optimizerPreferences);
      }
      await updatePrompt(prompt.id!, { optimizedContent: optimized });
      toast.success('Prompt optimiert');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Optimierung fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  }

  function updateOptimizerPreference<Key extends keyof OptimizerPreferences>(key: Key, value: OptimizerPreferences[Key]) {
    setOptimizerPreferences((current) => ({ ...current, [key]: value }));
  }

  async function copyOptimizedContent() {
    if (!prompt) return;
    if (!prompt.optimizedContent.trim()) return;
    await navigator.clipboard.writeText(prompt.optimizedContent);
    toast.success('Optimierte Version kopiert');
  }

  async function suggestMetadata() {
    if (!prompt) return;
    if (!prompt.content.trim()) {
      toast.error('Bitte zuerst einen Prompt eingeben.');
      return;
    }

    setMetadataBusy(true);
    try {
      const apiKey = await decryptSecret(settings?.apiKeys.anthropic);
      if (!apiKey) throw new Error('Anthropic API-Key fehlt.');
      const suggestion = await suggestPromptMetadataWithAnthropic(apiKey, prompt.content, prompt.optimizedContent, categories, anthropicModel);
      const category = await findOrCreateCategory(prompt.tabId, suggestion.categoryName);
      await updatePrompt(prompt.id!, {
        title: shouldReplaceGeneratedTitle(prompt.title) ? suggestion.title || prompt.title : prompt.title,
        description: promptDescription.trim() ? promptDescription : suggestion.description || '',
        categoryId: category.id,
        tags: Array.from(new Set([...prompt.tags, ...suggestion.tags])).slice(0, 12)
      });
      toast.success('Titel, Beschreibung, Kategorie und Tags vorgeschlagen');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Metadaten-Vorschlag fehlgeschlagen');
    } finally {
      setMetadataBusy(false);
    }
  }

  async function removeTag(tagToRemove: string) {
    if (!prompt) return;
    await updatePrompt(prompt.id!, { tags: prompt.tags.filter((tag) => tag !== tagToRemove) });
  }

  return (
    <div className="grid min-w-0 grid-rows-[auto_minmax(0,1fr)] bg-[#fdfcf8] dark:bg-[#151515]">
      <header className="flex items-center justify-between border-b border-line px-5 py-3 dark:border-[#333]">
        <div className="min-w-0">
          <input
            value={prompt.title}
            onChange={(event) => updatePrompt(prompt.id!, { title: event.target.value })}
            className="w-full bg-transparent text-lg font-semibold outline-none"
          />
          <p className="text-xs text-neutral-500">Version {prompt.version} · lokal gespeichert</p>
        </div>
        <div className="flex gap-2">
          <button className="icon-only" title="Favorit" onClick={() => updatePrompt(prompt.id!, { favorite: !prompt.favorite })}>
            <Star size={17} className={prompt.favorite ? 'fill-amber text-amber' : ''} />
          </button>
          <button className="icon-only" title="Duplizieren" onClick={() => duplicatePrompt(prompt)}>
            <Copy size={17} />
          </button>
          <button className="icon-only" title="Speichern">
            <Save size={17} />
          </button>
          <button className="icon-only" title="Loeschen" onClick={() => onDelete(prompt)}>
            <Trash2 size={17} />
          </button>
        </div>
      </header>

      <div className="grid min-h-0 grid-cols-2 overflow-hidden">
        <section className="min-h-0 min-w-0 overflow-y-auto border-r border-line dark:border-[#333]">
          <div className="grid gap-3 border-b border-line p-3 dark:border-[#333]">
            <div className="rounded border border-line bg-white p-3 dark:border-[#333] dark:bg-[#181817]">
              <div className="grid grid-cols-3 divide-x divide-line rounded border border-line bg-[#f7f7f4] text-xs dark:divide-[#333] dark:border-[#333] dark:bg-[#151515]">
                <WorkflowStep number="1" title="Prompt" subtitle="Inhalt erfasst" active={Boolean(prompt.content.trim())} />
                <WorkflowStep number="2" title="Metadaten" subtitle="KI ergänzt" active={Boolean(promptDescription.trim() || prompt.tags.length)} />
                <WorkflowStep number="3" title="Speichern" subtitle="Eintrag sichern" active={Boolean(prompt.title.trim() && prompt.categoryId)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
              <label className="grid gap-1 text-xs font-medium text-neutral-500">
                Ziel
                <select className="field" value={optimizerPreferences.goal} onChange={(event) => updateOptimizerPreference('goal', event.target.value as OptimizerPreferences['goal'])}>
                  <option value="writing">Schreiben</option>
                  <option value="coding">Coding</option>
                  <option value="marketing">Marketing</option>
                  <option value="analysis">Analyse</option>
                  <option value="image">Bildprompt</option>
                  <option value="automation">Automatisierung</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs font-medium text-neutral-500">
                Zielgruppe
                <select className="field" value={optimizerPreferences.audience} onChange={(event) => updateOptimizerPreference('audience', event.target.value as OptimizerPreferences['audience'])}>
                  <option value="general">Allgemein</option>
                  <option value="beginner">Einsteiger</option>
                  <option value="expert">Experten</option>
                  <option value="customer">Kunden</option>
                  <option value="management">Management</option>
                  <option value="developer">Entwickler</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs font-medium text-neutral-500">
                Stil
                <select className="field" value={optimizerPreferences.tone} onChange={(event) => updateOptimizerPreference('tone', event.target.value as OptimizerPreferences['tone'])}>
                  <option value="professional">Professionell</option>
                  <option value="precise">Präzise</option>
                  <option value="creative">Kreativ</option>
                  <option value="concise">Kurz</option>
                  <option value="detailed">Ausführlich</option>
                  <option value="persuasive">Überzeugend</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs font-medium text-neutral-500">
                Format
                <select className="field" value={optimizerPreferences.format} onChange={(event) => updateOptimizerPreference('format', event.target.value as OptimizerPreferences['format'])}>
                  <option value="markdown">Markdown</option>
                  <option value="list">Liste</option>
                  <option value="table">Tabelle</option>
                  <option value="json">JSON</option>
                  <option value="steps">Schritte</option>
                  <option value="freeform">Freitext</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs font-medium text-neutral-500">
                Stärke
                <select className="field" value={optimizerPreferences.strength} onChange={(event) => updateOptimizerPreference('strength', event.target.value as OptimizerPreferences['strength'])}>
                  <option value="fast">Schnell</option>
                  <option value="balanced">Ausgewogen</option>
                  <option value="premium">Premium</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs font-medium text-neutral-500">
                Sprache
                <select className="field" value={optimizerPreferences.language} onChange={(event) => updateOptimizerPreference('language', event.target.value as OptimizerPreferences['language'])}>
                  <option value="auto">Automatisch</option>
                  <option value="de">Deutsch</option>
                  <option value="en">Englisch</option>
                </select>
              </label>
            </div>
            <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={optimizerPreferences.askClarifyingQuestions}
                onChange={(event) => updateOptimizerPreference('askClarifyingQuestions', event.target.checked)}
              />
              Fehlende Informationen als Rückfragen ergänzen
            </label>
            <div className="grid gap-3 rounded border border-line bg-white p-3 dark:border-[#333] dark:bg-[#181817]">
              <div>
                <h2 className="text-sm font-semibold">Metadaten</h2>
                <p className="text-xs text-neutral-500">Titel, Beschreibung, Kategorie und Tags fuer die Bibliothek.</p>
              </div>
              <label className="grid gap-1 text-xs font-medium text-neutral-500">
                Titel
                <input
                  className="field"
                  value={prompt.title}
                  onChange={(event) => updatePrompt(prompt.id!, { title: event.target.value })}
                  placeholder="Kurzer, klarer Titel"
                />
              </label>
              <label className="grid gap-1 text-xs font-medium text-neutral-500">
                Beschreibung
                <textarea
                  className="field min-h-20 resize-y leading-6"
                  value={promptDescription}
                  onChange={(event) => updatePrompt(prompt.id!, { description: event.target.value })}
                  placeholder="Kurze Beschreibung fuer die Promptbibliothek"
                />
              </label>
              <div className="rounded border border-line bg-[#f9f8f3] p-3 text-xs leading-5 text-neutral-600 dark:border-[#333] dark:bg-[#151515] dark:text-neutral-300">
                Füllt leere Titel- und Beschreibungsfelder per KI. Kategorie wird vorgeschlagen, Tags werden ergänzt.
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <label className="grid gap-1 text-xs font-medium text-neutral-500">
                  Kategorie zum Speichern
                  <select
                    className="field"
                    value={prompt.categoryId}
                    onChange={(event) => {
                      const category = categories.find((item) => item.id === event.target.value);
                      updatePrompt(prompt.id!, { categoryId: event.target.value, tabId: category?.tabId || prompt.tabId });
                    }}
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="icon-button self-end" onClick={suggestMetadata} disabled={metadataBusy}>
                  <Tags size={16} /> {metadataBusy ? 'Analysiert...' : 'Titel & Metadaten'}
                </button>
              </div>

              <label className="grid gap-1 text-xs font-medium text-neutral-500">
                Tags zum Wiederfinden
                <input
                  className="field"
                  value={prompt.tags.join(', ')}
                  onChange={(event) =>
                    updatePrompt(prompt.id!, {
                      tags: event.target.value
                        .split(',')
                        .map((tag) => tag.trim().replace(/^#/, '').toLowerCase())
                        .filter(Boolean)
                    })
                  }
                  placeholder="seo, blog, strategie"
                />
              </label>

              <div className="flex min-h-8 flex-wrap gap-2">
                {prompt.tags.length === 0 && <span className="text-xs text-neutral-500">Noch keine Tags vergeben.</span>}
                {prompt.tags.map((tag) => (
                  <button
                    key={tag}
                    className="rounded bg-[#ece8dc] px-2 py-1 text-xs text-neutral-700 transition hover:bg-[#ded8c8] dark:bg-[#2b2b29] dark:text-neutral-300"
                    onClick={() => removeTag(tag)}
                    title="Tag entfernen"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex min-h-0 flex-col p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Eingabe</h2>
                <p className="text-xs text-neutral-500">Originalprompt oder Rohidee</p>
              </div>
              <span className="rounded bg-[#ece8dc] px-2 py-1 text-xs text-neutral-600 dark:bg-[#2b2b29] dark:text-neutral-300">
                {contentStats.words} Wörter · {contentStats.characters} Zeichen
              </span>
            </div>
            <textarea
              value={prompt.content}
              onChange={(event) => updatePrompt(prompt.id!, { content: event.target.value })}
              className="h-[360px] min-h-56 resize-y rounded border border-line bg-[#fffefa] p-5 text-[15px] leading-8 text-ink outline-none transition placeholder:text-neutral-400 focus:border-brand focus:bg-white focus:shadow-soft dark:border-[#333] dark:bg-[#181817] dark:text-[#f3f0e8] dark:focus:bg-[#151515]"
              placeholder="Beschreibe hier, was die KI tun soll..."
            />
          </div>
        </section>

        <section className="min-h-0 min-w-0 overflow-y-auto">
          <div className="grid gap-2 border-b border-line p-3 dark:border-[#333]">
            <div className="flex items-center gap-2">
              <button className="icon-button" onClick={() => setShowExpertOptions((current) => !current)}>
                <Settings2 size={16} /> Expertenmodus
              </button>
              <button className="icon-button ml-auto" onClick={optimize} disabled={busy}>
                <Sparkles size={16} /> {busy ? 'Optimiert...' : 'Optimieren'}
              </button>
            </div>
            {showExpertOptions && (
              <div className="grid grid-cols-2 gap-2 rounded border border-line bg-white p-3 dark:border-[#3a3a38] dark:bg-[#181817]">
                <label className="grid gap-1 text-xs font-medium text-neutral-500">
                  Anbieter
                  <select className="field" value={provider} onChange={(event) => setProvider(event.target.value as AiProvider)}>
                    <option value="anthropic">Anthropic</option>
                    <option value="local">Lokale Vorlage</option>
                  </select>
                </label>
                {provider === 'anthropic' && (
                  <label className="grid gap-1 text-xs font-medium text-neutral-500">
                    Anthropic Modell
                    <input className="field" value={anthropicModel} onChange={(event) => setAnthropicModel(event.target.value)} />
                  </label>
                )}
              </div>
            )}
          </div>
          <div className="flex min-h-0 flex-col bg-[#faf8f1] p-4 dark:bg-[#171716]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Optimierte Ausgabe</h2>
                <p className="text-xs text-neutral-500">Direkt kopierbarer Zielprompt</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#e3f1ed] px-2 py-1 text-xs text-brand dark:bg-[#123a34]">
                  {optimizedStats.words} Wörter · {optimizedStats.characters} Zeichen
                </span>
                <button className="icon-only" title="Optimierte Version kopieren" onClick={copyOptimizedContent} disabled={!prompt.optimizedContent.trim()}>
                  <Copy size={16} />
                </button>
              </div>
            </div>
            <textarea
              value={prompt.optimizedContent}
              onChange={(event) => updatePrompt(prompt.id!, { optimizedContent: event.target.value })}
              className="h-[calc(100vh-255px)] min-h-80 resize-y rounded border border-line bg-white p-5 text-[15px] leading-8 text-ink outline-none transition placeholder:text-neutral-400 focus:border-brand focus:shadow-soft dark:border-[#333] dark:bg-[#111] dark:text-[#f3f0e8]"
              placeholder="Hier erscheint die optimierte Version..."
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function getTextStats(value: string) {
  const trimmed = value.trim();
  return {
    characters: value.length,
    words: trimmed ? trimmed.split(/\s+/).length : 0
  };
}

function shouldReplaceGeneratedTitle(title: string) {
  const normalized = title.trim().toLowerCase();
  return !normalized || normalized === 'neuer prompt' || normalized.endsWith(' kopie');
}

function WorkflowStep({ number, title, subtitle, active }: { number: string; title: string; subtitle: string; active?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${active ? 'bg-brand text-white' : 'bg-[#ece8dc] text-neutral-600 dark:bg-[#2b2b29] dark:text-neutral-300'}`}>
        {active ? <CheckCircle2 size={14} /> : number}
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-neutral-800 dark:text-neutral-100">{title}</span>
        <span className="block text-neutral-500">{subtitle}</span>
      </span>
    </div>
  );
}
