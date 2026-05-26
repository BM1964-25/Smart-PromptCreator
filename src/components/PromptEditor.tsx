import { CheckCircle2, Copy, Save, Settings2, Sparkles, Star, Tags, Trash2, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { normalizeAnthropicModel, optimizeWithAnthropic, suggestPromptMetadataWithAnthropic } from '../services/anthropicService';
import { buildVariantOptimizationPrompt, defaultOptimizerPreferences, optimizeLocally, optimizeVariantLocally } from '../services/optimizerService';
import { duplicatePrompt, findOrCreateCategory, undoLastPromptChange, updatePrompt } from '../services/promptService';
import type { AiProvider, Category, OptimizerPreferences, Prompt, PromptVariant, PromptVariantTone, Settings } from '../types/domain';
import { decryptSecret } from '../utils/crypto';

interface PromptEditorProps {
  prompt?: Prompt;
  settings?: Settings;
  categories: Category[];
  onDelete: (prompt: Prompt) => void;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  onCreatePrompt?: () => void;
}

export function PromptEditor({ prompt, settings, categories, onDelete, emptyStateTitle, emptyStateDescription, onCreatePrompt }: PromptEditorProps) {
  const [provider, setProvider] = useState<AiProvider>('anthropic');
  const [showExpertOptions, setShowExpertOptions] = useState(false);
  const [optimizerPreferences, setOptimizerPreferences] = useState<OptimizerPreferences>(defaultOptimizerPreferences);
  const [busy, setBusy] = useState(false);
  const [variantBusy, setVariantBusy] = useState<PromptVariantTone | 'all'>();
  const [metadataBusy, setMetadataBusy] = useState(false);
  const promptDescription = prompt?.description || '';
  const contentStats = getTextStats(prompt?.content || '');
  const optimizedStats = getTextStats(prompt?.optimizedContent || '');
  const variants = getPromptVariants(prompt);
  const anthropicModel = normalizeAnthropicModel(settings?.anthropicModel);

  if (!prompt) {
    return (
      <div className="grid place-items-center bg-[#fdfcf8] p-8 text-center dark:bg-[#151515]">
        <div className="max-w-md rounded border border-dashed border-line bg-white p-6 shadow-sm dark:border-[#333] dark:bg-[#181817]">
          <Sparkles className="mx-auto mb-3 text-brand" size={26} />
          <h2 className="text-lg font-semibold">{emptyStateTitle || 'Noch kein Prompt vorhanden'}</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            {emptyStateDescription || 'Erstelle oder importiere einen Eintrag in der Prompt-Bibliothek.'}
          </p>
          {onCreatePrompt && (
            <button className="icon-button ai-button mx-auto mt-4" type="button" onClick={onCreatePrompt}>
              <Sparkles size={16} /> Ersten Prompt erstellen
            </button>
          )}
        </div>
      </div>
    );
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

  async function optimizeContent(content: string, preferences: OptimizerPreferences, tone: PromptVariantTone) {
    if (provider === 'anthropic') {
      const apiKey = await decryptSecret(settings?.apiKeys.anthropic);
      if (!apiKey) throw new Error('Anthropic API-Key fehlt.');
      return optimizeWithAnthropic(apiKey, buildVariantOptimizationPrompt(content, preferences, tone), preferences, anthropicModel);
    }

    return optimizeVariantLocally(content, preferences, tone);
  }

  async function generateVariants() {
    if (!prompt) return;
    if (!prompt.content.trim()) {
      toast.error('Bitte zuerst einen Prompt eingeben.');
      return;
    }

    setVariantBusy('all');
    try {
      const nextVariants: PromptVariant[] = [];
      for (const preset of variantPresets) {
        const content = await optimizeContent(prompt.content, createVariantPreferences(optimizerPreferences, preset.tone), preset.tone);
        nextVariants.push({
          id: preset.tone,
          tone: preset.tone,
          title: preset.title,
          goal: preset.goal,
          description: preset.description,
          content,
          updatedAt: new Date().toISOString()
        });
      }
      await updatePrompt(prompt.id!, {
        variants: nextVariants,
        optimizedContent: nextVariants.find((variant) => variant.tone === 'premium')?.content || nextVariants[0]?.content || prompt.optimizedContent
      });
      toast.success('2 Varianten erstellt');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Varianten konnten nicht erstellt werden');
    } finally {
      setVariantBusy(undefined);
    }
  }

  async function improveVariant(variant: PromptVariant) {
    if (!prompt) return;
    setVariantBusy(variant.tone);
    try {
      const improved = await optimizeContent(variant.content || prompt.content, createVariantPreferences(optimizerPreferences, variant.tone), variant.tone);
      const nextVariants = variants.map((item) =>
        item.tone === variant.tone
          ? {
              ...item,
              content: improved,
              updatedAt: new Date().toISOString()
            }
          : item
      );
      await updatePrompt(prompt.id!, { variants: nextVariants });
      toast.success(`${variant.title} verbessert`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Variante konnte nicht verbessert werden');
    } finally {
      setVariantBusy(undefined);
    }
  }

  async function useVariant(variant: PromptVariant) {
    if (!prompt) return;
    if (!variant.content.trim()) return;
    await updatePrompt(prompt.id!, { optimizedContent: variant.content });
    toast.success(`${variant.title} übernommen`);
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

  async function undoLastChange() {
    if (!prompt?.id) return;
    const restored = await undoLastPromptChange(prompt.id);
    if (restored) {
      toast.success('Letzter Schritt rückgängig gemacht');
    } else {
      toast.info('Kein vorheriger Schritt vorhanden');
    }
  }

  return (
    <div className="grid min-w-0 grid-rows-[auto_minmax(0,1fr)] bg-[#fdfcf8] dark:bg-[#151515]">
      <header className="flex min-h-[68px] items-center justify-between border-b border-line px-5 py-3 dark:border-[#333]">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-normal">Prompt-Werkstatt</h2>
          <p className="text-xs text-neutral-500">Prompt bearbeiten · Varianten vergleichen · Ausgabe übernehmen</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button className="toolbar-action" aria-label="Rückgängig" onClick={undoLastChange} disabled={!prompt.history.length}>
            <span>Rückgängig</span>
            <Undo2 size={17} />
          </button>
          <button className="toolbar-action" aria-label="Favorit" onClick={() => updatePrompt(prompt.id!, { favorite: !prompt.favorite })}>
            <span>Favorit</span>
            <Star size={17} className={prompt.favorite ? 'fill-amber text-amber' : ''} />
          </button>
          <button className="toolbar-action" aria-label="Duplizieren" onClick={() => duplicatePrompt(prompt)}>
            <span>Duplizieren</span>
            <Copy size={17} />
          </button>
          <button className="toolbar-action" aria-label="Speichern">
            <span>Speichern</span>
            <Save size={17} />
          </button>
          <button className="toolbar-action" aria-label="Löschen" onClick={() => onDelete(prompt)}>
            <span>Löschen</span>
            <Trash2 size={17} />
          </button>
        </div>
      </header>

      <div className="grid min-h-0 grid-cols-2 overflow-hidden">
        <section className="grid min-h-0 min-w-0 grid-rows-[minmax(560px,66%)_minmax(180px,34%)] border-r border-line dark:border-[#333]">
          <div className="min-h-0 overflow-y-auto border-b border-line p-3 dark:border-[#333]">
            <div className="grid gap-3">
            <div className="rounded border border-line bg-white px-3 py-2 dark:border-[#333] dark:bg-[#181817]">
              <input
                value={prompt.title}
                onChange={(event) => updatePrompt(prompt.id!, { title: event.target.value })}
                className="w-full bg-transparent text-base font-semibold outline-none"
              />
              <p className="text-xs text-neutral-500">Version {prompt.version} · lokal gespeichert</p>
            </div>
            <div className="rounded border border-line bg-white px-3 py-4 dark:border-[#333] dark:bg-[#181817]">
              <div className="relative grid grid-cols-4 gap-3">
                <div className="absolute left-[12.5%] right-[12.5%] top-4 h-px bg-line dark:bg-[#333]" />
                <WorkflowStep
                  number="01"
                  title="Prompt-Ziel klären"
                  subtitle={['Was soll entstehen?', 'Für wen ist es gedacht?', 'Welche Infos fehlen?']}
                  active={Boolean(prompt.content.trim())}
                />
                <WorkflowStep
                  number="02"
                  title="Masterstruktur aufbauen"
                  subtitle={['Rolle und Ziel definieren.', 'Kontext einordnen.', 'Aufgaben klar gliedern.']}
                  active={Boolean(prompt.content.trim() && prompt.categoryId)}
                />
                <WorkflowStep
                  number="03"
                  title="Varianten vergleichen"
                  subtitle={['Kompakt schnell nutzen.', 'Premium sauber ausarbeiten.', 'Beste Richtung wählen.']}
                  active={variants.some((variant) => variant.content.trim())}
                />
                <WorkflowStep
                  number="04"
                  title="Prompt finalisieren"
                  subtitle={['Ausgabe übernehmen.', 'Details nachschärfen.', 'Speichern und wiederfinden.']}
                  active={Boolean(prompt.optimizedContent.trim())}
                />
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
                <p className="text-xs text-neutral-500">Titel, Beschreibung, Kategorie und Tags für die Bibliothek.</p>
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
                  placeholder="Kurze Beschreibung für die Prompt-Bibliothek"
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
                <button className="icon-button ai-button self-end" onClick={suggestMetadata} disabled={metadataBusy}>
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
              className="min-h-0 flex-1 resize-none rounded border border-line bg-[#fffefa] p-5 text-[15px] leading-8 text-ink outline-none transition placeholder:text-neutral-400 focus:border-brand focus:bg-white focus:shadow-soft dark:border-[#333] dark:bg-[#181817] dark:text-[#f3f0e8] dark:focus:bg-[#151515]"
              placeholder="Beschreibe hier, was die KI tun soll..."
            />
          </div>
        </section>

        <section className="grid min-h-0 min-w-0 grid-rows-[minmax(560px,66%)_minmax(180px,34%)]">
          <div className="min-h-0 overflow-y-auto border-b border-line p-3 dark:border-[#333]">
            <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2">
              <div className="grid gap-2">
                <div className="flex items-start justify-between gap-3">
                  <button className="icon-button" onClick={() => setShowExpertOptions((current) => !current)}>
                    <Settings2 size={16} /> Expertenmodus
                  </button>
                  <div className="mr-[13px] grid w-36 shrink-0 gap-2">
                    <button className="icon-button ai-button w-full justify-center" onClick={optimize} disabled={busy}>
                      <Sparkles size={16} /> {busy ? 'Optimiert...' : 'Optimieren'}
                    </button>
                  </div>
                </div>
                {showExpertOptions && (
                  <div className="grid gap-3 rounded border border-line bg-white p-3 dark:border-[#3a3a38] dark:bg-[#181817]">
                    <label className="grid gap-1 text-xs font-medium text-neutral-500">
                      Anbieter
                      <select className="field" value={provider} onChange={(event) => setProvider(event.target.value as AiProvider)}>
                        <option value="anthropic">Anthropic</option>
                        <option value="local">Lokal</option>
                      </select>
                    </label>
                    <div className="rounded border border-line bg-[#f9f8f3] p-3 text-xs leading-5 text-neutral-600 dark:border-[#333] dark:bg-[#151515] dark:text-neutral-300">
                      {provider === 'anthropic'
                        ? 'Anthropic nutzt deinen gespeicherten API-Schlüssel, sendet den Prompt an Claude und erzeugt eine KI-optimierte Version. Dafür ist eine aktive Verbindung erforderlich.'
                        : 'Lokal verarbeitet den Prompt nur im Browser mit einer eingebauten Vorlage. Es werden keine Inhalte an Anthropic gesendet, die Optimierung ist dafür regelbasiert und weniger kreativ.'}
                    </div>
                  </div>
                )}
              </div>
            <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 rounded border border-line bg-white p-3 dark:border-[#3a3a38] dark:bg-[#181817]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">Variantenvergleich</h2>
                  <p className="text-xs text-neutral-500">Kompakte und Premium-Struktur vergleichen, übernehmen und weiter verbessern.</p>
                </div>
                <button className="icon-button ai-button w-36 shrink-0 justify-center" onClick={generateVariants} disabled={Boolean(variantBusy)}>
                  <Sparkles size={16} /> {variantBusy === 'all' ? 'Erstellt...' : '2 Varianten'}
                </button>
              </div>
              <div className="grid min-h-0 gap-2 xl:grid-cols-2">
                {variants.map((variant) => {
                  const stats = getTextStats(variant.content);
                  const isBusy = variantBusy === variant.tone;
                  return (
                    <article key={variant.tone} className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-2 rounded border border-line bg-[#f9f8f3] p-3 dark:border-[#333] dark:bg-[#151515]">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold">{variant.title}</h3>
                          <span className="rounded bg-[#ece8dc] px-2 py-1 text-[11px] text-neutral-600 dark:bg-[#2b2b29] dark:text-neutral-300">
                            {stats.words} Wörter
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-neutral-500">{variant.description}</p>
                        <p className="mt-2 rounded border border-line bg-white px-2 py-1.5 text-xs leading-5 text-neutral-600 dark:border-[#333] dark:bg-[#111] dark:text-neutral-300">
                          <span className="font-semibold">Ziel:</span> {variant.goal}
                        </p>
                      </div>
                      <textarea
                        className="min-h-0 resize-none rounded border border-line bg-white p-3 text-xs leading-5 outline-none focus:border-brand dark:border-[#333] dark:bg-[#111]"
                        value={variant.content}
                        onChange={(event) =>
                          updatePrompt(prompt.id!, {
                            variants: variants.map((item) =>
                              item.tone === variant.tone ? { ...item, content: event.target.value, updatedAt: new Date().toISOString() } : item
                            )
                          })
                        }
                        placeholder={`${variant.title} Variante erscheint hier...`}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <button className="icon-button justify-center" onClick={() => useVariant(variant)} disabled={!variant.content.trim()}>
                          <CheckCircle2 size={16} /> Übernehmen
                        </button>
                        <button className="icon-button ai-button justify-center" onClick={() => improveVariant(variant)} disabled={Boolean(variantBusy) || !variant.content.trim()}>
                          <Sparkles size={16} /> {isBusy ? 'Verbessert...' : 'Verbessern'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
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
              className="min-h-44 flex-1 resize-none rounded border border-line bg-white p-5 text-[15px] leading-8 text-ink outline-none transition placeholder:text-neutral-400 focus:border-brand focus:shadow-soft dark:border-[#333] dark:bg-[#111] dark:text-[#f3f0e8]"
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

const variantPresets: Array<Pick<PromptVariant, 'tone' | 'title' | 'goal' | 'description'>> = [
  {
    tone: 'compact',
    title: 'Kompakt',
    goal: 'Schnell einen klaren, direkt nutzbaren Prompt erzeugen.',
    description: 'Kurze Struktur mit Rolle, Ziel, Aufgaben, Ausgabeformat und Qualitätsanforderungen.'
  },
  {
    tone: 'premium',
    title: 'Premium',
    goal: 'Den bestmöglichen Prompt nach Masterstruktur für hochwertige Ergebnisse erstellen.',
    description: 'Vollständige Struktur mit Kontext, Ziel, Aufgaben, Ausgabeformat und Qualitätsanforderungen.'
  }
];

function getPromptVariants(prompt?: Prompt): PromptVariant[] {
  const existing = prompt?.variants || [];
  return variantPresets.map((preset) => {
    const variant = existing.find((item) => item.tone === preset.tone);
    return {
      id: variant?.id || preset.tone,
      tone: preset.tone,
      title: preset.title,
      goal: variant?.goal || preset.goal,
      description: preset.description,
      content: variant?.content || '',
      updatedAt: variant?.updatedAt || ''
    };
  });
}

function createVariantPreferences(preferences: OptimizerPreferences, tone: PromptVariantTone): OptimizerPreferences {
  if (tone === 'compact') {
    return {
      ...preferences,
      tone: 'concise',
      strength: 'fast',
      format: preferences.format === 'freeform' ? 'steps' : preferences.format,
      askClarifyingQuestions: false
    };
  }

  return {
    ...preferences,
    tone: 'detailed',
    strength: 'premium',
    askClarifyingQuestions: true
  };
}

function shouldReplaceGeneratedTitle(title: string) {
  const normalized = title.trim().toLowerCase();
  return !normalized || normalized === 'neuer prompt' || normalized.endsWith(' kopie');
}

function WorkflowStep({ number, title, subtitle, active }: { number: string; title: string; subtitle: string[]; active?: boolean }) {
  return (
    <div className="relative z-10 grid justify-items-center gap-2 text-center">
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold ${active ? 'bg-[#111a20] text-white shadow-soft dark:bg-[#f3f0e8] dark:text-[#111]' : 'bg-[#ece8dc] text-neutral-600 dark:bg-[#2b2b29] dark:text-neutral-300'}`}>
        {number}
      </span>
      <span className="grid gap-1">
        <span className="text-[13px] font-bold leading-4 text-neutral-900 dark:text-neutral-100">{title}</span>
        <span className="grid min-h-[60px] content-start text-[12px] leading-5 text-neutral-500 dark:text-neutral-400">
          {subtitle.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </span>
      </span>
    </div>
  );
}
