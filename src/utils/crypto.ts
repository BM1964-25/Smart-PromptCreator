const encoder = new TextEncoder();
const decoder = new TextDecoder();
const storageSaltKey = 'spc.crypto.salt';

function bytesToBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(value: string) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

async function getKeyMaterial(secret: string) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), 'PBKDF2', false, ['deriveKey']);
}

async function deriveKey(secret: string) {
  const existingSalt = localStorage.getItem(storageSaltKey);
  const salt = existingSalt ? base64ToBytes(existingSalt) : crypto.getRandomValues(new Uint8Array(16));
  if (!existingSalt) localStorage.setItem(storageSaltKey, bytesToBase64(salt));

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' },
    await getKeyMaterial(secret),
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function localSecret() {
  const existing = localStorage.getItem('spc.local.secret');
  if (existing) return existing;
  const secret = bytesToBase64(crypto.getRandomValues(new Uint8Array(32)));
  localStorage.setItem('spc.local.secret', secret);
  return secret;
}

export async function encryptSecret(value: string) {
  if (!value) return '';
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await deriveKey(localSecret()), encoder.encode(value));
  return `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(encrypted))}`;
}

export async function decryptSecret(payload?: string) {
  if (!payload) return '';
  const [iv, data] = payload.split('.');
  if (!iv || !data) return '';
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(iv) },
    await deriveKey(localSecret()),
    base64ToBytes(data)
  );
  return decoder.decode(decrypted);
}
