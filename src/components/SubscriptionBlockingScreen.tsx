import { useNavigate } from 'react-router-dom';
import { ShieldAlert, CreditCard, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';

import { useBusiness } from '../context/BusinessContext';
import { Navigate } from 'react-router-dom';

export default function SubscriptionBlockingScreen() {
  const navigate = useNavigate();
  const { business } = useBusiness();

  // Safety check: if by some reason we get here and the plan is actually valid, we go back
  const isActive = business?.subscription_status === 'active' || 
    (business?.subscription_status === 'trialing' && business?.trial_ends_at && new Date(business.trial_ends_at).getTime() > Date.now());

  if (isActive) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-[var(--bg-primary)]">
      {/* Background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-[var(--danger)]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-[var(--accent)]/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[500px] relative z-10 animate-fade-up">
        <div className="bg-white rounded-[24px] border border-[var(--border)] p-10 text-center shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
          {/* Icon */}
          <div className="w-20 h-20 bg-[var(--danger-subtle)] rounded-full flex items-center justify-center mx-auto mb-8 relative">
            <div className="absolute inset-0 rounded-full animate-ping bg-[var(--danger)]/10" />
            <ShieldAlert className="w-10 h-10 text-[var(--danger)]" />
          </div>

          {/* Text Content */}
          <div className="space-y-4 mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Acceso Restringido
            </h1>
            <p className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
              Tu periodo de prueba ha finalizado o tu plan actual no está activo. Para continuar gestionando tu negocio con todas las herramientas premium de Velora Pure, por favor activa tu suscripción.
            </p>
          </div>

          {/* Features highlight */}
          <div className="grid grid-cols-2 gap-3 mb-10">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-left">
              <Sparkles className="w-4 h-4 text-[var(--accent)]" />
              <span className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Gestión AI</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-left">
              <CreditCard className="w-4 h-4 text-[var(--accent)]" />
              <span className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Pagos Rápidos</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Button
              size="lg"
              className="w-full font-bold shadow-lg shadow-[var(--accent)]/15"
              onClick={() => navigate('/billing')}
            >
              Ir a Facturación
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            
            <p className="text-[11px] text-[var(--text-muted)] font-medium">
              ¿Dudas sobre tu plan? Contacta con soporte@velorapure.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
