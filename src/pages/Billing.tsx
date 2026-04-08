import { useEffect, useState } from 'react';
import { 
  CreditCard, 
  AlertCircle, 
  ExternalLink,
  Calendar,
  Zap,
  Lock,
  ArrowRight,
  ShieldCheck,
  Activity,
  Infinity
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { createCheckoutUrl } from '../lib/lemonsqueezy';
import { toast } from 'react-hot-toast';

// New UI Components
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export default function Billing() {
  const { business, refetch: refetchBusiness } = useBusiness();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const isActive = business?.subscription_status === 'active' || business?.subscription_status === 'trialing';
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
    <div className="space-y-10 max-w-6xl animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="relative">
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-[var(--accent)] rounded-r-full blur-[2px] opacity-70" />
        <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">Suscripción y Plan</h1>
        <p className="text-[var(--text-secondary)] mt-1.5 font-medium italic opacity-80">Escala tu negocio con potencia ilimitada y automatización</p>
      </header>

      {isCanceled && (
        <Card variant="subtle" padding="none" className="bg-[var(--danger)]/5 border-[var(--danger)]/20 animate-in slide-in-from-top-4 overflow-hidden">
          <div className="p-6 flex items-center gap-5">
             <div className="w-12 h-12 bg-[var(--danger)]/10 rounded-2xl flex items-center justify-center border border-[var(--danger)]/20">
               <AlertCircle className="w-6 h-6 text-[var(--danger)]" />
             </div>
             <div>
               <h4 className="font-black text-[var(--danger)] uppercase tracking-widest text-xs">Acceso Suspendido</h4>
               <p className="text-sm text-[var(--text-secondary)] font-medium mt-1">Reactiva tu suscripción para recuperar todas las funciones operativas.</p>
             </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:items-start">
        {/* Current Plan Card */}
        <Card variant="elevated" padding="none" className="relative overflow-hidden group border-[var(--accent)]/20">
          <div className="h-1.5 w-full bg-gradient-to-r from-[var(--accent)] via-[var(--accent-light)] to-[var(--success)]" />
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-[var(--accent)]/[0.04] rounded-full blur-[80px] group-hover:bg-[var(--accent)]/[0.08] transition-all duration-700" />
          
          <div className="p-10 space-y-10 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-[var(--accent-subtle)] rounded-[24px] flex items-center justify-center border border-[var(--accent)]/20">
                <Zap className="w-8 h-8 text-[var(--accent)]" />
              </div>
              <div className="space-y-1">
                <Badge variant="success" className="bg-[var(--accent)]/10 text-[var(--accent-light)] border-none text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 mb-1">Platinum Suite</Badge>
                <h3 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">Velora Pure</h3>
              </div>
            </div>

            <div className="space-y-5 py-2">
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Funciones Desbloqueadas:</p>
              <div className="grid grid-cols-1 gap-4">
                <PlanFeature label="Clientes y Prospectos Ilimitados" icon={Infinity} />
                <PlanFeature label="Servicios y Agenda Centralizada" icon={Calendar} />
                <PlanFeature label="Recordatorios Auto-WhatsApp" icon={Activity} />
                <PlanFeature label="Gestión de Nómina e Informes" icon={ShieldCheck} />
                <PlanFeature label="Métricas de Rentabilidad Real-time" icon={Zap} />
              </div>
            </div>

            <div className="pt-8 border-t border-[var(--border)] border-dashed space-y-4">
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Estado de la suscripción</p>
              <div className="flex items-center justify-between bg-[var(--bg-secondary)]/50 p-5 rounded-2xl border border-[var(--border)] group/status">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    isActive ? "bg-[var(--success)] shadow-[0_0_15px_rgba(52,211,153,0.5)] animate-pulse" : 
                    (isCanceled || isPastDue) ? "bg-[var(--danger)] shadow-[0_0_15px_rgba(248,113,113,0.5)]" :
                    "bg-[var(--warning)] shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                  )} />
                  <span className="font-black text-[var(--text-primary)] text-sm tracking-tight">
                    {business?.subscription_status === 'active' ? 'Suscripción Activa' : 
                     business?.subscription_status === 'trialing' ? 'Periodo de Prueba (Activo)' :
                     isCanceled ? 'Suscripción Cancelada' : 'Pendiente de Pago'}
                  </span>
                </div>
                <Badge variant="muted" className="bg-[var(--bg-primary)] border-[var(--border)] font-black text-[9px] px-3 py-1 uppercase group-hover/status:text-[var(--text-primary)] transition-colors">V2.0</Badge>
              </div>
            </div>

            <div className="pt-2">
              {!isActive ? (
                <Button 
                  onClick={handleActivatePlan}
                  loading={loading}
                  size="lg"
                  className="w-full h-15 shadow-2xl shadow-[var(--accent)]/20 font-black uppercase tracking-[0.2em] text-xs"
                >
                  <CreditCard className="w-5 h-5 mr-3" />
                  {isCanceled ? 'Reactivar Suscripción' : 'Activar Plan — $229/mes'}
                  <ArrowRight className="w-4 h-4 ml-2 opacity-50 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <a 
                  href="https://app.lemonsqueezy.com/my-orders"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group/btn"
                >
                  <Button variant="secondary" size="lg" className="w-full h-15 border-[var(--border)] bg-transparent hover:bg-[var(--bg-secondary)] font-black uppercase tracking-[0.2em] text-xs">
                    <span>Portal de Facturación</span>
                    <ExternalLink className="w-4 h-4 ml-2 opacity-40 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        </Card>

        {/* Billing Info Columns */}
        <div className="space-y-8">
          <Card variant="elevated" padding="none" className="border-[var(--border)] overflow-hidden shadow-2xl">
            <div className="p-8 space-y-8">
              <h3 className="font-black text-[var(--text-primary)] flex items-center gap-3 text-xs uppercase tracking-[0.2em]">
                <div className="p-1.5 bg-[var(--accent)]/10 rounded-lg">
                  <Calendar className="w-4 h-4 text-[var(--accent)]" />
                </div>
                Ciclo de Facturación
              </h3>
              
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-inner">
                  <p className="text-[10px] font-black text-[var(--text-muted)] mb-3 uppercase tracking-[0.15em]">Siguiente Renovación</p>
                  <p className="text-2xl font-mono font-black text-[var(--text-primary)] tracking-tight">
                    {isActive ? 'Gestionado por Lemonsqueezy' : 'Suscripción Inactiva'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-5 bg-[var(--bg-secondary)]/30 rounded-2xl border border-[var(--border)] group/card hover:bg-[var(--bg-secondary)]/50 transition-colors">
                      <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-2 tracking-widest">Frecuencia</p>
                      <p className="text-sm font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Mensual (USD)</p>
                   </div>
                   <div className="p-5 bg-[var(--bg-secondary)]/30 rounded-2xl border border-[var(--border)] group/card hover:bg-[var(--bg-secondary)]/50 transition-colors">
                      <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-2 tracking-widest">Tributación</p>
                      <p className="text-sm font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Incluida (RoM)</p>
                   </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-[var(--bg-secondary)]/20 border-t border-[var(--border)] flex items-center justify-center gap-2">
               <ShieldCheck className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-50" />
               <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Facturación Segura HSH-256</p>
            </div>
          </Card>

          <Card padding="lg" variant="subtle" className="bg-[var(--bg-card)]/30 border-[var(--border)] border-dashed relative overflow-hidden group">
            <div className="absolute top-[-20px] right-[-20px] opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
               <Lock className="w-32 h-32 text-[var(--text-muted)]" />
            </div>
            <div className="relative z-10 space-y-4">
              <h3 className="font-black text-[var(--text-secondary)] flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] group-hover:text-[var(--text-primary)] transition-colors">
                <Lock className="w-4 h-4" /> Merchant of Record
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium transition-colors group-hover:text-[var(--text-secondary)]">
                Tus datos financieros viajan encriptados de punto a punto. Velora Pure utiliza <span className="text-[var(--accent-light)] font-bold">Lemon Squeezy</span> para procesar transacciones cumpliendo con los máximos estándares PCI DSS globales.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PlanFeature({ label, icon: Icon }: { label: string, icon: any }) {
  return (
    <div className="flex items-center gap-4 group/feature transition-all">
      <div className="w-10 h-10 rounded-2xl bg-[var(--success)]/[0.03] flex items-center justify-center shrink-0 border border-[var(--success)]/10 group-hover/feature:bg-[var(--success)]/10 group-hover/feature:border-[var(--success)]/30 group-hover/feature:scale-105 transition-all">
        <Icon className="w-4 h-4 text-[var(--success)] transition-transform group-hover/feature:rotate-12" />
      </div>
      <span className="text-sm text-[var(--text-secondary)] font-semibold group-hover/feature:text-[var(--text-primary)] transition-colors tracking-tight">{label}</span>
    </div>
  );
}

