import { simpleCrudApi } from './simpleCrud';

export interface Agent {
  _id: string;
  name: string;
  active: boolean;
}

export const agentsApi = simpleCrudApi<Agent, { name: string }>('/agents');
