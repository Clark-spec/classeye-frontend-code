import api from './client';
import type { User } from '../types';

export interface LoginPayload {
  staff_id: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ResetPasswordPayload {
  name: string;
  password: string;
  password_confirmation: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/login', payload);
  return data;
}

export async function resetPasswordRequest(
  payload: ResetPasswordPayload
): Promise<ResetPasswordResponse> {
  const { data } = await api.post<ResetPasswordResponse>('/forgot-password', payload);
  return data;
}

export async function logoutRequest(): Promise<void> {
  await api.post('/logout');
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<{ data: User }>('/me');
  return data.data;
}
