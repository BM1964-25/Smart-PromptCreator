import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Plug, Save, Trash2, Unplug, Wifi } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { db } from '../db/database';
import { anthropicModelOptions, defaultAnthropicModel, normalizeAnthropicModel, testAnthropicConnection } from '../services/anthropicService';
import type { Settings } from '../types/domain';
import { decryptSecret, encryptSecret } from '../utils/crypto';

type FeedbackTone = 'idle' | 'success' | 'error' | 'info';

interface Feedback {
  tone: FeedbackTone;
  message: string;
}

interface AnthropicApiKeyManagerProps {
  settings?: Settings;
  onOpenHelp?: () => void;
}

function maskApiKey(apiKey: string) {
  if (!apiKey) return '';
  const visiblePrefix = apiKey.startsWith('sk-ant-') ? 'sk-ant' : apiKey.slice(0, Math.min(6, apiKey.length));
  return `${visiblePrefix}-${'•'.repeat(12)}`;
}

export function AnthropicApiKeyManager({ settings, onOpenHelp }: AnthropicApiKeyManagerProps) {
  const [savedApiKey, setSavedApiKey] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>({ tone: 'idle', message: 'Noch keine aktive Anthropic-Verbindung.' });
  const selectedModel = normalizeAnthropicModel(settings?.anthropicModel || defaultAnthropicModel);

  useEffect(() => {
    let active = true;

    async function loadSavedKey() {
      const decrypted = await decryptSecret(settings?.apiKeys.anthropic);
      if (!active) return;
      setSavedApiKey(decrypted);
      setInputValue(decrypted);
      setIsDirty(false);
      setIsConnected(false);
      setFeedback(
        decrypted
          ? { tone: 'info', message: 'Anthropic API-Schlüssel ist lokal verschlüsselt gespeichert.' }
          : { tone: 'idle', message: 'Noch kein Anthropic API-Schlüssel gespeichert.' }
      );
    }

    loadSavedKey();
    return () => {
      active = false;
    };
  }, [settings?.apiKeys.anthropic]);

  const displayedValue = useMemo(() => {
    if (isVisible || isDirty) return inputValue;
    return maskApiKey(savedApiKey);
  }, [inputValue, isDirty, isVisible, savedApiKey]);

  const inputType = isVisible ? 'text' : isDirty ? 'password' : 'text';
  const activeApiKey = isDirty ? inputValue.trim() : savedApiKey.trim();

  function beginEditing() {
    if (!isDirty) {
      setInputValue(savedApiKey);
      setIsDirty(true);
    }
  }

  function handleInputChange(value: string) {
    setInputValue(value);
    setIsDirty(true);
    setFeedback({ tone: 'info', message: 'Aenderung noch nicht gespeichert.' });
  }

  async function handleSave() {
    const nextKey = inputValue.trim();
    if (!nextKey) {
      setFeedback({ tone: 'error', message: 'Bitte einen Anthropic API-Schlüssel eingeben.' });
      return;
    }
    if (!nextKey.startsWith('sk-ant-')) {
      setFeedback({ tone: 'error', message: 'Der Schlüssel sollte mit sk-ant- beginnen.' });
      return;
    }

    setSaving(true);
    try {
      await db.settings.update('app', {
        apiKeys: {
          ...settings?.apiKeys,
          anthropic: await encryptSecret(nextKey)
        }
      });
      setSavedApiKey(nextKey);
      setInputValue(nextKey);
      setIsDirty(false);
      setFeedback({ tone: 'success', message: 'Anthropic API-Schlüssel lokal verschlüsselt gespeichert.' });
      toast.success('Anthropic API-Schlüssel gespeichert');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Speichern fehlgeschlagen.';
      setFeedback({ tone: 'error', message });
    } finally {
      setSaving(false);
    }
  }

  async function handleModelChange(model: string) {
    await db.settings.update('app', { anthropicModel: model });
    setIsConnected(false);
    setFeedback({ tone: 'info', message: 'Claude-Modell geändert. Bitte die Verbindung erneut prüfen.' });
  }

  async function handleConnect() {
    if (!activeApiKey) {
      setFeedback({ tone: 'error', message: 'Bitte zuerst einen Anthropic API-Schlüssel speichern oder eingeben.' });
      return;
    }

    setConnecting(true);
    try {
      setFeedback({ tone: 'info', message: 'Anthropic-Verbindung wird hergestellt und geprüft...' });
      const result = await testAnthropicConnection(activeApiKey, selectedModel);
      setIsConnected(result.ok);
      setFeedback({ tone: result.ok ? 'success' : 'error', message: result.message });
      if (result.ok) toast.success('Anthropic-Verbindung aktiviert');
    } finally {
      setConnecting(false);
    }
  }

  async function handleCheckConnection() {
    if (!activeApiKey) {
      setFeedback({ tone: 'error', message: 'Bitte zuerst einen Anthropic API-Schlüssel eingeben.' });
      return;
    }

    setChecking(true);
    setFeedback({ tone: 'info', message: 'Anthropic-Verbindung wird geprüft...' });
    const result = await testAnthropicConnection(activeApiKey, selectedModel);
    setIsConnected(result.ok);
    setFeedback({ tone: result.ok ? 'success' : 'error', message: result.message });
    if (result.ok) toast.success('Anthropic-Verbindung erfolgreich');
    setChecking(false);
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      setIsConnected(false);
      setFeedback({ tone: 'info', message: 'Anthropic-Verbindung getrennt. Der gespeicherte Schlüssel bleibt erhalten.' });
      toast.message('Anthropic-Verbindung getrennt');
    } finally {
      setDisconnecting(false);
    }
  }

  async function handleDeleteKey() {
    setDeleting(true);
    try {
      await db.settings.update('app', {
        apiKeys: {
          ...settings?.apiKeys,
          anthropic: undefined
        }
      });
      setSavedApiKey('');
      setInputValue('');
      setIsDirty(false);
      setIsVisible(false);
      setIsConnected(false);
      setFeedback({ tone: 'info', message: 'Anthropic API-Schlüssel lokal gelöscht.' });
      toast.message('Anthropic API-Schlüssel gelöscht');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'API-Schlüssel konnte nicht gelöscht werden.';
      setFeedback({ tone: 'error', message });
    } finally {
      setDeleting(false);
    }
  }

  const feedbackStyles: Record<FeedbackTone, string> = {
    idle: 'border-line bg-white text-neutral-600 dark:border-[#3a3a38] dark:bg-[#151515] dark:text-neutral-300',
    info: 'border-[#a8c6be] bg-[#eef7f4] text-[#256f63] dark:border-[#21564c] dark:bg-[#122520] dark:text-[#9dd1c5]',
    success: 'border-[#7dbb8b] bg-[#eff8f0] text-[#23713a] dark:border-[#1f6b35] dark:bg-[#102516] dark:text-[#9ed9aa]',
    error: 'border-[#d9a0a0] bg-[#fff0f0] text-[#9b3030] dark:border-[#743232] dark:bg-[#2b1414] dark:text-[#f0aaaa]'
  };

  return (
    <section className="rounded border border-line bg-[#f4f1e8] p-4 shadow-sm dark:border-[#333] dark:bg-[#181817]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Anthropic</h3>
          <p className="mt-1 text-xs leading-5 text-neutral-500">Claude API-Schlüssel lokal speichern, Verbindung prüfen und für Optimierungen verwenden.</p>
          {onOpenHelp && (
            <button className="mt-2 text-xs font-semibold text-brand hover:underline" type="button" onClick={onOpenHelp}>
              So erhalten Sie einen Anthropic API-Schlüssel
            </button>
          )}
        </div>
        <span className={`shrink-0 rounded px-2.5 py-1 text-xs font-semibold ${isConnected ? 'bg-[#e5f5e8] text-[#23713a]' : 'bg-[#ece8dc] text-neutral-600 dark:bg-[#2b2b29] dark:text-neutral-300'}`}>
          {isConnected ? 'Verbunden' : 'Getrennt'}
        </span>
      </div>

      <div className="grid gap-3">
        <label className="grid gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-300">
          Claude-Modell
          <select className="field" value={selectedModel} onChange={(event) => handleModelChange(event.target.value)}>
            {anthropicModelOptions.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label} - {model.description}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
          <input
            className="field"
            type={inputType}
            value={displayedValue}
            onFocus={beginEditing}
            onChange={(event) => handleInputChange(event.target.value)}
            placeholder="sk-ant-..."
            autoComplete="off"
            spellCheck={false}
          />
          <button
            className="icon-only"
            type="button"
            title={isVisible ? 'API-Schlüssel verbergen' : 'API-Schlüssel anzeigen'}
            onClick={() => {
              setInputValue(savedApiKey || inputValue);
              setIsDirty(true);
              setIsVisible((current) => !current);
            }}
          >
            {isVisible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
          <button
            className="icon-only"
            type="button"
            title="API-Schlüssel löschen"
            onClick={handleDeleteKey}
            disabled={deleting || (!savedApiKey && !inputValue)}
          >
            {deleting ? <Loader2 className="animate-spin" size={17} /> : <Trash2 size={17} />}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button className="icon-button justify-center whitespace-nowrap" type="button" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Speichern
          </button>
          <button className="icon-button justify-center whitespace-nowrap" type="button" onClick={handleConnect} disabled={connecting}>
            {connecting ? <Loader2 className="animate-spin" size={16} /> : <Plug size={16} />}
            Verbinden
          </button>
          <button className="icon-button justify-center whitespace-nowrap" type="button" onClick={handleCheckConnection} disabled={checking}>
            {checking ? <Loader2 className="animate-spin" size={16} /> : <Wifi size={16} />}
            Prüfen
          </button>
          <button className="icon-button justify-center whitespace-nowrap" type="button" onClick={handleDisconnect} disabled={disconnecting || !isConnected}>
            {disconnecting ? <Loader2 className="animate-spin" size={16} /> : <Unplug size={16} />}
            Trennen
          </button>
        </div>

        <div className={`flex items-start gap-2 rounded border px-3 py-2 text-xs leading-5 ${feedbackStyles[feedback.tone]}`}>
          {feedback.tone === 'success' ? <CheckCircle2 className="mt-0.5 shrink-0" size={15} /> : <AlertCircle className="mt-0.5 shrink-0" size={15} />}
          <span>{feedback.message}</span>
        </div>
      </div>
    </section>
  );
}
