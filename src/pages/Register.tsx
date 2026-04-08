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

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Error al conectar con Google');
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

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]"></div>
            </div>
            <div className="relative flex justify-center text-[12px] font-medium uppercase tracking-wider">
              <span className="bg-white px-4 text-[var(--text-muted)]">O continúa con</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border-2 border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-all font-semibold text-[14px] text-[var(--text-primary)]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </button>

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
