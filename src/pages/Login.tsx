import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
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
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-[var(--accent)]/30">
      {/* Abstract Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[var(--accent)]/[0.07] rounded-full blur-[140px] animate-pulse duration-[10s]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[var(--success)]/[0.05] rounded-full blur-[140px] animate-pulse duration-[8s]" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-[var(--accent-light)]/[0.05] rounded-full blur-[100px]" />
      
      <div className="w-full max-w-[460px] relative z-10">
        <div className="mb-12 flex flex-col items-center gap-6 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
          <LogoDisplay />
          <div className="space-y-2">
             <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 shadow-lg shadow-[var(--accent)]/5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent-light)]" />
                <span className="text-[10px] font-black text-[var(--accent-light)] uppercase tracking-[0.3em]">Velora Pure</span>
             </div>
             <p className="text-[var(--text-secondary)] text-sm font-medium italic opacity-70">Elevando el estándar en la gestión de limpieza</p>
          </div>
        </div>

        <Card variant="elevated" padding="none" className="border-[var(--border)] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in zoom-in-95 duration-700">
          <div className="h-1.5 w-full bg-gradient-to-r from-[var(--accent)] via-[var(--accent-light)] to-[var(--success)]" />
          
          <div className="p-10 space-y-8">
            <div className="space-y-1.5">
               <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">Bienvenido</h1>
               <p className="text-sm text-[var(--text-muted)] font-medium">Ingresa tus credenciales para acceder al centro de mando.</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <Input 
                label="Correo Electrónico"
                placeholder="tu@empresa.com"
                type="email"
                icon={Mail}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="bg-[var(--bg-secondary)]/50"
              />

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                   <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Contraseña</label>
                   <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[10px] font-black text-[var(--accent-light)] hover:text-[var(--accent)] uppercase tracking-widest transition-colors flex items-center gap-1.5"
                  >
                    {showPassword ? <ShieldCheck className="w-3 h-3" /> : null}
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <Input 
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  icon={Lock}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="bg-[var(--bg-secondary)]/50"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  loading={loading}
                  size="lg"
                  className="w-full h-14 shadow-2xl shadow-[var(--accent)]/20 font-black uppercase tracking-[0.2em] text-xs"
                >
                  Continuar
                  {!loading && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
                </Button>
              </div>
            </form>

            <div className="pt-8 border-t border-[var(--border)] border-dashed text-center">
              <button
                onClick={handleForgotPassword}
                className="text-[10px] font-black text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all uppercase tracking-[0.25em] py-2 px-4 rounded-xl border border-transparent hover:border-[var(--border)] hover:bg-[var(--bg-secondary)]"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>
        </Card>
        
        <div className="mt-12 flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity duration-500">
           <p className="text-center text-[var(--text-muted)] text-[10px] uppercase font-black tracking-[0.4em]">
            Pure Dashboard v2.0
          </p>
          <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
        </div>
      </div>
    </div>
  );
}

function LogoDisplay() {
  const [logoError, setLogoError] = useState(false);

  if (logoError) {
    return (
      <div className="w-24 h-24 bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-card)] rounded-[32px] flex items-center justify-center border border-[var(--border)] shadow-[inset_0_2px_10px_rgba(0,0,0,0.5),0_20px_40px_rgba(0,0,0,0.4)] relative group overflow-hidden">
         <div className="absolute inset-0 bg-[var(--accent)]/5 group-hover:bg-[var(--accent)]/10 transition-colors" />
         <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[var(--accent-light)] to-[var(--accent)] relative z-10">V</span>
      </div>
    );
  }

  return (
    <img 
      src="/logo.png" 
      alt="Velora Pure" 
      className="h-28 w-auto object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.6)] animate-pulse-slow"
      onError={() => setLogoError(true)}
    />
  );
}

