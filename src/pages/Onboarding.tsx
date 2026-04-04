import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User as UserIcon, Phone, MapPin, Wallet, Check, ChevronRight, Sparkles, Loader2, Landmark } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

// New UI Components
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

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
      const { data: newBusiness, error } = await supabase.from('businesses').insert({
        owner_id: user.id,
        business_name: formData.businessName,
        owner_name: formData.ownerName,
        phone: formData.phone,
        city: formData.city,
        state: formData.state,
        zelle_info: formData.zelle,
        venmo_info: formData.venmo,
        cashapp_info: formData.cashapp,
        subscription_status: 'pending',
      }).select().single();

      if (error) throw error;

      await refetch();
      
      try {
        await supabase.functions.invoke('welcome-email', {
          body: { businessId: newBusiness.id }
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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[var(--accent)]/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[var(--success)]/5 rounded-full blur-[120px]" />
      
      <div className="w-full max-w-2xl relative z-10 animate-in fade-in duration-700">
        
        {/* Logo and Progress Indicator */}
        <div className="flex flex-col items-center mb-16">
           <div className="mb-10 text-center space-y-2">
             <div className="flex items-center justify-center gap-2 text-[var(--accent)] mb-2">
               <Sparkles className="w-6 h-6" />
               <span className="font-bold uppercase tracking-[0.4em] text-[10px]">Setup Wizard</span>
             </div>
             <h1 className="text-4xl font-extrabold tracking-tight">Velora <span className="text-[var(--accent)]">Pure</span></h1>
           </div>

           <div className="flex items-center gap-4 w-full px-12">
             {[1, 2, 3].map((s) => (
               <div key={s} className="flex-1 flex flex-col gap-3">
                  <div className={cn(
                    "h-1.5 rounded-full transition-all duration-500",
                    step >= s ? "bg-[var(--accent)]" : "bg-[var(--bg-secondary)]"
                  )} />
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest text-center transition-colors",
                    step >= s ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                  )}>
                    {s === 1 ? 'Negocio' : s === 2 ? 'Pagos' : 'Finalizar'}
                  </span>
               </div>
             ))}
           </div>
        </div>

        {/* Wizard Card Container */}
        <div className="min-h-[460px]">
          {step === 1 && (
            <Card padding="lg" variant="elevated" className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Háblanos de tu Negocio</h2>
                <p className="text-[var(--text-secondary)] text-sm">Información básica para personalizar tu perfil</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Nombre de la Empresa"
                  placeholder="Ej: Crystal Clean Services"
                  icon={Building2}
                  value={formData.businessName}
                  onChange={e => setFormData({...formData, businessName: e.target.value})}
                  className="md:col-span-2"
                />
                
                <Input
                  label="Dueño / Admin"
                  placeholder="Tu nombre completo"
                  icon={UserIcon}
                  value={formData.ownerName}
                  onChange={e => setFormData({...formData, ownerName: e.target.value})}
                />

                <Input
                  label="WhatsApp de Negocio"
                  placeholder="(XXX) XXX-XXXX"
                  icon={Phone}
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />

                <Input
                  label="Ciudad de Operación"
                  placeholder="Ej: Miami"
                  icon={MapPin}
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                />

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider ml-1">Estado / Región</label>
                  <div className="relative group">
                    <div className="absolute left-3 top-3.5 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <select
                      className="input-field w-full pl-10 h-12 bg-[var(--bg-secondary)] border-[var(--border)] rounded-xl outline-none focus:border-[var(--accent)] transition-all appearance-none"
                      value={formData.state}
                      onChange={e => setFormData({...formData, state: e.target.value})}
                    >
                      {US_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {step === 2 && (
            <Card padding="lg" variant="elevated" className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Canales de Recaudación</h2>
                <p className="text-[var(--text-secondary)] text-sm">¿Dónde prefieres recibir tus pagos?</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input 
                    label="Zelle" 
                    placeholder="Email o Teléfono" 
                    icon={Wallet}
                    value={formData.zelle}
                    onChange={v => setFormData({...formData, zelle: v.target.value})}
                  />
                  <Input 
                    label="Venmo" 
                    placeholder="Usuario sin @" 
                    icon={Wallet}
                    value={formData.venmo}
                    onChange={v => setFormData({...formData, venmo: v.target.value})}
                  />
                  <Input 
                    label="CashApp" 
                    placeholder="Usuario sin $" 
                    icon={Wallet}
                    value={formData.cashapp}
                    onChange={v => setFormData({...formData, cashapp: v.target.value})}
                  />
                  
                  <div className="flex items-center gap-4 p-5 rounded-2xl border border-[var(--border)-soft] bg-[var(--bg-secondary)]/30 hover:border-[var(--success)]/30 transition-all cursor-pointer group" onClick={() => setFormData({...formData, acceptsCash: !formData.acceptsCash})}>
                    <div className={cn(
                      "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                      formData.acceptsCash ? "bg-[var(--success)] border-[var(--success)]" : "border-[var(--border)] group-hover:border-[var(--success)]/50"
                    )}>
                      {formData.acceptsCash && <Check className="w-4 h-4 text-black" />}
                    </div>
                    <div>
                      <span className="block font-bold text-sm">Acepto Efectivo</span>
                      <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-tighter">Habilita registro manual</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[var(--accent-subtle)] border border-[var(--accent)]/10 rounded-xl">
                  <p className="text-[11px] text-[var(--accent-light)] leading-relaxed italic text-center">
                    "Estos métodos aparecerán integrados en los recordatorios automáticos que envíes por WhatsApp."
                  </p>
                </div>
              </div>
            </Card>
          )}

          {step === 3 && (
            <Card padding="lg" variant="elevated" className="text-center py-12 animate-in zoom-in-95 duration-700 flex flex-col items-center">
              <div className="w-24 h-24 bg-[var(--success)]/10 rounded-[32px] flex items-center justify-center mb-8 border border-[var(--success)]/20 shadow-[0_0_50px_rgba(52,211,153,0.1)]">
                <Sparkles className="w-12 h-12 text-[var(--success)]" />
              </div>
              <h2 className="text-3xl font-extrabold mb-4 tracking-tight">¡Bienvenido, {formData.ownerName.split(' ')[0]}!</h2>
              <p className="text-[var(--text-secondary)] mb-10 max-w-sm mx-auto leading-relaxed">
                Tu plataforma está lista. Hemos configurado el núcleo de tu negocio para que empieces a crecer hoy mismo.
              </p>
              
              <div className="w-full bg-[var(--bg-secondary)]/50 p-6 rounded-2xl border border-[var(--border)-soft] text-left">
                <div className="flex items-center gap-3 text-[var(--success)] mb-3">
                  <Check className="w-5 h-5" />
                  <span className="font-bold uppercase tracking-wider text-xs">Empresa Registrada</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Para activar todas las funciones premium, incluyendo reportes avanzados y automatizaciones ilimitadas, 
                  visita la sección de facturación una vez que entres.
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-6 mt-12 px-2">
          {step > 1 && step < 3 ? (
            <button 
              onClick={prevStep}
              className="px-6 py-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold text-sm uppercase tracking-widest transition-colors"
            >
              Regresar
            </button>
          ) : <div />}
          
          <div className="min-w-[200px]">
             {step < 3 ? (
               <Button 
                 onClick={nextStep}
                 disabled={step === 1 && (!formData.businessName || !formData.ownerName)}
                 size="lg"
                 className="w-full h-14 group shadow-xl shadow-[var(--accent)]/10"
               >
                 <span>Siguiente</span>
                 <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
               </Button>
             ) : (
               <Button 
                 onClick={handleComplete}
                 disabled={loading}
                 size="lg"
                 className="w-full h-14 shadow-2xl shadow-[var(--success)]/10 bg-gradient-to-r from-[var(--success)] to-[#10B981] border-none text-black"
               >
                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                   <>
                     <span>Comenzar Ahora</span>
                     <ChevronRight className="w-5 h-5" />
                   </>
                 )}
               </Button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

