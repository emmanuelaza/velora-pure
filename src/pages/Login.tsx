import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// New UI Components
import { Card } from '../components/ui/Card';
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
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--accent)]/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--success)]/5 rounded-full blur-[120px]" />
      
      <div className="w-full max-w-[440px] relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          <LogoDisplay />
          <div className="space-y-1">
             <h2 className="text-sm font-bold text-[var(--accent-light)] uppercase tracking-[0.2em] flex items-center justify-center gap-2">
               <Sparkles className="w-3.5 h-3.5" />
               Velora Pure
             </h2>
             <p className="text-[var(--text-secondary)] text-sm">Gestiona tu negocio de limpieza con elegancia</p>
          </div>
        </div>

        <Card padding="lg" variant="elevated" className="border-[var(--border)-soft]/50 shadow-2xl shadow-black/60">
          <div className="mb-8">
             <h1 className="text-2xl font-bold text-[var(--text-primary)]">¡Bienvenido!</h1>
             <p className="text-sm text-[var(--text-muted)] mt-1">Ingresa tus datos para acceder</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <Input 
              label="Correo Electrónico"
              placeholder="nombre@empresa.com"
              type="email"
              icon={Mail}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />

            <div className="space-y-2">
              <Input 
                label="Contraseña"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <div className="flex justify-end pr-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] font-bold text-[var(--text-muted)] hover:text-[var(--accent-light)] uppercase tracking-wider transition-colors"
                >
                  {showPassword ? 'Ocultar Password' : 'Ver Password'}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 mt-4 shadow-xl shadow-[var(--accent)]/10"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar al Dashboard'}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-[var(--border)-soft] text-center">
            <button
              onClick={handleForgotPassword}
              className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all uppercase tracking-widest"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </Card>
        
        <p className="mt-10 text-center text-[var(--text-muted)] text-[11px] uppercase tracking-widest font-mono">
          © {new Date().getFullYear()} Velora Pure · All Rights Reserved
        </p>
      </div>
    </div>
  );
}

function LogoDisplay() {
  const [logoError, setLogoError] = useState(false);

  if (logoError) {
    return (
      <div className="w-20 h-20 bg-[var(--accent)]/10 rounded-[22px] flex items-center justify-center border border-[var(--accent)]/20 shadow-inner">
         <span className="text-4xl font-extrabold text-[var(--accent)]">V</span>
      </div>
    );
  }

  return (
    <img 
      src="/logo.png" 
      alt="Velora Pure" 
      className="h-24 w-auto object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
      onError={() => setLogoError(true)}
    />
  );
}

