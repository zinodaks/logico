import { api } from './client';

export interface User {
  id: string;
  email: string;
  name: string;
  active: boolean;
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<{ user: User }>('/auth/me');
  return data.user;
}

export async function fetchSignupStatus(): Promise<boolean> {
  const { data } = await api.get<{ signupOpen: boolean }>('/auth/signup-status');
  return data.signupOpen;
}

export async function login(email: string, password: string): Promise<User> {
  const { data } = await api.post<{ user: User }>('/auth/login', { email, password });
  return data.user;
}

export async function signup(email: string, password: string, name: string): Promise<User> {
  const { data } = await api.post<{ user: User }>('/auth/signup', { email, password, name });
  return data.user;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}
