import { useState } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      <div className="md:hidden flex items-center justify-between bg-gray-900 text-white px-4 py-3 sticky top-0 z-20">
        <span className="text-lg font-semibold">Cash Flow</span>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          className="text-gray-200 hover:text-white text-xl leading-none px-2 py-1"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      <aside
        className={`${menuOpen ? 'flex' : 'hidden'} md:flex w-full md:w-56 md:shrink-0 bg-gray-900 text-gray-200 flex-col md:min-h-screen`}
      >
        <div className="hidden md:block px-4 py-4 text-lg font-semibold text-white">Cash Flow</div>
        <nav className="flex-1 overflow-y-auto max-h-[70vh] md:max-h-none">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMenuOpen(false)}
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

      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
