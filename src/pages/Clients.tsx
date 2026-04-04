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
  UserPlus,
  FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBusiness } from '../context/BusinessContext';
import { formatCurrency, formatPhone, getInitials, avatarColor, cn } from '../lib/utils';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// New UI Components
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';

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
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Clientes</h1>
          <p className="text-[var(--text-secondary)] mt-1">Gestiona y organiza tu base de datos de clientes</p>
        </div>
        <Button 
          onClick={() => {
            setEditingClient(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-5 h-5" />
          Nuevo Cliente
        </Button>
      </header>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[var(--bg-secondary)] p-4 rounded-[16px] border border-[var(--border)]">
        <div className="w-full md:w-96">
          <Input 
            icon={Search}
            placeholder="Buscar por nombre o teléfono..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex bg-[var(--bg-primary)] p-1 rounded-[12px] border border-[var(--border)]">
          <FilterButton label="Activos" active={filter === 'active'} onClick={() => setFilter('active')} />
          <FilterButton label="Inactivos" active={filter === 'inactive'} onClick={() => setFilter('inactive')} />
          <FilterButton label="Todos" active={filter === 'all'} onClick={() => setFilter('all')} />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 bg-[var(--bg-card)] rounded-[20px] animate-pulse" />)}
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
            <Card key={client.id} padding="md" className="group flex flex-col h-full relative border-[var(--border)] hover:border-[var(--accent)]/30">
              <div className="flex items-start justify-between mb-5">
                <div 
                  className="w-12 h-12 rounded-[14px] flex items-center justify-center font-bold text-lg"
                  style={{ backgroundColor: `${avatarColor(client.name)}20`, color: avatarColor(client.name) }}
                >
                  {getInitials(client.name)}
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="p-2 h-9 w-9"
                    onClick={() => {
                      setEditingClient(client);
                      setIsModalOpen(true);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="p-2 h-9 w-9 text-[var(--danger)] hover:bg-[var(--danger)]/10"
                    onClick={() => {
                      setClientToDelete(client.id);
                      setIsConfirmOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] truncate">{client.name}</h3>
                    {client.notes && (
                      <Badge variant="warning" className="px-1.5 py-0.5">
                        <FileText className="w-3 h-3" />
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mt-1.5 font-medium">
                    <Phone className="w-4 h-4 opacity-70" />
                    <span>{formatPhone(client.phone)}</span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center gap-2.5 text-sm text-[var(--text-primary)]/80">
                    <MapPin className="w-4 h-4 text-[var(--text-muted)]" />
                    <span className="truncate">{client.address}, {client.city}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-[var(--text-primary)]/80">
                    <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
                    <span>Frecuencia: <span className="text-[var(--accent-light)] font-semibold">{client.frequency}</span></span>
                  </div>
                </div>
              </div>

              <div className="mt-7 pt-5 border-t border-[var(--border)] flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Saldo Pendiente</p>
                  <p className={cn(
                    "font-mono text-[24px] font-semibold mt-1",
                    client.total_debt! > 0 ? "text-[var(--warning)]" : "text-[var(--success)]"
                  )}>
                    {formatCurrency(client.total_debt || 0)}
                  </p>
                </div>
                <Button 
                  variant="secondary"
                  size="sm"
                  className="h-10 w-10 p-0 rounded-full"
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </Card>
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

function ClientForm({ editingClient, onClose, onSuccess }: any) {
  const { business } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: editingClient?.name || '',
    phone: editingClient?.phone || '',
    address: editingClient?.address || '',
    city: editingClient?.city || '',
    state: editingClient?.state || 'Florida',
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input 
        label="Nombre Completo"
        placeholder="Juan Pérez"
        required 
        value={formData.name}
        onChange={e => setFormData({...formData, name: e.target.value})}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input 
          label="Teléfono"
          type="tel" 
          placeholder="(000) 000-0000"
          value={formData.phone}
          onChange={e => setFormData({...formData, phone: e.target.value})}
        />
        <Select 
          label="Frecuencia"
          value={formData.frequency}
          onChange={e => setFormData({...formData, frequency: e.target.value})}
        >
          <option>Semanal</option>
          <option>Cada 2 semanas</option>
          <option>Mensual</option>
          <option>Una sola vez</option>
        </Select>
      </div>

      <Input 
        label="Dirección"
        placeholder="123 Main St"
        value={formData.address}
        onChange={e => setFormData({...formData, address: e.target.value})}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input 
          label="Ciudad"
          placeholder="Miami"
          value={formData.city}
          onChange={e => setFormData({...formData, city: e.target.value})}
        />
        <Input 
          label="Estado"
          placeholder="Florida"
          value={formData.state}
          onChange={e => setFormData({...formData, state: e.target.value})}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-[var(--text-secondary)] px-1">Notas (Opcional)</label>
        <textarea 
          className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[10px] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(139,92,246,0.15)] transition-all h-24 resize-none"
          placeholder="Instrucciones especiales..."
          value={formData.notes}
          onChange={e => setFormData({...formData, notes: e.target.value})}
        />
      </div>

      <div className="flex gap-4 pt-4">
        <Button variant="secondary" type="button" onClick={onClose} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          {editingClient ? 'Actualizar' : 'Guardar Cliente'}
        </Button>
      </div>
    </form>
  );
}
