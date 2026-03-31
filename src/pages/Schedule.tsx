import { useEffect, useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  CalendarDays,
  List,
  LayoutGrid,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBusiness } from '../context/BusinessContext';
import { formatDate, cn } from '../lib/utils';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import toast from 'react-hot-toast';

interface ScheduledService {
  id: string;
  client_id: string;
  service_type: string;
  scheduled_date: string;
  status: 'pending' | 'completed' | 'canceled';
  clients: {
    name: string;
    address: string;
    phone: string;
  };
}

export default function Schedule() {
  const { business } = useBusiness();
  const [scheduled, setScheduled] = useState<{ day: string, items: ScheduledService[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'week'>('list');

  useEffect(() => {
    if (business) {
      fetchSchedule();
    }
  }, [business]);

  const fetchSchedule = async () => {
    if (!business) return;
    setLoading(true);
    try {
      const hoy = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('scheduled_services')
        .select('*, clients(name, address, phone)')
        .eq('business_id', business.id)
        .gte('scheduled_date', hoy)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      // Group by day
      const grouped: Record<string, ScheduledService[]> = {};
      (data || []).forEach((item: any) => {
        const day = item.scheduled_date;
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push(item);
      });

      const formatted = Object.keys(grouped).sort().map(day => ({
        day,
        items: grouped[day]
      }));

      setScheduled(formatted);
    } catch (error) {
      toast.error('Error al cargar la agenda');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (service: ScheduledService) => {
    try {
      // 1. Insertar en servicios reales (esto es una simplificación, en prod se pediría el monto)
      const { error: serviceError } = await supabase.from('services').insert({
        business_id: business?.id,
        client_id: service.client_id,
        amount: 0, // Se asume que el usuario luego ajustará el precio o hay uno base
        date: service.scheduled_date,
        status: 'pending', // Queda como pendiente de pago
        notes: `Completado desde agenda: ${service.service_type}`
      });

      if (serviceError) throw serviceError;

      // 2. Marcar como completado en agenda
      const { error: scheduleError } = await supabase
        .from('scheduled_services')
        .update({ status: 'completed' })
        .eq('id', service.id);

      if (scheduleError) throw scheduleError;

      toast.success('Servicio marcado como completado y registrado');
      fetchSchedule();
    } catch (error) {
      toast.error('Error al completar servicio');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-[#888888]">Organiza los trabajos de las próximas semanas</p>
        </div>
        
        <div className="flex bg-[var(--bg-primary)] p-1 rounded-lg border border-[var(--border)]">
          <button 
            onClick={() => setView('list')}
            className={cn("px-4 py-2 rounded-lg text-sm flex items-center gap-2", view === 'list' ? "bg-[var(--accent)] text-white shadow-[0_0_10px_rgba(139,92,246,0.2)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]")}
          >
            <List className="w-4 h-4" />
            Lista
          </button>
          <button 
            onClick={() => setView('week')}
            className={cn("px-4 py-2 rounded-lg text-sm flex items-center gap-2", view === 'week' ? "bg-[var(--accent)] text-white shadow-[0_0_10px_rgba(139,92,246,0.2)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]")}
          >
            <LayoutGrid className="w-4 h-4" />
            Semana
          </button>
        </div>
      </header>

      {loading ? (
        <div className="space-y-8">
          {[1,2].map(i => (
            <div key={i} className="space-y-4">
              <Skeleton className="w-32 h-6" />
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
            </div>
          ))}
        </div>
      ) : scheduled.length === 0 ? (
        <EmptyState 
          icon={CalendarDays}
          title="Sin servicios programados"
          description="Usa el botón de Nuevo Servicio para agendar trabajos futuros."
          actionLabel="Agendar Trabajo"
          onAction={() => {}} // Placeholder
        />
      ) : (
        <div className="space-y-10">
          {scheduled.map(group => (
            <section key={group.day} className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Calendar className="w-4 h-4 text-[var(--accent)]" />
                <h2 className="section-title mt-1">
                  {formatDate(group.day)}
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items.map(item => (
                  <div key={item.id} className="card group hover:border-[var(--accent)] transition-all relative overflow-hidden">
                    {item.status === 'completed' && (
                      <div className="absolute top-0 right-0 p-2 bg-[var(--success)]/10 text-[var(--success)]">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                    
                    <div className="flex flex-col h-full space-y-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">{item.service_type || 'Servicio de Limpieza'}</p>
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded-lg font-bold",
                            item.status === 'pending' ? "bg-[var(--warning)]/10 text-[var(--warning)]" : "bg-[var(--success)]/10 text-[var(--success)]"
                          )}>
                            {item.status === 'completed' ? 'Completado' : 'Pendiente'}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg text-[var(--text-primary)]">{item.clients?.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mt-2">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{item.clients?.address}</span>
                        </div>
                      </div>

                      {item.status === 'pending' && (
                        <button 
                          onClick={() => handleComplete(item)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[var(--success)]/50 text-sm font-bold text-[var(--success)] hover:bg-[var(--success)]/10 transition-all mt-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Completar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
