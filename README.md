# Smart Prompt Creator

Lokale Desktop-App zur Verwaltung, Optimierung und Organisation von KI-Prompts.

## Stack

- Tauri 2
- React, TypeScript, Vite
- TailwindCSS
- IndexedDB mit Dexie.js
- Anthropic API fuer Prompt-Optimierung
- kleines Node/Express Backend fuer Stripe Checkout und Lizenzvalidierung

## Entwicklung

```bash
npm install
npm run dev
```

Tauri Desktop:

```bash
npm run tauri dev
```

Lizenz-Backend:

```bash
cp .env.example .env
npm run license:dev
```

## Datenschutz

Prompts, Kategorien, Tabs, Einstellungen und der verschluesselte Anthropic API-Key bleiben lokal in IndexedDB. Netzwerkzugriffe passieren nur bei expliziter Anthropic-Optimierung oder Lizenzaktion. Es gibt keine Cloud-Datenbank und keine Telemetrie.

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
