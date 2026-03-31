import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MessageCircle, 
  Plus, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle2,
  Trash2,
  Phone,
  MapPin
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBusiness } from '../context/BusinessContext';
import { formatCurrency, formatDate, getInitials, avatarColor, cn, formatPhone } from '../lib/utils';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Skeleton } from '../components/Skeleton';
import toast from 'react-hot-toast';

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

  useEffect(() => {
    if (business && id) {
      fetchClientData();
    }
  }, [business, id]);

  const fetchClientData = async () => {
    setLoading(true);
    try {
      // Fetch Client Info
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (clientError) throw clientError;
      setClient(clientData);

      // Fetch Services
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
    const message = `Hola ${client.name.split(' ')[0]}, te escribo de ${business?.business_name}. Te envío este recordatorio del servicio de limpieza del ${formatDate(service.date)} por un monto de ${formatCurrency(service.amount)}. ¡Muchas gracias!`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/1${client.phone.replace(/\D/g,'')}?text=${encodedMessage}`, '_blank');
  };

  const totalGenerated = services.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalPending = services.filter(s => s.status === 'pending').reduce((acc, curr) => acc + Number(curr.amount), 0);

  if (loading) return <DetailSkeleton />;
  if (!client) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/clients')}
            className="p-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl hover:bg-[#2A2A2A] transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl"
            style={{ backgroundColor: `${avatarColor(client.name)}20`, color: avatarColor(client.name) }}
          >
            {getInitials(client.name)}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{client.name}</h1>
            <div className="flex items-center gap-3 text-sm text-[#888888] mt-1">
              <span className={cn(
                "w-2 h-2 rounded-full",
                client.active ? "bg-[#00C896]" : "bg-[#888888]"
              )} />
              {client.active ? 'Activo' : 'Inactivo'}
              <span className="opacity-30">•</span>
              <Phone className="w-4 h-4" />
              {formatPhone(client.phone)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/services', { state: { clientId: client.id } })}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Registrar Servicio</span>
          </button>
        </div>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatSmall label="Total Generado" value={formatCurrency(totalGenerated)} icon={DollarSign} color="white" />
        <StatSmall label="Saldo Pendiente" value={formatCurrency(totalPending)} icon={Clock} color={totalPending > 0 ? 'warning' : 'white'} />
        <StatSmall label="Frecuencia" value={client.frequency} icon={Calendar} color="accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Info detail column */}
        <div className="lg:col-span-1 space-y-6">
          <section className="card space-y-4">
            <h3 className="font-bold text-lg border-b border-[#2A2A2A] pb-4">Detalles del Cliente</h3>
            <div className="space-y-4 pt-2">
              <InfoRow icon={MapPin} label="Dirección" value={`${client.address}, ${client.city}, ${client.state}`} />
              <InfoRow icon={Phone} label="WhatsApp" value={formatPhone(client.phone)} />
              {client.notes && (
                <div className="space-y-1">
                  <p className="text-xs text-[#888888] font-bold uppercase tracking-wider">Notas</p>
                  <p className="text-sm text-[#F5F5F5] bg-[#111] p-3 rounded-lg border border-[#2A2A2A]">{client.notes}</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* History column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Historial de Servicios</h2>
          </div>

          <div className="card !p-0 overflow-hidden">
            {services.length === 0 ? (
              <div className="py-12 text-center text-[#888888]">No hay servicios registrados.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#111] border-b border-[#2A2A2A]">
                      <th className="px-6 py-4 text-xs font-bold text-[#888888] uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#888888] uppercase tracking-wider">Monto</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#888888] uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#888888] uppercase tracking-wider text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2A2A]">
                    {services.map((service) => (
                      <tr key={service.id} className="hover:bg-[#111] transition-colors group">
                        <td className="px-6 py-4 text-sm font-medium">{formatDate(service.date)}</td>
                        <td className="px-6 py-4 text-sm font-bold">{formatCurrency(service.amount)}</td>
                        <td className="px-6 py-4 text-sm">
                          <StatusBadge status={service.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {service.status === 'pending' && (
                              <button 
                                onClick={() => sendReminder(service)}
                                className="p-2 text-[#00C896] hover:bg-[#00C896]/10 rounded-lg transition-all"
                                title="Enviar recordatorio WhatsApp"
                              >
                                <MessageCircle className="w-5 h-5" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleToggleStatus(service.id, service.status)}
                              className={cn(
                                "p-2 rounded-lg transition-all",
                                service.status === 'pending' 
                                  ? "text-[#00C896] hover:bg-[#00C896]/10" 
                                  : "text-[#888888] hover:bg-[#2A2A2A]"
                              )}
                              title={service.status === 'paid' ? 'Marcar como pendiente' : 'Marcar como pagado'}
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => {
                                setServiceToDelete(service.id);
                                setIsConfirmOpen(true);
                              }}
                              className="p-2 text-[#FF4444] hover:bg-[#FF4444]/10 rounded-lg transition-all"
                              title="Eliminar servicio"
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
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteService}
        title="¿Eliminar servicio?"
        description="Esta acción eliminará el registro de este servicio permanentemente."
        danger
        confirmLabel="Eliminar"
      />
    </div>
  );
}

function StatSmall({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    white: 'text-white border-[#2A2A2A]',
    warning: 'text-[#FFB800] border-[#FFB800]/30',
    accent: 'text-[#00C896] border-[#00C896]/30'
  };

  return (
    <div className={cn("card flex items-center gap-4 py-4 px-6", colors[color])}>
      <div className="p-3 rounded-xl bg-black/20">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] uppercase font-bold tracking-widest text-[#888888] mb-0.5">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-[#111] rounded-lg mt-0.5">
        <Icon className="w-4 h-4 text-[#888888]" />
      </div>
      <div>
        <p className="text-[10px] text-[#888888] uppercase font-bold tracking-wider">{label}</p>
        <p className="text-sm font-medium leading-tight mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="w-48 h-10 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Skeleton className="lg:col-span-1 h-96 rounded-2xl" />
        <Skeleton className="lg:col-span-2 h-96 rounded-2xl" />
      </div>
    </div>
  );
}
