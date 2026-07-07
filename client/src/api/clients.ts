import { api } from './client';

export interface ClientDocument {
  _id: string;
  key: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface Client {
  _id: string;
  name: string;
  address: string;
  rccm?: string;
  identificationNationale?: string;
  nif?: string;
  documents: ClientDocument[];
  active: boolean;
}

export type ClientInput = Pick<Client, 'name' | 'address' | 'rccm' | 'identificationNationale' | 'nif'>;

export async function listClients(): Promise<Client[]> {
  const { data } = await api.get<{ items: Client[] }>('/clients');
  return data.items;
}

export async function getClient(id: string): Promise<Client> {
  const { data } = await api.get<{ item: Client }>(`/clients/${id}`);
  return data.item;
}

export async function createClient(input: ClientInput): Promise<Client> {
  const { data } = await api.post<{ item: Client }>('/clients', input);
  return data.item;
}

export async function updateClient(id: string, input: Partial<ClientInput>): Promise<Client> {
  const { data } = await api.patch<{ item: Client }>(`/clients/${id}`, input);
  return data.item;
}

export async function uploadClientDocument(id: string, file: File): Promise<Client> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<{ item: Client }>(`/clients/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.item;
}

export async function deleteClientDocument(id: string, docId: string): Promise<Client> {
  const { data } = await api.delete<{ item: Client }>(`/clients/${id}/documents/${docId}`);
  return data.item;
}

export function clientDocumentDownloadUrl(id: string, docId: string): string {
  return `/api/clients/${id}/documents/${docId}/download`;
}

export function clientDocumentsZipUrl(id: string): string {
  return `/api/clients/${id}/documents/zip`;
}

export function clientStatementUrl(id: string, format: 'pdf' | 'xlsx'): string {
  return `/api/clients/${id}/statement?format=${format}`;
}
