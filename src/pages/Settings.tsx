import React, { useState } from 'react';
import { 
  User, 
  Building2, 
  Phone, 
  Wallet, 
  Save, 
  LogOut, 
  ShieldCheck, 
  MapPin,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, signOut } = useAuth();
  const { business, refetch } = useBusiness();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    business_name: business?.business_name || '',
    owner_name: business?.owner_name || '',
    phone: business?.phone || '',
    city: business?.city || '',
    state: business?.state || '',
    zelle_info: business?.zelle_info || '',
    venmo_info: business?.venmo_info || '',
    cashapp_info: business?.cashapp_info || ''
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('businesses')
        .update(formData)
        .eq('id', business.id);

      if (error) throw error;
      
      await refetch();
      toast.success('Configuración guardada');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <header>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-[#888888]">Gestiona tu perfil y métodos de pago</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Navigation Tabs (Simulated) */}
        <aside className="lg:col-span-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--accent-subtle)] text-[var(--accent-light)] rounded-lg font-bold border-l-2 border-[var(--accent)]">
            <Building2 className="w-5 h-5" />
            Perfil y Negocio
          </button>
          <button 
            onClick={() => navigate('/billing')}
            className="w-full flex items-center gap-3 px-4 py-3 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] rounded-lg transition-all"
          >
            <ShieldCheck className="w-5 h-5" />
            Suscripción y Plan
          </button>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-all mt-8"
          >
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </button>
        </aside>

        {/* Form Content */}
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleUpdate} className="space-y-6">
            {/* Business Info Section */}
            <section className="card space-y-6">
              <h3 className="section-title border-b border-[var(--border)] pb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Información del Negocio
              </h3>
              
              <div className="space-y-4">
                <InputGroup icon={Building2} label="Nombre del Negocio" value={formData.business_name} onChange={v => setFormData({...formData, business_name: v})} />
                <InputGroup icon={User} label="Nombre del Dueño" value={formData.owner_name} onChange={v => setFormData({...formData, owner_name: v})} />
                <div className="grid grid-cols-2 gap-4">
                  <InputGroup icon={Phone} label="Teléfono" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} />
                  <InputGroup icon={MapPin} label="Ciudad" value={formData.city} onChange={v => setFormData({...formData, city: v})} />
                </div>
              </div>
            </section>

            {/* Payments Section */}
            <section className="card space-y-6">
              <h3 className="section-title border-b border-[var(--border)] pb-4 flex items-center gap-2">
                <Wallet className="w-4 h-4" /> Métodos de Pago
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">Esta información se usará en los recordatorios que envíes a tus clientes.</p>
              
              <div className="space-y-4">
                <InputGroup icon={Wallet} label="Zelle (Email o Teléfono)" value={formData.zelle_info} onChange={v => setFormData({...formData, zelle_info: v})} />
                <InputGroup icon={Wallet} label="Venmo (Usuario sin @)" value={formData.venmo_info} onChange={v => setFormData({...formData, venmo_info: v})} />
                <InputGroup icon={Wallet} label="CashApp (Usuario sin $)" value={formData.cashapp_info} onChange={v => setFormData({...formData, cashapp_info: v})} />
              </div>
            </section>

            {/* Account Info */}
            <section className="card bg-[var(--bg-primary)] border-[var(--border)]">
              <h3 className="section-title mb-4">Información de Acceso</h3>
              <div className="p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)]">
                <p className="text-xs text-[var(--text-secondary)]">Correo Electrónico</p>
                <p className="font-medium text-[var(--text-primary)]">{user?.email}</p>
                <p className="text-[10px] text-[var(--text-secondary)] mt-2 italic">Velora Pure no permite cambiar el correo principal por seguridad.</p>
              </div>
            </section>

            <div className="sticky bottom-8 py-4 bg-[var(--bg-primary)]/80 backdrop-blur-md">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function InputGroup({ icon: Icon, label, value, onChange }: { icon: any, label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-[#888888] uppercase ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-3 top-3.5 text-[var(--text-secondary)] group-focus-within:text-[var(--accent)] transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        <input 
          type="text" 
          className="input-field w-full pl-10 h-10"
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
