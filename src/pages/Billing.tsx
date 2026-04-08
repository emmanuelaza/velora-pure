import { useEffect, useState } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  MessageCircle, 
  Crown,
  Zap,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Sparkles
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
  const isTrialing = business?.subscription_status === 'trialing';

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

  const features = [
    "Dashboard con resumen financiero en tiempo real",
    "Gestión de clientes ilimitados",
    "Catálogo de servicios personalizados",
    "Cotizaciones con inteligencia artificial",
    "Control de cobros con recordatorios por WhatsApp",
    "Agenda semanal con asignación de empleados",
    "Control de empleados y nómina",
    "Paquetes de servicio profesionales",
    "Reportes financieros mensuales en PDF",
    "Configuración completa del negocio",
    "Soporte directo por WhatsApp con Emmanuel",
    "Configuración incluida en videollamada"
  ];

  return (
    <div className="max-w-[1000px] mx-auto py-10 px-6 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 animate-bounce transition-all duration-1000">
          <Crown className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-[0.2em]">Acceso Premium</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--text-primary)] leading-tight">
          Activa tu plan y toma <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)]">control de tu negocio</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-lg max-w-xl mx-auto font-medium">
          Todo lo que necesitas para crecer, en un solo lugar. Sin complicaciones técnicas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start text-left">
        
        {/* Features List */}
        <div className="lg:col-span-7 space-y-8 order-2 lg:order-1">
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[var(--text-muted)] flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-[var(--accent-light)]" />
              ¿Qué incluye tu suscripción?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              {features.map((feature, i) => (
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

          <div className="p-6 bg-[var(--bg-secondary)]/30 rounded-3xl border border-[var(--border)] border-dashed">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--accent)]/10 rounded-2xl">
                <ShieldCheck className="w-6 h-6 text-[var(--accent)]" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-[var(--text-primary)]">Garantía de Satisfacción 100%</p>
                <p className="text-xs text-[var(--text-muted)] font-medium italic">"Mi meta es que Velora Pure sea la herramienta que transforme tu negocio por completo. Si no estás feliz, yo no estoy feliz." - Emmanuel</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="lg:col-span-5 order-1 lg:order-2 sticky top-24">
          <Card 
            variant="elevated" 
            padding="none" 
            className="overflow-hidden border-2 border-[var(--accent)]/30 shadow-[0_32px_64px_-16px_rgba(var(--accent-rgb),0.15)] bg-white"
          >
            <div className="bg-[var(--accent)] text-white p-6 text-center space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Plan Único Todo Incluido</p>
              <h2 className="text-xl font-black tracking-tight">Velora Platinum Suite</h2>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-2xl font-black text-[var(--text-muted)] self-start mt-2">$</span>
                  <span className="text-6xl font-black tracking-tighter text-[var(--text-primary)]">229</span>
                  <span className="text-xl font-bold text-[var(--text-muted)] self-end mb-2">/mes</span>
                </div>
                <p className="text-[10px] font-bold text-[var(--success)] uppercase tracking-widest bg-[var(--success)]/10 inline-block px-3 py-1 rounded-full">Precio Final • Todo Incluido</p>
              </div>

              <div className="space-y-4">
                {isActive ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 p-4 bg-[var(--success)]/10 text-[var(--success)] rounded-2xl border border-[var(--success)]/20">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-bold text-sm">Tu plan está activo</span>
                    </div>
                    <a 
                      href="https://app.lemonsqueezy.com/my-orders"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="secondary" size="lg" className="w-full">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Gestionar facturación
                      </Button>
                    </a>
                  </div>
                ) : (
                  <Button 
                    onClick={handleActivatePlan}
                    loading={loading}
                    size="lg"
                    className="w-full h-16 text-lg font-black shadow-2xl shadow-[var(--accent)]/30 group"
                  >
                    Activar plan ahora
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                )}
                
                <p className="text-[11px] text-[var(--text-muted)] text-center font-medium leading-relaxed">
                  Procesado de forma segura por <span className="text-[var(--text-primary)] font-bold">Lemon Squeezy</span>. <br />
                  Pagos encriptados de punto a punto.
                </p>
              </div>

              <div className="pt-6 border-t border-[var(--border)] border-dashed">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-[var(--warning)]" />
                    <span className="text-xs font-bold text-[var(--text-secondary)] tracking-tight">Activación instantánea</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-[var(--accent)]" />
                    <span className="text-xs font-bold text-[var(--text-secondary)] tracking-tight">Cancela en cualquier momento</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* Footer / Support Section */}
      <div className="pt-16 border-t border-[var(--border)] text-center space-y-10">
        <div className="max-w-2xl mx-auto space-y-4">
          <p className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
            "Mi compromiso es que recuperes tu inversión multiplicada <br className="hidden md:block" />
            gracias a la eficiencia que Velora Pure traerá a tu vida."
          </p>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-black uppercase tracking-[0.2em] text-[var(--accent)]">Sin contratos. Cancela cuando quieras.</span>
            <span className="text-xs text-[var(--text-muted)] font-medium">Flexibilidad total para tu negocio.</span>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-[0.1em]">¿Tienes preguntas? Escríbele a Emmanuel</p>
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

    </div>
  );
}
