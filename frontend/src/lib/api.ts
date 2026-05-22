import axios, { AxiosError, AxiosRequestConfig } from "axios";

import { auth } from "./firebase";

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export const api = axios.create({ baseURL, timeout: 30_000 });

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ApiError {
  detail: string;
  code?: string;
  status: number;
}

export function asApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const e = err as AxiosError<{ detail?: string; code?: string }>;
    const data = e.response?.data;
    const detail = typeof data === "string" ? data : data?.detail || e.message;
    return { detail: detail || "Request failed", code: data?.code, status: e.response?.status || 0 };
  }
  return { detail: String(err), status: 0 };
}

export async function get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.get<T>(path, config);
  return res.data;
}

export async function post<T>(path: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.post<T>(path, body, config);
  return res.data;
}

export async function patch<T>(path: string, body?: unknown): Promise<T> {
  const res = await api.patch<T>(path, body);
  return res.data;
}

export async function del(path: string): Promise<void> {
  await api.delete(path);
}

export async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await api.put<T>(path, body);
  return res.data;
}
