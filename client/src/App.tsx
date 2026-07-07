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
import ProcessTemplates from './pages/ProcessTemplates';
import SettingsPage from './pages/Settings';
import Files from './pages/Files';
import FileNew from './pages/FileNew';
import FileDetail from './pages/FileDetail';
import Payments from './pages/Payments';
import CautionsReport from './pages/CautionsReport';
import ProfitTransfers from './pages/ProfitTransfers';

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
            <Route path="/files" element={<Files />} />
            <Route path="/files/new" element={<FileNew />} />
            <Route path="/files/:id" element={<FileDetail />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/transporters" element={<Transporters />} />
            <Route path="/payment-types" element={<PaymentTypes />} />
            <Route path="/process-templates" element={<ProcessTemplates />} />
            <Route path="/profit-transfers" element={<ProfitTransfers />} />
            <Route path="/reports/cautions-actual" element={<CautionsReport />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/team" element={<Team />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
