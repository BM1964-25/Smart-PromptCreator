import { CheckCircle2, Database, KeyRound, Lightbulb, ShieldCheck, Sparkles, Tags, X } from 'lucide-react';
import type { ReactNode } from 'react';

interface HelpPanelProps {
  onClose: () => void;
}

export function HelpPanel({ onClose }: HelpPanelProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-6">
      <div className="flex max-h-[86vh] w-full max-w-4xl flex-col rounded bg-[#fdfcf8] shadow-soft dark:bg-[#20201f]">
        <header className="flex items-center justify-between border-b border-line p-4 dark:border-[#333]">
          <div>
            <h2 className="text-lg font-semibold">Hilfe und Bedienungsanleitung</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">SMART PromptCreator lokal und sicher verwenden.</p>
          </div>
          <button className="icon-only" onClick={onClose} title="Schliessen">
            <X size={17} />
          </button>
        </header>

        <div className="overflow-auto p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <HelpSection icon={<Lightbulb size={18} />} title="Grundidee">
              <p>
                SMART PromptCreator verwaltet Prompts lokal auf diesem Rechner. Die Prompt-Bibliothek dient dazu,
                Prompts zu schreiben, zu optimieren, zu speichern, wiederzufinden und strukturiert in Tabs und Kategorien abzulegen.
              </p>
            </HelpSection>

            <HelpSection icon={<Database size={18} />} title="Lokale Speicherung">
              <p>
                Prompts, Tabs, Kategorien, Tags und Einstellungen werden lokal in IndexedDB gespeichert. Es gibt keine Cloud-Datenbank
                fuer Prompt-Inhalte. Export und Import laufen ueber JSON-Dateien.
              </p>
            </HelpSection>

            <HelpSection icon={<Sparkles size={18} />} title="Prompt optimieren">
              <ul>
                <li>Prompt zuerst im Originalfeld erfassen.</li>
                <li>Optimierungsziel, Zielgruppe, Stil, Format, Staerke und Sprache einstellen.</li>
                <li>Die optimierte Version pruefen und bei Bedarf manuell nachbearbeiten.</li>
                <li>Danach Titel, Beschreibung, Kategorie und Tags per KI vorschlagen lassen.</li>
              </ul>
            </HelpSection>

            <HelpSection icon={<Tags size={18} />} title="Tabs, Kategorien und Tags">
              <ul>
                <li>Tabs sind Hauptbereiche, zum Beispiel Bibliothek, Produktion oder Kundenprojekte.</li>
                <li>Kategorien liegen innerhalb eines Tabs und gruppieren Prompts fachlich.</li>
                <li>Tags sind flexible Suchbegriffe, die mehrere Themen verbinden koennen.</li>
                <li>Viele Tabs oder Kategorien werden im mittleren Sidebar-Bereich scrollbar dargestellt.</li>
              </ul>
            </HelpSection>

            <HelpSection icon={<KeyRound size={18} />} title="Anthropic API-Key">
              <p>
                Fuer KI-Funktionen wird ein Anthropic API-Key benoetigt. Der Key wird lokal gespeichert. API-Anfragen senden den
                jeweiligen Prompt an Anthropic, wenn eine Optimierung oder ein Metadatenvorschlag gestartet wird.
              </p>
            </HelpSection>

            <HelpSection icon={<ShieldCheck size={18} />} title="Wichtig zu beachten">
              <ul>
                <li>Keine vertraulichen Daten an die KI senden, wenn sie nicht extern verarbeitet werden duerfen.</li>
                <li>KI-Vorschlaege immer fachlich pruefen, bevor sie produktiv genutzt werden.</li>
                <li>Regelmaessig JSON-Backups exportieren, besonders vor groesseren Aufraeumarbeiten.</li>
                <li>Beim Loeschen von Tabs oder Kategorien bleiben Prompts erhalten, verlieren aber die Zuordnung.</li>
                <li>API-Keys und Lizenzdaten sorgfaeltig behandeln und nicht in exportierten Prompt-Texten ablegen.</li>
              </ul>
            </HelpSection>
          </div>

          <section className="mt-4 rounded border border-line bg-white p-4 text-sm leading-6 dark:border-[#3a3a38] dark:bg-[#151515]">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <CheckCircle2 size={18} className="text-brand" />
              Empfohlener Arbeitsablauf
            </div>
            <ol className="list-decimal space-y-1 pl-5 text-neutral-600 dark:text-neutral-300">
              <li>Neuen Prompt erstellen und Rohtext eingeben.</li>
              <li>Optimierungseinstellungen passend zum Ziel waehlen.</li>
              <li>Prompt optimieren lassen und Ergebnis pruefen.</li>
              <li>Titel, Beschreibung, Kategorie und Tags per KI vorschlagen lassen.</li>
              <li>Eintrag speichern, bei Bedarf favorisieren und spaeter ueber Suche oder Tags wiederfinden.</li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

function HelpSection({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded border border-line bg-white p-4 text-sm leading-6 dark:border-[#3a3a38] dark:bg-[#151515]">
      <div className="mb-2 flex items-center gap-2 font-semibold text-neutral-800 dark:text-neutral-100">
        <span className="text-brand">{icon}</span>
        {title}
      </div>
      <div className="space-y-2 text-neutral-600 dark:text-neutral-300 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
