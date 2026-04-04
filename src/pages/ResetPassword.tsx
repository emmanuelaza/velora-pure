import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// New UI Components
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast.success('Contraseña actualizada correctamente');
      setTimeout(() => navigate('/login'), 3000);
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--success)]/[0.05] rounded-full blur-[120px]" />
        
        <Card variant="elevated" padding="none" className="max-w-[460px] w-full overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-700">
           <div className="h-1.5 w-full bg-[var(--success)]" />
           <div className="p-12 flex flex-col items-center gap-8">
            <div className="w-28 h-28 bg-[var(--success)]/10 rounded-[40px] flex items-center justify-center border border-[var(--success)]/20 shadow-[0_20px_50px_rgba(52,211,153,0.1)] relative group">
              <div className="absolute inset-[-4px] rounded-[44px] border border-[var(--success)]/10 animate-ping opacity-20" />
              <CheckCircle2 className="w-14 h-14 text-[var(--success)] group-hover:scale-110 transition-transform" />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">Acceso Restaurado</h1>
              <p className="text-[var(--text-secondary)] font-medium leading-relaxed italic opacity-80">Tu seguridad ha sido reforzada con éxito. Volvemos al centro de mando en segundos.</p>
            </div>
            <Button onClick={() => navigate('/login')} size="lg" className="w-full h-14 mt-4 font-black uppercase tracking-[0.2em] text-xs">
              Ir al Inicio ahora
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-[var(--accent)]/30">
       {/* Background Decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[var(--accent)]/[0.07] rounded-full blur-[140px] animate-pulse duration-[10s]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[var(--accent-light)]/[0.03] rounded-full blur-[140px]" />
      
      <div className="w-full max-w-[460px] relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="mb-12 text-center space-y-3">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 shadow-lg shadow-[var(--accent)]/5">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-light)]" />
            <span className="text-[10px] font-black text-[var(--accent-light)] uppercase tracking-[0.3em]">Criptografía Velora</span>
          </div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">Nueva Clave</h1>
          <p className="text-[var(--text-secondary)] text-sm font-medium italic opacity-70">Restaura el acceso a tu bóveda de administración</p>
        </div>

        <Card variant="elevated" padding="none" className="border-[var(--border)] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)]" />
          
          <form onSubmit={handleReset} className="p-10 space-y-10">
            <div className="space-y-4 text-center">
               <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Reinicia tus Credenciales</h3>
               <p className="text-xs text-[var(--text-muted)] font-medium">Define una clave de alta seguridad con al menos 6 caracteres.</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                 <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Nueva Contraseña</label>
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
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-[var(--bg-secondary)]/50"
              />
            </div>

            <Button 
               type="submit" 
               loading={loading}
               size="lg"
               disabled={!password} 
               className="w-full h-14 shadow-2xl shadow-[var(--accent)]/20 font-black uppercase tracking-[0.2em] text-xs"
            >
              Actualizar y Entrar
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

