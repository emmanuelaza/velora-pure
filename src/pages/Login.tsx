import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Ingresa tu email y contraseña');
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
        // Verificar si existe el negocio
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
      toast.error(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Ingresa tu email para restablecer la contraseña');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      toast.success('Te enviamos un correo para restablecer tu contraseña');
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar la solicitud');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            {/* Si existe logo.png se muestra, si no el texto con V verde */}
            <LogoDisplay />
          </div>
          <p className="text-[var(--text-secondary)] text-sm">Empresas de limpieza latinas en EEUU</p>
        </div>

        {/* Login Card */}
        <div className="card p-8">
          <h1 className="text-2xl font-bold mb-6 text-center text-[var(--text-primary)]">Iniciar Sesión</h1>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-[var(--text-secondary)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field w-full pl-10"
                  placeholder="ejemplo@correo.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-[var(--text-secondary)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field w-full pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-[var(--text-secondary)] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Iniciar sesión'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={handleForgotPassword}
              className="text-sm text-[var(--accent)] hover:text-[var(--accent-light)] transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogoDisplay() {
  const [logoError, setLogoError] = useState(false);

  if (logoError) {
    return (
      <span className="text-3xl font-extrabold tracking-tight text-white">
        <span className="text-[var(--accent)]">V</span>elora Pure
      </span>
    );
  }

  return (
    <img 
      src="/logo.png" 
      alt="Velora Pure" 
      className="h-28 w-auto object-contain mb-2"
      onError={() => setLogoError(true)}
    />
  );
}
