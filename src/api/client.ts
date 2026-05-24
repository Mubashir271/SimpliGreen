import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = 'https://simpligreen.netlify.app/api';
export const TOKEN_KEY = '@crm_auth_token';

const ORIGIN = BASE_URL.replace('/api', '');

// avatar field from backend is either a full URL or a bare filename
export function getAvatarUrl(avatar: string | undefined | null): string | null {
  if (!avatar) {return null;}
  if (avatar.startsWith('http')) {return avatar;}
  return `${ORIGIN}/uploads/${avatar}`;
}

export const tokenStorage = {
  get: (): Promise<string | null> => AsyncStorage.getItem(TOKEN_KEY),
  set: (token: string): Promise<void> => AsyncStorage.setItem(TOKEN_KEY, token),
  remove: (): Promise<void> => AsyncStorage.removeItem(TOKEN_KEY),
};

// Registered by AppNavigator — called whenever any request gets a 401
let _onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void) {
  _onUnauthorized = handler;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await tokenStorage.get();
  const isFormData = options?.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : {'Content-Type': 'application/json'}),
    ...(token ? {Authorization: `Bearer ${token}`} : {}),
    ...((options?.headers as Record<string, string>) ?? {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, {...options, headers});

  if (response.status === 401) {
    await tokenStorage.remove();
    _onUnauthorized?.();
    throw new Error('Session expired. Please sign in again.');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? `HTTP ${response.status}`);
  }
  return data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, {method: 'DELETE'}),
  upload: <T>(path: string, formData: FormData) =>
    request<T>(path, {method: 'POST', body: formData}),
};
