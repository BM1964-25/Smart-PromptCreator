# SMART PromptCreator

Browserbasierte lokale KI-Arbeitsoberflaeche zur Verwaltung, Optimierung und Organisation von Prompts.

Die App ist keine Electron- oder Tauri-Desktop-App. Sie laeuft lokal im Browser und wird ueber einen kleinen Node.js-Server gestartet. Der Server liefert die App-Dateien aus und leitet KI-Anfragen ueber einen lokalen Proxy an Anthropic weiter.

## Nutzerfreundlicher Start

### macOS

1. Einmalig installieren:

```bash
npm install
npm run build
npm run launcher:mac
```

2. Danach per Doppelklick starten:

```text
dist-launcher/SMART PromptCreator.app
```

Der Launcher startet den lokalen Server im Hintergrund und oeffnet automatisch den Browser. Es ist kein sichtbares Terminalfenster notwendig.

### Windows

1. Einmalig installieren:

```bash
npm install
npm run build
```

2. Danach per Doppelklick starten:

```text
launchers/windows/Start-SMART-PromptCreator.vbs
```

Der Starter laeuft ohne dauerhaft sichtbares Konsolenfenster, startet den lokalen Server und oeffnet den Browser.

## Technischer Start

```bash
npm install
npm run build
npm start
```

Die App ist danach lokal erreichbar unter:

```text
http://127.0.0.1:48241/
```

Der Port `48241` ist fuer SMART PromptCreator reserviert.

## Lokaler KI-Proxy

Der lokale Server stellt diese Endpunkte bereit:

- `GET /api/health`
- `POST /api/anthropic/messages`

Das Frontend erkennt automatisch, ob es direkt ueber `http://127.0.0.1:48241/` laeuft. Wenn es aus einem anderen Kontext geoeffnet wird, nutzt es automatisch:

```text
http://127.0.0.1:48241/api/...
```

Anthropic API-Keys werden nicht in eine Cloud-Datenbank geschrieben. Der lokale Proxy speichert den Key nicht dauerhaft, sondern leitet ihn nur fuer die konkrete Anfrage an Anthropic weiter.

## Logs

Server- und Launcher-Ausgaben werden lokal geschrieben nach:

```text
logs/
```

Der Ordner wird nicht versioniert.

## Datenschutz

Prompts, Kategorien, Tabs, Einstellungen und der verschluesselte Anthropic API-Key bleiben lokal in IndexedDB. Netzwerkzugriffe passieren nur bei expliziter Anthropic-Optimierung oder Metadaten-Erstellung. Es gibt keine Cloud-Datenbank und keine Telemetrie.

## Entwicklung

Frontend-Entwicklung mit Vite:

```bash
npm run dev
```

Produktionsbuild:

```bash
npm run build
```

Lokaler Produktionsserver:

```bash
npm start
```

Lizenz-Backend fuer Entwicklung:

```bash
cp .env.example .env
npm run license:dev
```

## Importformat

```json
{
  "version": "1.0",
  "prompts": [
    {
      "title": "SEO Blog Prompt",
      "content": "Schreibe einen SEO Artikel...",
      "optimized": "Erstelle einen professionellen SEO Artikel...",
      "category": "SEO",
      "tags": ["seo", "blog"]
    }
  ]
}
```

## App-spezifische Kennungen

- Produktname: `SMART PromptCreator`
- Lokaler Port: `48241`
- Bundle-Identifier macOS Launcher: `de.smartpromptcreator.local`
- IndexedDB Name: `smart-prompt-creator`
- Lokaler Storage-Prefix: `spc`
