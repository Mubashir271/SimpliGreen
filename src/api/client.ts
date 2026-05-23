import AsyncStorage from '@react-native-async-storage/async-storage';

// iOS Simulator: 127.0.0.1 | Android Emulator: 10.0.2.2
export const BASE_URL = 'http://10.0.2.2:3000/api';
export const TOKEN_KEY = '@crm_auth_token';

export const tokenStorage = {
  get: (): Promise<string | null> => AsyncStorage.getItem(TOKEN_KEY),
  set: (token: string): Promise<void> => AsyncStorage.setItem(TOKEN_KEY, token),
  remove: (): Promise<void> => AsyncStorage.removeItem(TOKEN_KEY),
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await tokenStorage.get();
  const isFormData = options?.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : {'Content-Type': 'application/json'}),
    ...(token ? {Authorization: `Bearer ${token}`} : {}),
    ...((options?.headers as Record<string, string>) ?? {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, {...options, headers});

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
