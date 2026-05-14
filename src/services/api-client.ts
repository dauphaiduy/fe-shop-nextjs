import axios from "axios";
import type { ApiResponse } from "@/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/v1";

let _accessToken: string | null = null;

// Resolved once session is determined (authenticated or not) to prevent race on reload.
let _resolveReady!: () => void;
const _sessionReady = new Promise<void>((resolve) => {
  _resolveReady = resolve;
});

export function setApiToken(token: string | null) {
  _accessToken = token;
  _resolveReady();
}

const instance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

instance.interceptors.request.use(async (config) => {
  await _sessionReady;
  if (_accessToken) {
    config.headers["Authorization"] = `Bearer ${_accessToken}`;
  }
  return config;
});

instance.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err.response?.data ?? err),
);

export const apiClient = {
  get: <T>(path: string) =>
    instance.get<ApiResponse<T>>(path).then((r) => r.data),
  post: <T>(path: string, body: unknown) =>
    instance.post<ApiResponse<T>>(path, body).then((r) => r.data),
  put: <T>(path: string, body: unknown) =>
    instance.put<ApiResponse<T>>(path, body).then((r) => r.data),
  patch: <T>(path: string, body: unknown) =>
    instance.patch<ApiResponse<T>>(path, body).then((r) => r.data),
  delete: <T>(path: string) =>
    instance.delete<ApiResponse<T>>(path).then((r) => r.data),
};

// Public client — no auth gate, for public endpoints (products, categories)
const publicInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

publicInstance.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err.response?.data ?? err),
);

export const publicClient = {
  get: <T>(path: string) =>
    publicInstance.get<ApiResponse<T>>(path).then((r) => r.data),
};
