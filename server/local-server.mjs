import { createServer } from 'node:http';
import { appendFile, mkdir, readFile, stat } from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const APP_PORT = Number(process.env.SMART_PROMPT_CREATOR_PORT || process.env.PORT || 48241);
const ANTHROPIC_VERSION = '2023-06-01';
const ROOT_DIR = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DIST_DIR = join(ROOT_DIR, 'dist');
const LOG_DIR = process.env.SMART_LOG_DIR ? resolve(process.env.SMART_LOG_DIR) : join(ROOT_DIR, 'logs');
const LOG_FILE = join(LOG_DIR, 'smart-prompt-creator.log');
const OPEN_BROWSER = process.argv.includes('--open') || process.env.SMART_OPEN_BROWSER === '1';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

await mkdir(LOG_DIR, { recursive: true });

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  process.stdout.write(line);
  appendFile(LOG_FILE, line).catch(() => undefined);
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

async function proxyAnthropic(request, response) {
  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {});
    return;
  }

  if (request.method !== 'POST') {
    sendJson(response, 405, {
      error: 'method_not_allowed',
      message: 'Diese Route akzeptiert nur POST. Starte die App über den lokalen Server und wiederhole die Aktion.'
    });
    return;
  }

  try {
    const { apiKey, payload } = await readJsonBody(request);
    if (!apiKey || typeof apiKey !== 'string') {
      sendJson(response, 400, { error: 'missing_api_key', message: 'Anthropic API-Schlüssel fehlt.' });
      return;
    }
    if (!payload || typeof payload !== 'object') {
      sendJson(response, 400, { error: 'missing_payload', message: 'Anthropic Anfrageinhalt fehlt.' });
      return;
    }

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': ANTHROPIC_VERSION
      },
      body: JSON.stringify(payload)
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      log(`Anthropic upstream error ${upstream.status}: ${text.slice(0, 500)}`);
    }
    response.writeHead(upstream.status, {
      'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    });
    response.end(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Proxyfehler';
    log(`Anthropic proxy error: ${message}`);
    sendJson(response, 502, {
      error: 'proxy_failed',
      message: `Der lokale KI-Proxy konnte Anthropic nicht erreichen: ${message}`
    });
  }
}

async function serveStatic(request, response) {
  if (!existsSync(DIST_DIR)) {
    sendJson(response, 503, {
      error: 'dist_missing',
      message: 'Der Build-Ordner dist fehlt. Bitte zuerst npm run build ausführen.'
    });
    return;
  }

  const url = new URL(request.url || '/', `http://127.0.0.1:${APP_PORT}`);
  const pathname = decodeURIComponent(url.pathname);
  const safePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  let filePath = resolve(DIST_DIR, safePath);

  if (!filePath.startsWith(DIST_DIR)) {
    sendJson(response, 403, { error: 'forbidden', message: 'Ungültiger Dateipfad.' });
    return;
  }

  const fileInfo = await stat(filePath).catch(() => undefined);
  if (!fileInfo?.isFile()) filePath = join(DIST_DIR, 'index.html');

  response.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream' });
  createReadStream(filePath).pipe(response);
}

function openBrowser(url) {
  const platform = process.platform;
  const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = platform === 'win32' ? ['/c', 'start', '', url] : [url];
  const child = spawn(command, args, { detached: true, stdio: 'ignore' });
  child.unref();
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://127.0.0.1:${APP_PORT}`);
  log(`${request.method} ${url.pathname}`);

  if (url.pathname === '/api/health') {
    sendJson(response, 200, {
      ok: true,
      product: 'SMART PromptCreator',
      port: APP_PORT,
      app: 'browser-local'
    });
    return;
  }

  if (url.pathname === '/api/anthropic/messages') {
    await proxyAnthropic(request, response);
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    sendJson(response, 404, {
      error: 'api_not_found',
      message: `Lokale API-Route nicht gefunden: ${url.pathname}`
    });
    return;
  }

  await serveStatic(request, response);
});

const appUrl = `http://127.0.0.1:${APP_PORT}/`;

server.on('error', (error) => {
  if (error?.code === 'EADDRINUSE') {
    log(`Port ${APP_PORT} is already in use. Opening existing app at ${appUrl}`);
    if (OPEN_BROWSER) openBrowser(appUrl);
    process.exit(0);
  }

  const message = error instanceof Error ? error.message : String(error);
  log(`Server failed: ${message}`);
  process.exit(1);
});

server.listen(APP_PORT, '127.0.0.1', () => {
  log(`SMART PromptCreator local server running at ${appUrl}`);
  if (OPEN_BROWSER) openBrowser(appUrl);
});
