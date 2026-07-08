import { api } from './client';

export function simpleCrudApi<T, TCreate = Partial<T>>(resourcePath: string) {
  return {
    async list(params?: Record<string, string>): Promise<T[]> {
      const { data } = await api.get<{ items: T[] }>(resourcePath, { params });
      return data.items;
    },
    async create(input: TCreate): Promise<T> {
      const { data } = await api.post<{ item: T }>(resourcePath, input);
      return data.item;
    },
    async update(id: string, input: Partial<T>): Promise<T> {
      const { data } = await api.patch<{ item: T }>(`${resourcePath}/${id}`, input);
      return data.item;
    },
    async remove(id: string): Promise<T> {
      const { data } = await api.delete<{ item: T }>(`${resourcePath}/${id}`);
      return data.item;
    },
  };
}
