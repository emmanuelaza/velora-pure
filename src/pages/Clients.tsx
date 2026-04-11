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

// UI Components
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
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
    <div className="space-y-6">
      <div className="anim-fade-up-1">
      <PageHeader
        title="Clientes"
        subtitle="Gestiona tu cartera de clientes"
        actions={
          <Button 
            onClick={() => {
              setEditingClient(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Agregar cliente
          </Button>
        }
      />

      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between anim-fade-up-2">
        <div className="w-full md:w-80">
          <Input 
            icon={Search}
            placeholder="Buscar por nombre o teléfono..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex bg-[var(--bg-secondary)] p-1 rounded-[var(--radius-md)] border border-[var(--border)]">
          <FilterPill label="Activos" active={filter === 'active'} onClick={() => setFilter('active')} />
          <FilterPill label="Inactivos" active={filter === 'inactive'} onClick={() => setFilter('inactive')} />
          <FilterPill label="Todos" active={filter === 'all'} onClick={() => setFilter('all')} />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-52 bg-[var(--bg-card)] rounded-[var(--radius-md)] animate-pulse" />)}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 anim-fade-up-3">
          {filteredClients.map(client => (
            <Card 
              key={client.id} 
              padding="none" 
              className="group border-[var(--border)] hover:border-[var(--accent)]/20 cursor-pointer overflow-hidden"
              onClick={() => navigate(`/clients/${client.id}`)}
            >
              <div className="p-5">
                {/* Top row: avatar + name + actions */}
                <div className="flex items-start gap-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-base shrink-0"
                    style={{ backgroundColor: `${avatarColor(client.name)}15`, color: avatarColor(client.name) }}
                  >
                    {getInitials(client.name)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-semibold text-[var(--text-primary)] truncate">{client.name}</h3>
                      {client.notes && (
                        <Badge variant="warning" className="px-1.5 py-0.5 shrink-0">
                          <FileText className="w-3 h-3" />
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[13px] text-[var(--text-muted)] mt-0.5">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{formatPhone(client.phone, business?.country)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-all"
                      onClick={() => {
                        setEditingClient(client);
                        setIsModalOpen(true);
                      }}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      className="p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-all"
                      onClick={() => {
                        setClientToDelete(client.id);
                        setIsConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Info rows */}
                <div className="mt-4 space-y-1.5 pl-16">
                  <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
                    <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                    <span className="truncate">{client.address}, {client.city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
                    <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                    <span>Frecuencia: <span className="text-[var(--accent-light)] font-medium">{client.frequency}</span></span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]/30">
                <div>
                  <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-[0.06em]">Saldo Pendiente</p>
                  <p className={cn(
                    "font-mono text-lg font-semibold mt-0.5",
                    client.total_debt! > 0 ? "text-[var(--warning)]" : "text-[var(--success)]"
                  )}>
                    {formatCurrency(client.total_debt || 0)}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--bg-hover)] text-[var(--text-muted)] group-hover:text-[var(--accent-light)] group-hover:bg-[var(--accent-subtle)] transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Showing count */}
      {!loading && filteredClients.length > 0 && (
        <p className="text-center text-[13px] text-[var(--text-muted)]">
          Mostrando {filteredClients.length} de {clients.length} clientes
        </p>
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
          className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-3 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all h-24 resize-none"
          placeholder="Instrucciones especiales..."
          value={formData.notes}
          onChange={e => setFormData({...formData, notes: e.target.value})}
        />
      </div>

      <div className="flex gap-3 pt-3">
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
