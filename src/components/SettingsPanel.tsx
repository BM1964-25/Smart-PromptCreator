import { X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { db } from '../db/database';
import { checkOllama } from '../services/ollamaService';
import { validateLicense } from '../services/licenseService';
import { AnthropicApiKeyManager } from './AnthropicApiKeyManager';
import type { Settings } from '../types/domain';
import type { ThemeMode } from '../types/domain';
import { encryptSecret } from '../utils/crypto';

interface SettingsPanelProps {
  settings?: Settings;
  onClose: () => void;
}

export function SettingsPanel({ settings, onClose }: SettingsPanelProps) {
  const [apiKey, setApiKey] = useState('');
  const [licenseKey, setLicenseKey] = useState(settings?.license.key || '');
  const [licenseEndpoint, setLicenseEndpoint] = useState('http://127.0.0.1:8787');
  const [ollamaStatus, setOllamaStatus] = useState<string>();

  async function saveApiKey() {
    await db.settings.update('app', { apiKeys: { ...settings?.apiKeys, openai: await encryptSecret(apiKey) } });
    setApiKey('');
    toast.success('API-Key lokal verschluesselt gespeichert');
  }

  async function activateLicense() {
    const result = await validateLicense(licenseKey, licenseEndpoint);
    toast.success(result.valid ? 'Lizenz aktiviert' : 'Lizenz ungueltig');
  }

  async function probeOllama() {
    const result = await checkOllama();
    setOllamaStatus(result.available ? `Aktiv: ${result.models.join(', ') || 'keine Modelle gefunden'}` : 'Nicht erreichbar');
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-6">
      <div className="w-full max-w-3xl rounded bg-[#fdfcf8] shadow-soft dark:bg-[#20201f]">
        <header className="flex items-center justify-between border-b border-line p-4 dark:border-[#333]">
          <h2 className="text-base font-semibold">Einstellungen</h2>
          <button className="icon-only" onClick={onClose} title="Schliessen"><X size={17} /></button>
        </header>
        <div className="grid gap-5 p-5">
          <section>
            <h3 className="mb-2 text-sm font-semibold">Darstellung</h3>
            <select
              className="field max-w-56"
              value={settings?.theme || 'system'}
              onChange={(event) => db.settings.update('app', { theme: event.target.value as ThemeMode })}
            >
              <option value="system">System</option>
              <option value="light">Hell</option>
              <option value="dark">Dunkel</option>
            </select>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold">OpenAI</h3>
            <div className="flex gap-2">
              <input className="field" type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="sk-..." />
              <button className="icon-button" onClick={saveApiKey}>Speichern</button>
            </div>
          </section>

          <AnthropicApiKeyManager settings={settings} />

          <section>
            <h3 className="mb-2 text-sm font-semibold">Ollama</h3>
            <div className="flex items-center gap-3">
              <button className="icon-button" onClick={probeOllama}>Pruefen</button>
              <span className="text-sm text-neutral-500">{ollamaStatus}</span>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold">Lizenz</h3>
            <div className="grid grid-cols-[1fr_180px_auto] gap-2">
              <input className="field" value={licenseKey} onChange={(event) => setLicenseKey(event.target.value)} placeholder="Lizenzschluessel" />
              <input className="field" value={licenseEndpoint} onChange={(event) => setLicenseEndpoint(event.target.value)} />
              <button className="icon-button" onClick={activateLicense}>Aktivieren</button>
            </div>
            <p className="mt-2 text-xs text-neutral-500">Status: {settings?.license.status || 'inactive'}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
