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

// UI Components
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
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
  service_packages?: {
    name: string;
  };
  package_id?: string;
}

interface ServicePackage {
  id: string;
  name: string;
  price: number;
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
  const [packages, setPackages] = useState<ServicePackage[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    client_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending' as 'paid' | 'pending',
    assigned_employee_id: '',
    package_id: '',
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

      const { data: packagesData } = await supabase
        .from('service_packages')
        .select('id, name, price')
        .eq('business_id', business.id)
        .eq('is_active', true)
        .order('name');
      
      setPackages(packagesData || []);

      let query = supabase
        .from('services')
        .select(`
          *,
          clients(name),
          employees(name),
          service_packages(name)
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
        package_id: formData.package_id || null,
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
        package_id: '',
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
      setServices(services.map(s => s.id === serviceId ? { ...s, status: newStatus as any } : s));
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
    s.clients?.name.toLowerCase().includes(search.toLowerCase()) ||
    s.service_packages?.name.toLowerCase().includes(search.toLowerCase())
  );

  const handlePackageChange = (packageId: string) => {
    const pkg = packages.find(p => p.id === packageId);
    if (pkg) {
      setFormData({
        ...formData,
        package_id: packageId,
        amount: pkg.price.toString()
      });
    } else {
      setFormData({
        ...formData,
        package_id: '',
      });
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    const success = await generateMonthlyPDF(business);
    if (success) toast.success('Reporte descargado correctamente');
    setIsGeneratingPdf(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Servicios"
        subtitle="Historial de todos los servicios"
        actions={
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary"
              onClick={handleDownloadPDF}
              loading={isGeneratingPdf}
            >
              <FileText className="w-4 h-4" />
              Reporte PDF
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4" />
              Registrar servicio
            </Button>
          </div>
        }
      />

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="w-full md:w-80">
          <Input 
            icon={Search}
            placeholder="Buscar por cliente..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-[var(--bg-secondary)] p-1 rounded-[var(--radius-md)] border border-[var(--border)]">
          <FilterPill label="Todos" active={filter === 'all'} onClick={() => setFilter('all')} />
          <FilterPill label="Pendientes" active={filter === 'pending'} onClick={() => setFilter('pending')} />
          <FilterPill label="Pagados" active={filter === 'paid'} onClick={() => setFilter('paid')} />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-[var(--bg-card)] rounded-[var(--radius-md)] animate-pulse" />)}
        </div>
      ) : filteredServices.length === 0 ? (
        <EmptyState 
          icon={ClipboardList}
          title="No hay servicios"
          description={search ? "No se encontraron resultados" : "Registra tu primer trabajo para comenzar el historial."}
        />
      ) : (
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-4 py-3 text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.08em]">Cliente</th>
                  <th className="px-4 py-3 text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.08em] text-center">Fecha</th>
                  <th className="px-4 py-3 text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.08em] text-center">Equipo</th>
                  <th className="px-4 py-3 text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.08em] text-right">Monto</th>
                  <th className="px-4 py-3 text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.08em] text-center">Estado</th>
                  <th className="px-4 py-3 text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.08em] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((s) => (
                  <tr key={s.id} className="border-b border-[var(--border)]/50 hover:bg-[var(--bg-hover)] transition-colors group">
                    <td className="px-4 py-3">
                      <span className="text-[14px] font-medium text-[var(--text-primary)]">{s.clients?.name}</span>
                      {s.service_packages && (
                        <p className="text-[11px] text-[var(--accent-light)] font-medium mt-0.5">
                          📦 {s.service_packages.name}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[var(--text-secondary)] text-center">{formatDate(s.date, business?.country)}</td>
                    <td className="px-4 py-3 text-center">
                      {s.employees ? (
                        <Badge variant="info" className="text-[11px]">{s.employees.name}</Badge>
                      ) : (
                        <span className="text-[12px] text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-right text-[14px] text-[var(--text-primary)]">{formatCurrency(s.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={s.status === 'paid' ? 'success' : 'warning'}>
                        {s.status === 'paid' ? 'Pagado' : 'Pendiente'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {s.status === 'pending' && (
                          <button
                            onClick={() => handleToggleStatus(s.id, s.status)}
                            className="p-1.5 text-[var(--success)] hover:bg-[var(--success)]/10 rounded-lg transition-colors"
                            title="Marcar pagado"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {s.status === 'paid' && (
                          <button
                            onClick={() => handleToggleStatus(s.id, s.status)}
                            className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                            title="Revertir a pendiente"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setServiceToDelete(s.id);
                            setIsConfirmOpen(true);
                          }}
                          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Count */}
      {!loading && filteredServices.length > 0 && (
        <p className="text-center text-[13px] text-[var(--text-muted)]">
          Mostrando {filteredServices.length} servicios
        </p>
      )}

      {/* Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Registrar Nuevo Trabajo"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {formData.client_id && clients.find(c => c.id === formData.client_id)?.notes && (
            <div className="p-3 bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded-[var(--radius-md)] flex gap-3">
              <AlertTriangle className="w-4 h-4 text-[var(--warning)] shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-semibold text-[var(--warning)]">Nota del Cliente</p>
                <p className="text-[13px] text-[var(--text-secondary)] mt-0.5 italic">"{clients.find(c => c.id === formData.client_id)?.notes}"</p>
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

          <div className="space-y-4">
            <Select 
              label="Paquete de Servicio (Opcional)"
              value={formData.package_id}
              onChange={e => handlePackageChange(e.target.value)}
            >
              <option value="">Selección manual de monto</option>
              {packages.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.price)})</option>
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
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[var(--text-secondary)] px-1">Estado del Pago</label>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setFormData({...formData, status: 'pending'})}
                className={cn(
                  "flex-1 p-4 rounded-[var(--radius-md)] border transition-all flex flex-col items-center gap-2",
                  formData.status === 'pending' 
                    ? "bg-[var(--warning)]/10 border-[var(--warning)]/40 text-[var(--warning)]" 
                    : "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-soft)]"
                )}
              >
                <Clock className="w-5 h-5" />
                <span className="text-[12px] font-semibold">Pendiente</span>
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, status: 'paid'})}
                className={cn(
                  "flex-1 p-4 rounded-[var(--radius-md)] border transition-all flex flex-col items-center gap-2",
                  formData.status === 'paid' 
                    ? "bg-[var(--success)]/10 border-[var(--success)]/40 text-[var(--success)]" 
                    : "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-soft)]"
                )}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-[12px] font-semibold">Pagado</span>
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
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-3 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all h-24 resize-none"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div className="flex gap-3 pt-3">
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
        description="Esta acción eliminará permanentemente la información de este trabajo."
        danger
        confirmLabel="Eliminar Registro"
      />
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-[10px] text-[13px] font-medium transition-all duration-200",
        active 
          ? "bg-[var(--accent)] text-white" 
          : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
      )}
    >
      {label}
    </button>
  );
}
