import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
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
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 text-center">
        <Card padding="lg" variant="elevated" className="max-w-[440px] w-full py-16 flex flex-col items-center gap-8 shadow-2xl">
          <div className="w-24 h-24 bg-[var(--success)]/10 rounded-full flex items-center justify-center border border-[var(--success)]/20 shadow-[0_0_40px_rgba(52,211,153,0.1)]">
            <CheckCircle2 className="w-12 h-12 text-[var(--success)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">¡Contraseña Cambiada!</h1>
            <p className="text-[var(--text-secondary)] mt-2">Tu seguridad ha sido actualizada con éxito. Serás redirigido al login.</p>
          </div>
          <Button onClick={() => navigate('/login')} className="w-full h-14 mt-4">
            Volver al Inicio ahora
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 relative overflow-hidden">
       {/* Background Decoration */}
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-[var(--accent)]/5 rounded-full blur-[100px]" />
      
      <div className="w-full max-w-[440px] relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="mb-10 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-[var(--accent-light)] mb-4">
            <Sparkles className="w-5 h-5" />
            <span className="font-bold uppercase tracking-[0.3em] text-xs">Security System</span>
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Nueva Contraseña</h1>
          <p className="text-[var(--text-secondary)] text-sm">Define una clave segura para tu cuenta</p>
        </div>

        <Card padding="lg" variant="elevated" className="border-[var(--border)-soft]/50 shadow-2xl">
          <form onSubmit={handleReset} className="space-y-8">
            <div className="space-y-2">
              <Input 
                label="Nueva Contraseña"
                placeholder="Mínimo 6 caracteres"
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <div className="flex justify-end pr-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--accent-light)] uppercase tracking-widest transition-colors"
                >
                  {showPassword ? 'Ocultar' : 'Ver Contraseña'}
                </button>
              </div>
            </div>

            <Button 
               type="submit" 
               disabled={loading || !password} 
               className="w-full h-14 shadow-lg shadow-[var(--accent)]/10"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Actualizar y Entrar'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

