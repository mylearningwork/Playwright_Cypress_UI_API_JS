import { env } from '../config/env.js';
import { upstreamUnavailable } from './errors.js';

export async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? env.REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.headers ?? {})
      }
    });

    if (!response.ok) {
      throw upstreamUnavailable(`Upstream returned HTTP ${response.status}`, { url });
    }

    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw upstreamUnavailable('Upstream request timed out', { url });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
