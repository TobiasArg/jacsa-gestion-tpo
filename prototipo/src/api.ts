import type { Estimate, PublicArticle, Snapshot, User } from './types';

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, method: 'GET' | 'POST', body?: unknown): Promise<T> {
  const headers = new Headers({ Accept: 'application/json' });
  const init: RequestInit = { method, credentials: 'same-origin', headers };
  if (method === 'POST') {
    headers.set('Content-Type', 'application/json');
    headers.set('X-Jacsa-Request', '1');
    init.body = JSON.stringify(body ?? {});
  }

  let response: Response;
  try {
    response = await fetch(path, init);
  } catch {
    throw new ApiError('No se pudo conectar con JACSA Gestión. Comprueba que el servicio esté disponible e intenta otra vez.', 0);
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // The API contract is JSON, but keep a useful error if a proxy returns HTML.
  }
  if (!response.ok) {
    const problem = payload && typeof payload === 'object' ? payload as { error?: unknown; code?: unknown } : {};
    const message = typeof problem.error === 'string' ? problem.error : `La solicitud no pudo completarse (${response.status}).`;
    throw new ApiError(message, response.status, typeof problem.code === 'string' ? problem.code : undefined);
  }
  return payload as T;
}

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>(path, 'GET');
  },
  post<T>(path: string, body: unknown = {}): Promise<T> {
    return request<T>(path, 'POST', body);
  },
  async me(): Promise<User | null> {
    const result = await request<{ user: User | null }>('/api/me', 'GET');
    return result.user;
  },
  catalog(): Promise<{ articles: PublicArticle[] }> {
    return request('/api/catalog', 'GET');
  },
  bootstrap(): Promise<Snapshot> {
    return request('/api/bootstrap', 'GET');
  },
  estimate(body: { articleId: string | null; quantity: number; unit: string; special: boolean }): Promise<Estimate> {
    return request('/api/estimate', 'POST', body);
  },
};
