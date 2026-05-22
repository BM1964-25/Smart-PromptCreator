export const SMART_PROMPT_CREATOR_PORT = 48241;

const localHosts = new Set(['127.0.0.1', 'localhost', '::1']);

export function getLocalProxyBase() {
  if (typeof window === 'undefined') return `http://127.0.0.1:${SMART_PROMPT_CREATOR_PORT}`;

  const { hostname, port, protocol } = window.location;
  const isLocalHost = localHosts.has(hostname);
  const isAppServer = isLocalHost && port === String(SMART_PROMPT_CREATOR_PORT);

  if (protocol === 'http:' && isAppServer) return '';
  return `http://127.0.0.1:${SMART_PROMPT_CREATOR_PORT}`;
}

export function localApiUrl(path: string) {
  return `${getLocalProxyBase()}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function parseProxyError(response: Response) {
  const payload = await response.json().catch(() => undefined);
  const message = payload?.message || payload?.error || response.statusText;

  if (response.status === 405) {
    return 'Die lokale API wurde mit der falschen HTTP-Methode aufgerufen. Bitte die App ueber den lokalen Starter oder npm start starten und die Aktion erneut ausfuehren.';
  }

  if (response.status === 0 || response.status >= 500) {
    return `Der lokale KI-Proxy konnte die Anfrage nicht verarbeiten: ${message}`;
  }

  return message || `API-Anfrage fehlgeschlagen (HTTP ${response.status}).`;
}
