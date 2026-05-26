import {
  Briefcase,
  CheckCircle2,
  Copy,
  Database,
  Download,
  FileText,
  KeyRound,
  Layers,
  Lightbulb,
  PanelLeftClose,
  Plug,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Tags,
  Upload,
  X
} from 'lucide-react';
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
            <HelpSection icon={<Lightbulb size={18} />} title="Grundidee und Nutzen">
              <p>
                SMART PromptCreator ist eine lokale Prompt-Werkstatt. Die App hilft dabei, Rohideen in klare Prompts zu verwandeln,
                Varianten zu vergleichen, optimierte Ausgaben zu übernehmen und erfolgreiche Prompts dauerhaft wiederzufinden.
              </p>
              <p>
                Der wichtigste Nutzen liegt in Struktur: Gute Prompts verschwinden nicht mehr in Chatverläufen, Notizen oder einzelnen
                Dokumenten, sondern werden zentral in einer lokalen Bibliothek gepflegt. Dadurch können bewährte Vorlagen wiederverwendet,
                verbessert, dupliziert und für neue Aufgaben angepasst werden.
              </p>
            </HelpSection>

            <HelpSection icon={<Database size={18} />} title="Lokale Speicherung">
              <p>
                Prompts, Arbeitsbereiche, Kategorien, Tags, Favoriten und Einstellungen werden lokal im Browser über IndexedDB gespeichert.
                Es gibt keine zentrale Cloud-Datenbank für Prompt-Inhalte. Backups laufen über Export und Import als JSON-Datei.
              </p>
              <p>
                Andere Nutzer haben keinen Zugriff auf diese lokalen Inhalte. Wenn Sie den Browser-Speicher löschen, das Gerät wechseln
                oder die App in einem anderen Browser verwenden, sind die Daten dort nicht automatisch vorhanden. Nutzen Sie deshalb
                regelmäßig den Export, wenn Ihre Prompt-Bibliothek wichtig ist.
              </p>
            </HelpSection>

            <HelpSection icon={<FileText size={18} />} title="Oberfläche im Überblick">
              <ul>
                <li>Links befindet sich die Sidebar mit Suche, neuem Prompt, Favoriten, Einstellungen, Hilfe, Arbeitsbereichen und Kategorien.</li>
                <li>Daneben liegt die Prompt-Bibliothek. Sie zeigt alle sichtbaren Prompts des aktuellen Arbeitsbereichs und der aktiven Filter.</li>
                <li>In der Mitte bearbeiten Sie Titel, Metadaten, Eingabe, Strukturvorgaben und den ursprünglichen Prompt.</li>
                <li>Rechts befindet sich die KI-Werkstatt mit Optimierung, Variantenvergleich und optimierter Ausgabe.</li>
                <li>Unten zeigt der Systemstatus Lizenz, Anthropic API-Key, lokalen Speicher und Anzahl der Bibliothekseinträge.</li>
              </ul>
            </HelpSection>

            <HelpSection icon={<Briefcase size={18} />} title="Arbeitsbereiche">
              <ul>
                <li>Arbeitsbereiche sind getrennte Sammlungen, zum Beispiel Bibliothek, Kundenprojekte oder Social Media.</li>
                <li>Ein neuer Prompt wird immer im aktuell aktiven Arbeitsbereich erstellt.</li>
                <li>Mit dem Plus erstellen Sie einen neuen Arbeitsbereich und geben direkt den Namen ein.</li>
                <li>Mit dem Stift benennen Sie einen Arbeitsbereich um. Mit dem Griff links kann die Reihenfolge geändert werden.</li>
                <li>Der Button „Alle Prompts im Arbeitsbereich“ entfernt Kategorie, Suche und Favoritenfilter im aktuellen Arbeitsbereich.</li>
              </ul>
              <p>
                Ein Arbeitsbereich ist sinnvoll, wenn Prompts klar voneinander getrennt bleiben sollen, zum Beispiel private Prompts,
                Kundenprojekte, Marketing, Produktivität oder interne Vorlagen. Beim Wechsel des Arbeitsbereichs zeigt die Bibliothek
                nur die Prompts, die diesem Arbeitsbereich zugeordnet sind.
              </p>
            </HelpSection>

            <HelpSection icon={<Layers size={18} />} title="Kategorien und Tags">
              <ul>
                <li>Kategorien gehören immer zu dem aktuell gewählten Arbeitsbereich.</li>
                <li>Eine Kategorie filtert die Prompt-Bibliothek auf ein fachliches Thema, zum Beispiel Marketing, Analyse oder Coding.</li>
                <li>Mit dem Plus erstellen Sie eine neue Kategorie. Mit dem Stift benennen Sie sie um.</li>
                <li>Tags sind zusätzliche Suchbegriffe innerhalb eines Prompts und können mehrere Themen verbinden.</li>
                <li>Favoriten werden im aktuell aktiven Arbeitsbereich gefiltert.</li>
              </ul>
              <p>
                Kategorien eignen sich für die Hauptordnung. Tags eignen sich für Querverbindungen. Ein Prompt kann zum Beispiel in
                der Kategorie „Marketing“ liegen und zusätzlich die Tags „linkedin“, „positionierung“ und „content-creation“ tragen.
              </p>
            </HelpSection>

            <HelpSection icon={<Search size={18} />} title="Suchen und Filtern">
              <ul>
                <li>Die globale Suche in der Sidebar durchsucht Titel, Inhalt und Tags.</li>
                <li>Die Suche in der Prompt-Bibliothek filtert die aktuell angezeigten Prompts.</li>
                <li>Über Favoriten zeigen Sie nur markierte Prompts im aktuellen Arbeitsbereich.</li>
                <li>Über Kategorien grenzen Sie die Bibliothek fachlich ein.</li>
                <li>„Auswahl zurücksetzen“ entfernt aktive Filter und zeigt wieder den gesamten Arbeitsbereich.</li>
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
              <p>
                Die Eingabe darf eine grobe Idee, ein alter Prompt, eine Aufgabenbeschreibung oder ein kurzer Arbeitsauftrag sein.
                Je klarer Ziel, Zielgruppe und Ausgabeformat gewählt werden, desto brauchbarer wird die optimierte Ausgabe.
              </p>
            </HelpSection>

            <HelpSection icon={<CheckCircle2 size={18} />} title="Workflow in 4 Schritten">
              <ol>
                <li>
                  <strong>Prompt-Ziel klären:</strong> Legen Sie fest, welches Ergebnis entstehen soll, für wen es gedacht ist und
                  welche Informationen unbedingt enthalten sein müssen.
                </li>
                <li>
                  <strong>Masterstruktur aufbauen:</strong> Bringen Sie den Prompt in eine klare Struktur mit Rolle, Ziel, Kontext,
                  Aufgaben, Ausgabeformat und Qualitätsanforderungen.
                </li>
                <li>
                  <strong>Varianten vergleichen:</strong> Nutzen Sie Kompakt für schnelle Ergebnisse und Premium für anspruchsvollere
                  Aufgaben. Vergleichen Sie beide Varianten und wählen Sie die bessere Grundlage.
                </li>
                <li>
                  <strong>Prompt finalisieren:</strong> Übernehmen Sie die beste Ausgabe, schärfen Sie Details nach, speichern Sie
                  Metadaten und machen Sie den Prompt über Kategorien, Tags oder Favoriten wiederauffindbar.
                </li>
              </ol>
            </HelpSection>

            <HelpSection icon={<Settings2 size={18} />} title="Strukturvorgaben einstellen">
              <ul>
                <li><strong>Ziel:</strong> Legt fest, ob der Prompt für Schreiben, Coding, Marketing, Analyse, Bildprompts oder Automatisierung gedacht ist.</li>
                <li><strong>Zielgruppe:</strong> Passt Sprache und Detailtiefe an, zum Beispiel für Einsteiger, Experten, Kunden oder Management.</li>
                <li><strong>Stil:</strong> Steuert die Tonalität, etwa professionell, präzise, kreativ, kurz, ausführlich oder überzeugend.</li>
                <li><strong>Format:</strong> Definiert die gewünschte Ausgabe, zum Beispiel Markdown, Liste, Tabelle, JSON, Schritte oder Freitext.</li>
                <li><strong>Stärke:</strong> Bestimmt, ob schnell, ausgewogen oder besonders ausführlich optimiert werden soll.</li>
                <li><strong>Sprache:</strong> Lässt die Sprache automatisch erkennen oder erzwingt Deutsch bzw. Englisch.</li>
                <li><strong>Rückfragen:</strong> Ergänzt fehlende Informationen als Fragen, statt stillschweigend Annahmen zu treffen.</li>
              </ul>
            </HelpSection>

            <HelpSection icon={<Sparkles size={18} />} title="Die wichtigsten KI-Buttons">
              <ul>
                <li><strong>Titel & Metadaten:</strong> Analysiert Eingabe und optimierte Ausgabe und schlägt Titel, Beschreibung, Kategorie und Tags vor.</li>
                <li><strong>Optimieren:</strong> Erstellt aus der Eingabe einen verbesserten Zielprompt und schreibt ihn in „Optimierte Ausgabe“.</li>
                <li><strong>2 Varianten:</strong> Erstellt eine kompakte und eine Premium-Variante zum direkten Vergleich.</li>
                <li><strong>Verbessern bei Kompakt:</strong> Überarbeitet nur die kompakte Variante, wenn sie noch präziser oder kürzer werden soll.</li>
                <li><strong>Verbessern bei Premium:</strong> Überarbeitet nur die Premium-Variante mit stärkerer Struktur und mehr Details.</li>
                <li><strong>Weiter verbessern:</strong> Übernimmt die optimierte Ausgabe als neue Eingabe, damit eine zweite bewusste Optimierungsrunde gestartet werden kann.</li>
              </ul>
              <p>
                Alle blau hervorgehobenen Buttons lösen eine KI- oder Optimierungsfunktion aus. Je nach Anbieter-Einstellung läuft dies
                über Anthropic oder lokal regelbasiert. „Titel & Metadaten“ nutzt Anthropic, weil Kategorie- und Tag-Vorschläge semantisch
                aus dem Prompt abgeleitet werden.
              </p>
            </HelpSection>

            <HelpSection icon={<CheckCircle2 size={18} />} title="Varianten und Rückgängig">
              <ul>
                <li>Kompakt ist für schnelle, direkt kopierbare Prompts gedacht.</li>
                <li>Premium nutzt eine ausführlichere Masterstruktur mit Rolle, Ziel, Kontext, Aufgaben, Ausgabeformat und Qualitätsanforderungen.</li>
                <li>Der Abschnitt Ziel hilft, den gewünschten Nutzen und das erwartete Ergebnis ausdrücklich festzuhalten.</li>
                <li>Mit „Rückgängig“ stellen Sie den letzten gespeicherten Prompt-Zustand wieder her.</li>
                <li>Mit „Duplizieren“ erzeugen Sie eine Kopie, um Varianten gefahrlos weiterzuentwickeln.</li>
              </ul>
              <p>
                Empfohlen ist: erst die Eingabe grob formulieren, dann „2 Varianten“ erzeugen, beide Fassungen lesen, die bessere Variante
                übernehmen und anschließend in der optimierten Ausgabe manuell finalisieren.
              </p>
            </HelpSection>

            <HelpSection icon={<Copy size={18} />} title="Übernehmen, kopieren und weiterverwenden">
              <ul>
                <li>„Übernehmen“ kopiert eine Variante in die optimierte Ausgabe.</li>
                <li>Das Kopier-Icon bei „Optimierte Ausgabe“ kopiert den fertigen Zielprompt in die Zwischenablage.</li>
                <li>Die optimierte Ausgabe kann manuell nachbearbeitet werden, bevor sie in ein KI-Tool übernommen wird.</li>
                <li>Wort- und Zeichenzähler helfen einzuschätzen, wie lang Eingabe, Varianten und Zielprompt sind.</li>
              </ul>
            </HelpSection>

            <HelpSection icon={<RotateCcw size={18} />} title="Optimierungsschleifen sinnvoll nutzen">
              <ul>
                <li>„Weiter verbessern“ übernimmt die optimierte Ausgabe als neue Eingabe und leert die bisherige optimierte Ausgabe.</li>
                <li>Danach können Ziel, Zielgruppe, Stil, Format, Stärke oder Sprache angepasst und erneut optimiert werden.</li>
                <li>Sinnvoll ist das, wenn die nächste Runde ein klares Ziel hat, zum Beispiel präziser, kürzer, ausführlicher oder stärker auf eine Zielgruppe ausgerichtet.</li>
                <li>Weniger sinnvoll sind viele automatische Wiederholungen ohne neue Vorgabe, weil dabei konkrete Details verloren gehen können.</li>
                <li>Empfohlen ist: Ausgabe lesen, Ziel für die nächste Runde festlegen, dann erst „Weiter verbessern“ und erneut optimieren.</li>
              </ul>
            </HelpSection>

            <HelpSection icon={<Star size={18} />} title="Favoriten, Speichern und Löschen">
              <ul>
                <li>Mit „Favorit“ markieren Sie besonders wichtige Prompts für schnellen Zugriff.</li>
                <li>Änderungen werden fortlaufend lokal gespeichert. Der Button „Speichern“ dient als sichtbarer Arbeitsanker.</li>
                <li>„Duplizieren“ erstellt eine Kopie des aktuellen Prompts und öffnet sie direkt.</li>
                <li>„Löschen“ entfernt den ausgewählten Prompt nach Bestätigung aus der lokalen Bibliothek.</li>
                <li>Beim Löschen von Arbeitsbereichen oder Kategorien bleiben Prompts erhalten, verlieren aber die jeweilige Zuordnung.</li>
              </ul>
            </HelpSection>

            <HelpSection icon={<Briefcase size={18} />} title="Prompts verschieben oder kopieren">
              <ul>
                <li>Zum Verschieben wählen Sie einen Prompt aus und öffnen rechts die Metadaten.</li>
                <li>Im Feld „Arbeitsbereich“ wählen Sie den Ziel-Arbeitsbereich aus.</li>
                <li>Danach zeigt „Kategorie zum Speichern“ nur noch Kategorien dieses Arbeitsbereichs.</li>
                <li>Zum Kopieren klicken Sie zuerst auf „Duplizieren“. Die Kopie wird direkt geöffnet.</li>
                <li>Ändern Sie anschließend bei der Kopie den Arbeitsbereich und wählen Sie bei Bedarf eine passende Kategorie.</li>
                <li>So bleibt das Original erhalten, während die Kopie im neuen Arbeitsbereich weiterbearbeitet werden kann.</li>
              </ul>
            </HelpSection>

            <HelpSection icon={<PanelLeftClose size={18} />} title="Mehr Platz schaffen">
              <ul>
                <li>Die Sidebar kann über das Einklapp-Icon links unten reduziert werden.</li>
                <li>Die Prompt-Bibliothek kann über das Icon im Bibliothekskopf eingeklappt werden.</li>
                <li>Im eingeklappten Zustand bleiben Orientierung und Anzahl der sichtbaren Prompts erhalten.</li>
                <li>Das ist hilfreich, wenn die eigentliche Prompt-Werkstatt mehr Breite benötigt.</li>
              </ul>
            </HelpSection>

            <HelpSection icon={<Download size={18} />} title="Export als Backup">
              <ul>
                <li>Der Export-Button in der Sidebar erstellt eine JSON-Datei Ihrer lokalen Prompt-Bibliothek.</li>
                <li>Diese Datei dient als Sicherung, bevor größere Änderungen, Löschungen oder Browserwechsel vorgenommen werden.</li>
                <li>Speichern Sie Exporte an einem sicheren Ort, wenn die enthaltenen Prompts geschäftlich oder vertraulich sind.</li>
                <li>Ein Export ersetzt keine automatische Cloud-Synchronisierung. Er ist bewusst eine lokale Sicherung.</li>
              </ul>
            </HelpSection>

            <HelpSection icon={<Upload size={18} />} title="Import aus JSON">
              <ul>
                <li>Der Import-Button liest eine zuvor exportierte JSON-Datei ein.</li>
                <li>Importierte Inhalte werden als zusätzliche Einträge übernommen, damit vorhandene Daten nicht stillschweigend überschrieben werden.</li>
                <li>Nach einem Import sollten Arbeitsbereiche, Kategorien und Stichproben einzelner Prompts geprüft werden.</li>
                <li>Wenn eine JSON-Datei nicht importiert werden kann, prüfen Sie, ob sie aus SMART PromptCreator stammt und vollständig gespeichert wurde.</li>
              </ul>
            </HelpSection>

            <HelpSection icon={<KeyRound size={18} />} title="Anthropic API-Schlüssel">
              <p>
                Für Anthropic-Optimierungen benötigt SMART PromptCreator einen API-Schlüssel aus der Anthropic Console.
                Der Schlüssel wird lokal verschlüsselt gespeichert. Bei Anthropic-Optimierungen sendet die App den jeweiligen Prompt
                über den lokalen Proxy an die Anthropic API. Bei lokaler Optimierung werden keine Inhalte an Anthropic gesendet.
              </p>
              <p>
                Ein gespeicherter API-Key bedeutet nur, dass ein Schlüssel lokal vorhanden ist. Ob die Verbindung funktioniert, prüfen
                Sie über „Verbindung überprüfen“. Ein normaler Claude.ai-Account oder Claude-Pro-Plan ersetzt keinen API-Key für die
                Anthropic Console.
              </p>
            </HelpSection>

            <HelpSection icon={<Plug size={18} />} title="Anthropic oder lokale Optimierung">
              <ul>
                <li><strong>Anthropic:</strong> Sendet den jeweiligen Prompt über den lokalen Proxy an Claude und erzeugt hochwertigere Vorschläge.</li>
                <li><strong>Lokal:</strong> Verarbeitet den Text im Browser mit eingebauten Regeln und sendet keine Inhalte an Anthropic.</li>
                <li>Die lokale Optimierung ist gut für einfache Strukturierung, aber weniger flexibel und weniger kreativ.</li>
                <li>Anthropic ist sinnvoll, wenn Qualität, Variantenbildung und präzise Metadaten wichtiger sind als reine Offline-Verarbeitung.</li>
              </ul>
            </HelpSection>

            <HelpSection icon={<ShieldCheck size={18} />} title="Lizenz und Nutzerzugriff">
              <ul>
                <li>Die Lizenz steuert die Nutzung der App, speichert aber keine Prompt-Inhalte in einer zentralen Cloud-Datenbank.</li>
                <li>Pro Lizenz ist ein persönlicher Nutzerzugriff vorgesehen.</li>
                <li>Für Aktivierung und Prüfung kann eine Verbindung zum Lizenzdienst erforderlich sein.</li>
                <li>Der Lizenzstatus wird unten in der Sidebar unter „Systemstatus“ angezeigt.</li>
              </ul>
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

            <HelpSection icon={<Plug size={18} />} title="Typische Probleme lösen">
              <ul>
                <li><strong>API-Verbindung schlägt fehl:</strong> Prüfen Sie API-Key, lokalen Server, Internetverbindung und ob der Key wirklich aus der Anthropic Console stammt.</li>
                <li><strong>„API-Key gespeichert“, aber keine Verbindung:</strong> Der Schlüssel ist lokal vorhanden, kann aber ungültig, gesperrt oder ohne Billing sein.</li>
                <li><strong>Keine Prompts sichtbar:</strong> Setzen Sie Suche, Favoriten und Kategorieauswahl zurück oder wechseln Sie den Arbeitsbereich.</li>
                <li><strong>Import klappt nicht:</strong> Prüfen Sie, ob die Datei eine gültige JSON-Sicherung von SMART PromptCreator ist.</li>
                <li><strong>Daten fehlen nach Browserwechsel:</strong> Lokale Daten werden nicht automatisch übertragen. Importieren Sie vorher exportierte JSON-Backups.</li>
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
            <ol className="list-decimal space-y-2 pl-5 text-neutral-600 dark:text-neutral-300">
              <li>
                <strong>Arbeitsbereich vorbereiten:</strong> Wählen Sie den passenden Arbeitsbereich oder legen Sie einen neuen an.
                Erstellen Sie bei Bedarf eine Kategorie, damit der Prompt später fachlich sauber einsortiert ist.
              </li>
              <li>
                <strong>Prompt erfassen:</strong> Klicken Sie auf „Prompt“, tragen Sie die Rohidee im Eingabefeld ein und ergänzen Sie
                Titel, Beschreibung, Kategorie und Tags in den Metadaten.
              </li>
              <li>
                <strong>Optimieren und vergleichen:</strong> Wählen Sie Ziel, Zielgruppe, Stil, Format, Stärke und Sprache. Optimieren
                Sie den Prompt und vergleichen Sie bei Bedarf die Kompakt- und Premium-Variante.
              </li>
              <li>
                <strong>Übernehmen und pflegen:</strong> Übernehmen Sie die beste Ausgabe, prüfen Sie sie fachlich, favorisieren Sie
                wichtige Prompts und nutzen Sie Suche, Kategorien oder Tags zum Wiederfinden.
              </li>
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
      <div className="space-y-2 text-neutral-600 dark:text-neutral-300 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
