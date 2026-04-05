import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Droplets, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Por favor, ingresa tus credenciales');
      return;
    }

    setLoading(true);
    try {
      const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      if (user) {
        const { data: business, error: bizError } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', user.id)
          .single();

        if (bizError && bizError.code !== 'PGRST116') {
          throw bizError;
        }

        if (!business) {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al autenticar');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Escribe tu email para enviarte el enlace');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      toast.success('Se ha enviado un enlace a tu correo');
    } catch (error: any) {
      toast.error(error.message || 'Error en la solicitud');
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

      <div className="w-full max-w-[420px] relative z-10 anim-fade-up">
        {/* Card */}
        <div
          className="bg-white rounded-[20px] p-10"
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
              Velora Pure
            </h1>
            <p
              className="text-[13px] mt-1 text-center"
              style={{ color: 'var(--text-muted)' }}
            >
              Sistema de gestión para tu negocio de limpieza
            </p>
          </div>

          {/* Accent top bar - style element */}
          <div
            className="h-[3px] w-full rounded-full mb-8"
            style={{ background: 'var(--gradient-accent)' }}
          />

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label="Correo Electrónico"
              placeholder="tu@empresa.com"
              type="email"
              icon={Mail}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <label
                  className="block text-[13px] font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="flex items-center gap-1.5 text-[12px] font-medium transition-colors"
                  style={{ color: 'var(--accent)' }}
                >
                  {showPassword
                    ? <><EyeOff className="w-3.5 h-3.5" /> Ocultar</>
                    : <><Eye className="w-3.5 h-3.5" /> Mostrar</>
                  }
                </button>
              </div>
              <Input
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="pt-1">
              <Button
                type="submit"
                loading={loading}
                size="lg"
                className="w-full font-semibold"
                style={{
                  boxShadow: '0 4px 14px rgba(14, 165, 233, 0.25)',
                }}
              >
                Iniciar sesión
              </Button>
            </div>
          </form>

          {/* Forgot password */}
          <div className="mt-6 text-center">
            <button
              onClick={handleForgotPassword}
              className="text-[13px] font-medium transition-colors hover:underline"
              style={{ color: 'var(--text-muted)' }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Footer note */}
          <p
            className="text-center text-[11px] mt-6"
            style={{ color: 'var(--text-muted)' }}
          >
            Acceso solo para clientes de Velora Pure
          </p>
        </div>
      </div>
    </div>
  );
}
