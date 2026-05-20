import { Copy, Save, Sparkles, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { db } from '../db/database';
import { optimizeLocally, optimizeWithOpenAI } from '../services/openaiService';
import { optimizeWithOllama } from '../services/ollamaService';
import { duplicatePrompt, updatePrompt } from '../services/promptService';
import { useAppStore } from '../store/useAppStore';
import type { Prompt, Settings } from '../types/domain';
import { decryptSecret } from '../utils/crypto';

interface PromptEditorProps {
  prompt?: Prompt;
  settings?: Settings;
}

export function PromptEditor({ prompt, settings }: PromptEditorProps) {
  const [provider, setProvider] = useState<'openai' | 'ollama' | 'local'>('local');
  const [ollamaModel, setOllamaModel] = useState('llama3');
  const [busy, setBusy] = useState(false);
  const mode = useAppStore((state) => state.optimizerMode);
  const setMode = useAppStore((state) => state.setOptimizerMode);

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
        optimized = await optimizeWithOpenAI(apiKey, prompt.content, mode, settings?.defaultModel);
      } else if (provider === 'ollama') {
        optimized = await optimizeWithOllama(ollamaModel, prompt.content, mode);
      } else {
        optimized = optimizeLocally(prompt.content, mode);
      }
      await updatePrompt(prompt.id!, { optimizedContent: optimized });
      toast.success('Prompt optimiert');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Optimierung fehlgeschlagen');
    } finally {
      setBusy(false);
    }
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
          <div className="flex items-center gap-2 border-b border-line p-3 dark:border-[#333]">
            <select className="field max-w-40" value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}>
              <option value="gpt">GPT</option>
              <option value="claude">Claude</option>
              <option value="midjourney">Midjourney</option>
              <option value="coding">Coding</option>
              <option value="marketing">Marketing</option>
            </select>
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
          <div className="flex items-center gap-2 border-b border-line p-3 dark:border-[#333]">
            <select className="field max-w-36" value={provider} onChange={(event) => setProvider(event.target.value as typeof provider)}>
              <option value="local">Lokal</option>
              <option value="openai">OpenAI</option>
              <option value="ollama">Ollama</option>
            </select>
            {provider === 'ollama' && <input className="field max-w-36" value={ollamaModel} onChange={(event) => setOllamaModel(event.target.value)} />}
            <button className="icon-button ml-auto" onClick={optimize} disabled={busy}>
              <Sparkles size={16} /> {busy ? 'Optimiert...' : 'Optimieren'}
            </button>
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
