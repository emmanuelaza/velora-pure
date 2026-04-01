import { useEffect, useState } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  ShieldCheck,
  Calendar,
  Loader2,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { createCheckoutUrl } from '../lib/lemonsqueezy';
import { toast } from 'react-hot-toast';

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
      // Limpiar URL
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
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <header>
        <h1 className="text-3xl font-bold">Suscripción</h1>
        <p className="text-[#888888]">Gestiona tu plan y facturación de Velora Pure</p>
      </header>

      {isCanceled && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-top-4">
          <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h4 className="font-bold text-red-500">Tu acceso está suspendido</h4>
            <p className="text-sm text-[#888888]">Reactiva tu plan para continuar gestionando tu negocio.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Current Plan Card */}
        <div className="card space-y-6 relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#00C896]/10 rounded-2xl flex items-center justify-center border border-[#00C896]/20">
              <ShieldCheck className="w-6 h-6 text-[#00C896]" />
            </div>
            <div>
              <p className="text-sm text-[#888888]">Plan Actual</p>
              <h3 className="text-xl font-bold">Velora Pure</h3>
            </div>
          </div>

          <div className="space-y-4 py-4 border-y border-[#2A2A2A]">
            <PlanFeature label="Clientes ilimitados" />
            <PlanFeature label="Servicios ilimitados" />
            <PlanFeature label="Recordatorios por WhatsApp" />
            <PlanFeature label="Reportes PDF" />
            <PlanFeature label="Notificaciones por email" />
            <PlanFeature label="Soporte por WhatsApp" />
          </div>

          <div className="space-y-2">
            <p className="text-[#888888] text-sm">Estado del plan:</p>
            <div className="flex items-center gap-3">
              <span className={cn(
                "w-3 h-3 rounded-full shadow-[0_0_8px]",
                isActive ? "bg-[#00C896] shadow-[#00C896]" : 
                (isCanceled || isPastDue) ? "bg-red-500 shadow-red-500" :
                "bg-[#FFB800] shadow-[#FFB800]"
              )} />
              <span className="font-bold text-lg">
                {isActive ? 'Plan Activo' : isCanceled ? 'Cancelado' : 'Pendiente de activar'}
              </span>
            </div>
          </div>

          {!isActive ? (
            <button 
              onClick={handleActivatePlan}
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 group mt-4 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>{isCanceled ? 'Reactivar plan' : 'Activar mi plan — $229/mes'}</span>
                  <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
              )}
            </button>
          ) : (
            <a 
              href="https://app.lemonsqueezy.com/my-orders"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full btn-secondary flex items-center justify-center gap-2 mt-4"
            >
              <span>Gestionar suscripción</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Billing Info Columns */}
        <div className="space-y-6">
          <section className="card space-y-4">
            <h3 className="font-bold border-b border-[#2A2A2A] pb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Facturación
            </h3>
            <div className="p-4 bg-[#111] rounded-xl border border-[#2A2A2A]">
              <p className="text-sm text-[#888888]">Próximo cobro:</p>
              <p className="text-xl font-bold text-white">
                {isActive ? 'Gestionado por Lemon Squeezy' : '--'}
              </p>
            </div>
          </section>

          <section className="card space-y-4 opacity-50">
            <h3 className="font-bold border-b border-[#2A2A2A] pb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Seguridad
            </h3>
            <div className="py-4 text-sm text-[#888888]">
              Todas las facturas y pagos se gestionan a través de Lemon Squeezy para tu seguridad y cumplimiento.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function PlanFeature({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <CheckCircle2 className="w-4 h-4 text-[#00C896]" />
      <span className="text-sm text-[#F5F5F5]">{label}</span>
    </div>
  );
}
