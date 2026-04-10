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
  Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { PAYMENT_METHODS } from '../lib/constants';

// UI Components
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';

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
    country: business?.country || 'US',
    zelle_info: business?.zelle_info || '',
    venmo_info: business?.venmo_info || '',
    cashapp_info: business?.cashapp_info || '',
    bizum_info: business?.bizum_info || '',
    bank_name: business?.bank_name || '',
    iban: business?.iban || ''
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
      toast.success('Configuración actualizada');
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
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Configuración"
        subtitle="Personaliza tu perfil operativo y métodos de pago"
      />

      <form onSubmit={handleUpdate} className="space-y-6">
        
        {/* Section: Business Info */}
        <Card padding="none" className="border-[var(--border)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-3">
            <div className="p-2 bg-[var(--accent-subtle)] rounded-lg">
              <Building2 className="w-4 h-4 text-[var(--accent)]" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">Información del negocio</h3>
              <p className="text-[13px] text-[var(--text-muted)]">Datos base para facturación y comunicaciones</p>
            </div>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
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
                label={business?.country === 'US' ? "Estado" : "Provincia"}
                icon={Globe}
                placeholder={business?.country === 'US' ? "FL" : "Madrid"}
                value={formData.state} 
                onChange={e => setFormData({...formData, state: e.target.value})} 
              />
            </div>
          </div>
        </Card>

        {/* Section: Payment Methods */}
        <Card padding="none" className="border-[var(--border)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-3">
            <div className="p-2 bg-[var(--success)]/10 rounded-lg">
              <Wallet className="w-4 h-4 text-[var(--success)]" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">Métodos de pago aceptados</h3>
              <p className="text-[13px] text-[var(--text-muted)]">Se incluyen en los recordatorios de cobro</p>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {(PAYMENT_METHODS[business?.country as keyof typeof PAYMENT_METHODS] || PAYMENT_METHODS.US).map((method) => (
              <Input 
                key={method.id}
                label={method.label} 
                placeholder={method.placeholder}
                value={(formData as any)[method.id]} 
                onChange={e => setFormData({...formData, [method.id]: e.target.value})} 
              />
            ))}
          </div>
        </Card>

        {/* Section: Account */}
        <Card padding="none" className="border-[var(--border)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-3">
            <div className="p-2 bg-[var(--bg-hover)] rounded-lg">
              <ShieldCheck className="w-4 h-4 text-[var(--text-muted)]" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">Cuenta y seguridad</h3>
              <p className="text-[13px] text-[var(--text-muted)]">Tu identidad de acceso</p>
            </div>
          </div>
          
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)]">
                <Mail className="w-4 h-4 text-[var(--text-muted)]" />
              </div>
              <div>
                <p className="text-[13px] text-[var(--text-muted)]">Email de acceso</p>
                <p className="text-[14px] font-medium text-[var(--text-primary)]">{user?.email}</p>
              </div>
            </div>
            <span className="text-[12px] text-[var(--text-muted)] bg-[var(--bg-secondary)] px-3 py-1 rounded-full border border-[var(--border)]">No editable</span>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          <button 
            type="button"
            onClick={handleSignOut}
            className="text-[14px] font-medium text-[var(--danger)] hover:underline flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
          <Button 
            type="submit" 
            loading={loading}
            className="min-w-[180px]"
          >
            <Save className="w-4 h-4" />
            Guardar cambios
          </Button>
        </div>
      </form>
    </div>
  );
}
