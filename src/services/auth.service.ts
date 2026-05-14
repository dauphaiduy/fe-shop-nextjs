import { apiClient } from "./api-client";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  name?: string;
}

export interface AuthToken {
  accessToken: string;
}

export const authService = {
  login: (body: LoginRequest) =>
    apiClient.post<AuthToken>("/auth/login", body),

  register: (body: RegisterRequest) =>
    apiClient.post<unknown>("/auth/register", body),
};
