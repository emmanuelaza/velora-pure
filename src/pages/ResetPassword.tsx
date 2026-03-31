import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

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
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4 text-center">
        <div className="card max-w-md w-full py-12">
          <div className="w-16 h-16 bg-[#00C896]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-[#00C896]" />
          </div>
          <h1 className="text-2xl font-bold mb-2">¡Contraseña Cambiada!</h1>
          <p className="text-[#888888] mb-8">Serás redirigido al login en unos segundos...</p>
          <button onClick={() => navigate('/login')} className="btn-primary w-full">Ir al Login ahora</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Nueva Contraseña</h1>
          <p className="text-[#888888] mt-2">Ingresa tu nueva clave de acceso</p>
        </div>

        <div className="card shadow-2xl">
          <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#888888]">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-[#888888]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input-field w-full pl-10 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-[#888888]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Restablecer Contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
