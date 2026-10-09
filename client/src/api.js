const subscribers = new Set();
export function onAuthExpired(listener) { subscribers.add(listener); return () => subscribers.delete(listener); }

function validateResponse(path, method, data) {
  const invalid = () => { throw new Error('The server returned an unexpected response. Please retry.'); };
  if (!data || typeof data !== 'object' || Array.isArray(data)) invalid();
  if (path.startsWith('/auth/') && !path.endsWith('/logout') && (!data.user || !Number.isSafeInteger(data.user.id))) invalid();
  if (method === 'GET' && path.startsWith('/sessions/')) {
    if (!data.session || !Array.isArray(data.session.drills) || !['in_progress', 'completed'].includes(data.session.status)
        || !data.session.drills.length || data.session.drills.some((drill) => !drill.result || !Number.isSafeInteger(drill.id))) invalid();
  } else if (method === 'GET' && path.startsWith('/sessions') && !Array.isArray(data.sessions)) invalid();
  if (method === 'GET' && path === '/workouts' && !Array.isArray(data.workouts)) invalid();
  if (method === 'GET' && path === '/workouts/drills' && !Array.isArray(data.drills)) invalid();
  if (method === 'GET' && path === '/progress' && (!data.progress || !Array.isArray(data.progress.categories) || !Array.isArray(data.progress.recentSessions))) invalid();
  if (['POST', 'PUT'].includes(method) && path.startsWith('/workouts') && !data.workout?.id) invalid();
  if (method === 'POST' && path.startsWith('/sessions') && !data.sessionId) invalid();
  if (method === 'PATCH' && path.startsWith('/sessions/')
      && (!data.result || typeof data.result.completed !== 'boolean' || typeof data.result.notes !== 'string')) invalid();
  return data;
}

export function createApiClient({ baseUrl = '', fetchImpl = globalThis.fetch, timeoutMs = 15000, unauthorized = () => {} } = {}) {
  return async function request(path, options = {}) {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    const abort = () => controller.abort();
    if (options.signal?.aborted) controller.abort();
    options.signal?.addEventListener('abort', abort, { once: true });
    const method = options.method || 'GET';
    try {
      const response = await fetchImpl(`${baseUrl}${path}`, {
        ...options, method, credentials: 'include', signal: controller.signal,
        headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
      });
      if (response.status === 401 && !['/auth/login', '/auth/register'].includes(path)) unauthorized();
      if (response.status === 204) {
        if (method === 'DELETE' || path === '/auth/logout') return null;
        throw new Error('The server returned an unexpected empty response. Please retry.');
      }
      let body;
      try { body = await response.json(); }
      catch { throw Object.assign(new Error('The server returned unreadable data. Please retry.'), { status: response.status }); }
      if (!response.ok) throw Object.assign(new Error(typeof body?.error === 'string' ? body.error : 'The request could not be completed.'), { status: response.status });
      return validateResponse(path, method, body);
    } catch (error) {
      if (timedOut) throw new Error('The request timed out. Your changes may have reached the server; retry to check.');
      if (error.name === 'TypeError') throw new Error('Cannot reach the server. Check your connection and try again.');
      throw error;
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', abort);
    }
  };
}

export const api = createApiClient({
  baseUrl: import.meta.env?.VITE_API_URL || '/api',
  unauthorized: () => { for (const listener of subscribers) listener(); },
});
