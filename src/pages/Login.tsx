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

          {/* Forgot password */}
          <div className="mt-8 text-center flex flex-col gap-3">
            <button
              onClick={handleForgotPassword}
              className="text-[13px] font-medium transition-colors hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              ¿Olvidaste tu contraseña?
            </button>
            <p className="text-[13px] text-[var(--text-muted)]">
              ¿No tienes una cuenta?{' '}
              <button
                onClick={() => navigate('/register')}
                className="font-bold text-[var(--accent)] hover:underline"
              >
                Regístrate
              </button>
            </p>
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
