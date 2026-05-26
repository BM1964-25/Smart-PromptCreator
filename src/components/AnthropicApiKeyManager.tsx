import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Plug, Save, Unplug, Wifi } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { db } from '../db/database';
import { testAnthropicConnection } from '../services/anthropicService';
import type { Settings } from '../types/domain';
import { decryptSecret, encryptSecret } from '../utils/crypto';

type FeedbackTone = 'idle' | 'success' | 'error' | 'info';

interface Feedback {
  tone: FeedbackTone;
  message: string;
}

interface AnthropicApiKeyManagerProps {
  settings?: Settings;
}

function maskApiKey(apiKey: string) {
  if (!apiKey) return '';
  const visiblePrefix = apiKey.startsWith('sk-ant-') ? 'sk-ant' : apiKey.slice(0, Math.min(6, apiKey.length));
  return `${visiblePrefix}-${'•'.repeat(12)}`;
}

export function AnthropicApiKeyManager({ settings }: AnthropicApiKeyManagerProps) {
  const [savedApiKey, setSavedApiKey] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>({ tone: 'idle', message: 'Noch keine aktive Anthropic-Verbindung.' });

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
          ? { tone: 'info', message: 'Anthropic API-Schluessel ist lokal verschluesselt gespeichert.' }
          : { tone: 'idle', message: 'Noch kein Anthropic API-Schluessel gespeichert.' }
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
      setFeedback({ tone: 'error', message: 'Bitte einen Anthropic API-Schluessel eingeben.' });
      return;
    }
    if (!nextKey.startsWith('sk-ant-')) {
      setFeedback({ tone: 'error', message: 'Der Schluessel sollte mit sk-ant- beginnen.' });
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
      setFeedback({ tone: 'success', message: 'Anthropic API-Schluessel lokal verschluesselt gespeichert.' });
      toast.success('Anthropic API-Schluessel gespeichert');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Speichern fehlgeschlagen.';
      setFeedback({ tone: 'error', message });
    } finally {
      setSaving(false);
    }
  }

  async function handleConnect() {
    if (!activeApiKey) {
      setFeedback({ tone: 'error', message: 'Bitte zuerst einen Anthropic API-Schluessel speichern oder eingeben.' });
      return;
    }

    setConnecting(true);
    try {
      setFeedback({ tone: 'info', message: 'Anthropic-Verbindung wird hergestellt und geprueft...' });
      const result = await testAnthropicConnection(activeApiKey);
      setIsConnected(result.ok);
      setFeedback({ tone: result.ok ? 'success' : 'error', message: result.message });
      if (result.ok) toast.success('Anthropic-Verbindung aktiviert');
    } finally {
      setConnecting(false);
    }
  }

  async function handleCheckConnection() {
    if (!activeApiKey) {
      setFeedback({ tone: 'error', message: 'Bitte zuerst einen Anthropic API-Schluessel eingeben.' });
      return;
    }

    setChecking(true);
    setFeedback({ tone: 'info', message: 'Anthropic-Verbindung wird geprueft...' });
    const result = await testAnthropicConnection(activeApiKey);
    setIsConnected(result.ok);
    setFeedback({ tone: result.ok ? 'success' : 'error', message: result.message });
    if (result.ok) toast.success('Anthropic-Verbindung erfolgreich');
    setChecking(false);
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      setIsConnected(false);
      setFeedback({ tone: 'info', message: 'Anthropic-Verbindung getrennt. Der gespeicherte Schluessel bleibt erhalten.' });
      toast.message('Anthropic-Verbindung getrennt');
    } finally {
      setDisconnecting(false);
    }
  }

  const feedbackStyles: Record<FeedbackTone, string> = {
    idle: 'border-line bg-white text-neutral-600 dark:border-[#3a3a38] dark:bg-[#151515] dark:text-neutral-300',
    info: 'border-[#a8c6be] bg-[#eef7f4] text-[#256f63] dark:border-[#21564c] dark:bg-[#122520] dark:text-[#9dd1c5]',
    success: 'border-[#7dbb8b] bg-[#eff8f0] text-[#23713a] dark:border-[#1f6b35] dark:bg-[#102516] dark:text-[#9ed9aa]',
    error: 'border-[#d9a0a0] bg-[#fff0f0] text-[#9b3030] dark:border-[#743232] dark:bg-[#2b1414] dark:text-[#f0aaaa]'
  };

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Anthropic</h3>
          <p className="text-xs text-neutral-500">Claude API-Schluessel lokal verwalten und Verbindung testen.</p>
        </div>
        <span className={`rounded px-2 py-1 text-xs font-medium ${isConnected ? 'bg-[#e5f5e8] text-[#23713a]' : 'bg-[#ece8dc] text-neutral-600 dark:bg-[#2b2b29] dark:text-neutral-300'}`}>
          {isConnected ? 'Verbunden' : 'Getrennt'}
        </span>
      </div>

      <div className="grid gap-3">
        <div className="flex gap-2">
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
            title={isVisible ? 'API-Schluessel verbergen' : 'API-Schluessel anzeigen'}
            onClick={() => {
              setInputValue(savedApiKey || inputValue);
              setIsDirty(true);
              setIsVisible((current) => !current);
            }}
          >
            {isVisible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          <button className="icon-button" type="button" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Speichern
          </button>
          <button className="icon-button" type="button" onClick={handleConnect} disabled={connecting}>
            {connecting ? <Loader2 className="animate-spin" size={16} /> : <Plug size={16} />}
            Verbindung
          </button>
          <button className="icon-button" type="button" onClick={handleCheckConnection} disabled={checking}>
            {checking ? <Loader2 className="animate-spin" size={16} /> : <Wifi size={16} />}
            Verbindung überprüfen
          </button>
          <button className="icon-button" type="button" onClick={handleDisconnect} disabled={disconnecting || !isConnected}>
            {disconnecting ? <Loader2 className="animate-spin" size={16} /> : <Unplug size={16} />}
            Verbindung trennen
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
