import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useBusiness } from './context/BusinessContext';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Services from './pages/Services';
import PendingPayments from './pages/PendingPayments';
import Schedule from './pages/Schedule';
import Settings from './pages/Settings';
import Billing from './pages/Billing';
import ResetPassword from './pages/ResetPassword';
import Layout from './components/Layout';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { business, loading: bizLoading } = useBusiness();

  const loading = authLoading || (user && bizLoading);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00C896] animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Onboarding Route */}
      <Route 
        path="/onboarding" 
        element={
          user ? (
            !business ? <Onboarding /> : <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />

      {/* Protected Routes Wrapper */}
      <Route 
        element={
          user ? (
            business ? <Layout /> : <Navigate to="/onboarding" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/services" element={<Services />} />
        <Route path="/pending" element={<PendingPayments />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/billing" element={<Billing />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
