import { useBusiness } from '../context/BusinessContext';
import { useNavigate } from 'react-router-dom';
import { differenceInDays, parseISO } from 'date-fns';
import { AlertCircle, CheckCircle2, Crown, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

export function SubscriptionBanner() {
  const { business } = useBusiness();
  const navigate = useNavigate();

  if (!business) return null;

  const { subscription_status, trial_ends_at } = business;

  const isTrialActive = subscription_status === 'trialing' && trial_ends_at && new Date(trial_ends_at) > new Date();
  const isActive = subscription_status === 'active';
  const isExpired = !isActive && !isTrialActive;

  if (isActive) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-bold border border-emerald-100/80 w-fit mb-5 shadow-sm transform transition-all hover:scale-[1.02] cursor-default">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="tracking-wide uppercase">Plan activo</span>
      </div>
    );
  }

  if (isTrialActive) {
    const daysRemaining = Math.max(0, differenceInDays(parseISO(trial_ends_at!), new Date()));
    
    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_4px_20px_-4px_rgba(251,191,36,0.15)] animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
          <Crown size={80} />
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 shadow-inner">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-amber-900 font-bold text-[15px] tracking-tight">
              🎉 Prueba gratuita activa — te quedan <span className="text-orange-600">{daysRemaining}</span> {daysRemaining === 1 ? 'día' : 'días'}
            </p>
            <p className="text-amber-700/80 text-[13px] mt-0.5 font-medium">
              Disfruta de todas las funciones premium de Velora Pure.
            </p>
          </div>
        </div>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={() => navigate('/billing')}
          className="bg-amber-600 hover:bg-amber-700 text-white border-none shadow-[0_8px_16px_-4px_rgba(217,119,6,0.25)] hover:shadow-[0_12px_20px_-4px_rgba(217,119,6,0.35)] transition-all duration-300 px-6 py-2.5 rounded-xl shrink-0 group/btn"
        >
          Activar plan
          <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
        </Button>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/60 rounded-2xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_4px_20px_-4px_rgba(239,68,68,0.15)] animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
          <AlertCircle size={80} />
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0 shadow-inner">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-red-900 font-bold text-[15px] tracking-tight">
              Tu prueba ha expirado
            </p>
            <p className="text-red-700/80 text-[13px] mt-0.5 font-medium">
              Activa tu plan para seguir usando Velora y no perder acceso a tus datos.
            </p>
          </div>
        </div>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={() => navigate('/billing')}
          className="bg-red-600 hover:bg-red-700 text-white border-none shadow-[0_8px_16px_-4px_rgba(220,38,38,0.25)] hover:shadow-[0_12px_20px_-4px_rgba(220,38,38,0.35)] transition-all duration-300 px-6 py-2.5 rounded-xl shrink-0 group/btn"
        >
          Ver planes
          <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
        </Button>
      </div>
    );
  }

  return null;
}
