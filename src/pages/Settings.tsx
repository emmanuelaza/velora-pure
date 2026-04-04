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
  Mail,
  ChevronRight,
  Globe,
  Lock,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// New UI Components
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

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
      toast.success('Configuración actualizada correctamente');
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
    <div className="space-y-10 max-w-6xl animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="relative">
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-[var(--accent)] rounded-r-full blur-[2px] opacity-70" />
        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Configuración</h1>
        <p className="text-[var(--text-secondary)] mt-1.5 font-medium italic opacity-80">Personaliza tu perfil operativo y métodos de recaudo</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-3 space-y-3 sticky top-24">
          <button className="w-full flex items-center justify-between group px-5 py-4 bg-[var(--bg-secondary)] text-[var(--accent-light)] rounded-2xl font-bold border border-[var(--accent)]/30 shadow-[0_8px_32px_rgba(139,92,246,0.15)] transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
                <Building2 className="w-4 h-4 text-[var(--accent)]" />
              </div>
              <span className="text-sm">Perfil del Negocio</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-50" />
          </button>
          
          <button 
            onClick={() => navigate('/billing')}
            className="w-full flex items-center justify-between group px-5 py-4 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] rounded-2xl transition-all border border-transparent hover:border-[var(--border)]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] group-hover:border-[var(--accent)]/30 group-hover:text-[var(--accent)] transition-all">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold">Suscripción</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-all translate-x-[-10px] group-hover:translate-x-0" />
          </button>

          <div className="pt-10 px-1 border-t border-[var(--border)] border-dashed mt-6">
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-5 py-4 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-2xl transition-all font-black text-xs uppercase tracking-widest border border-transparent hover:border-[var(--danger)]/20"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </aside>

        {/* Form Content */}
        <div className="lg:col-span-9 space-y-10">
          <form onSubmit={handleUpdate} className="space-y-10">
            
            {/* Section: Business Profile */}
            <Card variant="elevated" padding="none" className="border-[var(--border)] overflow-hidden shadow-2xl">
              <div className="px-8 py-6 bg-gradient-to-r from-[var(--bg-secondary)]/50 to-transparent border-b border-[var(--border)] border-dashed flex items-center gap-4">
                 <div className="p-2.5 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-xl">
                    <Building2 className="w-5 h-5 text-[var(--accent)]" />
                 </div>
                 <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Identidad Corporativa</h3>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-[0.15em] mt-0.5">Información base de facturación</p>
                 </div>
              </div>
              
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <Input 
                  label="Nombre Comercial" 
                  icon={Building2}
                  placeholder="Ej: Velora Cleaning Co."
                  value={formData.business_name} 
                  onChange={e => setFormData({...formData, business_name: e.target.value})} 
                />
                <Input 
                  label="Representante Legal" 
                  icon={User}
                  placeholder="Nombre del propietario"
                  value={formData.owner_name} 
                  onChange={e => setFormData({...formData, owner_name: e.target.value})} 
                />
                <Input 
                  label="WhatsApp para Notificaciones" 
                  icon={Phone}
                  placeholder="+1 (000) 000-0000"
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Ciudad" 
                    icon={MapPin}
                    placeholder="Miami"
                    value={formData.city} 
                    onChange={e => setFormData({...formData, city: e.target.value})} 
                  />
                   <Input 
                    label="Estado" 
                    icon={Globe}
                    placeholder="FL"
                    value={formData.state} 
                    onChange={e => setFormData({...formData, state: e.target.value})} 
                  />
                </div>
              </div>
            </Card>

            {/* Section: Payment Hub */}
            <Card variant="elevated" padding="none" className="border-[var(--border)] overflow-hidden shadow-2xl">
              <div className="px-8 py-6 bg-gradient-to-r from-[var(--success)]/[0.03] to-transparent border-b border-[var(--border)] border-dashed flex items-center gap-4">
                <div className="p-2.5 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-xl">
                   <Wallet className="w-5 h-5 text-[var(--success)]" />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Canales de Recaudación</h3>
                   <p className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-[0.15em] mt-0.5">Visibles en recordatorios automáticos</p>
                </div>
              </div>
              
              <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                <Input 
                  label="Zelle Pay" 
                  placeholder="Email o Teléfono asociado"
                  value={formData.zelle_info} 
                  onChange={e => setFormData({...formData, zelle_info: e.target.value})} 
                />
                <Input 
                  label="Venmo User" 
                  placeholder="@usuario"
                  value={formData.venmo_info} 
                  onChange={e => setFormData({...formData, venmo_info: e.target.value})} 
                />
                <Input 
                  label="Cash App" 
                  placeholder="$Cashtag"
                  value={formData.cashapp_info} 
                  onChange={e => setFormData({...formData, cashapp_info: e.target.value})} 
                />
              </div>
            </Card>

            {/* Section: Account & Security */}
            <Card padding="none" variant="subtle" className="bg-[var(--bg-card)]/30 border-[var(--border)] border-dashed relative overflow-hidden group">
              <div className="absolute top-[-20px] right-[-20px] opacity-5 group-hover:opacity-10 transition-opacity">
                 <Lock className="w-32 h-32 text-[var(--text-muted)]" />
              </div>
              <div className="p-8 flex items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-[var(--bg-secondary)] rounded-2xl flex items-center justify-center border border-[var(--border)] shadow-inner">
                    <Mail className="w-7 h-7 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                       <ShieldCheck className="w-3.5 h-3.5" /> Cuenta de Acceso
                    </p>
                    <p className="text-base font-bold text-[var(--text-primary)] tracking-tight">{user?.email}</p>
                  </div>
                </div>
                <Badge variant="muted" className="bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest px-4 py-1.5">No Editable</Badge>
              </div>
            </Card>

            <div className="flex justify-end pt-6">
              <Button 
                type="submit" 
                loading={loading}
                size="lg"
                className="w-full md:w-auto min-w-[240px] h-14 shadow-2xl shadow-[var(--accent)]/20 font-black uppercase tracking-[0.15em] text-xs"
              >
                {!loading && <Save className="w-5 h-5" />}
                Actualizar Configuración
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

