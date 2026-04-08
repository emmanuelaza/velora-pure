import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Droplets, Eye, EyeOff, Building2, User as UserIcon, Phone, MapPin, Landmark } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
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

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    city: '',
    state: 'Florida',
    email: '',
    password: ''
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.businessName || !formData.ownerName) {
      toast.error('Por favor, completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      // 1. Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('No se pudo crear el usuario');

      // 2. Create the business record with automatic trial
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 3);

      const { error: bizError } = await supabase.from('businesses').insert({
        owner_id: authData.user.id,
        business_name: formData.businessName,
        owner_name: formData.ownerName,
        phone: formData.phone,
        city: formData.city,
        state: formData.state,
        subscription_status: 'trialing',
        trial_ends_at: trialEndsAt.toISOString(),
      });

      if (bizError) throw bizError;

      toast.success('¡Registro exitoso! Bienvenido a Velora Pure.');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #E0F2FE 0%, #F7F9FC 50%, #FFFFFF 100%)' }}
    >
      {/* Subtle decorative blobs */}
      <div className="absolute top-[-80px] left-[-80px] w-80 h-80 rounded-full opacity-40 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #BAE6FD 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-60px] right-[-60px] w-72 h-72 rounded-full opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #E0F2FE 0%, transparent 70%)' }} />

      <div className="w-full max-w-[500px] relative z-10 anim-fade-up py-10">
        {/* Card */}
        <div
          className="bg-white rounded-[24px] p-10"
          style={{ boxShadow: 'var(--shadow-xl)' }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--gradient-accent)' }}
            >
              <Droplets className="w-7 h-7 text-white" />
            </div>
            <h1
              className="text-[26px] font-bold tracking-tight"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'var(--text-primary)' }}
            >
              Crea tu cuenta
            </h1>
            <p
              className="text-[13px] mt-1 text-center"
              style={{ color: 'var(--text-muted)' }}
            >
              Comienza tu prueba gratuita de 3 días hoy mismo
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre del Negocio"
                placeholder="Ej: Crystal Clean"
                icon={Building2}
                value={formData.businessName}
                onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                required
                className="md:col-span-2"
              />
              <Input
                label="Nombre del Dueño"
                placeholder="Tu nombre"
                icon={UserIcon}
                value={formData.ownerName}
                onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                required
              />
              <Input
                label="Teléfono"
                placeholder="+1 (000) 000-0000"
                icon={Phone}
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                required
              />
              <Input
                label="Ciudad"
                placeholder="Ej: Miami"
                icon={MapPin}
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                required
              />
              <Select
                label="Estado"
                icon={Landmark}
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                required
              >
                {US_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </Select>
            </div>

            <div className="h-px bg-[var(--border)] my-2 opacity-50" />

            <Input
              label="Correo Electrónico"
              placeholder="tu@email.com"
              type="email"
              icon={Mail}
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <label className="block text-[13px] font-medium text-[var(--text-secondary)]">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="flex items-center gap-1.5 text-[12px] font-medium transition-colors text-[var(--accent)]"
                >
                  {showPassword ? <><EyeOff className="w-3.5 h-3.5" /> Ocultar</> : <><Eye className="w-3.5 h-3.5" /> Mostrar</>}
                </button>
              </div>
              <Input
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <Button
              type="submit"
              loading={loading}
              size="lg"
              className="w-full font-bold mt-2 shadow-lg shadow-[var(--accent)]/15"
            >
              Empezar mi trial gratis
            </Button>
          </form>

          <p className="text-center text-[13px] mt-8 text-[var(--text-muted)]">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="font-bold text-[var(--accent)] hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
