import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useBusiness } from './context/BusinessContext';
import Login from './pages/Login';
import Register from './pages/Register';
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
import Employees from './pages/Employees';
import Financials from './pages/Financials';
import Packages from './pages/Packages';
import Quotes from './pages/Quotes';
import Layout from './components/Layout';
import SubscriptionBlockingScreen from './components/SubscriptionBlockingScreen';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { business, loading: bizLoading } = useBusiness();
  const location = useLocation();

  const loading = authLoading || (user && bizLoading);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
      </div>
    );
  }

  // Subscription verification logic
  const isSubscriptionValid = () => {
    if (!business) return false;

    const { subscription_status, trial_ends_at } = business;
    
    // Status can be 'active' or 'trialing' with a future date
    const isActive = 
      subscription_status === 'active' || 
      (subscription_status === 'trialing' && trial_ends_at && new Date(trial_ends_at).getTime() > Date.now());

    return !!isActive;
  };

  const isAccessAllowed = isSubscriptionValid();
  const isBillingPage = location.pathname === '/billing';

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" replace />} />
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
            business ? (
              <>
                {(!isAccessAllowed && !isBillingPage) && <SubscriptionBlockingScreen />}
                <Layout />
              </>
            ) : (
              <Navigate to="/onboarding" replace />
            )
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
        <Route path="/employees" element={<Employees />} />
        <Route path="/financials" element={<Financials />} />
        <Route path="/packages" element={<Packages />} />
        <Route path="/quotes" element={<Quotes />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
