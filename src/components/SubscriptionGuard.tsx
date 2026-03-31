import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertTriangle } from 'lucide-react';

export function SubscriptionGuard({ children }: { children: ReactNode }) {
  const { business, loading: bizLoading } = useBusiness();
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  if (authLoading || bizLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00C896] animate-spin" />
      </div>
    );
  }

  // Si no hay negocio (y no estamos en onboarding), redirigir
  if (user && !business && !location.pathname.includes('/onboarding')) {
    return <Navigate to="/onboarding" replace />;
  }

  // Si está cancelado o vencido (esto es simple por ahora)
  const isSuspended = business?.subscription_status === 'canceled' || business?.subscription_status === 'past_due';

  if (isSuspended && !location.pathname.includes('/billing')) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Tu acceso ha sido pausado</h2>
        <p className="text-[#888888] max-w-sm mb-8">
          Tu suscripción ha finalizado o hay un problema con tu pago. Por favor, actualiza tu plan para continuar.
        </p>
        <Navigate to="/billing" replace />
      </div>
    );
  }

  return <>{children}</>;
}
