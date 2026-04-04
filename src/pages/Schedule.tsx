import { useEffect, useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Plus,
  Users,
  CalendarDays,
  LayoutGrid,
  List,
  CheckCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBusiness } from '../context/BusinessContext';
import { formatDate, cn } from '../lib/utils';
import toast from 'react-hot-toast';

// New UI Components
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
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
  status: 'pending' | 'completed' | 'canceled';
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
  const [scheduled, setScheduled] = useState<{ day: string, items: ScheduledService[] }[]>([]);
  const [activeEmployees, setActiveEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'week'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    client_id: '',
    service_type: 'Limpieza Regular',
    scheduled_date: new Date().toISOString().split('T')[0],
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

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Agenda</h1>
          <p className="text-[var(--text-secondary)] mt-1">Organiza los trabajos de las próximas semanas</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-[var(--bg-secondary)] p-1 rounded-[12px] border border-[var(--border)]">
            <button 
              onClick={() => setView('list')}
              className={cn(
                "px-4 py-2 rounded-[10px] text-sm font-semibold flex items-center gap-2 transition-all",
                view === 'list' 
                  ? "bg-[var(--accent)] text-white shadow-lg" 
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <List className="w-4 h-4" />
              Lista
            </button>
            <button 
              onClick={() => setView('week')}
              className={cn(
                "px-4 py-2 rounded-[10px] text-sm font-semibold flex items-center gap-2 transition-all",
                view === 'week' 
                  ? "bg-[var(--accent)] text-white shadow-lg" 
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Mosaico
            </button>
          </div>

          <Button 
            onClick={() => setIsModalOpen(true)}
            size="lg"
          >
            <Plus className="w-5 h-5" />
            Agendar Trabajo
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="space-y-12">
          {[1,2].map(i => (
            <div key={i} className="space-y-6">
              <div className="h-6 w-40 bg-[var(--bg-card)] rounded animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(j => <div key={j} className="h-44 bg-[var(--bg-card)] rounded-[20px] animate-pulse" />)}
              </div>
            </div>
          ))}
        </div>
      ) : scheduled.length === 0 ? (
        <EmptyState 
          icon={CalendarDays}
          title="Sin servicios programados"
          description="Usa el botón de Nuevo Servicio para agendar trabajos futuros."
          actionLabel="Agendar Trabajo"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="space-y-12">
          {scheduled.map(group => (
            <section key={group.day} className="space-y-6">
              <div className="flex items-center gap-3 px-1">
                <div className="p-2 bg-[var(--accent-subtle)] rounded-lg">
                  <Calendar className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  {formatDate(group.day)}
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.items.map(item => (
                  <Card 
                    key={item.id} 
                    padding="md"
                    className="group relative flex flex-col border-[var(--border)] hover:border-[var(--accent)]/40 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <Badge variant={item.status === 'completed' ? 'success' : 'warning'}>
                        {item.status === 'completed' ? 'Completado' : 'Pendiente'}
                      </Badge>
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                        {item.service_type || 'Limpieza'}
                      </span>
                    </div>

                    <div className="flex flex-col h-full space-y-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-[var(--text-primary)]">{item.clients?.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mt-2 font-medium">
                          <MapPin className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                          <span className="truncate">{item.clients?.address}</span>
                        </div>
                        
                        {item.employees && (
                          <div className="mt-4 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                              <Users className="w-3.5 h-3.5 text-[var(--accent)]" />
                            </div>
                            <span className="text-xs font-bold text-[var(--accent-light)]">{item.employees.name}</span>
                          </div>
                        )}
                      </div>

                      {item.status === 'pending' && (
                        <Button 
                          variant="secondary"
                          onClick={() => handleComplete(item)}
                          className="w-full h-11 border-[var(--success)]/20 hover:bg-[var(--success)]/5 text-[var(--success)]"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Marcar Completado
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Modal Agendar */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Agendar Nuevo Trabajo"
      >
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!business) return;
          try {
            const { error } = await supabase.from('scheduled_services').insert({
              business_id: business.id,
              client_id: formData.client_id,
              service_type: formData.service_type,
              scheduled_date: formData.scheduled_date,
              assigned_employee_id: formData.assigned_employee_id || null,
              status: 'pending'
            });
            if (error) throw error;
            toast.success('Servicio agendado');
            setIsModalOpen(false);
            fetchSchedule();
          } catch (error: any) {
            toast.error(error.message);
          }
        }} className="space-y-6">
          <Select 
            label="Cliente"
            required
            value={formData.client_id}
            onChange={e => setFormData({...formData, client_id: e.target.value})}
          >
            <option value="">Selecciona un cliente</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Fecha Programada"
              type="date" 
              required
              value={formData.scheduled_date}
              onChange={e => setFormData({...formData, scheduled_date: e.target.value})}
            />
            <Input 
              label="Tipo de Servicio"
              placeholder="Ej: Limpieza profunda"
              required
              value={formData.service_type}
              onChange={e => setFormData({...formData, service_type: e.target.value})}
            />
          </div>

          <Select 
            label="Empleado Asignado (Opcional)"
            value={formData.assigned_employee_id}
            onChange={e => setFormData({...formData, assigned_employee_id: e.target.value})}
          >
            <option value="">Sin asignar</option>
            {activeEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>

          <div className="flex gap-4 pt-4">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={!formData.client_id || !formData.scheduled_date}>
              Confirmar Agenda
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

