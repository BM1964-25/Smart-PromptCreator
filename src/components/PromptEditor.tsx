import { Copy, Save, Settings2, Sparkles, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { db } from '../db/database';
import { optimizeWithAnthropic } from '../services/anthropicService';
import { defaultOptimizerPreferences, optimizeLocally, optimizeWithOpenAI } from '../services/openaiService';
import { optimizeWithOllama } from '../services/ollamaService';
import { duplicatePrompt, updatePrompt } from '../services/promptService';
import type { AiProvider, OptimizerPreferences, Prompt, Settings } from '../types/domain';
import { decryptSecret } from '../utils/crypto';

interface PromptEditorProps {
  prompt?: Prompt;
  settings?: Settings;
}

export function PromptEditor({ prompt, settings }: PromptEditorProps) {
  const [provider, setProvider] = useState<AiProvider>('local');
  const [openAiModel, setOpenAiModel] = useState(settings?.defaultModel || 'gpt-4.1-mini');
  const [anthropicModel, setAnthropicModel] = useState('claude-3-5-haiku-latest');
  const [ollamaModel, setOllamaModel] = useState('llama3');
  const [showExpertOptions, setShowExpertOptions] = useState(false);
  const [optimizerPreferences, setOptimizerPreferences] = useState<OptimizerPreferences>(defaultOptimizerPreferences);
  const [busy, setBusy] = useState(false);

  if (!prompt) {
    return <div className="grid place-items-center text-sm text-neutral-500">Erstelle oder importiere einen Prompt.</div>;
  }

  async function optimize() {
    if (!prompt) return;
    setBusy(true);
    try {
      let optimized = '';
      if (provider === 'openai') {
        const apiKey = await decryptSecret(settings?.apiKeys.openai);
        if (!apiKey) throw new Error('OpenAI API-Key fehlt.');
        optimized = await optimizeWithOpenAI(apiKey, prompt.content, optimizerPreferences, openAiModel);
      } else if (provider === 'anthropic') {
        const apiKey = await decryptSecret(settings?.apiKeys.anthropic);
        if (!apiKey) throw new Error('Anthropic API-Key fehlt.');
        optimized = await optimizeWithAnthropic(apiKey, prompt.content, optimizerPreferences, anthropicModel);
      } else if (provider === 'ollama') {
        optimized = await optimizeWithOllama(ollamaModel, prompt.content, optimizerPreferences);
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
          <button className="icon-only" title="Loeschen" onClick={() => db.prompts.delete(prompt.id!)}>
            <Trash2 size={17} />
          </button>
        </div>
      </header>

      <div className="grid min-h-0 grid-cols-2">
        <section className="flex min-w-0 flex-col border-r border-line dark:border-[#333]">
          <div className="grid gap-3 border-b border-line p-3 dark:border-[#333]">
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
            <input
              className="field"
              value={prompt.tags.join(', ')}
              onChange={(event) => updatePrompt(prompt.id!, { tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) })}
              placeholder="Tags"
            />
          </div>
          <textarea
            value={prompt.content}
            onChange={(event) => updatePrompt(prompt.id!, { content: event.target.value })}
            className="min-h-0 flex-1 resize-none bg-transparent p-5 text-sm leading-7 outline-none"
            placeholder="Ausgangsprompt..."
          />
        </section>

        <section className="flex min-w-0 flex-col">
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
                    <option value="local">Lokal</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="ollama">Ollama</option>
                  </select>
                </label>
                {provider === 'openai' && (
                  <label className="grid gap-1 text-xs font-medium text-neutral-500">
                    Modell
                    <input className="field" value={openAiModel} onChange={(event) => setOpenAiModel(event.target.value)} />
                  </label>
                )}
                {provider === 'anthropic' && (
                  <label className="grid gap-1 text-xs font-medium text-neutral-500">
                    Modell
                    <input className="field" value={anthropicModel} onChange={(event) => setAnthropicModel(event.target.value)} />
                  </label>
                )}
                {provider === 'ollama' && (
                  <label className="grid gap-1 text-xs font-medium text-neutral-500">
                    Lokales Modell
                    <input className="field" value={ollamaModel} onChange={(event) => setOllamaModel(event.target.value)} />
                  </label>
                )}
              </div>
            )}
          </div>
          <textarea
            value={prompt.optimizedContent}
            onChange={(event) => updatePrompt(prompt.id!, { optimizedContent: event.target.value })}
            className="min-h-0 flex-1 resize-none bg-transparent p-5 text-sm leading-7 outline-none"
            placeholder="Optimierte Version..."
          />
        </section>
      </div>
    </div>
  );
}
