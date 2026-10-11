// Fonctions d'appel a l'API auth (register, login, logout, me, request-reset, change-password).

import type {
  AuthUser,
  ChangePasswordInput,
  LoginInput,
  LoginResponse,
  RegisterInput,
  RequestResetInput,
} from '@/contracts/auth';
import { apiFetch } from './client';

export function register(input: RegisterInput): Promise<AuthUser> {
  return apiFetch<AuthUser>('/api/auth/register', { method: 'POST', body: input });
}

export function login(input: LoginInput): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/auth/login', { method: 'POST', body: input });
}

export function logout(): Promise<void> {
  return apiFetch<void>('/api/auth/logout', { method: 'POST' });
}

export function me(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/api/auth/me');
}

export function requestReset(input: RequestResetInput): Promise<void> {
  return apiFetch<void>('/api/auth/request-reset', { method: 'POST', body: input });
}

export function changePassword(input: ChangePasswordInput): Promise<void> {
  return apiFetch<void>('/api/auth/change-password', { method: 'POST', body: input });
}
