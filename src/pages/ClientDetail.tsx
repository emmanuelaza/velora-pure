import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MessageCircle, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2,
  Trash2,
  Phone,
  MapPin,
  FileText,
  Save,
  Users,
  ClipboardList,
  TrendingUp
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBusiness } from '../context/BusinessContext';
import { formatCurrency, formatDate, getInitials, avatarColor, cn, formatPhone } from '../lib/utils';
import toast from 'react-hot-toast';

// New UI Components
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { MetricCard } from '../components/ui/MetricCard';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  frequency: string;
  notes?: string;
  active: boolean;
}

interface Service {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending';
  notes?: string;
  created_at: string;
}

export default function ClientDetail() {
  const { id } = useParams();
  const { business } = useBusiness();
  const navigate = useNavigate();
  
  const [client, setClient] = useState<Client | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [internalNote, setInternalNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (business && id) {
      fetchClientData();
    }
  }, [business, id]);

  const fetchClientData = async () => {
    setLoading(true);
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (clientError) throw clientError;
      setClient(clientData);
      setInternalNote(clientData.notes || '');

      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('client_id', id)
        .order('date', { ascending: false });

      if (servicesError) throw servicesError;
      setServices(servicesData || []);

    } catch (error: any) {
      toast.error('Error al cargar datos del cliente');
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (serviceId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    try {
      const { error } = await supabase
        .from('services')
        .update({ status: newStatus })
        .eq('id', serviceId);
      
      if (error) throw error;
      setServices(services.map(s => s.id === serviceId ? { ...s, status: newStatus as any } : s));
      toast.success(`Servicio marcado como ${newStatus === 'paid' ? 'pagado' : 'pendiente'}`);
    } catch (error: any) {
      toast.error('Error al actualizar servicio');
    }
  };

  const handleSaveNote = async () => {
    if (!id) return;
    setSavingNote(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({ notes: internalNote })
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Nota interna guardada');
      setClient(prev => prev ? { ...prev, notes: internalNote } : null);
    } catch (error: any) {
      toast.error('Error al guardar nota');
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;
    try {
      const { error } = await supabase.from('services').delete().eq('id', serviceToDelete);
      if (error) throw error;
      setServices(services.filter(s => s.id !== serviceToDelete));
      toast.success('Servicio eliminado');
    } catch (error: any) {
      toast.error('Error al eliminar servicio');
    }
  };

  const sendReminder = (service: Service) => {
    if (!client) return;
    const message = `Hola ${client.name.split(' ')[0]}, te escribo de ${business?.business_name}. Te envío este recordatorio del servicio de limpieza del ${formatDate(service.date, business?.country)} por un monto de ${formatCurrency(service.amount, business?.country)}. ¡Muchas gracias!`;
    const encodedMessage = encodeURIComponent(message);
    
    let phoneDigits = client.phone.replace(/\D/g, '');
    if (business?.country === 'ES') {
      if (!phoneDigits.startsWith('34')) phoneDigits = '34' + phoneDigits;
    } else {
      if (!phoneDigits.startsWith('1')) phoneDigits = '1' + phoneDigits;
    }
    
    window.open(`https://wa.me/${phoneDigits}?text=${encodedMessage}`, '_blank');
  };

  const totalGenerated = services.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalPending = services.filter(s => s.status === 'pending').reduce((acc, curr) => acc + Number(curr.amount), 0);

  if (loading) return <DetailSkeleton />;
  if (!client) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Button 
            variant="secondary"
            size="sm"
            onClick={() => navigate('/clients')}
            className="p-2 h-11 w-11 shrink-0 bg-[var(--bg-secondary)] border-[var(--border)]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div 
            className="w-16 h-16 rounded-[20px] flex items-center justify-center font-bold text-2xl shrink-0 ring-1 ring-white/10"
            style={{ backgroundColor: `${avatarColor(client.name)}20`, color: avatarColor(client.name) }}
          >
            {getInitials(client.name)}
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] truncate tracking-tight">{client.name}</h1>
            <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--text-secondary)] mt-2 font-medium">
              <Badge variant={client.active ? 'success' : 'muted'}>
                {client.active ? 'Activo' : 'Inactivo'}
              </Badge>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 opacity-70" />
                <span>{formatPhone(client.phone, business?.country)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            size="lg"
            onClick={() => navigate('/services', { state: { clientId: client.id } })}
            className="shadow-xl shadow-[var(--accent)]/20"
          >
            <Plus className="w-5 h-5" />
            Registrar Servicio
          </Button>
        </div>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard title="Total Generado" value={formatCurrency(totalGenerated)} icon={TrendingUp} />
        <MetricCard title="Saldo Pendiente" value={formatCurrency(totalPending)} icon={Clock} trend={totalPending > 0 ? { value: 100, isPositive: false } : undefined} />
        <MetricCard title="Frecuencia" value={client.frequency} icon={Calendar} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Info detail column */}
        <div className="lg:col-span-1 space-y-6">
          <Card variant="elevated" padding="lg" className="space-y-6 border-[var(--border)]">
            <h3 className="font-bold text-lg text-[var(--text-primary)] border-b border-[var(--border)] pb-4 flex items-center gap-2">
               <Users className="w-5 h-5 text-[var(--accent)]" />
               Detalles del Cliente
            </h3>
            <div className="space-y-6">
              <InfoRow icon={MapPin} label="Dirección Principal" value={`${client.address}, ${client.city}, ${client.state}`} />
              <InfoRow icon={Phone} label="WhatsApp Business" value={formatPhone(client.phone, business?.country)} />
              {client.notes && (
                <div className="space-y-2.5">
                  <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest px-1">Notas del Perfil</p>
                  <div className="text-sm text-[var(--text-primary)] bg-[var(--bg-secondary)]/50 p-4 rounded-xl border border-[var(--border)] leading-relaxed italic border-dashed">
                    "{client.notes}"
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card padding="lg" className="space-y-5">
            <h3 className="font-bold text-lg flex items-center gap-2 text-[var(--text-primary)]">
              <FileText className="w-5 h-5 text-[var(--accent)]" />
              Notas Internas
            </h3>
            <div className="space-y-4">
              <textarea 
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[12px] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent)]/15 transition-all h-32 resize-none"
                placeholder="Escribe detalles privados sobre este cliente..."
                value={internalNote}
                onChange={e => setInternalNote(e.target.value)}
              />
              <Button 
                onClick={handleSaveNote}
                loading={savingNote}
                disabled={internalNote === (client.notes || '')}
                className="w-full"
                variant="secondary"
              >
                <Save className="w-4 h-4" />
                Guardar cambios
              </Button>
            </div>
          </Card>
        </div>

        {/* History column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Historial de Servicios</h2>
            <Badge variant="muted">{services.length} registros</Badge>
          </div>

          <Card padding="none" className="overflow-hidden border-[var(--border)]">
            {services.length === 0 ? (
              <div className="py-20 text-center text-[var(--text-secondary)]">
                 <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-10" />
                 No hay servicios registrados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                      <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Fecha</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Monto</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-center">Estado</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {services.map((service) => (
                      <tr key={service.id} className="hover:bg-[var(--bg-hover)]/30 transition-colors group">
                        <td className="px-6 py-5 text-sm font-medium text-[var(--text-primary)]">{formatDate(service.date, business?.country)}</td>
                        <td className="px-6 py-5 text-sm font-bold font-mono text-[var(--text-primary)]">{formatCurrency(service.amount)}</td>
                        <td className="px-6 py-5 text-sm text-center">
                          <Badge variant={service.status === 'paid' ? 'success' : 'warning'}>
                            {service.status === 'paid' ? 'Pagado' : 'Pendiente'}
                          </Badge>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {service.status === 'pending' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => sendReminder(service)}
                                className="text-[var(--success)] hover:bg-[var(--success)]/10 h-9 w-9 p-0"
                                title="Recordatorio WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleToggleStatus(service.id, service.status)}
                              className={cn(
                                "h-9 w-9 p-0",
                                service.status === 'pending' ? "text-[var(--success)] hover:bg-[var(--success)]/10" : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
                              )}
                              title={service.status === 'paid' ? 'Marcar como pendiente' : 'Marcar como pagado'}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setServiceToDelete(service.id);
                                setIsConfirmOpen(true);
                              }}
                              className="text-[var(--danger)] hover:bg-[var(--danger)]/10 h-9 w-9 p-0"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteService}
        title="¿Eliminar registro de servicio?"
        description="Esta acción eliminará permanentemente la información de este trabajo y afectará los subtotales."
        danger
        confirmLabel="Eliminar Registro"
      />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start gap-4 group">
      <div className="p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] shrink-0 transition-colors group-hover:border-[var(--accent)]/30 group-hover:bg-[var(--bg-hover)]">
        <Icon className="w-4.5 h-4.5 text-[var(--accent)]" />
      </div>
      <div className="min-w-0 pt-0.5">
        <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">{label}</p>
        <p className="text-sm font-semibold text-[var(--text-primary)] mt-1.5 leading-tight">{value}</p>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6">
        <div className="w-12 h-12 bg-[var(--bg-card)] rounded-xl animate-pulse" />
        <div className="w-64 h-12 bg-[var(--bg-card)] rounded-xl animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-[var(--bg-card)] rounded-2xl animate-pulse" />) }
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 h-96 bg-[var(--bg-card)] rounded-2xl animate-pulse" />
        <div className="lg:col-span-2 h-96 bg-[var(--bg-card)] rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}

