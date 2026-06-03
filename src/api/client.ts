import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, {AxiosError, AxiosRequestConfig} from 'axios';

export const BASE_URL = 'https://simpligreen.netlify.app/api';
export const TOKEN_KEY = '@crm_auth_token';

const ORIGIN = BASE_URL.replace('/api', '');

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

let _onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void) {
  _onUnauthorized = handler;
}

const client = axios.create({baseURL: BASE_URL});

// Attach token before every request
client.interceptors.request.use(async config => {
  const token = await tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
client.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await tokenStorage.remove();
      _onUnauthorized?.();
      throw new Error('Session expired. Please sign in again.');
    }
    const data = error.response?.data as {error?: string} | undefined;
    throw new Error(data?.error ?? error.message ?? `HTTP ${error.response?.status}`);
  },
);

// Retry on network errors (e.g. Netlify cold-start drops the connection)
async function requestWithRetry<T>(config: AxiosRequestConfig, maxAttempts = 3): Promise<T> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await client.request<T>(config);
      return res.data;
    } catch (err) {
      const isNetwork = axios.isAxiosError(err) && !err.response;
      if (isNetwork && attempt < maxAttempts - 1) {
        await new Promise<void>(res => setTimeout(res, 800 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Network request failed');
}

export const api = {
  get: <T>(path: string) =>
    requestWithRetry<T>({method: 'GET', url: path}),
  post: <T>(path: string, body?: unknown) =>
    requestWithRetry<T>({method: 'POST', url: path, data: body}),
  put: <T>(path: string, body?: unknown) =>
    requestWithRetry<T>({method: 'PUT', url: path, data: body}),
  delete: <T>(path: string) =>
    requestWithRetry<T>({method: 'DELETE', url: path}),
  upload: <T>(path: string, formData: FormData) =>
    requestWithRetry<T>({
      method: 'POST',
      url: path,
      data: formData,
      headers: {'Content-Type': 'multipart/form-data'},
    }),
};
