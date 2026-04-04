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
  Loader2,
  Mail,
  ChevronRight
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
      toast.success('Configuración guardada correctamente');
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
    <div className="space-y-8 max-w-5xl">
      <header>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Configuración</h1>
        <p className="text-[var(--text-secondary)] mt-1.5">Personaliza tu cuenta y métodos de cobro</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-3 space-y-2 sticky top-24">
          <button className="w-full flex items-center justify-between group px-4 py-3 bg-[var(--accent-subtle)] text-[var(--accent-light)] rounded-xl font-bold border border-[var(--accent)]/20 shadow-lg shadow-[var(--accent)]/5 transition-all">
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4" />
              <span className="text-sm">Perfil y Negocio</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-50" />
          </button>
          
          <button 
            onClick={() => navigate('/billing')}
            className="w-full flex items-center justify-between group px-4 py-3 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] rounded-xl transition-all"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-sm">Suscripción</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
          </button>

          <div className="pt-8 px-2">
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-xl transition-all font-bold text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </aside>

        {/* Form Content */}
        <div className="lg:col-span-9 space-y-8">
          <form onSubmit={handleUpdate} className="space-y-8">
            
            {/* Section: Business Profile */}
            <Card padding="lg" className="space-y-8 border-[var(--border-soft)]">
              <div className="flex items-center gap-3 border-b border-[var(--border)-soft] pb-6 px-1">
                <div className="p-2 bg-[var(--accent-subtle)] rounded-lg">
                   <Building2 className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Perfil del Negocio</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Nombre de la Empresa" 
                  icon={Building2}
                  value={formData.business_name} 
                  onChange={e => setFormData({...formData, business_name: e.target.value})} 
                />
                <Input 
                  label="Dueño / Administrador" 
                  icon={User}
                  value={formData.owner_name} 
                  onChange={e => setFormData({...formData, owner_name: e.target.value})} 
                />
                <Input 
                  label="WhatsApp de Negocio" 
                  icon={Phone}
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Ciudad" 
                    icon={MapPin}
                    value={formData.city} 
                    onChange={e => setFormData({...formData, city: e.target.value})} 
                  />
                   <Input 
                    label="Estado" 
                    value={formData.state} 
                    onChange={e => setFormData({...formData, state: e.target.value})} 
                  />
                </div>
              </div>
            </Card>

            {/* Section: Payment Hub */}
            <Card padding="lg" className="space-y-8 border-[var(--border-soft)]">
              <div className="flex items-center gap-3 border-b border-[var(--border)-soft] pb-6 px-1">
                <div className="p-2 bg-[var(--success)]/10 rounded-lg">
                   <Wallet className="w-5 h-5 text-[var(--success)]" />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-[var(--text-primary)]">Pasarelas de Cobro</h3>
                   <p className="text-xs text-[var(--text-muted)] mt-0.5">Visibles en tus recordatorios de WhatsApp</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input 
                  label="Zelle" 
                  placeholder="Email o Teléfono"
                  value={formData.zelle_info} 
                  onChange={e => setFormData({...formData, zelle_info: e.target.value})} 
                />
                <Input 
                  label="Venmo" 
                  placeholder="Usuario"
                  value={formData.venmo_info} 
                  onChange={e => setFormData({...formData, venmo_info: e.target.value})} 
                />
                <Input 
                  label="CashApp" 
                  placeholder="Usuario"
                  value={formData.cashapp_info} 
                  onChange={e => setFormData({...formData, cashapp_info: e.target.value})} 
                />
              </div>
            </Card>

            {/* Section: Account & Security */}
            <Card padding="lg" variant="subtle" className="bg-[var(--bg-card)]/30 border-[var(--border-soft)]">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[var(--bg-secondary)] rounded-2xl flex items-center justify-center border border-[var(--border)]">
                    <Mail className="w-6 h-6 text-[var(--text-muted)]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Email de Acceso</p>
                    <p className="text-sm font-bold text-[var(--text-secondary)]">{user?.email}</p>
                  </div>
                </div>
                <Badge variant="muted" className="bg-[var(--bg-secondary)] font-bold">Inmutable</Badge>
              </div>
            </Card>

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={loading}
                size="lg"
                className="w-full md:w-auto min-w-[200px] h-14 shadow-xl shadow-[var(--accent)]/10"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Guardar Cambios
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

