import { Briefcase, CheckCircle2, Database, KeyRound, Layers, Lightbulb, Plug, ShieldCheck, Sparkles, Tags, X } from 'lucide-react';
import type { ReactNode } from 'react';

interface HelpPanelProps {
  onClose: () => void;
}

export function HelpPanel({ onClose }: HelpPanelProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-6">
      <div className="flex max-h-[88vh] w-full max-w-5xl flex-col rounded bg-[#fdfcf8] shadow-soft dark:bg-[#20201f]">
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
                SMART PromptCreator ist eine lokale Prompt-Werkstatt. Die App hilft dabei, Rohideen in klare Prompts zu verwandeln,
                Varianten zu vergleichen, optimierte Ausgaben zu übernehmen und erfolgreiche Prompts dauerhaft wiederzufinden.
              </p>
            </HelpSection>

            <HelpSection icon={<Database size={18} />} title="Lokale Speicherung">
              <p>
                Prompts, Arbeitsbereiche, Kategorien, Tags, Favoriten und Einstellungen werden lokal im Browser über IndexedDB gespeichert.
                Es gibt keine zentrale Cloud-Datenbank für Prompt-Inhalte. Backups laufen über Export und Import als JSON-Datei.
              </p>
            </HelpSection>

            <HelpSection icon={<Briefcase size={18} />} title="Arbeitsbereiche">
              <ul>
                <li>Arbeitsbereiche sind getrennte Sammlungen, zum Beispiel Bibliothek, Kundenprojekte oder Social Media.</li>
                <li>Ein neuer Prompt wird immer im aktuell aktiven Arbeitsbereich erstellt.</li>
                <li>Mit dem Plus erstellen Sie einen neuen Arbeitsbereich und geben direkt den Namen ein.</li>
                <li>Mit dem Stift benennen Sie einen Arbeitsbereich um. Mit dem Griff links kann die Reihenfolge geändert werden.</li>
                <li>Der Button „Alle Prompts im Arbeitsbereich“ entfernt Kategorie, Suche und Favoritenfilter im aktuellen Arbeitsbereich.</li>
              </ul>
            </HelpSection>

            <HelpSection icon={<Layers size={18} />} title="Kategorien und Tags">
              <ul>
                <li>Kategorien gehören immer zu dem aktuell gewählten Arbeitsbereich.</li>
                <li>Eine Kategorie filtert die Prompt-Bibliothek auf ein fachliches Thema, zum Beispiel Marketing, Analyse oder Coding.</li>
                <li>Mit dem Plus erstellen Sie eine neue Kategorie. Mit dem Stift benennen Sie sie um.</li>
                <li>Tags sind zusätzliche Suchbegriffe innerhalb eines Prompts und können mehrere Themen verbinden.</li>
                <li>Favoriten werden im aktuell aktiven Arbeitsbereich gefiltert.</li>
              </ul>
            </HelpSection>

            <HelpSection icon={<Sparkles size={18} />} title="Prompt-Werkstatt nutzen">
              <ul>
                <li>Wählen Sie links einen Arbeitsbereich und bei Bedarf eine Kategorie.</li>
                <li>Klicken Sie auf „Prompt“, um einen neuen Prompt im aktiven Arbeitsbereich zu erstellen.</li>
                <li>Tragen Sie im Feld „Eingabe“ die Rohidee oder den Originalprompt ein.</li>
                <li>Wählen Sie Ziel, Zielgruppe, Stil, Format, Stärke und Sprache passend zur Aufgabe.</li>
                <li>Klicken Sie auf „Optimieren“, um eine direkt nutzbare Zielausgabe zu erzeugen.</li>
                <li>Nutzen Sie „2 Varianten“, um Kompakt und Premium gegenüberzustellen.</li>
                <li>Übernehmen Sie die bessere Variante in die optimierte Ausgabe und bearbeiten Sie sie bei Bedarf nach.</li>
              </ul>
            </HelpSection>

            <HelpSection icon={<CheckCircle2 size={18} />} title="Varianten und Rückgängig">
              <ul>
                <li>Kompakt ist für schnelle, direkt kopierbare Prompts gedacht.</li>
                <li>Premium nutzt eine ausführlichere Masterstruktur mit Rolle, Ziel, Kontext, Aufgaben, Ausgabeformat und Qualitätsanforderungen.</li>
                <li>Der Abschnitt Ziel hilft, den gewünschten Nutzen und das erwartete Ergebnis ausdrücklich festzuhalten.</li>
                <li>Mit „Rückgängig“ stellen Sie den letzten gespeicherten Prompt-Zustand wieder her.</li>
                <li>Mit „Duplizieren“ erzeugen Sie eine Kopie, um Varianten gefahrlos weiterzuentwickeln.</li>
              </ul>
            </HelpSection>

            <HelpSection icon={<KeyRound size={18} />} title="Anthropic API-Schlüssel">
              <p>
                Für Anthropic-Optimierungen benötigt SMART PromptCreator einen API-Schlüssel aus der Anthropic Console.
                Der Schlüssel wird lokal verschlüsselt gespeichert. Bei Anthropic-Optimierungen sendet die App den jeweiligen Prompt
                über den lokalen Proxy an die Anthropic API. Bei lokaler Optimierung werden keine Inhalte an Anthropic gesendet.
              </p>
            </HelpSection>

            <HelpSection icon={<ShieldCheck size={18} />} title="Wichtig zu beachten">
              <ul>
                <li>Keine vertraulichen Daten an die KI senden, wenn sie nicht extern verarbeitet werden dürfen.</li>
                <li>KI-Vorschläge immer fachlich prüfen, bevor sie produktiv genutzt werden.</li>
                <li>Regelmäßig JSON-Backups exportieren, besonders vor größeren Aufräumarbeiten.</li>
                <li>Beim Löschen von Arbeitsbereichen oder Kategorien bleiben Prompts erhalten, verlieren aber die Zuordnung.</li>
                <li>API-Keys und Lizenzdaten sorgfältig behandeln und nicht in exportierten Prompt-Texten ablegen.</li>
              </ul>
            </HelpSection>
          </div>

          <section id="anthropic-api-key" className="mt-4 rounded border border-line bg-white p-4 text-sm leading-6 dark:border-[#3a3a38] dark:bg-[#151515]">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <KeyRound size={18} className="text-brand" />
              So erhalten Sie einen Anthropic API-Schlüssel
            </div>
            <ol className="list-decimal space-y-2 pl-5 text-neutral-600 dark:text-neutral-300">
              <li>Öffnen Sie die Anthropic Console unter <a className="font-semibold text-brand hover:underline" href="https://console.anthropic.com/" target="_blank" rel="noreferrer">console.anthropic.com</a>.</li>
              <li>Melden Sie sich an oder erstellen Sie ein Anthropic-Console-Konto.</li>
              <li>Richten Sie in der Console bei Bedarf Organisation, Workspace und Billing ein. API-Nutzung wird separat über die Console abgerechnet.</li>
              <li>Öffnen Sie in der Console die API-Key-Verwaltung, meist unter Account Settings oder API Keys.</li>
              <li>Erstellen Sie einen neuen API-Schlüssel, vergeben Sie einen eindeutigen Namen, zum Beispiel „SMART PromptCreator“.</li>
              <li>Kopieren Sie den Schlüssel sofort. Er beginnt üblicherweise mit „sk-ant-“. Bewahren Sie ihn vertraulich auf.</li>
              <li>Öffnen Sie in SMART PromptCreator die Einstellungen, fügen Sie den Schlüssel im Anthropic-Bereich ein und klicken Sie auf „Speichern“.</li>
              <li>Klicken Sie anschließend auf „Prüfen“. Wenn die Verbindung erfolgreich ist, kann Anthropic für Optimierungen genutzt werden.</li>
            </ol>
            <p className="mt-3 text-xs leading-5 text-neutral-500">
              Offizielle Hinweise: Anthropic beschreibt den API-Zugang über die Console und API-Keys in der Dokumentation.
              Die API erwartet bei Anfragen einen API-Key im Header. Weitere Informationen finden Sie in der
              <a className="font-semibold text-brand hover:underline" href="https://docs.anthropic.com/en/api/overview" target="_blank" rel="noreferrer"> Anthropic API-Übersicht</a>.
            </p>
          </section>

          <section className="mt-4 rounded border border-line bg-white p-4 text-sm leading-6 dark:border-[#3a3a38] dark:bg-[#151515]">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <Plug size={18} className="text-brand" />
              Warum eine bezahlte Claude-Lizenz nicht genügt
            </div>
            <p className="text-neutral-600 dark:text-neutral-300">
              Ein bezahlter Claude.ai-Plan und die Anthropic API Console sind separate Produkte. Claude.ai ist die Chat-Oberfläche
              für Einzelpersonen oder Teams. Die API Console ist die Entwicklerplattform für Anwendungen, Integrationen und
              programmatische Modellzugriffe. Eine Claude.ai-Bezahllizenz verbessert die Chat-Nutzung, enthält aber nicht automatisch
              API-Nutzung über die Console. Wer beides nutzen möchte, benötigt zusätzlich zur Claude.ai-Lizenz separat eingerichteten
              API-Zugriff in der Console.
            </p>
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              Anthropic erklärt diese Trennung im Help Center:
              <a className="font-semibold text-brand hover:underline" href="https://support.anthropic.com/en/articles/9876003-i-subscribe-to-a-paid-claude-ai-plan-why-do-i-have-to-pay-separately-for-api-usage-on-console" target="_blank" rel="noreferrer"> Claude.ai Plan und API Console sind separate Produkte</a>.
            </p>
          </section>

          <section className="mt-4 rounded border border-line bg-white p-4 text-sm leading-6 dark:border-[#3a3a38] dark:bg-[#151515]">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <Sparkles size={18} className="text-brand" />
              Vorteile einer API-Schnittstelle
            </div>
            <ul className="list-disc space-y-1 pl-5 text-neutral-600 dark:text-neutral-300">
              <li>SMART PromptCreator kann Prompts direkt aus der App heraus optimieren, ohne manuelles Kopieren in Claude.ai.</li>
              <li>Die App kann feste Arbeitsabläufe anbieten, zum Beispiel Optimieren, Varianten erstellen und Metadaten vorschlagen.</li>
              <li>Modell, Anfrageformat und Ergebnisverarbeitung sind kontrollierbarer als in einem normalen Chatfenster.</li>
              <li>API-Nutzung lässt sich über Console, Workspaces und Abrechnung besser einem Anwendungsfall zuordnen.</li>
              <li>Die lokale App kann einen Proxy nutzen, damit Browserbeschränkungen vermieden und API-Anfragen sauber gebündelt werden.</li>
              <li>Sie behalten die Wahl: Anthropic für KI-gestützte Qualität oder lokale Optimierung, wenn keine externe Verarbeitung gewünscht ist.</li>
            </ul>
          </section>

          <section className="mt-4 rounded border border-line bg-white p-4 text-sm leading-6 dark:border-[#3a3a38] dark:bg-[#151515]">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <CheckCircle2 size={18} className="text-brand" />
              Empfohlener Arbeitsablauf
            </div>
            <ol className="list-decimal space-y-1 pl-5 text-neutral-600 dark:text-neutral-300">
              <li>Arbeitsbereich wählen oder neu anlegen.</li>
              <li>Kategorie wählen oder erstellen.</li>
              <li>Neuen Prompt erstellen und Rohtext eingeben.</li>
              <li>Optimierungseinstellungen passend zum Ziel wählen.</li>
              <li>Bei Bedarf Anthropic in den Einstellungen verbinden oder lokal optimieren.</li>
              <li>Kompakt- und Premium-Variante vergleichen.</li>
              <li>Die beste Ausgabe übernehmen, prüfen, nachschärfen und favorisieren.</li>
              <li>Über Suche, Kategorien, Tags oder Favoriten später wiederfinden.</li>
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
