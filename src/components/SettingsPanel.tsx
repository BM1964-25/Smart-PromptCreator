import { X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { validateLicense } from '../services/licenseService';
import { AnthropicApiKeyManager } from './AnthropicApiKeyManager';
import type { Settings } from '../types/domain';
import type { ThemeMode } from '../types/domain';
import { db } from '../db/database';

interface SettingsPanelProps {
  settings?: Settings;
  onClose: () => void;
}

export function SettingsPanel({ settings, onClose }: SettingsPanelProps) {
  const [licenseKey, setLicenseKey] = useState(settings?.license.key || '');
  const [licenseEndpoint, setLicenseEndpoint] = useState('http://127.0.0.1:8787');

  async function activateLicense() {
    const result = await validateLicense(licenseKey, licenseEndpoint);
    toast.success(result.valid ? 'Lizenz aktiviert' : 'Lizenz ungültig');
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-6">
      <div className="w-full max-w-4xl rounded bg-[#fdfcf8] shadow-soft dark:bg-[#20201f]">
        <header className="flex items-center justify-between border-b border-line p-4 dark:border-[#333]">
          <h2 className="text-base font-semibold">Einstellungen</h2>
          <button className="icon-only" onClick={onClose} title="Schliessen"><X size={17} /></button>
        </header>
        <div className="grid gap-5 p-5">
          <section className="rounded border border-line bg-[#f4f1e8] p-4 shadow-sm dark:border-[#333] dark:bg-[#181817]">
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

          <AnthropicApiKeyManager settings={settings} />

          <section className="rounded border border-line bg-[#f4f1e8] p-4 shadow-sm dark:border-[#333] dark:bg-[#181817]">
            <h3 className="mb-2 text-sm font-semibold">Lizenz</h3>
            <div className="grid grid-cols-[1fr_180px_auto] gap-2">
              <input className="field" value={licenseKey} onChange={(event) => setLicenseKey(event.target.value)} placeholder="Lizenzschlüssel" />
              <input className="field" value={licenseEndpoint} onChange={(event) => setLicenseEndpoint(event.target.value)} />
              <button className="icon-button justify-center whitespace-nowrap" onClick={activateLicense}>Aktivieren</button>
            </div>
            <p className="mt-2 text-xs text-neutral-500">Status: {settings?.license.status || 'inactive'}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
