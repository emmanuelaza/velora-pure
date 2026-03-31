import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { 
  Plus, 
  Search, 
  Phone, 
  MapPin, 
  Calendar, 
  Trash2, 
  Edit2,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBusiness } from '../context/BusinessContext';
import { formatCurrency, formatPhone, getInitials, avatarColor, cn } from '../lib/utils';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  frequency: string;
  active: boolean;
  notes?: string;
  total_debt?: number;
}

export default function Clients() {
  const { business } = useBusiness();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (business) {
      fetchClients();
    }
  }, [business, filter]);

  const fetchClients = async () => {
    if (!business) return;
    setLoading(true);
    try {
      let query = supabase
        .from('clients')
        .select(`
          *,
          services(amount, status)
        `)
        .eq('business_id', business.id);

      if (filter === 'active') query = query.eq('active', true);
      if (filter === 'inactive') query = query.eq('active', false);

      const { data, error } = await query.order('name');
      if (error) throw error;

      const results = (data || []).map((c: any) => {
        const debt = c.services
          ? c.services
              .filter((s: any) => s.status === 'pending')
              .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0)
          : 0;
        return { ...c, total_debt: debt };
      });

      setClients(results);
    } catch (error: any) {
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!clientToDelete) return;
    try {
      const { error } = await supabase.from('clients').delete().eq('id', clientToDelete);
      if (error) throw error;
      toast.success('Cliente eliminado');
      fetchClients();
    } catch (error: any) {
      toast.error('No se puede eliminar un cliente con historial de servicios');
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-[#888888]">Gestiona y organiza tu base de datos de clientes</p>
        </div>
        <button 
          onClick={() => {
            setEditingClient(null);
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Cliente</span>
        </button>
      </header>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border)]">
        <div className="flex items-center gap-2 bg-[var(--bg-primary)] px-4 py-2.5 rounded-lg border border-[var(--border)] w-full md:w-96">
          <Search className="w-5 h-5 text-[var(--text-secondary)]" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o teléfono..." 
            className="bg-transparent border-none outline-none text-[var(--text-primary)] text-sm w-full placeholder-[var(--text-secondary)]"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex bg-[var(--bg-primary)] p-1 rounded-lg border border-[var(--border)]">
          <FilterButton label="Activos" active={filter === 'active'} onClick={() => setFilter('active')} />
          <FilterButton label="Inactivos" active={filter === 'inactive'} onClick={() => setFilter('inactive')} />
          <FilterButton label="Todos" active={filter === 'all'} onClick={() => setFilter('all')} />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      ) : filteredClients.length === 0 ? (
        <EmptyState 
          icon={UserPlus}
          title="No se encontraron clientes"
          description={search ? "Intenta con otra búsqueda" : "Empieza registrando a tu primer cliente para comenzar."}
          actionLabel={!search ? "Agregar Cliente" : undefined}
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map(client => (
            <div key={client.id} className="card group hover:border-[var(--border-soft)] transition-all flex flex-col h-full relative">
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg"
                  style={{ backgroundColor: `${avatarColor(client.name)}20`, color: avatarColor(client.name) }}
                >
                  {getInitials(client.name)}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setEditingClient(client);
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent-subtle)] rounded-lg transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      setClientToDelete(client.id);
                      setIsConfirmOpen(true);
                    }}
                    className="p-2 text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] truncate pr-8">{client.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mt-1">
                    <Phone className="w-4 h-4" />
                    <span>{formatPhone(client.phone)}</span>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-sm text-[var(--text-primary)]/80">
                    <MapPin className="w-4 h-4 text-[var(--text-secondary)]" />
                    <span className="truncate">{client.address}, {client.city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-primary)]/80">
                    <Calendar className="w-4 h-4 text-[var(--text-secondary)]" />
                    <span>Frecuencia: <span className="text-[var(--success)] font-medium">{client.frequency}</span></span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between">
                <div>
                  <p className="section-title">Saldo Pendiente</p>
                  <p className={cn(
                    "amount text-[24px] font-bold mt-1",
                    client.total_debt! > 0 ? "text-[var(--warning)]" : "text-[var(--success)]"
                  )}>
                    {formatCurrency(client.total_debt || 0)}
                  </p>
                </div>
                <button 
                  onClick={() => navigate(`/clients/${client.id}`)}
                  className="p-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
      >
        <ClientForm 
          editingClient={editingClient} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchClients();
          }} 
        />
      </Modal>

      <ConfirmDialog 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="¿Eliminar cliente?"
        description="Esta acción no se puede deshacer. Se eliminarán todos los datos vinculados al cliente."
        danger
        confirmLabel="Eliminar"
      />
    </div>
  );
}

function FilterButton({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
        active ? "bg-[var(--accent)] text-white shadow-[0_0_10px_rgba(139,92,246,0.2)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      )}
    >
      {label}
    </button>
  );
}

function ClientForm({ editingClient, onClose, onSuccess }: any) {
  const { business } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: editingClient?.name || '',
    phone: editingClient?.phone || '',
    address: editingClient?.address || '',
    city: editingClient?.city || '',
    state: editingClient?.state || 'California',
    frequency: editingClient?.frequency || 'Cada 2 semanas',
    active: editingClient?.active ?? true,
    notes: editingClient?.notes || ''
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setLoading(true);

    try {
      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update(formData)
          .eq('id', editingClient.id);
        if (error) throw error;
        toast.success('Cliente actualizado');
      } else {
        const { error } = await supabase
          .from('clients')
          .insert({ ...formData, business_id: business.id });
        if (error) throw error;
        toast.success('Cliente registrado');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#888888]">Nombre Completo</label>
        <input 
          type="text" 
          required 
          className="input-field w-full"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#888888]">Teléfono</label>
          <input 
            type="tel" 
            className="input-field w-full" 
            value={formData.phone}
            onChange={e => setFormData({...formData, phone: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#888888]">Frecuencia</label>
          <select 
            className="input-field w-full"
            value={formData.frequency}
            onChange={e => setFormData({...formData, frequency: e.target.value})}
          >
            <option>Semanal</option>
            <option>Cada 2 semanas</option>
            <option>Mensual</option>
            <option>Una sola vez</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[#888888]">Dirección</label>
        <input 
          type="text" 
          className="input-field w-full"
          value={formData.address}
          onChange={e => setFormData({...formData, address: e.target.value})}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#888888]">Ciudad</label>
          <input 
            type="text" 
            className="input-field w-full"
            value={formData.city}
            onChange={e => setFormData({...formData, city: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#888888]">Estado</label>
          <input 
            type="text" 
            className="input-field w-full"
            value={formData.state}
            onChange={e => setFormData({...formData, state: e.target.value})}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[#888888]">Notas (Opcional)</label>
        <textarea 
          className="input-field w-full h-24 resize-none"
          value={formData.notes}
          onChange={e => setFormData({...formData, notes: e.target.value})}
        />
      </div>

      <div className="flex gap-4 pt-4">
        <button 
          type="button" 
          onClick={onClose}
          className="flex-1 px-4 py-3 rounded-xl border border-[#2A2A2A] font-semibold text-[#888888] hover:bg-[#2A2A2A] transition-all"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          disabled={loading}
          className="flex-1 btn-primary flex items-center justify-center"
        >
          {loading ? <Skeleton className="w-20 h-4" /> : 'Guardar Cliente'}
        </button>
      </div>
    </form>
  );
}
