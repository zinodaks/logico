import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/clients', label: 'Clients' },
  { to: '/files', label: 'Files' },
  { to: '/payments', label: 'Payments' },
  { to: '/agents', label: 'Agents' },
  { to: '/transporters', label: 'Transporters' },
  { to: '/payment-types', label: 'Payment Types' },
  { to: '/process-templates', label: 'Process Templates' },
  { to: '/profit-transfers', label: 'Profit Transfers' },
  { to: '/reports/cautions-actual', label: 'Caution Report' },
  { to: '/settings', label: 'Settings' },
  { to: '/team', label: 'Team' },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-56 shrink-0 bg-gray-900 text-gray-200 flex flex-col">
        <div className="px-4 py-4 text-lg font-semibold text-white">Cash Flow</div>
        <nav className="flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block px-4 py-2 text-sm hover:bg-gray-800 ${isActive ? 'bg-gray-800 text-white' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-gray-800 text-sm">
          <div className="mb-2 text-gray-400">{user?.name}</div>
          <button onClick={handleLogout} className="text-gray-300 hover:text-white underline">
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
