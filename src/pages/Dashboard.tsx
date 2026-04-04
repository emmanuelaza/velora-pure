import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { 
  DollarSign, 
  Clock, 
  Users, 
  ClipboardList, 
  MessageCircle, 
  AlertCircle,
  CheckCircle2,
  FileText,
  Zap,
  X,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBusiness } from '../context/BusinessContext';
import { formatCurrency, formatDateShort, getInitials, avatarColor, cn } from '../lib/utils';
import { generateMonthlyPDF } from '../lib/pdf';
import toast from 'react-hot-toast';

// New UI Components
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { MetricCard } from '../components/ui/MetricCard';

interface DashboardStats {
  totalCobrado: number;
  totalPendiente: number;
  clientesActivos: number;
  serviciosMes: number;
  totalServicios: number;
  hasPaymentConfig: boolean;
  hasClients: boolean;
}

interface PendingDebtor {
  client_id: string;
  name: string;
  phone: string;
  total_pending: number;
  oldest_pending_days: number;
}

interface RecentService {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending';
  client_name: string;
}

export default function Dashboard() {
  const { business } = useBusiness();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingDebtors, setPendingDebtors] = useState<PendingDebtor[]>([]);
  const [recentServices, setRecentServices] = useState<RecentService[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [fastServiceOpen, setFastServiceOpen] = useState(false);
  const [allClients, setAllClients] = useState<{id: string, name: string, notes?: string}[]>([]);
  const [activeEmployees, setActiveEmployees] = useState<{id: string, name: string}[]>([]);
  const [fastServiceData, setFastServiceData] = useState({ client_id: '', amount: '', status: 'pending' as 'pending' | 'paid', assigned_employee_id: '' });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showSmartBanner, setShowSmartBanner] = useState(false);
  const [smartBannerCount, setSmartBannerCount] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    if (business) {
      fetchDashboardData();
    }
  }, [business]);

  const fetchDashboardData = async () => {
    if (!business) return;
    setLoading(true);

    try {
      const hoy = new Date();
      const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString();
      const hoyISO = hoy.toISOString();

      const [
        { data: cobradoData },
        { data: pendienteData },
        { count: clientesCount },
        { count: serviciosCount }
      ] = await Promise.all([
        supabase.from('services').select('amount').eq('business_id', business.id).eq('status', 'paid').gte('date', primerDiaMes).lte('date', hoyISO),
        supabase.from('services').select('amount').eq('business_id', business.id).eq('status', 'pending'),
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('business_id', business.id).eq('active', true),
        supabase.from('services').select('id', { count: 'exact', head: true }).eq('business_id', business.id).gte('date', primerDiaMes)
      ]);

      const { count: totalServicesCount } = await supabase.from('services').select('id', { count: 'exact', head: true }).eq('business_id', business.id);
      const { data: clientsData } = await supabase.from('clients').select('id, name, notes').eq('business_id', business.id).eq('active', true);
      const { data: employeesData } = await supabase.from('employees').select('id, name').eq('business_id', business.id).eq('is_active', true);
      setAllClients(clientsData || []);
      setActiveEmployees(employeesData || []);

      const totalCobrado = (cobradoData || []).reduce((acc, curr) => acc + Number(curr.amount), 0);
      const totalPendiente = (pendienteData || []).reduce((acc, curr) => acc + Number(curr.amount), 0);
      const hasPaymentConfig = !!(business.zelle_info || business.venmo_info || business.cashapp_info);

      setStats({
        totalCobrado,
        totalPendiente,
        clientesActivos: clientesCount || 0,
        serviciosMes: serviciosCount || 0,
        totalServicios: totalServicesCount || 0,
        hasPaymentConfig,
        hasClients: (clientesCount || 0) > 0
      });

      const { data: allPending } = await supabase
        .from('services')
        .select('amount, date, clients(id, name, phone)')
        .eq('business_id', business.id)
        .eq('status', 'pending');

      const debtorsMap: Record<string, PendingDebtor> = {};
      (allPending || []).forEach((s: any) => {
        const client = s.clients;
        if (!client) return;
        
        const days = Math.floor((Date.now() - new Date(s.date).getTime()) / (1000 * 60 * 60 * 24));
        
        if (!debtorsMap[client.id]) {
          debtorsMap[client.id] = {
            client_id: client.id,
            name: client.name,
            phone: client.phone,
            total_pending: 0,
            oldest_pending_days: days
          };
        }
        
        debtorsMap[client.id].total_pending += Number(s.amount);
        if (days > debtorsMap[client.id].oldest_pending_days) {
          debtorsMap[client.id].oldest_pending_days = days;
        }
      });

      setPendingDebtors(
        Object.values(debtorsMap)
          .sort((a, b) => b.total_pending - a.total_pending)
          .slice(0, 5)
      );

      let pendingOver7Count = 0;
      Object.values(debtorsMap).forEach(d => {
         if (d.oldest_pending_days > 7) pendingOver7Count++;
      });
      if (pendingOver7Count > 0 && localStorage.getItem(`banner_${business.id}`) !== hoyISO.split('T')[0]) {
         setShowSmartBanner(true);
         setSmartBannerCount(pendingOver7Count);
      } else {
         setShowSmartBanner(false);
      }

      const { data: recent } = await supabase
        .from('services')
        .select('id, date, amount, status, clients(name)')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })
        .limit(8);

      setRecentServices((recent || []).map((r: any) => ({
        id: r.id,
        date: r.date,
        amount: Number(r.amount),
        status: r.status,
        client_name: r.clients?.name || 'Cliente desconocido'
      })));

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFastService = async (e: FormEvent) => {
    e.preventDefault();
    if (!business || !fastServiceData.client_id || !fastServiceData.amount) return;
    try {
      const { error } = await supabase.from('services').insert({
        business_id: business.id,
        client_id: fastServiceData.client_id,
        amount: Number(fastServiceData.amount),
        date: new Date().toISOString().split('T')[0],
        status: fastServiceData.status,
        assigned_employee_id: fastServiceData.assigned_employee_id || null,
      });
      if (error) throw error;
      toast.success('Servicio rápido registrado');
      setFastServiceOpen(false);
      setFastServiceData({ client_id: '', amount: '', status: 'pending', assigned_employee_id: '' });
      fetchDashboardData();
    } catch (err: any) {
      const queue = JSON.parse(localStorage.getItem(`offline_queue_${business.id}`) || '[]');
      queue.push({
        business_id: business.id,
        client_id: fastServiceData.client_id,
        amount: Number(fastServiceData.amount),
        date: new Date().toISOString().split('T')[0],
        status: fastServiceData.status,
        assigned_employee_id: fastServiceData.assigned_employee_id || null,
      });
      localStorage.setItem(`offline_queue_${business.id}`, JSON.stringify(queue));
      toast.success('Guardado sin conexión. Se sincronizará luego.');
      setFastServiceOpen(false);
      setFastServiceData({ client_id: '', amount: '', status: 'pending', assigned_employee_id: '' });
      fetchDashboardData();
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    const success = await generateMonthlyPDF(business);
    if (success) toast.success('Reporte descargado correctamente');
    setIsGeneratingPdf(false);
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const showOnboarding = stats && (!stats.hasClients || !stats.totalServicios || !stats.hasPaymentConfig) && localStorage.getItem(`onboarding_${business?.id}`) !== 'true';

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Buenos días, {business?.business_name || 'Negocio'} 👋</h1>
          <p className="text-[var(--text-secondary)] mt-1">Mira cómo va tu negocio este mes</p>
        </div>
        <div className="flex items-center flex-wrap gap-3 mt-4 md:mt-0">
          <Button 
            variant="secondary" 
            onClick={handleDownloadPDF}
            loading={isGeneratingPdf}
          >
            <FileText className="w-4 h-4" />
            Reporte PDF
          </Button>
          <Button 
            onClick={() => setFastServiceOpen(true)}
          >
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Servicio rápido</span>
            <span className="sm:hidden">Rápido</span>
          </Button>
        </div>
      </header>

      {/* Smart Banner */}
      {showSmartBanner && (
        <Card variant="subtle" className="flex flex-col md:flex-row md:items-center justify-between border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.08)] py-3 px-5">
          <div className="flex items-center gap-3 text-[var(--warning)]">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <p className="text-sm font-medium">Tienes {smartBannerCount} clientes con cobros de más de 7 días.</p>
          </div>
          <div className="flex items-center gap-4 mt-3 md:mt-0">
            <NavLink to="/pending" className="text-sm font-bold text-[var(--warning)] hover:underline whitespace-nowrap">Ver cobros →</NavLink>
            <button 
              onClick={() => {
                setShowSmartBanner(false);
                localStorage.setItem(`banner_${business?.id}`, new Date().toISOString().split('T')[0]);
              }}
              className="text-[var(--warning)] opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </Card>
      )}

      {/* Onboarding Checklist */}
      {showOnboarding && stats && (
        <Card variant="elevated" padding="lg" className="border-[var(--accent)]/30 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2 uppercase tracking-tight">¡Bienvenido a Velora Pure! 🚀</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-6 font-medium">Completa estos 3 pasos para empezar:</p>
          
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {stats.hasClients ? <CheckCircle2 className="w-6 h-6 text-[var(--success)]" /> : <div className="w-6 h-6 rounded-full border-2 border-[var(--border)]" />}
                <p className={cn("font-medium", stats.hasClients ? "text-[var(--text-secondary)] line-through" : "text-[var(--text-primary)]")}>Agrega tu primer cliente</p>
              </div>
              {!stats.hasClients && <Button variant="ghost" size="sm" onClick={() => navigate('/clients')}>Agregar →</Button>}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {stats.totalServicios > 0 ? <CheckCircle2 className="w-6 h-6 text-[var(--success)]" /> : <div className="w-6 h-6 rounded-full border-2 border-[var(--border)]" />}
                <p className={cn("font-medium", stats.totalServicios > 0 ? "text-[var(--text-secondary)] line-through" : "text-[var(--text-primary)]")}>Registra tu primer servicio</p>
              </div>
              {!stats.totalServicios && <Button variant="ghost" size="sm" onClick={() => setFastServiceOpen(true)}>Registrar →</Button>}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {stats.hasPaymentConfig ? <CheckCircle2 className="w-6 h-6 text-[var(--success)]" /> : <div className="w-6 h-6 rounded-full border-2 border-[var(--border)]" />}
                <p className={cn("font-medium", stats.hasPaymentConfig ? "text-[var(--text-secondary)] line-through" : "text-[var(--text-primary)]")}>Configura tus métodos de pago</p>
              </div>
              {!stats.hasPaymentConfig && <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>Configurar →</Button>}
            </div>
          </div>
          
          {stats.hasClients && stats.totalServicios > 0 && stats.hasPaymentConfig && (
            <Button 
              onClick={() => {
                localStorage.setItem(`onboarding_${business?.id}`, 'true');
                fetchDashboardData(); 
              }}
              className="mt-8 w-full"
              size="lg"
            >
              ¡Comenzar a usar Velora Pure!
            </Button>
          )}
        </Card>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard 
          title="Cobrado este mes" 
          value={formatCurrency(stats?.totalCobrado || 0)} 
          icon={DollarSign}
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard 
          title="Pendiente total" 
          value={formatCurrency(stats?.totalPendiente || 0)} 
          icon={Clock}
          trend={{ value: 5, isPositive: false }}
        />
        <MetricCard 
          title="Clientes activos" 
          value={stats?.clientesActivos.toString() || '0'} 
          icon={Users}
        />
        <MetricCard 
          title="Servicios este mes" 
          value={stats?.serviciosMes.toString() || '0'} 
          icon={ClipboardList}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Debts Column */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
              <AlertCircle className="w-5 h-5 text-[var(--warning)]" />
              Cobros pendientes
            </h2>
            <NavLink to="/pending" className="text-sm font-semibold text-[var(--accent)] hover:underline">Ver todos →</NavLink>
          </div>
          
          <Card className="divide-y divide-[var(--border)]">
            {pendingDebtors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-[var(--success)] mb-3 opacity-20" />
                <p className="text-[var(--text-secondary)]">✅ No tienes cobros pendientes</p>
              </div>
            ) : (
              pendingDebtors.map(debtor => (
                <div key={debtor.client_id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0 group">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                      style={{ backgroundColor: `${avatarColor(debtor.name)}20`, color: avatarColor(debtor.name) }}
                    >
                      {getInitials(debtor.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[var(--text-primary)] truncate">{debtor.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">Atraso de {debtor.oldest_pending_days} días</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className={cn(
                        "font-mono text-right text-[16px] font-semibold",
                        debtor.oldest_pending_days > 30 ? "text-[var(--danger)]" : debtor.oldest_pending_days > 14 ? "text-[var(--warning)]" : "text-[var(--text-primary)]"
                      )}>
                        {formatCurrency(debtor.total_pending)}
                      </p>
                      <button 
                        onClick={() => window.open(`https://wa.me/1${debtor.phone.replace(/\D/g,'')}`, '_blank')}
                        className="text-[var(--success)] opacity-60 hover:opacity-100 transition-opacity mt-1"
                        title="Enviar mensaje por WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </Card>
        </section>

        {/* Recent Activity Column */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
              <ClipboardList className="w-5 h-5 text-[var(--accent)]" />
              Actividad reciente
            </h2>
            <NavLink to="/services" className="text-sm font-semibold text-[var(--accent)] hover:underline">Ver servicios →</NavLink>
          </div>

          <Card className="divide-y divide-[var(--border)]">
            {recentServices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                 <ClipboardList className="w-12 h-12 text-[var(--text-secondary)] mb-3 opacity-20" />
                 <p className="text-[var(--text-secondary)]">No hay servicios registrados aún</p>
              </div>
            ) : (
              recentServices.map(service => (
                <div key={service.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0 group">
                  <div className="flex items-center gap-4">
                    <div className="text-xs font-bold text-[var(--text-muted)] w-10 uppercase">{formatDateShort(service.date)}</div>
                    <div>
                      <p className="font-semibold text-sm text-[var(--text-primary)]">{service.client_name}</p>
                      <p className="font-mono text-sm text-[var(--text-secondary)]">{formatCurrency(service.amount)}</p>
                    </div>
                  </div>
                  <Badge variant={service.status === 'paid' ? 'success' : 'warning'}>
                    {service.status === 'paid' ? 'Pagado' : 'Pendiente'}
                  </Badge>
                </div>
              ))
            )}
          </Card>
        </section>
      </div>

      {/* Fast Service Modal */}
      <Modal isOpen={fastServiceOpen} onClose={() => setFastServiceOpen(false)} title="Registrar Servicio Rápido">
        <form onSubmit={handleFastService} className="space-y-5">
          {fastServiceData.client_id && allClients.find(c => c.id === fastServiceData.client_id)?.notes && (
            <div className="p-4 bg-[var(--warning)]/5 border border-[var(--warning)]/20 rounded-xl flex gap-3">
              <AlertTriangle className="w-5 h-5 text-[var(--warning)] shrink-0" />
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-[var(--warning)] uppercase tracking-widest">Nota Importante</p>
                <p className="text-sm text-[var(--text-primary)]">{allClients.find(c => c.id === fastServiceData.client_id)?.notes}</p>
              </div>
            </div>
          )}

          <Select 
            label="Seleccionar Cliente"
            required
            value={fastServiceData.client_id}
            onChange={e => setFastServiceData({...fastServiceData, client_id: e.target.value})}
          >
            <option value="">Buscar cliente...</option>
            {allClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>

          <Input 
            label="Monto del Servicio ($)"
            type="number"
            required
            placeholder="0.00"
            value={fastServiceData.amount}
            onChange={e => setFastServiceData({...fastServiceData, amount: e.target.value})}
          />

          <Select 
            label="Asignar Empleado (Opcional)"
            value={fastServiceData.assigned_employee_id}
            onChange={e => setFastServiceData({...fastServiceData, assigned_employee_id: e.target.value})}
          >
            <option value="">Sin asignar</option>
            {activeEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[var(--text-secondary)] px-1">Estado de Pago</label>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setFastServiceData({...fastServiceData, status: 'pending'})}
                className={cn(
                  "flex-1 py-3 rounded-xl border text-sm font-bold transition-all",
                  fastServiceData.status === 'pending' 
                    ? "bg-[var(--warning)]/10 border-[var(--warning)] text-[var(--warning)] shadow-[0_0_12px_rgba(251,191,36,0.1)]" 
                    : "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)]"
                )}
              >PENDIENTE</button>
              <button 
                type="button"
                onClick={() => setFastServiceData({...fastServiceData, status: 'paid'})}
                className={cn(
                  "flex-1 py-3 rounded-xl border text-sm font-bold transition-all",
                  fastServiceData.status === 'paid' 
                    ? "bg-[var(--success)]/10 border-[var(--success)] text-[var(--success)] shadow-[0_0_12px_rgba(52,211,153,0.1)]" 
                    : "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)]"
                )}
              >PAGADO</button>
            </div>
          </div>
          
          <div className="pt-4">
            <Button type="submit" className="w-full" size="lg">Guardar Registro</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="w-48 h-8 bg-[var(--bg-card)] rounded-lg animate-pulse" />
        <div className="w-64 h-4 bg-[var(--bg-card)] rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-[var(--bg-card)] rounded-2xl animate-pulse" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-[400px] bg-[var(--bg-card)] rounded-2xl animate-pulse" />
        <div className="h-[400px] bg-[var(--bg-card)] rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}

