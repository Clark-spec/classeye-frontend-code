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

export async function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/login', payload);
  return data;
}

export async function logoutRequest(): Promise<void> {
  await api.post('/logout');
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<{ data: User }>('/me');
  return data.data;
}
