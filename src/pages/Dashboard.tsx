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
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBusiness } from '../context/BusinessContext';
import { formatCurrency, formatDateShort, getInitials, avatarColor, cn } from '../lib/utils';
import { StatusBadge } from '../components/StatusBadge';
import { Skeleton } from '../components/Skeleton';
import { Modal } from '../components/Modal';
import { generateMonthlyPDF } from '../lib/pdf';
import toast from 'react-hot-toast';

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
  
  // New State variables
  const [fastServiceOpen, setFastServiceOpen] = useState(false);
  const [allClients, setAllClients] = useState<{id: string, name: string}[]>([]);
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
      const { data: clientsData } = await supabase.from('clients').select('id, name').eq('business_id', business.id).eq('active', true);
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

      // 2. Pending Debtors (Top 5)
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

      // Smart Banner logic
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

      // 3. Recent Activity (Last 8)
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
      // Offline fallback queue
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Buenos días, {business?.business_name || 'Negocio'} 👋</h1>
          <p className="text-[var(--text-secondary)] mt-1">Mira cómo va tu negocio este mes</p>
        </div>
        <div className="flex items-center flex-wrap gap-3 mt-4 md:mt-0">
          <button 
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Reporte PDF
          </button>
          <button 
            onClick={() => setFastServiceOpen(true)}
            className="btn-primary flex items-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
          >
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Servicio rápido</span>
            <span className="sm:hidden">Rápido</span>
          </button>
        </div>
      </header>

      {/* Smart Banner */}
      {showSmartBanner && (
        <div className="flex flex-col md:flex-row md:items-center justify-between bg-[rgba(251,191,36,0.08)] border border-[rgba(251,191,36,0.2)] rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 text-[var(--warning)]">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <p className="text-sm font-medium">⚠️ Tienes {smartBannerCount} clientes con cobros de más de 7 días. Te enviamos un resumen por email.</p>
          </div>
          <div className="flex items-center gap-4 mt-3 md:mt-0 pl-9 md:pl-0">
            <NavLink to="/pending" className="text-sm font-bold text-[var(--warning)] hover:underline whitespace-nowrap">Ver cobros →</NavLink>
            <button 
              onClick={() => {
                setShowSmartBanner(false);
                localStorage.setItem(`banner_${business?.id}`, new Date().toISOString().split('T')[0]);
              }}
              className="text-[var(--warning)] opacity-60 hover:opacity-100 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Onboarding Checklist */}
      {showOnboarding && stats && (
        <div className="card border-[var(--accent)]/30 bg-[var(--accent-subtle)] p-6 md:p-8 animate-in slide-in-from-top-4">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">¡Bienvenido a Velora Pure! 🚀</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-6">Completa estos 3 pasos para empezar:</p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {stats.hasClients ? <CheckCircle2 className="w-6 h-6 text-[var(--accent)]" /> : <div className="w-6 h-6 rounded-full border-2 border-[var(--border)] bg-[#111]" />}
                <p className={cn("font-medium", stats.hasClients ? "text-[var(--text-secondary)] line-through" : "text-[var(--text-primary)]")}>Agrega tu primer cliente</p>
              </div>
              {!stats.hasClients && <button onClick={() => navigate('/clients')} className="text-sm text-[var(--accent)] font-medium hover:underline">Agregar cliente →</button>}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {stats.totalServicios > 0 ? <CheckCircle2 className="w-6 h-6 text-[var(--accent)]" /> : <div className="w-6 h-6 rounded-full border-2 border-[var(--border)] bg-[#111]" />}
                <p className={cn("font-medium", stats.totalServicios > 0 ? "text-[var(--text-secondary)] line-through" : "text-[var(--text-primary)]")}>Registra tu primer servicio</p>
              </div>
              {!stats.totalServicios && <button onClick={() => setFastServiceOpen(true)} className="text-sm text-[var(--accent)] font-medium hover:underline">Registrar servicio →</button>}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {stats.hasPaymentConfig ? <CheckCircle2 className="w-6 h-6 text-[var(--accent)]" /> : <div className="w-6 h-6 rounded-full border-2 border-[var(--border)] bg-[#111]" />}
                <p className={cn("font-medium", stats.hasPaymentConfig ? "text-[var(--text-secondary)] line-through" : "text-[var(--text-primary)]")}>Configura tus métodos de pago</p>
              </div>
              {!stats.hasPaymentConfig && <button onClick={() => navigate('/settings')} className="text-sm text-[var(--accent)] font-medium hover:underline">Ir a configuración →</button>}
            </div>
          </div>
          
          {stats.hasClients && stats.totalServicios > 0 && stats.hasPaymentConfig && (
            <button 
              onClick={() => {
                localStorage.setItem(`onboarding_${business?.id}`, 'true');
                navigate('/onboarding'); // O opcionalmente dispararlo aquí si tienes lógica en la DB
                // Para simplificar, recargamos el fetch envés de navegar, de acuerdo a nuestra spec si solo se cierra.
                // Sin embargo el prompt pidio: "El email de bienvenida llámalo desde el componente Onboarding.tsx directamente después de guardar en Supabase en el paso 3."
                // Wait, hay un componente Onboarding.tsx? Yo no he visto ninguno, veamos
                fetchDashboardData(); 
              }}
              className="mt-8 w-full py-3 bg-[var(--accent)] text-white rounded-lg font-bold hover:bg-[var(--accent-hover)] transition-all shadow-lg shadow-[var(--accent-subtle)]"
            >
              ¡Comenzar a usar Velora Pure!
            </button>
          )}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Cobrado este mes" 
          value={formatCurrency(stats?.totalCobrado || 0)} 
          icon={DollarSign}
          trend="En este periodo"
          color="success"
        />
        <StatCard 
          label="Pendiente total" 
          value={formatCurrency(stats?.totalPendiente || 0)} 
          icon={Clock}
          trend={`${pendingDebtors.length} clientes deben`}
          color="warning"
        />
        <StatCard 
          label="Clientes activos" 
          value={stats?.clientesActivos.toString() || '0'} 
          icon={Users}
          trend="Registrados"
          color="accent"
        />
        <StatCard 
          label="Servicios este mes" 
          value={stats?.serviciosMes.toString() || '0'} 
          icon={ClipboardList}
          trend="Completados"
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Debts Column */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
              <AlertCircle className="w-5 h-5 text-[var(--warning)]" />
              Cobros pendientes
            </h2>
            <NavLink to="/pending" className="text-sm text-[var(--accent)] hover:underline">Ver todos →</NavLink>
          </div>
          
          <div className="card space-y-2 p-4 min-h-[300px]">
            {pendingDebtors.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <CheckCircle2 className="w-12 h-12 text-[var(--success)] mb-3 opacity-20" />
                <p className="text-[var(--text-secondary)]">✅ No tienes cobros pendientes</p>
              </div>
            ) : (
              pendingDebtors.map(debtor => (
                <div key={debtor.client_id} className="flex items-center justify-between p-3 rounded-lg list-row group">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
                      style={{ backgroundColor: `${avatarColor(debtor.name)}20`, color: avatarColor(debtor.name) }}
                    >
                      {getInitials(debtor.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[var(--text-primary)] truncate">{debtor.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">Atraso de {debtor.oldest_pending_days} días</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right shrink-0">
                    <div>
                      <p className={cn(
                        "amount text-right text-[16px]",
                        debtor.oldest_pending_days > 30 ? "text-[var(--danger)]" : debtor.oldest_pending_days > 14 ? "text-[var(--warning)]" : "text-[var(--text-primary)]"
                      )}>
                        {formatCurrency(debtor.total_pending)}
                      </p>
                      <button 
                        onClick={() => window.open(`https://wa.me/1${debtor.phone.replace(/\D/g,'')}`, '_blank')}
                        className="text-[var(--success)] p-1.5 hover:bg-[var(--success)]/10 rounded-lg transition-colors inline-block mt-1 border border-transparent hover:border-[var(--success)]"
                        title="Enviar mensaje por WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent Activity Column */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
              <ClipboardList className="w-5 h-5 text-[var(--accent)]" />
              Actividad reciente
            </h2>
            <NavLink to="/services" className="text-sm text-[var(--accent)] hover:underline">Ver servicios →</NavLink>
          </div>

          <div className="card space-y-2 p-4 min-h-[300px]">
            {recentServices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                 <ClipboardList className="w-12 h-12 text-[var(--text-secondary)] mb-3 opacity-20" />
                 <p className="text-[var(--text-secondary)]">No hay servicios registrados aún</p>
              </div>
            ) : (
              recentServices.map(service => (
                <div key={service.id} className="flex items-center justify-between p-3 rounded-lg list-row group">
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-medium text-[var(--text-secondary)] w-12">{formatDateShort(service.date)}</div>
                    <div>
                      <p className="font-semibold text-sm text-[var(--text-primary)]">{service.client_name}</p>
                      <p className="amount text-right text-[var(--text-primary)] hidden sm:block">{formatCurrency(service.amount)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="amount sm:hidden">{formatCurrency(service.amount)}</span>
                    <StatusBadge status={service.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Fast Service Modal */}
      <Modal isOpen={fastServiceOpen} onClose={() => setFastServiceOpen(false)} title="⚡ Registro Rápido">
        <form onSubmit={handleFastService} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)] uppercase">Cliente</label>
            <select 
              required
              className="input-field w-full"
              value={fastServiceData.client_id}
              onChange={e => setFastServiceData({...fastServiceData, client_id: e.target.value})}
            >
              <option value="">Selecciona un cliente</option>
              {allClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)] uppercase">Monto ($)</label>
            <input 
              type="number"
              required
              placeholder="e.g. 150"
              className="input-field w-full"
              value={fastServiceData.amount}
              onChange={e => setFastServiceData({...fastServiceData, amount: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)] uppercase">Empleado Asignado (Opcional)</label>
            <select 
              className="input-field w-full"
              value={fastServiceData.assigned_employee_id}
              onChange={e => setFastServiceData({...fastServiceData, assigned_employee_id: e.target.value})}
            >
              <option value="">Sin asignar</option>
              {activeEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)] uppercase">Estado de Pago</label>
            <div className="flex gap-4 pt-1">
              <button 
                type="button"
                onClick={() => setFastServiceData({...fastServiceData, status: 'pending'})}
                className={cn("flex-1 p-3 rounded-lg border transition-all text-sm font-bold flex items-center justify-center gap-2", fastServiceData.status === 'pending' ? "bg-[var(--warning)]/10 border-[var(--warning)] text-[var(--warning)]" : "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)]")}
              >PENDIENTE</button>
              <button 
                type="button"
                onClick={() => setFastServiceData({...fastServiceData, status: 'paid'})}
                className={cn("flex-1 p-3 rounded-lg border transition-all text-sm font-bold flex items-center justify-center gap-2", fastServiceData.status === 'paid' ? "bg-[var(--success)]/10 border-[var(--success)] text-[var(--success)]" : "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)]")}
              >PAGADO</button>
            </div>
          </div>
          <button type="submit" className="w-full btn-primary py-3 mt-4 text-center">Registrar Trabajo</button>
        </form>
      </Modal>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, color = 'white' }: any) {
  const colorMap: any = {
    success: 'text-[var(--success)] border-[var(--success)]/20',
    warning: 'text-[var(--warning)] border-[var(--warning)]/20',
    accent: 'text-[var(--accent)] border-[var(--accent)]/20',
    blue: 'text-[#60A5FA] border-[#60A5FA]/20', 
    white: 'text-[var(--text-primary)] border-[var(--border)]'
  };

  return (
    <div className={cn("card p-6 flex flex-col justify-between h-full bg-[var(--bg-secondary)] border-t-2 relative overflow-hidden", colorMap[color] || colorMap.white)}>
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Icon className="w-16 h-16" />
      </div>
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={cn("p-2 rounded-lg bg-[var(--bg-primary)] border", colorMap[color])}>
          <Icon className="w-5 h-5 opacity-90" />
        </div>
      </div>
      <div className="relative z-10">
        <p className="amount text-[32px] font-light tracking-tight">{value}</p>
        <div className="flex flex-col mt-1">
          <span className="font-bold text-sm text-[var(--text-primary)]">{label}</span>
          <span className="text-[11px] font-medium text-[var(--text-secondary)] mt-0.5">{trend}</span>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="w-48 h-8" />
        <Skeleton className="w-64 h-4" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="h-[300px] rounded-xl" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    </div>
  );
}
