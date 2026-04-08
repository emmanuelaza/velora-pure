import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User as UserIcon, Phone, MapPin, Wallet, Check, Sparkles, Landmark, ArrowLeft, ArrowRight, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

// New UI Components
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
  'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

export default function Onboarding() {
  const { user } = useAuth();
  const { refetch } = useBusiness();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    city: '',
    state: 'Florida',
    zelle: '',
    venmo: '',
    cashapp: '',
    acceptsCash: true
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 3);

      const businessData = {
        owner_id: user.id,
        business_name: formData.businessName,
        owner_name: formData.ownerName,
        phone: formData.phone,
        city: formData.city,
        state: formData.state,
        zelle_info: formData.zelle,
        venmo_info: formData.venmo,
        cashapp_info: formData.cashapp,
        subscription_status: 'trialing',
      };

      let result;

      // Si ya existe un registro (creado por Google Login auto-create), actualizamos
      if (business?.id) {
        result = await supabase
          .from('businesses')
          .update(businessData)
          .eq('id', business.id)
          .select()
          .single();
      } else {
        // Si no existe, creamos (caso email login tradicional que se saltó el auto-create)
        result = await supabase
          .from('businesses')
          .insert({
            ...businessData,
            trial_ends_at: trialEndsAt.toISOString(),
          })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      await refetch();
      
      try {
        await supabase.functions.invoke('welcome-email', {
          body: { businessId: result.data.id }
        });
      } catch (emailErr) {
        console.error('Welcome email error:', emailErr);
      }
      toast.success('¡Configuración completada!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el negocio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-[var(--accent)]/30">
      {/* Background decoration */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[var(--accent)]/[0.05] rounded-full blur-[140px] animate-pulse duration-[12s]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[var(--success)]/[0.04] rounded-full blur-[140px] animate-pulse duration-[10s]" />
      
      <div className="w-full max-w-2xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* Logo and Progress Indicator */}
        <div className="flex flex-col items-center mb-12">
           <div className="mb-12 text-center space-y-3">
             <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 shadow-lg shadow-[var(--accent)]/5">
                <Zap className="w-3.5 h-3.5 text-[var(--accent-light)]" />
                <span className="text-[10px] font-black text-[var(--accent-light)] uppercase tracking-[0.3em]">Instalación Guiada</span>
             </div>
             <h1 className="text-4xl font-black tracking-tighter text-[var(--text-primary)]">Velora <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-light)] to-[var(--accent)]">Pure</span></h1>
           </div>

           <div className="flex items-center gap-6 w-full px-8">
             {[1, 2, 3].map((s) => (
               <div key={s} className="flex-1 flex flex-col gap-3 group">
                  <div className={cn(
                    "h-1.5 rounded-full transition-all duration-700 ease-out",
                    step === s ? "bg-[var(--accent)] shadow-[0_0_15px_rgba(139,92,246,0.3)]" : 
                    step > s ? "bg-[var(--accent-light)]" : "bg-[var(--bg-secondary)] border border-[var(--border)]"
                  )} />
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] text-center transition-all duration-300",
                    step === s ? "text-[var(--text-primary)] scale-105" : 
                    step > s ? "text-[var(--accent-light)]" : "text-[var(--text-muted)]"
                  )}>
                    {s === 1 ? 'Negocio' : s === 2 ? 'Finanzas' : 'Victoria'}
                  </span>
               </div>
             ))}
           </div>
        </div>

        {/* Wizard Card Container */}
        <div className="min-h-[480px]">
          {step === 1 && (
            <Card variant="elevated" padding="none" className="border-[var(--border)] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="p-10 space-y-10">
                <div className="space-y-1.5 text-center">
                  <h2 className="text-2xl font-black tracking-tight">Tu Identidad Operativa</h2>
                  <p className="text-[var(--text-secondary)] text-sm font-medium opacity-80">Configura la base de tu imperio de servicios</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Input
                    label="Nombre de la Empresa"
                    placeholder="Ej: Crystal Clean Services"
                    icon={Building2}
                    value={formData.businessName}
                    onChange={e => setFormData({...formData, businessName: e.target.value})}
                    className="md:col-span-2 bg-[var(--bg-secondary)]/50"
                  />
                  
                  <Input
                    label="Representante Legal"
                    placeholder="Tu nombre completo"
                    icon={UserIcon}
                    value={formData.ownerName}
                    onChange={e => setFormData({...formData, ownerName: e.target.value})}
                    className="bg-[var(--bg-secondary)]/50"
                  />

                  <Input
                    label="WhatsApp de Negocio"
                    placeholder="+1 (000) 000-0000"
                    icon={Phone}
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="bg-[var(--bg-secondary)]/50"
                  />

                  <Input
                    label="Sede Principal (Ciudad)"
                    placeholder="Ej: Miami"
                    icon={MapPin}
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                    className="bg-[var(--bg-secondary)]/50"
                  />

                  <Select
                    label="Estado / Región"
                    icon={Landmark}
                    value={formData.state}
                    onChange={e => setFormData({...formData, state: e.target.value})}
                    className="bg-[var(--bg-secondary)]/50"
                  >
                    {US_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </Select>
                </div>
              </div>
            </Card>
          )}

          {step === 2 && (
            <Card variant="elevated" padding="none" className="border-[var(--border)] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-right-8 duration-700">
              <div className="p-10 space-y-10">
                <div className="space-y-1.5 text-center">
                  <h2 className="text-2xl font-black tracking-tight">Canales de Recaudación</h2>
                  <p className="text-[var(--text-secondary)] text-sm font-medium opacity-80">¿Cómo prefieres que tus clientes te paguen?</p>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Input 
                      label="Zelle Pay" 
                      placeholder="Email o Teléfono" 
                      icon={Wallet}
                      value={formData.zelle}
                      onChange={v => setFormData({...formData, zelle: v.target.value})}
                      className="bg-[var(--bg-secondary)]/50"
                    />
                    <Input 
                      label="Venmo ID" 
                      placeholder="@usuario" 
                      icon={Wallet}
                      value={formData.venmo}
                      onChange={v => setFormData({...formData, venmo: v.target.value})}
                      className="bg-[var(--bg-secondary)]/50"
                    />
                    <Input 
                      label="Cash App Tag" 
                      placeholder="$cashtag" 
                      icon={Wallet}
                      value={formData.cashapp}
                      onChange={v => setFormData({...formData, cashapp: v.target.value})}
                      className="bg-[var(--bg-secondary)]/50"
                    />
                    
                    <button 
                      type="button"
                      className={cn(
                        "flex items-center gap-5 p-6 rounded-2xl border-2 transition-all group relative overflow-hidden",
                        formData.acceptsCash ? "bg-[var(--success)]/5 border-[var(--success)] shadow-lg shadow-[var(--success)]/5" : "bg-[var(--bg-secondary)]/30 border-[var(--border)] hover:border-[var(--success)]/30"
                      )} 
                      onClick={() => setFormData({...formData, acceptsCash: !formData.acceptsCash})}
                    >
                      <div className={cn(
                        "w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all shrink-0",
                        formData.acceptsCash ? "bg-[var(--success)] border-[var(--success)]" : "border-[var(--border)] group-hover:border-[var(--success)]/50 bg-transparent"
                      )}>
                        {formData.acceptsCash && <Check className="w-5 h-5 text-black" strokeWidth={3} />}
                      </div>
                      <div className="text-left">
                        <span className="block font-black text-sm tracking-tight text-[var(--text-primary)]">Gestión de Efectivo</span>
                        <span className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-widest">Habilitar cobro manual</span>
                      </div>
                    </button>
                  </div>

                  <div className="p-5 bg-gradient-to-r from-[var(--accent-subtle)] to-transparent border border-[var(--accent)]/10 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-[-10px] right-[-10px] opacity-10 group-hover:rotate-12 transition-transform">
                       <Sparkles className="w-12 h-12 text-[var(--accent)]" />
                    </div>
                    <p className="text-[11px] text-[var(--accent-light)] leading-normal font-bold italic text-center relative z-10 px-4">
                      "Tus datos de pago se integrarán mágicamente en tus recordatorios de WhatsApp para facilitar la vida a tus clientes."
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {step === 3 && (
            <Card variant="elevated" padding="none" className="border-[var(--border)] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-700">
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-28 h-28 bg-[var(--success)]/10 rounded-[40px] flex items-center justify-center mb-10 border border-[var(--success)]/20 shadow-[0_20px_50px_rgba(52,211,153,0.1)] relative group">
                  <div className="absolute inset-[-4px] rounded-[44px] border border-[var(--success)]/10 animate-ping opacity-20" />
                  <Sparkles className="w-14 h-14 text-[var(--success)] group-hover:scale-110 transition-transform" />
                </div>
                
                <h2 className="text-4xl font-black mb-4 tracking-tighter text-[var(--text-primary)]">¡Misión Cumplida!</h2>
                <p className="text-[var(--text-secondary)] mb-12 max-w-sm mx-auto font-medium opacity-80 leading-relaxed italic">
                  Tu ecosistema digital está listo para despegar. Hemos forjado la estructura base para tu éxito operativo.
                </p>
                
                <div className="w-full bg-[var(--bg-secondary)]/50 p-8 rounded-3xl border border-[var(--border)] border-dashed text-left">
                  <div className="flex items-center gap-3 text-[var(--success)] mb-4">
                    <div className="p-1.5 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-lg">
                      <Check className="w-4 h-4" />
                    </div>
                    <span className="font-black uppercase tracking-[0.2em] text-xs">Sincronización Completada</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
                    Tienes acceso total al centro de mando. Para potenciar tu crecimiento con <span className="text-[var(--accent-light)] font-black">Inteligencia de Clientes</span> y <span className="text-[var(--accent-light)] font-black">Pagos One-Click</span>, activa tu licencia premium en el dashboard.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-6 mt-12 px-2">
          <div className="w-32">
            {step > 1 && step < 3 && (
              <button 
                onClick={prevStep}
                className="flex items-center gap-2.5 px-4 py-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] font-black text-[10px] uppercase tracking-[0.2em] transition-all group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Regresar
              </button>
            )}
          </div>
          
          <div className="flex-1 max-w-[280px]">
             {step < 3 ? (
               <Button 
                 onClick={nextStep}
                 disabled={step === 1 && (!formData.businessName || !formData.ownerName)}
                 size="lg"
                 className="w-full h-14 group shadow-2xl shadow-[var(--accent)]/15 font-black uppercase tracking-[0.2em] text-xs"
               >
                 <span>Continuar</span>
                 <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
               </Button>
             ) : (
               <Button 
                 onClick={handleComplete}
                 loading={loading}
                 size="lg"
                 className="w-full h-15 shadow-2xl shadow-[var(--success)]/20 bg-gradient-to-r from-[var(--success)] to-[#10B981] border-none text-black font-black uppercase tracking-[0.25em] text-xs"
               >
                 <span className="flex items-center gap-2">
                   Entrar al Portal <Sparkles className="w-4 h-4" />
                 </span>
               </Button>
             )}
          </div>
          <div className="w-32" />
        </div>
      </div>
    </div>
  );
}

