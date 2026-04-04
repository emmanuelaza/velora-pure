import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Clock,
  CheckCircle2,
  Trash2,
  FileText,
  AlertTriangle,
  ClipboardList
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBusiness } from '../context/BusinessContext';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import toast from 'react-hot-toast';
import { generateMonthlyPDF } from '../lib/pdf';

// New UI Components
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';

interface Service {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending';
  notes?: string;
  client_id: string;
  clients: {
    name: string;
  };
  employees?: {
    name: string;
  };
}

interface Client {
  id: string;
  name: string;
  notes?: string;
}

interface Employee {
  id: string;
  name: string;
}

export default function Services() {
  const { business } = useBusiness();
  const location = useLocation();
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [activeEmployees, setActiveEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [search, setSearch] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    client_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending' as 'paid' | 'pending',
    assigned_employee_id: '',
    notes: ''
  });

  useEffect(() => {
    if (business) {
      fetchData();
    }
  }, [business, filter]);

  useEffect(() => {
    if (location.state?.clientId) {
      setFormData(prev => ({ ...prev, client_id: location.state.clientId }));
      setIsModalOpen(true);
    }
  }, [location.state]);

  const fetchData = async () => {
    if (!business) return;
    setLoading(true);
    try {
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, name, notes')
        .eq('business_id', business.id)
        .eq('active', true)
        .order('name');
      
      const { data: employeesData } = await supabase
        .from('employees')
        .select('id, name')
        .eq('business_id', business.id)
        .eq('is_active', true)
        .order('name');
      
      setClients(clientsData || []);
      setActiveEmployees(employeesData || []);

      let query = supabase
        .from('services')
        .select(`
          *,
          clients(name),
          employees(name)
        `)
        .eq('business_id', business.id)
        .order('date', { ascending: false });

      if (filter !== 'all') query = query.eq('status', filter);

      const { data, error } = await query.limit(50);
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      toast.error('Error al cargar servicios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    try {
      const { error } = await supabase.from('services').insert({
        business_id: business.id,
        client_id: formData.client_id,
        amount: Number(formData.amount),
        date: formData.date,
        status: formData.status,
        assigned_employee_id: formData.assigned_employee_id || null,
        notes: formData.notes
      });

      if (error) throw error;
      
      toast.success('Servicio registrado');
      setIsModalOpen(false);
      setFormData({
        client_id: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        assigned_employee_id: '',
        notes: ''
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleStatus = async (serviceId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    try {
      const { error } = await supabase.from('services').update({ status: newStatus }).eq('id', serviceId);
      if (error) throw error;
      setServices(services.map(s => s.id === serviceId ? { ...s, status: newStatus } : s));
      toast.success('Estado actualizado');
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;
    try {
      const { error } = await supabase.from('services').delete().eq('id', serviceToDelete);
      if (error) throw error;
      setServices(services.filter(s => s.id !== serviceToDelete));
      toast.success('Servicio eliminado');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const filteredServices = services.filter(s => 
    s.clients?.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    const success = await generateMonthlyPDF(business);
    if (success) toast.success('Reporte descargado correctamente');
    setIsGeneratingPdf(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Servicios</h1>
          <p className="text-[var(--text-secondary)] mt-1">Registro y control de trabajos realizados</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant="secondary"
            onClick={handleDownloadPDF}
            loading={isGeneratingPdf}
            className="h-11"
          >
            <FileText className="w-4 h-4" />
            Reporte PDF
          </Button>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="h-11"
          >
            <Plus className="w-5 h-5" />
            Registrar Trabajo
          </Button>
        </div>
      </header>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[var(--bg-secondary)] p-4 rounded-[16px] border border-[var(--border)]">
        <div className="w-full md:w-96">
          <Input 
            icon={Search}
            placeholder="Buscar por cliente..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex bg-[var(--bg-primary)] p-1 rounded-[12px] border border-[var(--border)]">
          <FilterButton label="Todos" active={filter === 'all'} onClick={() => setFilter('all')} />
          <FilterButton label="Pendientes" active={filter === 'pending'} onClick={() => setFilter('pending')} />
          <FilterButton label="Pagados" active={filter === 'paid'} onClick={() => setFilter('paid')} />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-[var(--bg-card)] rounded-xl animate-pulse" />)}
        </div>
      ) : filteredServices.length === 0 ? (
        <EmptyState 
          icon={ClipboardList}
          title="No hay servicios"
          description={search ? "No se encontraron resultados" : "Registra tu primer trabajo para comenzar el historial."}
        />
      ) : (
        <Card padding="none" className="overflow-hidden border border-[var(--border)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[var(--bg-secondary)]/50 border-b border-[var(--border)]">
                  <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Cliente</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Fecha</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Equipo</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-right">Monto</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Estado</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredServices.map((s) => (
                  <tr key={s.id} className="hover:bg-[var(--bg-hover)]/30 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-[var(--text-primary)]">{s.clients?.name}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)] font-medium">{formatDate(s.date)}</td>
                    <td className="px-6 py-4">
                      {s.employees ? (
                        <Badge variant="info" className="px-2 py-0.5">{s.employees.name}</Badge>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)] font-medium">No asignado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-right text-[var(--text-primary)]">{formatCurrency(s.amount)}</td>
                    <td className="px-6 py-4">
                      <Badge variant={s.status === 'paid' ? 'success' : 'warning'}>
                        {s.status === 'paid' ? 'Pagado' : 'Pendiente'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleToggleStatus(s.id, s.status)}
                          className={cn(
                            "h-8 w-8 p-0",
                            s.status === 'pending' ? "text-[var(--success)] hover:bg-[var(--success)]/10" : "text-[var(--text-muted)]"
                          )}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setServiceToDelete(s.id);
                            setIsConfirmOpen(true);
                          }}
                          className="text-[var(--danger)] hover:bg-[var(--danger)]/10 h-8 w-8 p-0"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal Registro */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Registrar Nuevo Trabajo"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {formData.client_id && clients.find(c => c.id === formData.client_id)?.notes && (
            <div className="p-4 bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded-xl flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertTriangle className="w-5 h-5 text-[var(--warning)] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[var(--warning)] uppercase tracking-widest">Nota Importante del Cliente</p>
                <p className="text-sm text-[var(--text-primary)] leading-relaxed">{clients.find(c => c.id === formData.client_id)?.notes}</p>
              </div>
            </div>
          )}

          <Select 
            label="Cliente"
            required
            value={formData.client_id}
            onChange={e => setFormData({...formData, client_id: e.target.value})}
          >
            <option value="">Selecciona un cliente</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Monto ($)"
              type="number" 
              required
              placeholder="120"
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: e.target.value})}
            />
            <Input 
              label="Fecha"
              type="date" 
              required
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[var(--text-secondary)] px-1">Estado del Pago</label>
            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => setFormData({...formData, status: 'pending'})}
                className={cn(
                  "flex-1 p-4 rounded-xl border transition-all flex flex-col items-center gap-1",
                  formData.status === 'pending' 
                    ? "bg-[var(--warning)]/10 border-[var(--warning)] text-[var(--warning)] shadow-[0_0_20px_rgba(251,191,36,0.1)]" 
                    : "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-muted)] grayscale hover:grayscale-0"
                )}
              >
                <Clock className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Pendiente</span>
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, status: 'paid'})}
                className={cn(
                  "flex-1 p-4 rounded-xl border transition-all flex flex-col items-center gap-1",
                  formData.status === 'paid' 
                    ? "bg-[var(--success)]/10 border-[var(--success)] text-[var(--success)] shadow-[0_0_20px_rgba(52,211,153,0.1)]" 
                    : "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-muted)] grayscale hover:grayscale-0"
                )}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Pagado</span>
              </button>
            </div>
          </div>

          <Select 
            label="Empleado Asignado (Opcional)"
            value={formData.assigned_employee_id}
            onChange={e => setFormData({...formData, assigned_employee_id: e.target.value})}
          >
            <option value="">Sin asignar</option>
            {activeEmployees.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </Select>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[var(--text-secondary)] px-1">Notas del Trabajo</label>
            <textarea 
              placeholder="Ej: Solo primer piso, trajo sus químicos..."
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[12px] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 transition-all h-24 resize-none"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={!formData.client_id || !formData.amount}>
              Registrar Trabajo
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="¿Eliminar registro de servicio?"
        description="Esta acción eliminará permanentemente la información de este trabajo y no se podrá recuperar."
        danger
        confirmLabel="Eliminar Registro"
      />
    </div>
  );
}

function FilterButton({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-5 py-2 rounded-[10px] text-sm font-semibold transition-all",
        active 
          ? "bg-[var(--accent)] text-white shadow-[0_4px_12px_rgba(139,92,246,0.3)]" 
          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
      )}
    >
      {label}
    </button>
  );
}

