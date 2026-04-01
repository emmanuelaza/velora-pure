import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User as UserIcon, Phone, MapPin, Wallet, Check, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import toast from 'react-hot-toast';

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
    state: 'California',
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
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {/* Progress Header */}
        <div className="flex items-center justify-between mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[#2A2A2A] -z-10" />
          <div className="absolute top-1/2 left-0 h-0.5 bg-[#00C896] transition-all duration-300 -z-10" style={{ width: `${((step - 1) / 2) * 100}%` }} />
          
          {[1, 2, 3].map((s) => (
            <div 
              key={s}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                step >= s ? 'bg-[#00C896] text-black scale-110' : 'bg-[#1A1A1A] text-[#888888] border border-[#2A2A2A]'
              }`}
            >
              {step > s ? <Check className="w-6 h-6" /> : s}
            </div>
          ))}
        </div>

        {/* Wizard Card */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-8 shadow-2xl">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Tu Negocio</h2>
                <p className="text-[#888888]">Cuéntanos sobre tu empresa de limpieza</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#888888]">Nombre del Negocio *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3.5 w-5 h-5 text-[#888888]" />
                    <input
                      type="text"
                      className="input-field w-full pl-10"
                      placeholder="Ej: Crystal Clean Services"
                      value={formData.businessName}
                      onChange={e => setFormData({...formData, businessName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#888888]">Tu Nombre Completo *</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-[#888888]" />
                    <input
                      type="text"
                      className="input-field w-full pl-10"
                      placeholder="Ej: Emmanuel"
                      value={formData.ownerName}
                      onChange={e => setFormData({...formData, ownerName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#888888]">Teléfono</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 w-5 h-5 text-[#888888]" />
                      <input
                        type="tel"
                        className="input-field w-full pl-10"
                        placeholder="(XXX) XXX-XXXX"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#888888]">Ciudad</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-[#888888]" />
                      <input
                        type="text"
                        className="input-field w-full pl-10"
                        placeholder="Miami"
                        value={formData.city}
                        onChange={e => setFormData({...formData, city: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#888888]">Estado</label>
                  <select
                    className="input-field w-full"
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
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">¿Cómo reciben sus pagos?</h2>
                <p className="text-[#888888]">Esta información aparecerá en tus recordatorios</p>
              </div>

              <div className="space-y-4">
                <PaymentInput 
                  label="Zelle" 
                  placeholder="Número o email" 
                  value={formData.zelle}
                  onChange={v => setFormData({...formData, zelle: v})}
                />
                <PaymentInput 
                  label="Venmo" 
                  placeholder="Usuario (sin @)" 
                  value={formData.venmo}
                  onChange={v => setFormData({...formData, venmo: v})}
                />
                <PaymentInput 
                  label="CashApp" 
                  placeholder="Usuario (sin $)" 
                  value={formData.cashapp}
                  onChange={v => setFormData({...formData, cashapp: v})}
                />
                
                <label className="flex items-center gap-3 p-4 rounded-xl border border-[#2A2A2A] bg-[#111] cursor-pointer hover:border-[#00C896] transition-colors mt-6">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 bg-[#1A1A1A] border-[#2A2A2A] rounded checked:bg-[#00C896] accent-[#00C896]" 
                    checked={formData.acceptsCash}
                    onChange={e => setFormData({...formData, acceptsCash: e.target.checked})}
                  />
                  <div>
                    <span className="block font-medium">También acepto efectivo</span>
                    <span className="text-xs text-[#888888]">Los clientes podrán indicar que pagaron en cash</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-8 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-[#00C896]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#00C896]/20">
                <Sparkles className="w-10 h-10 text-[#00C896]" />
              </div>
              <h2 className="text-3xl font-bold mb-4">¡Todo listo, {formData.ownerName.split(' ')[0]}!</h2>
              <p className="text-[#888888] mb-8 max-w-sm mx-auto">
                Tu cuenta está configurada. Ahora puedes empezar a registrar tus clientes y controlar tus cobros.
              </p>
              
              <div className="bg-[#111] p-6 rounded-xl border border-[#2A2A2A] text-left mb-8">
                <div className="flex items-center gap-2 text-[#00C896] mb-2 font-semibold">
                  <Check className="w-5 h-5" />
                  <span>Configuración Completa</span>
                </div>
                <p className="text-sm text-[#888888]">
                  Tu cuenta ha sido creada exitosamente. Activa tu plan en la sección de suscripción para empezar a trabajar.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-4 mt-10">
            {step > 1 && step < 3 && (
              <button 
                onClick={prevStep}
                className="btn-primary border-[#2A2A2A] text-[#888888] hover:bg-[#2A2A2A] hover:text-[#F5F5F5] flex-1"
              >
                Atrás
              </button>
            )}
            
            {step < 3 ? (
              <button 
                onClick={nextStep}
                disabled={step === 1 && (!formData.businessName || !formData.ownerName)}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={handleComplete}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ir al dashboard'}
                {!loading && <ChevronRight className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentInput({ label, placeholder, value, onChange }: { label: string, placeholder: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[#888888]">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-3.5 flex items-center gap-2 opacity-50">
          <Wallet className="w-5 h-5" />
        </div>
        <input
          type="text"
          className="input-field w-full pl-10"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
