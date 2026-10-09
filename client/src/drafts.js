export function formResult(result = {}) {
  if (!result || typeof result !== 'object') result = {};
  return { makes: result.makes ?? '', attempts: result.attempts ?? '', repetitions: result.repetitions ?? '',
    timeSeconds: result.timeSeconds ?? '', completed: Boolean(result.completed), notes: typeof result.notes === 'string' ? result.notes : '' };
}
function browserStorage() { try { return globalThis.sessionStorage; } catch { return undefined; } }
export function readDraft(key, fallback, storage = browserStorage()) {
  try { return JSON.parse(storage?.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}
export function writeDraft(key, value, storage = browserStorage()) {
  try { storage?.setItem(key, JSON.stringify(value)); return Boolean(storage); } catch { return false; }
}
export function removeDraft(key, storage = browserStorage()) {
  try { storage?.removeItem(key); } catch { /* Storage may be disabled. */ }
}
export function clearLocalDrafts(storage = browserStorage()) {
  try {
    for (const key of Object.keys(storage || {})) if (key.startsWith('hooproutine:draft:')) storage.removeItem(key);
  } catch { /* A successful server logout must not depend on browser storage. */ }
}
export function withoutDraft(drafts, id) {
  const next = { ...drafts }; delete next[id]; return next;
}
export function newRequestId() {
  if (globalThis.crypto.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export function shootingTotals(drills) {
  return drills.reduce((total, drill) => {
    const result = drill.result;
    const measured = result.attempts !== null && result.attempts !== undefined;
    return { completed: total.completed + Number(Boolean(result.completed)),
      makes: total.makes + (measured ? Number(result.makes || 0) : 0),
      attempts: total.attempts + Number(result.attempts || 0), repetitions: total.repetitions + Number(result.repetitions || 0) };
  }, { completed: 0, makes: 0, attempts: 0, repetitions: 0 });
}
