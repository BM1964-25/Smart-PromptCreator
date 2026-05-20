const anthropicVersion = '2023-06-01';
const testModel = 'claude-3-5-haiku-latest';

export interface AnthropicTestResult {
  ok: boolean;
  message: string;
}

export async function testAnthropicConnection(apiKey: string): Promise<AnthropicTestResult> {
  if (!apiKey.trim()) {
    return { ok: false, message: 'Bitte zuerst einen Anthropic API-Schluessel eingeben.' };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': anthropicVersion
      },
      body: JSON.stringify({
        model: testModel,
        max_tokens: 16,
        messages: [
          {
            role: 'user',
            content: 'Reply with exactly: connection-ok'
          }
        ]
      })
    });

    if (!response.ok) {
      const details = await response.json().catch(() => undefined);
      const apiMessage = details?.error?.message || `HTTP ${response.status}`;
      return { ok: false, message: `Anthropic hat die Anfrage abgelehnt: ${apiMessage}` };
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text || '';
    return {
      ok: text.toLowerCase().includes('connection-ok'),
      message: text ? 'Verbindung erfolgreich geprueft.' : 'Verbindung hergestellt, aber ohne Testantwort.'
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Netzwerkfehler';
    const corsHint = message.toLowerCase().includes('failed to fetch')
      ? 'Direkte Browser-Anfragen koennen durch CORS blockiert werden. In Tauri sollte dieser Request ueber einen lokalen Backend-/Command-Layer laufen.'
      : message;
    return { ok: false, message: corsHint };
  }
}
