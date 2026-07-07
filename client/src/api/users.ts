import { api } from './client';
import type { User } from './auth';

export async function listUsers(): Promise<User[]> {
  const { data } = await api.get<{ users: User[] }>('/users');
  return data.users;
}

export async function createUser(input: { email: string; password: string; name: string }): Promise<User> {
  const { data } = await api.post<{ user: User }>('/users', input);
  return data.user;
}

export async function setUserActive(id: string, active: boolean): Promise<User> {
  const { data } = await api.patch<{ user: User }>(`/users/${id}`, { active });
  return data.user;
}

export async function resetUserPassword(id: string, password: string): Promise<User> {
  const { data } = await api.patch<{ user: User }>(`/users/${id}/password`, { password });
  return data.user;
}
