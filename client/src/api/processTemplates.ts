import { api } from './client';

export interface ProcessTemplate {
  _id: string;
  processType: 'IM4' | 'TR8';
  steps: { name: string; order: number }[];
}

export async function getProcessTemplate(type: 'IM4' | 'TR8'): Promise<ProcessTemplate> {
  const { data } = await api.get<{ item: ProcessTemplate }>(`/process-templates/${type}`);
  return data.item;
}

export async function putProcessTemplate(type: 'IM4' | 'TR8', steps: { name: string }[]): Promise<ProcessTemplate> {
  const { data } = await api.put<{ item: ProcessTemplate }>(`/process-templates/${type}`, { steps });
  return data.item;
}
