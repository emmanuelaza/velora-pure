import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  MessageCircle,
  Crown,
  Zap,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Infinity,
  CalendarDays,
  RefreshCw,
  Star,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { createPaddleCheckout, type PaddlePlan } from '../lib/paddle';
import { toast } from 'react-hot-toast';

// ─── Plan badge map ──────────────────────────────────────────────────────────
const PLAN_BADGE: Record<string, { label: string; className: string }> = {
  monthly:  { label: 'Mensual',  className: 'bg-blue-50 text-blue-700 border-blue-100' },
  yearly:   { label: 'Anual',    className: 'bg-violet-50 text-violet-700 border-violet-100' },
  lifetime: { label: 'Lifetime', className: 'bg-amber-50 text-amber-700 border-amber-200' },
};

// ─── Plan config ─────────────────────────────────────────────────────────────
interface PlanConfig {
  id: PaddlePlan;
  name: string;
  price: number;
  period: string;
  periodShort: string;
  badge?: string;
  highlight?: boolean;
  icon: React.ReactNode;
  color: string;         // tailwind-like CSS var token
  accentBg: string;
  perks: string[];
}

const PLANS: PlanConfig[] = [
  {
    id: 'monthly',
    name: 'Plan Mensual',
    price: 59,
    period: '/mes',
    periodShort: 'mes',
    icon: <CalendarDays className="w-5 h-5" />,
    color: 'var(--accent)',
    accentBg: 'rgba(var(--accent-rgb), 0.08)',
    perks: [
      'Acceso completo a todas las funciones',
      'Dashboard financiero en tiempo real',
      'Cotizaciones con IA',
      'Gestión de clientes ilimitados',
      'Soporte por WhatsApp',
      'Cancela cuando quieras',
    ],
  },
  {
    id: 'yearly',
    name: 'Plan Anual',
    price: 497,
    period: '/año',
    periodShort: 'año',
    badge: '🔥 Más popular',
    highlight: true,
    icon: <RefreshCw className="w-5 h-5" />,
    color: '#7c3aed',
    accentBg: 'rgba(124, 58, 237, 0.08)',
    perks: [
      'Todo lo del plan Mensual',
      '30% de ahorro vs mensual',
      'Acceso 12 meses completos',
      'Dashboard financiero en tiempo real',
      'Cotizaciones con IA ilimitadas',
      'Prioridad en soporte',
    ],
  },
  {
    id: 'lifetime',
    name: 'Pago Único',
    price: 347,
    period: ' de por vida',
    periodShort: 'único',
    badge: '✦ Mejor valor',
    icon: <Infinity className="w-5 h-5" />,
    color: '#d97706',
    accentBg: 'rgba(217, 119, 6, 0.08)',
    perks: [
      'Acceso de por vida sin renovaciones',
      'Todas las funciones actuales y futuras',
      'Sin pagos recurrentes jamás',
      'Dashboard financiero en tiempo real',
      'Cotizaciones con IA ilimitadas',
      'Soporte prioritario de por vida',
    ],
  },
];

const FEATURES_ALL = [
  'Dashboard con resumen financiero en tiempo real',
  'Gestión de clientes ilimitados',
  'Catálogo de servicios personalizados',
  'Cotizaciones con inteligencia artificial',
  'Control de cobros con recordatorios por WhatsApp',
  'Agenda semanal con asignación de empleados',
  'Control de empleados y nómina',
  'Paquetes de servicio profesionales',
  'Reportes financieros mensuales en PDF',
  'Configuración completa del negocio',
  'Soporte directo por WhatsApp con Emmanuel',
  'Configuración incluida en videollamada',
];

