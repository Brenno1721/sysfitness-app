import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/api';

const KEY_ACCESS = 'auth_accessToken';
const KEY_REFRESH = 'auth_refreshToken';

export class SessionExpiredError extends Error {
  constructor() {
    super('Sessão expirada. Faça login novamente.');
    this.name = 'SessionExpiredError';
  }
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    SecureStore.setItemAsync(KEY_ACCESS, accessToken),
    SecureStore.setItemAsync(KEY_REFRESH, refreshToken),
  ]);
}

export async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(KEY_ACCESS),
    SecureStore.deleteItemAsync(KEY_REFRESH),
  ]);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY_ACCESS);
}

async function doRefresh(): Promise<void> {
  const refreshToken = await SecureStore.getItemAsync(KEY_REFRESH);
  if (!refreshToken) throw new SessionExpiredError();

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    await clearTokens();
    throw new SessionExpiredError();
  }

  const data = await res.json();
  await SecureStore.setItemAsync(KEY_ACCESS, data.accessToken);
}

type ReqOptions = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  skipAuth?: boolean;
};

async function request<T>(opts: ReqOptions, isRetry = false): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (!opts.skipAuth) {
    const token = await getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${opts.path}`, {
    method: opts.method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401 && !isRetry && !opts.skipAuth) {
    await doRefresh();
    return request(opts, true);
  }

  if (!res.ok) {
    let message = `Erro ${res.status}`;
    try {
      const data = await res.json();
      if (typeof data.message === 'string') message = data.message;
      else if (Array.isArray(data.message) && data.message.length > 0) message = data.message[0];
    } catch {}
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const apiGet = <T>(path: string): Promise<T> =>
  request<T>({ method: 'GET', path });

export const apiPost = <T>(path: string, body?: unknown, skipAuth = false): Promise<T> =>
  request<T>({ method: 'POST', path, body, skipAuth });

export const apiPatch = <T>(path: string, body?: unknown): Promise<T> =>
  request<T>({ method: 'PATCH', path, body });

export const apiDelete = <T>(path: string): Promise<T> =>
  request<T>({ method: 'DELETE', path });
