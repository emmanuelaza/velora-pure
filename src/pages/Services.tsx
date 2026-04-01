import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Calendar, 
  DollarSign,
  Clock,
  Users,
  CheckCircle2,
  Trash2,
  Info,
  FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBusiness } from '../context/BusinessContext';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import toast from 'react-hot-toast';
import { generateMonthlyPDF } from '../lib/pdf';

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
      // Fetch Clients for the dropdown
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, name')
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

      // Fetch Services
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Servicios</h1>
          <p className="text-[#888888]">Registro y control de trabajos realizados</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center gap-2 h-10"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Reporte PDF</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center justify-center gap-2 h-10"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Registrar Trabajo</span>
            <span className="sm:hidden">Registrar</span>
          </button>
        </div>
      </header>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border)]">
        <div className="flex items-center gap-2 bg-[var(--bg-primary)] px-4 py-2.5 rounded-lg border border-[var(--border)] w-full md:w-96">
          <Search className="w-5 h-5 text-[var(--text-secondary)]" />
          <input 
            type="text" 
            placeholder="Buscar por cliente..." 
            className="bg-transparent border-none outline-none text-[var(--text-primary)] text-sm w-full placeholder-[var(--text-secondary)]"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex bg-[var(--bg-primary)] p-1 rounded-lg border border-[var(--border)]">
          <button 
            onClick={() => setFilter('all')}
            className={cn("px-4 py-2 rounded-lg text-sm", filter === 'all' ? "bg-[var(--accent)] text-white shadow-[0_0_10px_rgba(139,92,246,0.2)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]")}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilter('pending')}
            className={cn("px-4 py-2 rounded-lg text-sm", filter === 'pending' ? "bg-[var(--warning)]/20 text-[var(--warning)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]")}
          >
            Pendientes
          </button>
          <button 
            onClick={() => setFilter('paid')}
            className={cn("px-4 py-2 rounded-lg text-sm", filter === 'paid' ? "bg-[var(--success)]/20 text-[var(--success)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]")}
          >
            Pagados
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : filteredServices.length === 0 ? (
        <EmptyState 
          icon={Clock}
          title="No hay servicios"
          description={search ? "No se encontraron resultados" : "Registra tu primer trabajo para comenzar el historial."}
        />
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                  <th className="px-6 py-4 section-title">Cliente</th>
                  <th className="px-6 py-4 section-title">Fecha</th>
                  <th className="px-6 py-4 section-title">Empleado</th>
                  <th className="px-6 py-4 section-title text-right">Monto</th>
                  <th className="px-6 py-4 section-title">Estado</th>
                  <th className="px-6 py-4 section-title text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredServices.map((s) => (
                  <tr key={s.id} className="list-row group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-[var(--text-primary)]">{s.clients?.name}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{formatDate(s.date)}</td>
                    <td className="px-6 py-4">
                      {s.employees ? (
                        <span className="text-sm font-medium text-[var(--accent)]">{s.employees.name}</span>
                      ) : (
                        <span className="text-sm text-[var(--text-secondary)]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 amount text-right text-[var(--text-primary)]">{formatCurrency(s.amount)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleToggleStatus(s.id, s.status)}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            s.status === 'pending' ? "text-[var(--success)] hover:bg-[var(--success)]/10" : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                          )}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => {
                            setServiceToDelete(s.id);
                            setIsConfirmOpen(true);
                          }}
                          className="p-2 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Registro */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Registrar Nuevo Trabajo"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#888888] flex items-center gap-2">
              <Users className="w-4 h-4" /> Cliente
            </label>
            <select 
              required
              className="input-field w-full"
              value={formData.client_id}
              onChange={e => setFormData({...formData, client_id: e.target.value})}
            >
              <option value="">Selecciona un cliente</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#888888] flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Monto ($)
              </label>
              <input 
                type="number" 
                required
                placeholder="120"
                className="input-field w-full"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#888888] flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Fecha
              </label>
              <input 
                type="date" 
                required
                className="input-field w-full"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#888888] flex items-center gap-2">
              <Clock className="w-4 h-4" /> Estado Inicial
            </label>
            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => setFormData({...formData, status: 'pending'})}
                className={cn(
                  "flex-1 p-3 rounded-xl border transition-all flex items-center justify-center gap-2",
                  formData.status === 'pending' ? "bg-[#FFB800]/10 border-[#FFB800] text-[#FFB800]" : "bg-[#111] border-[#2A2A2A] text-[#888888]"
                )}
              >
                <Clock className="w-4 h-4" /> Pendiente
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, status: 'paid'})}
                className={cn(
                  "flex-1 p-3 rounded-xl border transition-all flex items-center justify-center gap-2",
                  formData.status === 'paid' ? "bg-[#00C896]/10 border-[#00C896] text-[#00C896]" : "bg-[#111] border-[#2A2A2A] text-[#888888]"
                )}
              >
                <CheckCircle2 className="w-4 h-4" /> Pagado
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#888888] flex items-center gap-2">
              <Users className="w-4 h-4" /> Empleado Asignado (Opcional)
            </label>
            <select 
              className="input-field w-full"
              value={formData.assigned_employee_id}
              onChange={e => setFormData({...formData, assigned_employee_id: e.target.value})}
            >
              <option value="">Sin asignar</option>
              {activeEmployees.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#888888] flex items-center gap-2">
              <Info className="w-4 h-4" /> Notas adicionales
            </label>
            <textarea 
              placeholder="Ej: Solo primer piso, trajo sus químicos..."
              className="input-field w-full h-24 resize-none"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-3 rounded-xl border border-[#2A2A2A] font-semibold text-[#888888] hover:bg-[#2A2A2A] transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 btn-primary"
              disabled={!formData.client_id || !formData.amount}
            >
              Registrar Trabajo
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="¿Eliminar servicio?"
        description="Esta acción eliminará el registro de este servicio permanentemente."
        danger
        confirmLabel="Eliminar"
      />
    </div>
  );
}
