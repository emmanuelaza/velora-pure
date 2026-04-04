import { useEffect, useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Plus,
  Users,
  CalendarDays,
  List,
  LayoutGrid,
  CheckCircle,
  Phone,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBusiness } from '../context/BusinessContext';
import { formatDate, formatTime, cn } from '../lib/utils';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// UI Components

import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/EmptyState';

interface Employee {
  id: string;
  name: string;
}

interface ScheduledService {
  id: string;
  client_id: string;
  service_type: string;
  scheduled_date: string;
  status: 'scheduled' | 'completed' | 'canceled';
  scheduled_time?: string | null;
  assigned_employee_id?: string;
  employees?: {
    name: string;
  };
  clients: {
    name: string;
    address: string;
    phone: string;
  };
}

export default function Schedule() {
  const { business } = useBusiness();
  const navigate = useNavigate();
  const [scheduled, setScheduled] = useState<{ day: string, items: ScheduledService[] }[]>([]);
  const [activeEmployees, setActiveEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'week'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    client_id: '',
    service_type: 'Limpieza Regular',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '',
    assigned_employee_id: ''
  });

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
        .select('*, clients(name, address, phone), employees(name)')
        .eq('business_id', business.id)
        .gte('scheduled_date', hoy)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      const { data: empData } = await supabase
        .from('employees')
        .select('id, name')
        .eq('business_id', business.id)
        .eq('is_active', true)
        .order('name');
      
      const { data: clientData } = await supabase
        .from('clients')
        .select('id, name')
        .eq('business_id', business.id)
        .eq('active', true)
        .order('name');

      setActiveEmployees(empData || []);
      setClients(clientData || []);

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
      const { error: serviceError } = await supabase.from('services').insert({
        business_id: business?.id,
        client_id: service.client_id,
        amount: 0,
        date: service.scheduled_date,
        status: 'pending',
        assigned_employee_id: service.assigned_employee_id || null,
        notes: `Completado desde agenda: ${service.service_type}`
      });

      if (serviceError) throw serviceError;

      const { error: scheduleError } = await supabase
        .from('scheduled_services')
        .update({ status: 'completed' })
        .eq('id', service.id);

      if (scheduleError) throw scheduleError;

      toast.success('Servicio completado y registrado');
      fetchSchedule();
    } catch (error) {
      toast.error('Error al completar servicio');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('scheduled_services').insert({
        business_id: business.id,
        client_id: formData.client_id,
        service_type: formData.service_type,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time || null,
        assigned_employee_id: formData.assigned_employee_id || null,
        status: 'scheduled'
      });
      if (error) throw error;
      toast.success('Servicio agendado');
      setIsModalOpen(false);
      setFormData({
        client_id: '',
        service_type: 'Limpieza Regular',
        scheduled_date: new Date().toISOString().split('T')[0],
        scheduled_time: '',
        assigned_employee_id: ''
      });
      fetchSchedule();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        subtitle="Servicios programados"
        actions={
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex bg-[var(--bg-secondary)] p-1 rounded-[var(--radius-md)] border border-[var(--border)]">
              <button 
                onClick={() => setView('list')}
                className={cn(
                  "p-2 rounded-lg transition-all duration-200",
                  view === 'list' 
                    ? "bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-soft)]" 
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                )}
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setView('week')}
                className={cn(
                  "p-2 rounded-lg transition-all duration-200",
                  view === 'week' 
                    ? "bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-soft)]" 
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4" />
              Programar visita
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="space-y-8">
          {[1,2].map(i => (
            <div key={i} className="space-y-4">
              <div className="h-5 w-40 bg-[var(--bg-card)] rounded-lg animate-pulse" />
              <div className="space-y-3">
                {[1,2].map(j => <div key={j} className="h-32 bg-[var(--bg-card)] rounded-[var(--radius-md)] animate-pulse" />)}
              </div>
            </div>
          ))}
        </div>
      ) : scheduled.length === 0 ? (
        <EmptyState 
          icon={CalendarDays}
          title="Sin servicios programados"
          description="Agenda trabajos futuros para mantenerte organizado."
          actionLabel="Programar visita"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="space-y-8">
          {scheduled.map(group => (
            <section key={group.day} className="space-y-3">
              {/* Day header */}
              <div className="flex items-center gap-3 px-1">
                <div className="p-2 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)]">
                  <Calendar className="w-4 h-4 text-[var(--accent)]" />
                </div>
                <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
                  {formatDate(group.day)}
                </h2>
                <div className="h-px flex-1 bg-[var(--border)] ml-2" />
                <span className="text-[12px] text-[var(--text-muted)]">{group.items.length} servicios</span>
              </div>
              
              {/* Service cards */}
              <div className={cn(
                "grid gap-3",
                view === 'week' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
              )}>
                {group.items.map(item => (
                  <div 
                    key={item.id} 
                    className="group rounded-[var(--radius-md)] border border-[var(--border)] hover:border-[var(--accent)]/20 bg-[var(--bg-card)] transition-all flex gap-4 p-4"
                  >
                      {/* Left: Time column */}
                      <div className="w-20 shrink-0 flex flex-col items-center justify-center border-r border-[var(--border)] pr-4">
                        <span className={cn(
                          "font-mono text-[13px] font-semibold text-center leading-none",
                          item.scheduled_time ? "text-[var(--accent-light)]" : "text-[var(--text-muted)]"
                        )}>
                          {item.scheduled_time ? formatTime(item.scheduled_time) : 'Sin hora'}
                        </span>
                      </div>

                      {/* Right: Existing content */}
                      <div className="flex-1 min-w-0">
                        {/* Top: status + type */}
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant={item.status === 'completed' ? 'success' : 'warning'} className="text-[11px]">
                            {item.status === 'completed' ? 'Completado' : item.status === 'canceled' ? 'Cancelado' : 'Programado'}
                          </Badge>
                          <span className="text-[12px] text-[var(--text-muted)]">{item.service_type || 'Limpieza'}</span>
                        </div>

                        {/* Client info */}
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="text-[15px] font-semibold text-[var(--text-primary)] truncate">{item.clients?.name}</h3>
                              <div className="flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)] mt-1">
                                <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                                <span className="truncate">{item.clients?.address}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => navigate(`/clients/${item.client_id}`)} 
                              className="p-2 rounded-lg bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {/* Footer: phone + employee */}
                          <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]/50">
                            <div className="flex items-center gap-1.5 text-[13px] text-[var(--text-muted)]">
                              <Phone className="w-3.5 h-3.5" />
                              <span>{item.clients?.phone}</span>
                            </div>
                            {item.employees && (
                              <div className="flex items-center gap-1.5 text-[12px] text-[var(--accent-light)]">
                                <Users className="w-3.5 h-3.5" />
                                <span className="font-medium">{item.employees.name}</span>
                              </div>
                            )}
                          </div>

                          {/* Action buttons */}
                          {item.status === 'scheduled' && (
                            <div className="flex gap-2 pt-2">
                              <Button 
                                size="sm"
                                onClick={() => handleComplete(item)}
                                className="flex-1 bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20 hover:bg-[var(--success)] hover:text-white shadow-none"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Completar
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Programar Visita"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Select 
            label="Cliente"
            required
            value={formData.client_id}
            onChange={e => setFormData({...formData, client_id: e.target.value})}
          >
            <option value="">Selecciona un cliente</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Fecha Programada"
              type="date" 
              required
              value={formData.scheduled_date}
              onChange={e => setFormData({...formData, scheduled_date: e.target.value})}
            />
            <Input 
              label="Hora (Opcional)"
              type="time" 
              value={formData.scheduled_time}
              onChange={e => setFormData({...formData, scheduled_time: e.target.value})}
            />
          </div>

          <Input 
            label="Tipo de Servicio"
            placeholder="Ej: Limpieza profunda"
            required
            value={formData.service_type}
            onChange={e => setFormData({...formData, service_type: e.target.value})}
          />

          <Select 
            label="Empleado Asignado (Opcional)"
            value={formData.assigned_employee_id}
            onChange={e => setFormData({...formData, assigned_employee_id: e.target.value})}
          >
            <option value="">Sin asignar</option>
            {activeEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>

          <div className="flex gap-3 pt-3">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" loading={isSubmitting} disabled={!formData.client_id || !formData.scheduled_date}>
              Confirmar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
