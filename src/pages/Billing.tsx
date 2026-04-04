import { useEffect, useState } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Calendar,
  Loader2,
  Zap,
  Lock
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { createCheckoutUrl } from '../lib/lemonsqueezy';
import { toast } from 'react-hot-toast';

// New UI Components
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function Billing() {
  const { business, refetch: refetchBusiness } = useBusiness();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const isActive = business?.subscription_status === 'active';
  const isCanceled = business?.subscription_status === 'canceled';
  const isPastDue = business?.subscription_status === 'past_due';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast.success('¡Plan activado! Bienvenido a Velora Pure 🎉');
      refetchBusiness();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refetchBusiness]);

  const handleActivatePlan = async () => {
    if (!user?.email || !business?.id) {
      toast.error('No se pudo iniciar el pago. Intenta de nuevo.');
      return;
    }

    setLoading(true);
    try {
      const url = await createCheckoutUrl(user.email, business.id);
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Error al generar el pago. Contacta a soporte.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 max-w-5xl">
      <header>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Suscripción y Plan</h1>
        <p className="text-[var(--text-secondary)] mt-1.5">Gestiona tu facturación y el nivel de acceso de tu negocio</p>
      </header>

      {isCanceled && (
        <Card variant="subtle" padding="md" className="bg-[var(--danger)]/5 border-[var(--danger)]/20 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-[var(--danger)]/10 rounded-full flex items-center justify-center">
               <AlertCircle className="w-6 h-6 text-[var(--danger)]" />
             </div>
             <div>
               <h4 className="font-bold text-[var(--danger)]">Tu acceso está suspendido</h4>
               <p className="text-sm text-[var(--text-secondary)]">Reactiva tu plan para continuar operando sin interrupciones.</p>
             </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:items-start">
        {/* Current Plan Card */}
        <Card padding="lg" variant="elevated" className="relative overflow-hidden group border-[var(--accent)]/20">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[var(--accent)]/5 rounded-full blur-3xl group-hover:bg-[var(--accent)]/10 transition-colors" />
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-[var(--accent-subtle)] rounded-2xl flex items-center justify-center border border-[var(--accent)]/20 shadow-inner">
              <Zap className="w-7 h-7 text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-widest mb-1">Plan Premium</p>
              <h3 className="text-2xl font-bold text-[var(--text-primary)]">Velora Pure</h3>
            </div>
          </div>

          <div className="space-y-4 py-8 border-y border-[var(--border)-soft]">
            <PlanFeature label="Clientes y Prospectos Ilimitados" />
            <PlanFeature label="Servicios y Agenda Ilimitada" />
            <PlanFeature label="Recordatorios Auto-WhatsApp" />
            <PlanFeature label="Reportes de Nómina PDF" />
            <PlanFeature label="Dashboard de Métricas Real-time" />
            <PlanFeature label="Soporta Prioritario 24/7" />
          </div>

          <div className="py-8 space-y-3">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">Estado de la suscripción</p>
            <div className="flex items-center gap-3 bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border)]">
              <div className={cn(
                "w-3 h-3 rounded-full animate-pulse",
                isActive ? "bg-[var(--success)] shadow-[0_0_12px_rgba(52,211,153,0.5)]" : 
                (isCanceled || isPastDue) ? "bg-[var(--danger)] shadow-[0_0_12px_rgba(248,113,113,0.5)]" :
                "bg-[var(--warning)] shadow-[0_0_12px_rgba(251,191,36,0.5)]"
              )} />
              <span className="font-bold text-[var(--text-primary)]">
                {isActive ? 'Suscripción Activa' : isCanceled ? 'Suscripción Cancelada' : 'Pendiente de Pago'}
              </span>
            </div>
          </div>

          {!isActive ? (
            <Button 
              onClick={handleActivatePlan}
              disabled={loading}
              size="lg"
              className="w-full h-14 text-sm font-bold shadow-[0_8px_30px_rgb(139,92,246,0.3)]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>{isCanceled ? 'Reactivar Suscripción' : 'Activar Plan — $229/mes'}</span>
                  <ExternalLink className="w-4 h-4 ml-1 opacity-60" />
                </>
              )}
            </Button>
          ) : (
            <a 
              href="https://app.lemonsqueezy.com/my-orders"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="secondary" size="lg" className="w-full h-14 border-[var(--border-soft)]">
                <span>Centro de Facturación</span>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          )}
        </Card>

        {/* Billing Info Columns */}
        <div className="space-y-6">
          <Card padding="md" variant="subtle" className="space-y-6 border-[var(--border-soft)]">
            <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2 text-sm uppercase tracking-widest px-1">
              <Calendar className="w-4 h-4 text-[var(--accent)]" /> Detalle de Ciclo
            </h3>
            <div className="p-5 bg-[var(--bg-secondary)]/50 rounded-2xl border border-[var(--border)]">
              <p className="text-[11px] font-bold text-[var(--text-secondary)] mb-2 uppercase">Próximo Cobro</p>
              <p className="text-2xl font-mono font-bold text-[var(--text-primary)]">
                {isActive ? 'Gestionado en portal' : 'Suscripción inactiva'}
              </p>
            </div>
            <div className="flex gap-4">
               <div className="flex-1 p-4 bg-[var(--bg-secondary)]/30 rounded-xl border border-[var(--border)]">
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Moneda</p>
                  <p className="text-sm font-bold text-[var(--text-secondary)]">USD / Mensual</p>
               </div>
               <div className="flex-1 p-4 bg-[var(--bg-secondary)]/30 rounded-xl border border-[var(--border)]">
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Impuestos</p>
                  <p className="text-sm font-bold text-[var(--text-secondary)]">Incluidos</p>
               </div>
            </div>
          </Card>

          <Card padding="md" variant="subtle" className="bg-[var(--bg-card)]/30 border-[var(--border-soft)]">
            <h3 className="font-bold text-[var(--text-secondary)] flex items-center gap-2 text-[11px] uppercase tracking-widest px-1 mb-4">
              <Lock className="w-4 h-4" /> Seguridad de Pago
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed px-1">
              Tus datos financieros nunca tocan nuestros servidores. Velora utiliza Lemon Squeezy (Merchant of Record) 
              para procesar pagos de forma segura cumpliendo con estándares PCI DSS globales.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PlanFeature({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3.5 group">
      <div className="w-5 h-5 rounded-full bg-[var(--success)]/10 flex items-center justify-center shrink-0 border border-[var(--success)]/20 animate-in zoom-in duration-300">
        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
      </div>
      <span className="text-sm text-[var(--text-secondary)] font-medium group-hover:text-[var(--text-primary)] transition-colors">{label}</span>
    </div>
  );
}

