import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { daysUntil, cn } from '../lib/utils';

export default function Billing() {
  const { business } = useBusiness();

  const trialDays = business?.trial_ends_at ? daysUntil(business.trial_ends_at) : 0;
  const isTrial = business?.subscription_status === 'trial';
  const isActive = business?.subscription_status === 'active';

  const stripePaymentUrl = "https://buy.stripe.com/test_placeholder"; // URL de ejemplo

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <header>
        <h1 className="text-3xl font-bold">Suscripción</h1>
        <p className="text-[#888888]">Gestiona tu plan y facturación de Velora Pure</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Current Plan Card */}
        <div className="card space-y-6 relative overflow-hidden">
          {isTrial && (
            <div className="absolute top-0 right-0 bg-[#FFB800] text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest">
              Prueba Gratis
            </div>
          )}
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#00C896]/10 rounded-2xl flex items-center justify-center border border-[#00C896]/20">
              <ShieldCheck className="w-6 h-6 text-[#00C896]" />
            </div>
            <div>
              <p className="text-sm text-[#888888]">Plan Actual</p>
              <h3 className="text-xl font-bold">Velora Pure Pro</h3>
            </div>
          </div>

          <div className="space-y-4 py-4 border-y border-[#2A2A2A]">
            <PlanFeature label="Clientes Ilimitados" />
            <PlanFeature label="Servicios Ilimitados" />
            <PlanFeature label="Recordatorios de WhatsApp" />
            <PlanFeature label="Gestión de Agenda" />
          </div>

          <div className="space-y-2">
            <p className="text-[#888888] text-sm">Estado del plan:</p>
            <div className="flex items-center gap-3">
              <span className={cn(
                "w-3 h-3 rounded-full shadow-[0_0_8px]",
                isActive ? "bg-[#00C896] shadow-[#00C896]" : "bg-[#FFB800] shadow-[#FFB800]"
              )} />
              <span className="font-bold text-lg">
                {isActive ? 'Activo' : 'Trial (14 días gratis)'}
              </span>
            </div>
          </div>

          {isTrial && (
            <div className="bg-[#FFB800]/10 border border-[#FFB800]/20 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#FFB800] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[#FFB800]">¡Tu prueba termina pronto!</p>
                <p className="text-xs text-[#888888] mt-1">Te quedan {trialDays} días. Activa tu plan para no perder el acceso a tus datos.</p>
              </div>
            </div>
          )}

          <a 
            href={stripePaymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full btn-primary flex items-center justify-center gap-2 group mt-4"
          >
            <CreditCard className="w-5 h-5" />
            <span>Activar Suscripción ($229/mes)</span>
            <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>

        {/* Billing Info Columns */}
        <div className="space-y-6">
          <section className="card space-y-4">
            <h3 className="font-bold border-b border-[#2A2A2A] pb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Próximo Pago
            </h3>
            <div className="p-4 bg-[#111] rounded-xl border border-[#2A2A2A]">
              <p className="text-sm text-[#888888]">Vence el:</p>
              <p className="text-xl font-bold text-white">
                {business?.trial_ends_at ? new Date(business.trial_ends_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '--'}
              </p>
            </div>
          </section>

          <section className="card space-y-4 grayscale opacity-50 cursor-not-allowed">
            <h3 className="font-bold border-b border-[#2A2A2A] pb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Historial de Facturas
            </h3>
            <div className="py-8 text-center text-sm text-[#888888]">
              No hay facturas disponibles aún.
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