export default function Billing() {
  const { business, refetch: refetchBusiness } = useBusiness();
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<PaddlePlan | null>(null);

  const isActive = business?.subscription_status === 'active' || business?.lifetime === true;
  const currentPlan = business?.plan_type;
  const currentBadge = currentPlan ? PLAN_BADGE[currentPlan] : null;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast.success('¡Pago procesado! Tu acceso será activado en segundos 🎉');
      refetchBusiness();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refetchBusiness]);

  const handleBuy = async (plan: PaddlePlan) => {
    if (!user?.email || !business?.id) {
      toast.error('No se pudo iniciar el pago. Intenta de nuevo.');
      return;
    }
    setLoadingPlan(plan);
    try {
      const url = await createPaddleCheckout(plan, user.email, business.id);
      window.location.href = url;
    } catch (err) {
      console.error('Paddle checkout error:', err);
      toast.error('Error al generar el pago. Intenta de nuevo o contacta soporte.');
      setLoadingPlan(null);
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto py-10 px-6 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20">
          <Crown className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-[0.2em]">Planes de Velora Pure</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--text-primary)] leading-tight">
          Elige el plan que{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)]">
            se adapte a ti
          </span>
        </h1>
        <p className="text-[var(--text-secondary)] text-lg max-w-xl mx-auto font-medium">
          Sin complicaciones técnicas. Activa hoy y toma el control de tu negocio.
        </p>

        {/* Current plan badge */}
        {isActive && currentBadge && (
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold border ${currentBadge.className}`}>
            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            Plan actual: {currentBadge.label}
            {currentPlan === 'lifetime' && ' ✦'}
          </div>
        )}
      </div>

      {/* ── Pricing Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {PLANS.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          const isLoading = loadingPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={`
                relative flex flex-col rounded-3xl border transition-all duration-300
                ${plan.highlight
                  ? 'border-[2px] border-violet-400/60 shadow-[0_24px_48px_-12px_rgba(124,58,237,0.18)] scale-[1.02]'
                  : 'border-[var(--border)] shadow-sm hover:shadow-md hover:border-[var(--accent)]/30'
                }
                bg-white overflow-hidden
              `}
              style={{ '--plan-color': plan.color } as React.CSSProperties}
            >
              {/* Top color strip + badge */}
              <div
                className="h-1.5 w-full"
                style={{ background: plan.color }}
              />

              {plan.badge && (
                <div
                  className="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow"
                  style={{ background: plan.color }}
                >
                  {plan.badge}
                </div>
              )}

              <div className="p-8 flex flex-col gap-6 flex-1">
                {/* Plan name + icon */}
                <div className="space-y-1">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
                    style={{ background: plan.accentBg, color: plan.color }}
                  >
                    {plan.icon}
                  </div>
                  <h2 className="text-lg font-black text-[var(--text-primary)] tracking-tight">
                    {plan.name}
                  </h2>
                  <p className="text-[12px] text-[var(--text-muted)] font-medium">
                    {plan.id === 'lifetime' ? 'Un solo pago, acceso eterno' : 'Suscripción recurrente'}
                  </p>
                </div>

                {/* Price */}
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-black text-[var(--text-muted)] self-start mt-2">$</span>
                  <span
                    className="text-5xl font-black tracking-tighter leading-none"
                    style={{ color: plan.color }}
                  >
                    {plan.price}
                  </span>
                  <span className="text-sm font-bold text-[var(--text-muted)] mb-1">{plan.period}</span>
                </div>

                {/* Perks */}
                <ul className="space-y-3 flex-1">
                  {plan.perks.map((perk, i) => (
                    <li key={i} className="flex items-start gap-2.5 group">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: plan.accentBg }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: plan.color }} />
                      </div>
                      <span className="text-[13px] font-medium text-[var(--text-secondary)] leading-snug group-hover:text-[var(--text-primary)] transition-colors">
                        {perk}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-auto pt-4 space-y-2">
                  {isCurrentPlan ? (
                    <div
                      className="flex items-center justify-center gap-2 p-3.5 rounded-2xl text-sm font-bold border"
                      style={{
                        background: plan.accentBg,
                        color: plan.color,
                        borderColor: `${plan.color}30`,
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Tu plan actual
                    </div>
                  ) : isActive ? (
                    <div className="flex items-center justify-center gap-2 p-3.5 rounded-2xl text-sm font-medium text-[var(--text-muted)] border border-dashed border-[var(--border)]">
                      Ya tienes un plan activo
                    </div>
                  ) : (
                    <button
                      id={`btn-plan-${plan.id}`}
                      onClick={() => handleBuy(plan.id)}
                      disabled={!!loadingPlan}
                      className="w-full h-12 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all duration-300 hover:opacity-90 hover:scale-[1.02] active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg group"
                      style={{
                        background: plan.color,
                        boxShadow: `0 8px 24px -6px ${plan.color}50`,
                      }}
                    >
                      {isLoading ? (
                        <>
                          <Zap className="w-4 h-4 animate-pulse" />
                          Procesando…
                        </>
                      ) : (
                        <>
                          {plan.id === 'lifetime' ? <Star className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                          {plan.id === 'lifetime' ? 'Obtener acceso de por vida' : `Suscribirme ${plan.periodShort === 'mes' ? 'mensualmente' : 'anualmente'}`}
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </button>
                  )}

                  <p className="text-[10px] text-[var(--text-muted)] text-center font-medium">
                    {plan.id === 'lifetime'
                      ? 'Un solo pago · Sin renovaciones · Para siempre'
                      : 'Procesado de forma segura por Paddle · Cancela cuando quieras'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── What's included ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[var(--text-muted)] flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-[var(--accent-light)]" />
            Todos los planes incluyen
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
            {FEATURES_ALL.map((feature, i) => (
              <div key={i} className="flex items-start gap-3 group">
                <div className="mt-0.5 p-0.5 rounded-full bg-[var(--success)]/10 text-[var(--success)] group-hover:bg-[var(--success)] group-hover:text-black transition-all">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-[14px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors leading-snug">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-6 bg-[var(--bg-secondary)]/30 rounded-3xl border border-[var(--border)] border-dashed">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--accent)]/10 rounded-2xl shrink-0">
                <ShieldCheck className="w-6 h-6 text-[var(--accent)]" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-[var(--text-primary)]">Garantía de Satisfacción 100%</p>
                <p className="text-xs text-[var(--text-muted)] font-medium italic">
                  "Mi meta es que Velora Pure sea la herramienta que transforme tu negocio por completo. Si no estás feliz, yo no estoy feliz." — Emmanuel
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl border border-[var(--border)] space-y-3">
            <p className="text-sm font-bold text-[var(--text-primary)]">Comparación de precios</p>
            <div className="space-y-2">
              <div className="flex justify-between text-[13px]">
                <span className="text-[var(--text-secondary)]">Mensual (1 año)</span>
                <span className="font-bold text-[var(--text-primary)]">$708/año</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-[var(--text-secondary)]">Plan Anual</span>
                <span className="font-bold text-violet-600">$497/año · <span className="text-green-600">ahorra $211</span></span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-[var(--text-secondary)]">Lifetime (para siempre)</span>
                <span className="font-bold text-amber-600">$347 único · <span className="text-green-600">ahorra todo lo demás</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer / Support ─────────────────────────────────────────────────  */}
      <div className="pt-8 border-t border-[var(--border)] text-center space-y-6">
        <p className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
          "Mi compromiso es que recuperes tu inversión multiplicada{' '}
          <span className="text-[var(--accent)]">gracias a la eficiencia</span>{' '}
          que Velora Pure traerá a tu vida."
        </p>
        <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-[0.1em]">
          ¿Tienes preguntas? Escríbele a Emmanuel
        </p>
        <a
          href="https://wa.me/573016315482"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 py-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-[#25D366]/20 hover:scale-105"
        >
          <MessageCircle className="w-5 h-5 fill-current" />
          Contactar por WhatsApp
        </a>
      </div>
    </div>
  );
}
