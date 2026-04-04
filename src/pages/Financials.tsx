import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Target,
  Filter,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useBusiness } from '../context/BusinessContext';
import { formatCurrency, cn } from '../lib/utils';
import { 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  format, 
  parseISO,
  endOfDay,
  eachMonthOfInterval
} from 'date-fns';
import { es } from 'date-fns/locale';

// New UI Components
import { Card } from '../components/ui/Card';
import { MetricCard } from '../components/ui/MetricCard';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';

type Period = 'this_month' | 'last_month' | '3_months' | '6_months' | '12_months';

interface FinanceStats {
  totalCollected: number;
  totalPending: number;
  avgTicket: number;
  completedServices: number;
}

interface MonthlyData {
  name: string;
  total: number;
  count: number;
}

interface TopClient {
  id: string;
  name: string;
  servicesCount: number;
  totalGenerated: number;
  avgTicket: number;
}

export default function Financials() {
  const { business } = useBusiness();
  const [period, setPeriod] = useState<Period>('6_months');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FinanceStats>({ totalCollected: 0, totalPending: 0, avgTicket: 0, completedServices: 0 });
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [comparison, setComparison] = useState<{ current: number, previous: number, change: number, isPositive: boolean }>({ current: 0, previous: 0, change: 0, isPositive: true });

  useEffect(() => {
    if (business) {
      fetchFinancialData();
    }
  }, [business, period]);

  const fetchFinancialData = async () => {
    if (!business) return;
    setLoading(true);

    try {
      const now = new Date();
      let startDate: Date;
      let endDate = endOfDay(now);

      switch (period) {
        case 'this_month':
          startDate = startOfMonth(now);
          break;
        case 'last_month':
          startDate = startOfMonth(subMonths(now, 1));
          endDate = endOfMonth(subMonths(now, 1));
          break;
        case '3_months':
          startDate = startOfMonth(subMonths(now, 2));
          break;
        case '6_months':
          startDate = startOfMonth(subMonths(now, 5));
          break;
        case '12_months':
          startDate = startOfMonth(subMonths(now, 11));
          break;
        default:
          startDate = startOfMonth(subMonths(now, 5));
      }

      // 1. Fetch all services for the period
      const { data: servicesData, error } = await supabase
        .from('services')
        .select(`
          id,
          amount,
          status,
          date,
          client_id,
          clients (name)
        `)
        .eq('business_id', business.id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'));

      if (error) throw error;

      // 2. Calculate Main Stats
      const paidServices = servicesData.filter(s => s.status === 'paid');
      const pendingServices = servicesData.filter(s => s.status === 'pending');
      
      const totalCollected = paidServices.reduce((sum, s) => sum + Number(s.amount), 0);
      const totalPending = pendingServices.reduce((sum, s) => sum + Number(s.amount), 0);
      const completedServices = paidServices.length;
      const avgTicket = completedServices > 0 ? totalCollected / completedServices : 0;

      setStats({ totalCollected, totalPending, avgTicket, completedServices });

      // 3. Prepare Chart Data (Income by month)
      const months = eachMonthOfInterval({ start: startDate, end: now });
      const monthlyAgg: MonthlyData[] = months.map(m => ({
        name: format(m, 'MMM', { locale: es }).replace(/^\w/, c => c.toUpperCase()),
        total: 0,
        count: 0
      }));

      paidServices.forEach(s => {
        const sDate = parseISO(s.date);
        const monthName = format(sDate, 'MMM', { locale: es }).replace(/^\w/, c => c.toUpperCase());
        const entry = monthlyAgg.find(m => m.name === monthName);
        if (entry) {
          entry.total += Number(s.amount);
          entry.count += 1;
        }
      });
      setChartData(monthlyAgg);

      // 4. Top 5 Clients
      const clientAgg: Record<string, TopClient> = {};
      paidServices.forEach(s => {
        const clientId = s.client_id;
        const clientName = (s.clients as any)?.name || 'Cliente Desconocido';
        if (!clientAgg[clientId]) {
          clientAgg[clientId] = { id: clientId, name: clientName, servicesCount: 0, totalGenerated: 0, avgTicket: 0 };
        }
        clientAgg[clientId].servicesCount += 1;
        clientAgg[clientId].totalGenerated += Number(s.amount);
      });

      const top5 = Object.values(clientAgg)
        .map(c => ({ ...c, avgTicket: c.totalGenerated / c.servicesCount }))
        .sort((a, b) => b.totalGenerated - a.totalGenerated)
        .slice(0, 5);
      
      setTopClients(top5);

      // 5. Month-over-Month Comparison
      const currentMonthStart = startOfMonth(now);
      const prevMonthStart = startOfMonth(subMonths(now, 1));
      const prevMonthEnd = endOfMonth(subMonths(now, 1));

      const { data: compData } = await supabase
        .from('services')
        .select('amount, date')
        .eq('business_id', business.id)
        .eq('status', 'paid')
        .gte('date', format(prevMonthStart, 'yyyy-MM-dd'))
        .lte('date', format(now, 'yyyy-MM-dd'));

      const currentMonthTotal = (compData || [])
        .filter(s => parseISO(s.date) >= currentMonthStart)
        .reduce((sum, s) => sum + Number(s.amount), 0);
      
      const prevMonthTotal = (compData || [])
        ?.filter(s => {
          const d = parseISO(s.date);
          return d >= prevMonthStart && d <= prevMonthEnd;
        })
        .reduce((sum, s) => sum + Number(s.amount), 0) || 0;

      const diff = currentMonthTotal - prevMonthTotal;
      const percentChange = prevMonthTotal > 0 ? (diff / prevMonthTotal) * 100 : 0;
      
      setComparison({
        current: currentMonthTotal,
        previous: prevMonthTotal,
        change: Math.abs(percentChange),
        isPositive: diff >= 0
      });

    } catch (error: any) {
      console.error('Error fetching financials:', error);
    } finally {
      setLoading(false);
    }
  };

  const periodOptions = [
    { value: 'this_month', label: 'Mes en curso' },
    { value: 'last_month', label: 'Cierre anterior' },
    { value: '3_months', label: 'Trimestre' },
    { value: '6_months', label: 'Semestre' },
    { value: '12_months', label: 'Anual' },
  ];

  if (loading) return <FinancialsSkeleton />;

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header & Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative">
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-[var(--accent)] rounded-r-full blur-[2px]" />
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Análisis Financiero</h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium opacity-80 italic">Seguimiento de ingresos y rentabilidad operativa</p>
        </div>
        <div className="w-full md:w-72">
           <Select 
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            icon={Filter}
            className="bg-[var(--bg-secondary)] border-[var(--border)]"
           >
             {periodOptions.map(opt => (
               <option key={opt.value} value={opt.value}>{opt.label}</option>
             ))}
           </Select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Facturación Total"
          value={formatCurrency(stats.totalCollected)}
          icon={DollarSign}
          subtitle="Ingresos confirmados"
          className="border-none bg-gradient-to-br from-[var(--bg-card)] to-[#16162a]"
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard 
          title="Cartera Pendiente"
          value={formatCurrency(stats.totalPending)}
          icon={Clock}
          subtitle="Cuentas por cobrar"
          className="border-none bg-gradient-to-br from-[var(--bg-card)] to-[#1a1425]"
        />
        <MetricCard 
          title="Ticket Promedio"
          value={formatCurrency(stats.avgTicket)}
          icon={Target}
          subtitle="Valor por visita"
          className="border-none bg-gradient-to-br from-[var(--bg-card)] to-[#121a2c]"
        />
        <MetricCard 
          title="Servicios"
          value={stats.completedServices}
          icon={Activity}
          subtitle="Trabajos liquidados"
          className="border-none bg-gradient-to-br from-[var(--bg-card)] to-[#151d1e]"
        />
      </div>

      {/* Main Charts & Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Income Chart */}
        <Card variant="elevated" padding="none" className="lg:col-span-2 border-[var(--border)] overflow-hidden">
          <div className="p-7 pb-0 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Historial de Ingresos</h3>
              <p className="text-[10px] text-[var(--text-muted)] mt-1 uppercase font-black tracking-[0.2em]">Facturación mensual neta</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" className="bg-[var(--success)]/10 text-[var(--success)] border-none">
                <TrendingUp className="w-3 h-3 mr-1" /> Tendencia Positiva
              </Badge>
            </div>
          </div>
          
          <div className="h-[360px] w-full mt-4 pr-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.1} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }} 
                  tickFormatter={(val) => `$${val > 999 ? (val/1000).toFixed(1)+'k' : val}`}
                />
                <Tooltip 
                  cursor={{ stroke: 'var(--accent)', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border)', 
                    borderRadius: '16px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    border: '1px solid var(--border-soft)',
                    padding: '12px'
                  }}
                  itemStyle={{ 
                    color: 'var(--text-primary)', 
                    fontSize: '14px', 
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)'
                  }}
                  labelStyle={{
                    color: 'var(--text-muted)',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '4px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="var(--accent)" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Comparison Section */}
        <Card variant="elevated" padding="none" className="flex flex-col border-[var(--border)] overflow-hidden">
          <div className="p-7">
            <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Cierre de Período</h3>
            <p className="text-[10px] text-[var(--text-muted)] mt-1 uppercase font-black tracking-[0.2em]">Rendimiento Mensual</p>
          </div>

          <div className="flex-1 px-7 space-y-10">
             <div className="space-y-2">
                <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Total Acumulado</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl font-black font-mono tracking-tighter text-[var(--text-primary)]">
                    {formatCurrency(comparison.current)}
                  </p>
                </div>
             </div>

             <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Mes Anterior</p>
                    <p className="text-xl font-bold font-mono text-[var(--text-secondary)] opacity-80">
                      {formatCurrency(comparison.previous)}
                    </p>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border shadow-lg transition-transform hover:scale-105",
                    comparison.isPositive 
                      ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20 shadow-[var(--success)]/5" 
                      : "bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20 shadow-[var(--danger)]/5"
                  )}>
                    {comparison.isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {comparison.change.toFixed(1)}%
                  </div>
                </div>
                
                <div className="w-full h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden border border-[var(--border)]">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      comparison.isPositive ? "bg-[var(--success)]" : "bg-[var(--danger)]"
                    )}
                    style={{ width: `${Math.min(100, comparison.change * 2)}%` }}
                  />
                </div>
             </div>
          </div>

          <div className="p-7 mt-auto bg-[var(--bg-secondary)]/30 border-t border-[var(--border)]">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-[var(--accent-subtle)] rounded-lg">
                 <Zap className="w-4 h-4 text-[var(--accent)]" />
               </div>
               <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium italic">
                 El crecimiento se actualiza en tiempo real basado en pagos confirmados.
               </p>
             </div>
          </div>
        </Card>
      </div>

      {/* Top Clients Table */}
      <Card padding="none" className="overflow-hidden border border-[var(--border)] shadow-2xl">
        <div className="px-8 py-6 border-b border-[var(--border)] border-dashed flex items-center justify-between bg-gradient-to-r from-[var(--bg-card)] to-transparent">
           <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Ranking de Clientes</h3>
              <p className="text-[10px] text-[var(--text-muted)] mt-1 uppercase font-black tracking-[0.2em]">Basado en facturación acumulada</p>
            </div>
            <Badge variant="muted" className="px-4 py-1.5 bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)]">Top 5 Rentabilidad</Badge>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <th className="px-8 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest text-center w-24">Pos.</th>
                <th className="px-8 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Cliente Platinum</th>
                <th className="px-8 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest text-center">Frecuencia</th>
                <th className="px-8 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest text-right">Promedio $</th>
                <th className="px-8 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest text-right">Inversión Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {topClients.map((client, index) => (
                <tr key={client.id} className="hover:bg-[var(--accent)]/[0.03] transition-all duration-300 group">
                  <td className="px-8 py-6 text-center">
                    <span className={cn(
                      "inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-black font-mono shadow-inner border border-transparent transition-all group-hover:scale-110",
                      index === 0 ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/30 border-[var(--accent-light)]/20" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                    )}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-light)] transition-colors tracking-tight">{client.name}</p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-black font-mono text-[var(--text-primary)]">{client.servicesCount}</span>
                      <span className="text-[9px] uppercase font-black text-[var(--text-muted)] tracking-tighter">Visitas</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="text-sm font-bold font-mono text-[var(--text-secondary)]">
                      {formatCurrency(client.avgTicket)}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className={cn(
                      "text-lg font-black font-mono tracking-tighter",
                      index === 0 ? "text-[var(--accent-light)]" : "text-[var(--text-primary)]"
                    )}>
                      {formatCurrency(client.totalGenerated)}
                    </span>
                  </td>
                </tr>
              ))}
              {topClients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <p className="text-[var(--text-muted)] italic font-medium">No hay datos suficientes para generar el ranking en este período.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function FinancialsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-4">
          <div className="h-10 w-64 bg-[var(--bg-card)] rounded-2xl" />
          <div className="h-4 w-96 bg-[var(--bg-card)] rounded-xl" />
        </div>
        <div className="h-14 w-72 bg-[var(--bg-card)] rounded-2xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-36 bg-[var(--bg-card)] rounded-3xl" />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-[420px] bg-[var(--bg-card)] rounded-3xl" />
        <div className="h-[420px] bg-[var(--bg-card)] rounded-3xl" />
      </div>

      <div className="h-96 bg-[var(--bg-card)] rounded-3xl" />
    </div>
  );
}
