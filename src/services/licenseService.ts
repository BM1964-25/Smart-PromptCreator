import { db } from '../db/database';

export async function validateLicense(licenseKey: string, endpoint: string) {
  const response = await fetch(`${endpoint.replace(/\/$/, '')}/license/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ licenseKey })
  });
  if (!response.ok) throw new Error('Lizenzpruefung fehlgeschlagen.');
  const data = await response.json();
  const settings = await db.settings.get('app');
  await db.settings.put({
    ...(settings || {
      id: 'app',
      apiKeys: {},
      theme: 'system',
      language: 'de',
      defaultModel: 'gpt-4.1-mini',
      backup: { autoBackup: false }
    }),
    license: {
      key: licenseKey,
      token: data.token,
      status: data.valid ? 'active' : 'expired',
      lastValidatedAt: new Date().toISOString(),
      graceUntil: data.graceUntil
    }
  });
  return data;
}
