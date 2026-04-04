import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  ClipboardList, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
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
        total: 0
      }));

      paidServices.forEach(s => {
        const sDate = parseISO(s.date);
        const monthName = format(sDate, 'MMM', { locale: es }).replace(/^\w/, c => c.toUpperCase());
        const entry = monthlyAgg.find(m => m.name === monthName);
        if (entry) entry.total += Number(s.amount);
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

      // Fetch previous month specifically if not fully covered by current period fetch
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
    { value: 'this_month', label: 'Este mes' },
    { value: 'last_month', label: 'Mes pasado' },
    { value: '3_months', label: 'Últimos 3 meses' },
    { value: '6_months', label: 'Últimos 6 meses' },
    { value: '12_months', label: 'Últimos 12 meses' },
  ];

  if (loading) return <FinancialsSkeleton />;

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Finanzas</h1>
          <p className="text-[var(--text-secondary)] mt-1 text-sm tracking-wide uppercase font-medium opacity-70">
            Análisis de ingresos y rentabilidad
          </p>
        </div>
        <div className="w-full md:w-64">
           <Select 
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            icon={Filter}
           >
             {periodOptions.map(opt => (
               <option key={opt.value} value={opt.value}>{opt.label}</option>
             ))}
           </Select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard 
          title="Total Cobrado"
          value={formatCurrency(stats.totalCollected)}
          icon={DollarSign}
          subtitle="Ingresos en el período"
          className="border-[var(--success)]/10"
        />
        <MetricCard 
          title="Total Pendiente"
          value={formatCurrency(stats.totalPending)}
          icon={Clock}
          subtitle="Por cobrar actualmente"
          className="border-[var(--warning)]/10"
        />
        <MetricCard 
          title="Ticket Promedio"
          value={formatCurrency(stats.avgTicket)}
          icon={TrendingUp}
          subtitle="Valor por servicio"
        />
        <MetricCard 
          title="Completados"
          value={stats.completedServices}
          icon={ClipboardList}
          subtitle="Servicios liquidados"
        />
      </div>

      {/* Main Charts & Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Income Chart */}
        <Card variant="elevated" className="lg:col-span-2 p-7">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Ingresos por Mes</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1 uppercase tracking-widest font-bold">Histórico de facturación</p>
            </div>
            <div className="w-10 h-10 bg-[var(--accent-subtle)] rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[var(--accent)]" />
            </div>
          </div>
          
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.1} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }} 
                />
                <Tooltip 
                  cursor={{ fill: 'var(--bg-hover)', opacity: 0.4 }}
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border)', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-soft)'
                  }}
                  itemStyle={{ 
                    color: 'var(--text-primary)', 
                    fontSize: '13px', 
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)'
                  }}
                />
                <Bar 
                  dataKey="total" 
                  fill="var(--accent)" 
                  radius={[6, 6, 0, 0]} 
                  barSize={period === '12_months' ? 24 : 40}
                >
                   {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.total === Math.max(...chartData.map(d => d.total)) ? 'var(--accent)' : 'var(--accent-subtle)'} 
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Comparison Section */}
        <Card padding="lg" variant="elevated" className="flex flex-col justify-between border-[var(--border-soft)]/50">
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Crecimiento Mensual</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1 uppercase tracking-widest font-bold">Vs. Mes Anterior</p>
          </div>

          <div className="space-y-8 py-4">
             <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Mes Actual</p>
                <p className="text-4xl font-bold font-mono tracking-tighter text-[var(--text-primary)]">
                  {formatCurrency(comparison.current)}
                </p>
             </div>

             <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Mes Anterior</p>
                <div className="flex items-baseline gap-3">
                  <p className="text-2xl font-bold font-mono text-[var(--text-secondary)] opacity-80">
                    {formatCurrency(comparison.previous)}
                  </p>
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border",
                    comparison.isPositive 
                      ? "bg-[rgba(52,211,153,0.1)] text-[var(--success)] border-[rgba(52,211,153,0.2)]" 
                      : "bg-[rgba(248,113,113,0.1)] text-[var(--danger)] border-[rgba(248,113,113,0.2)]"
                  )}>
                    {comparison.isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {comparison.change.toFixed(1)}%
                  </div>
                </div>
             </div>
          </div>

          <div className="pt-6 border-t border-[var(--border)]">
            <p className="text-[11px] text-[var(--text-muted)] italic leading-relaxed">
              * El crecimiento se calcula comparando el total recaudado del mes en curso contra el total del mes anterior.
            </p>
          </div>
        </Card>
      </div>

      {/* Top Clients Table */}
      <Card padding="none" className="overflow-hidden border-[var(--border)]">
        <div className="px-7 py-6 border-b border-[var(--border)] flex items-center justify-between">
           <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Clientes más Rentables</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1 uppercase tracking-widest font-bold">Top 5 por facturación</p>
            </div>
            <div className="p-2 bg-[var(--bg-secondary)] rounded-lg">
              <Users className="w-5 h-5 text-[var(--text-muted)]" />
            </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--bg-secondary)]/50">
                <th className="px-7 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-center w-20">#</th>
                <th className="px-7 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Cliente</th>
                <th className="px-7 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-center">Servicios</th>
                <th className="px-7 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Ticket Prom.</th>
                <th className="px-7 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-right">Total Generado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {topClients.map((client, index) => (
                <tr key={client.id} className="hover:bg-[var(--bg-hover)]/30 transition-colors group">
                  <td className="px-7 py-5 text-center">
                    <span className={cn(
                      "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold font-mono",
                      index === 0 ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/30" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                    )}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-7 py-5">
                    <p className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-light)] transition-colors">{client.name}</p>
                  </td>
                  <td className="px-7 py-5 text-center">
                    <Badge variant="muted" className="font-mono">{client.servicesCount}</Badge>
                  </td>
                  <td className="px-7 py-5">
                    <span className="text-sm font-medium font-mono text-[var(--text-secondary)]">
                      {formatCurrency(client.avgTicket)}
                    </span>
                  </td>
                  <td className="px-7 py-5 text-right">
                    <span className="text-base font-bold font-mono text-[var(--accent-light)]">
                      {formatCurrency(client.totalGenerated)}
                    </span>
                  </td>
                </tr>
              ))}
              {topClients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-7 py-20 text-center text-[var(--text-secondary)] opacity-50 italic">
                    No hay suficientes datos para generar el ranking.
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
        <div className="space-y-2">
          <div className="h-10 w-48 bg-[var(--bg-card)] rounded-xl" />
          <div className="h-4 w-64 bg-[var(--bg-card)] rounded-lg" />
        </div>
        <div className="h-12 w-64 bg-[var(--bg-card)] rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-[var(--bg-card)] rounded-[20px]" />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-[400px] bg-[var(--bg-card)] rounded-[20px]" />
        <div className="h-[400px] bg-[var(--bg-card)] rounded-[20px]" />
      </div>

      <div className="h-96 bg-[var(--bg-card)] rounded-[20px]" />
    </div>
  );
}
