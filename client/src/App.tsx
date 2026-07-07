import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Team from './pages/Team';
import Agents from './pages/Agents';
import Transporters from './pages/Transporters';
import PaymentTypes from './pages/PaymentTypes';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import ComingSoon from './pages/ComingSoon';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/files" element={<ComingSoon title="Files" />} />
            <Route path="/payments" element={<ComingSoon title="Payments" />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/transporters" element={<Transporters />} />
            <Route path="/payment-types" element={<PaymentTypes />} />
            <Route path="/process-templates" element={<ComingSoon title="Process Templates" />} />
            <Route path="/profit-transfers" element={<ComingSoon title="Profit Transfers" />} />
            <Route path="/reports/cautions-actual" element={<ComingSoon title="Caution Report" />} />
            <Route path="/settings" element={<ComingSoon title="Settings" />} />
            <Route path="/team" element={<Team />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
