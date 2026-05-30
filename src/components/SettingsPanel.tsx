import { CreditCard, Mail, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { validateLicense } from '../services/licenseService';
import { AnthropicApiKeyManager } from './AnthropicApiKeyManager';
import type { Settings } from '../types/domain';

interface SettingsPanelProps {
  settings?: Settings;
  onClose: () => void;
  onOpenHelp?: () => void;
}

export function SettingsPanel({ settings, onClose, onOpenHelp }: SettingsPanelProps) {
  const [licenseKey, setLicenseKey] = useState(settings?.license.key || '');
  const licenseEndpoint = 'http://127.0.0.1:8787';

  async function activateLicense() {
    const result = await validateLicense(licenseKey, licenseEndpoint);
    toast.success(result.valid ? 'Lizenz aktiviert' : 'Lizenz ungültig');
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-6">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded bg-[#fdfcf8] shadow-soft dark:bg-[#20201f]">
        <header className="flex items-center justify-between border-b border-line p-4 dark:border-[#333]">
          <div>
            <h2 className="text-base font-semibold">Zugriff, Lizenz & Datenschutz</h2>
            <p className="mt-1 text-sm text-[#3f5f7c] dark:text-neutral-300">Login, Free Trial, Lizenz, KI-Guthaben und eigener API-Key.</p>
          </div>
          <button className="icon-only" onClick={onClose} title="Schliessen"><X size={17} /></button>
        </header>
        <div className="grid gap-3 p-4">
          <section className="rounded border border-[#9ec8eb] bg-[#e8f6ff] p-3 dark:border-[#315f83] dark:bg-[#102131]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold">Lizenz & Nutzerzugriff</h3>
                <p className="text-xs text-[#415d76] dark:text-neutral-300">Magic-Link Login, 3-Tage Free Trial, Jahreslizenz und Lizenzschlüssel.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-1 text-xs font-bold ${settings?.license.status === 'active' ? 'bg-[#daf2df] text-[#166534]' : 'bg-[#fff4d4] text-[#815000]'}`}>
                  {settings?.license.status === 'active' ? 'Aktiviert' : 'Nicht aktiviert'}
                </span>
              </div>
            </div>

            <div className="relative mb-4 grid grid-cols-4 gap-3 text-center text-xs text-[#314b63] before:absolute before:left-[12.5%] before:right-[12.5%] before:top-[30px] before:h-px before:bg-[#b5cfe4]">
              <StepBadge number="01" title="E-Mail eingeben" text="Login-Adresse eintragen" />
              <StepBadge number="02" title="Magic Link bestätigen" text="Link in der E-Mail öffnen" />
              <StepBadge number="03" title="Free Trial oder Lizenz wählen" text="5 KI-Anfragen kostenlos oder Jahreslizenz" />
              <StepBadge number="04" title="KI-Nutzung festlegen" text="API-Key oder BuiltSmart AI Guthaben" />
            </div>

            <label className="mb-2 grid gap-1 text-sm font-semibold text-[#314b63] dark:text-neutral-200">
              E-Mail für Magic Link
              <input className="field" placeholder="name@example.com" type="email" />
            </label>
            <p className="mb-3 text-xs text-[#4b657d] dark:text-neutral-300">Du erhältst eine E-Mail mit einem Magic Link. Erst danach kannst du Free Trial starten oder kaufen.</p>

            <div className="mb-3 grid grid-cols-[1fr_1fr_1fr_1fr_1.25fr] gap-2">
              <button className="icon-button justify-center border-[#9ec8eb] bg-[#f5fbff] text-[#064987]" type="button">
                <Mail size={16} /> Magic Link senden
              </button>
              <button className="icon-button justify-center border-[#c8dfd7] bg-[#f1fbf5] text-[#0f6b3a]" type="button">
                <ShieldCheck size={16} /> Status aktualisieren
              </button>
              <button className="icon-button justify-center border-[#c8dfd7] bg-[#f1fbf5] text-[#0f6b3a]" type="button">
                3 Tage testen
              </button>
              <button className="icon-button justify-center border-[#c8dfd7] bg-[#f1fbf5] text-[#0f6b3a]" type="button">
                Jahreslizenz kaufen
              </button>
              <div className="flex h-9 items-center rounded border border-line bg-white px-3 text-xs text-[#4b657d] dark:border-[#3a3a38] dark:bg-[#151515] dark:text-neutral-300">
                Noch nicht mit BuiltSmart AI verbunden.
              </div>
            </div>

            <label className="grid gap-1 text-sm font-semibold text-[#314b63] dark:text-neutral-200">
              Lizenzschlüssel vorhanden? Hier aktivieren.
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input className="field" value={licenseKey} onChange={(event) => setLicenseKey(event.target.value)} placeholder="Lizenzschlüssel eingeben" />
                <button className="icon-button justify-center whitespace-nowrap border-[#9ec8eb] bg-[#f5fbff] text-[#064987]" onClick={activateLicense}>Aktivieren</button>
              </div>
            </label>
            <p className="mt-2 text-xs text-[#4b657d] dark:text-neutral-300">Der Lizenzschlüssel aktiviert die App-Nutzung für deinen eingeloggten persönlichen Nutzerzugriff.</p>

            <div className="mt-3 rounded border border-[#e0bd70] bg-[#fff6df] p-3 text-sm leading-6 text-[#263b4f]">
              <h4 className="font-bold">Getrennte Datenbereiche</h4>
              <p>
                Der 3-Tage Free Trial enthält 5 kostenlose BuiltSmart AI KI-Anfragen. Nach dem Free Trial benötigst du eine aktive App-Lizenz;
                KI-Anfragen laufen danach entweder über deinen eigenen Anthropic API-Key oder über gekauftes BuiltSmart AI Guthaben.
              </p>
              <p>
                Lokale App-Inhalte bleiben in diesem Browser. Lizenzdaten, Login-Session und KI-Guthaben werden getrennt über BuiltSmart/Supabase verwaltet.
                Eigene API-Keys werden nur lokal gespeichert und nicht exportiert.
              </p>
            </div>
          </section>

          <section className="rounded border border-[#a9d9cd] bg-[#eefbf8] p-3 dark:border-[#28564c] dark:bg-[#10251f]">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold">KI-Zugang einrichten</h3>
                <p className="text-xs text-[#415d76] dark:text-neutral-300">BuiltSmart AI Guthaben nutzen oder optional eigenen API-Key lokal aktivieren.</p>
              </div>
              <span className="rounded-full bg-[#fff4d4] px-2 py-1 text-xs font-bold text-[#815000]">Nicht verbunden</span>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <section className="rounded border border-[#c8dfd7] bg-[#f5fbff] p-4 dark:border-[#28564c] dark:bg-[#12201d]">
                <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Option 1</p>
                <h3 className="text-base font-semibold">BuiltSmart AI Guthaben</h3>
                <p className="mt-1 text-xs leading-5 text-neutral-600 dark:text-neutral-300">
                  Du kaufst BuiltSmart AI Guthaben und nutzt KI-Funktionen, bis das Guthaben verbraucht ist. Kein eigener Anthropic API-Key nötig.
                </p>
                <span className="mt-3 inline-flex rounded bg-[#fff4d4] px-2 py-1 text-xs font-bold text-[#815000]">Nicht geprüft</span>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button className="icon-button justify-center border-[#c8dfd7] bg-[#f1fbf5] text-[#0f6b3a]" type="button" onClick={() => toast.message('BuiltSmart AI Guthaben-Checkout wird zentral angebunden.')}>
                    <CreditCard size={16} /> Guthaben kaufen
                  </button>
                  <button className="icon-button justify-center" type="button" onClick={() => toast.message('BuiltSmart AI Status wird später zentral aktualisiert.')}>
                    Status aktualisieren
                  </button>
                </div>
                <div className="mt-3 rounded border border-line bg-white px-3 py-2 text-xs text-[#4b657d] dark:border-[#3a3a38] dark:bg-[#151515] dark:text-neutral-300">
                  Login erforderlich, damit Guthaben deinem Nutzerzugriff zugeordnet werden kann.
                </div>
              </section>

              <AnthropicApiKeyManager settings={settings} onOpenHelp={onOpenHelp} />
            </div>

            <div className="mt-3 rounded border border-[#e0bd70] bg-[#fff6df] p-3 text-sm leading-6 text-[#263b4f]">
              <h4 className="font-bold">Datenschutz-Hinweis</h4>
              <p>
                Standardmäßig nutzt die App BuiltSmart AI Guthaben. Wenn du einen eigenen API-Key aktivierst, werden KI-Anfragen über den lokalen Proxy
                an Anthropic gesendet und nicht über BuiltSmart AI Guthaben abgerechnet.
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

function StepBadge({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="relative pt-4">
      <span className="relative mx-auto grid h-7 w-7 place-items-center rounded-full border-2 border-[#d7e7f4] bg-[#f7fbff] text-xs font-bold text-[#6b7f92]">
        {number}
      </span>
      <h4 className="mt-2 font-bold text-[#263b4f]">{title}</h4>
      <p className="mt-1 font-semibold leading-4 text-[#506981]">{text}</p>
    </div>
  );
}
