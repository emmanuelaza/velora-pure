import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Sparkles } from 'lucide-react';

export function SubscriptionGuard({ children }: { children: ReactNode }) {
  const { business, loading: bizLoading } = useBusiness();
  const { loading: authLoading } = useAuth();
  const location = useLocation();

  if (authLoading || bizLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[var(--accent)]/10 border-t-[var(--accent)] rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-[var(--accent)] animate-pulse" />
          </div>
        </div>
        <div className="space-y-1 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--accent-light)]">Velora Pure</p>
          <p className="text-[var(--text-muted)] text-[10px] uppercase font-mono">Initializing Workspace...</p>
        </div>
      </div>
    );
  }

  // Status can be 'active' or 'trialing' with a future date
  const isActive = 
    business?.subscription_status === 'active' || 
    (business?.subscription_status === 'trialing' && business?.trial_ends_at && new Date(business.trial_ends_at).getTime() > Date.now());

  if (!isActive && !location.pathname.includes('/billing') && !location.pathname.includes('/packages')) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-[var(--danger)]/10 rounded-[32px] flex items-center justify-center mb-8 border border-[var(--danger)]/20 shadow-[0_0_50px_rgba(248,113,113,0.1)]">
          <AlertTriangle className="w-12 h-12 text-[var(--danger)]" />
        </div>
        <h2 className="text-3xl font-extrabold mb-3 tracking-tight">Acceso Restringido</h2>
        <p className="text-[var(--text-secondary)] max-w-sm mb-10 leading-relaxed">
          Tu suscripción ha finalizado o hemos detectado un problema con tu método de pago. 
          Reactiva tu plan para continuar operando.
        </p>
        <Navigate to="/billing" replace />
      </div>
    );
  }

  return <>{children}</>;
}

