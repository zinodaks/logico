import { NamedEntityPage } from '../components/NamedEntityPage';
import { agentsApi } from '../api/agents';

export default function Agents() {
  return <NamedEntityPage title="Agents" queryKey="agents" api={agentsApi} />;
}
