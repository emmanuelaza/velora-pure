import { useEffect, useState } from 'react';
import { 
  MessageCircle, 
  Search, 
  CheckCircle2,
  Clock,
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBusiness } from '../context/BusinessContext';
import { formatCurrency, getInitials, avatarColor, cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

// UI Components
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { MetricCard } from '../components/ui/MetricCard';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/EmptyState';

interface Debtor {
  id: string;
  name: string;
  phone: string;
  pending_count: number;
  total_amount: number;
  last_service_date: string;
}

export default function PendingPayments() {
  const { business } = useBusiness();
  const navigate = useNavigate();
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (business) {
      fetchDebtors();
    }
  }, [business]);

  const fetchDebtors = async () => {
    if (!business) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('amount, date, client_id, clients(id, name, phone)')
        .eq('business_id', business.id)
        .eq('status', 'pending');

      if (error) throw error;

      const map: Record<string, Debtor> = {};
      (data || []).forEach((s: any) => {
        const client = s.clients;
        if (!client) return;

        if (!map[client.id]) {
          map[client.id] = {
            id: client.id,
            name: client.name,
            phone: client.phone,
            pending_count: 0,
            total_amount: 0,
            last_service_date: s.date
          };
        }

        map[client.id].pending_count += 1;
        map[client.id].total_amount += Number(s.amount);
        if (new Date(s.date) > new Date(map[client.id].last_service_date)) {
          map[client.id].last_service_date = s.date;
        }
      });

      setDebtors(Object.values(map).sort((a, b) => b.total_amount - a.total_amount));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const sendReminder = (debtor: Debtor) => {
    const message = `Hola ${debtor.name.split(' ')[0]}, espero estés bien. Te envío este recordatorio de tus ${debtor.pending_count} servicios de limpieza pendientes con ${business?.business_name} por un total de ${formatCurrency(debtor.total_amount)}. 
    
💰 Métodos de pago:
${business?.zelle_info ? `- Zelle: ${business.zelle_info}` : ''}
${business?.venmo_info ? `- Venmo: @${business.venmo_info}` : ''}
${business?.cashapp_info ? `- CashApp: $${business.cashapp_info}` : ''}

¡Muchas gracias!`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/1${debtor.phone.replace(/\D/g, '')}?text=${encoded}`, '_blank');
  };

  const filteredDebtors = debtors.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalGlobalPending = debtors.reduce((acc, curr) => acc + curr.total_amount, 0);

  return (
    <div className="space-y-6">
      <div className="anim-fade-up-1">
      <PageHeader
        title="Cobros pendientes"
        subtitle="Clientes con pagos atrasados"
        actions={
          <div className="font-mono text-2xl font-semibold text-[var(--warning)]">
            {formatCurrency(totalGlobalPending)}
          </div>
        }
      />

      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 anim-fade-up-2">
        <MetricCard 
          title="Deuda Total Pendiente"
          value={formatCurrency(totalGlobalPending)}
          icon={TrendingDown}
          subtitle={`${debtors.length} clientes con saldo pendiente`}
        />
        <MetricCard 
          title="Clientes con Deuda"
          value={debtors.length.toString()}
          icon={Clock}
          subtitle="Recordatorios vía WhatsApp disponibles"
        />
      </div>

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="w-full md:w-80">
          <Input 
            icon={Search}
            placeholder="Buscar cliente pendiente..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span className="text-[13px] text-[var(--text-muted)]">
          {filteredDebtors.length} clientes pendientes
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-[var(--bg-card)] rounded-[var(--radius-md)] animate-pulse" />)}
        </div>
      ) : filteredDebtors.length === 0 ? (
        <EmptyState 
          icon={CheckCircle2}
          title="¡Estás al día!"
          description="No tienes ningún cobro pendiente en este momento. ¡Excelente trabajo!"
        />
      ) : (
        <div className="space-y-3">
          {filteredDebtors.map(debtor => {
            const urgencyDays = Math.floor((Date.now() - new Date(debtor.last_service_date).getTime()) / (1000 * 60 * 60 * 24));
            const isRed = urgencyDays > 30;
            const isYellow = urgencyDays > 14;
            
            const borderClass = isRed
              ? 'urgency-critical'
              : isYellow
              ? 'urgency-normal'
              : '';

            return (
              <div 
                key={debtor.id} 
                className={`group rounded-[var(--radius-md)] border border-[var(--border)] hover:shadow-[var(--shadow-md)] bg-[var(--bg-card)] transition-all cursor-pointer overflow-hidden ${borderClass}`}
                onClick={() => navigate(`/clients/${debtor.id}`)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5">
                  {/* Left: client info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-base shrink-0"
                      style={{ backgroundColor: `${avatarColor(debtor.name)}15`, color: avatarColor(debtor.name) }}
                    >
                      {getInitials(debtor.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-[var(--text-primary)] truncate">{debtor.name}</h3>
                        {isRed && <Badge variant="danger" className="text-[10px] font-semibold px-1.5 py-0">Crítico</Badge>}
                        {isYellow && !isRed && <Badge variant="warning" className="text-[10px] font-semibold px-1.5 py-0">Atrasado</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[13px] text-[var(--text-muted)]">
                          {debtor.pending_count} {debtor.pending_count === 1 ? 'servicio' : 'servicios'}
                        </span>
                        <span className={cn("text-[13px] flex items-center gap-1", isRed ? "text-[var(--danger)]" : isYellow ? "text-[var(--warning)]" : "text-[var(--text-muted)]")}>
                          <Clock className="w-3.5 h-3.5" />
                          {urgencyDays} días
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: amount & actions */}
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="text-right">
                      <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-[0.06em]">Adeudado</p>
                      <p className="font-mono text-xl font-semibold text-[var(--text-primary)] mt-0.5">{formatCurrency(debtor.total_amount)}</p>
                    </div>
                    
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/clients/${debtor.id}`)}
                        className="p-2.5 rounded-[var(--radius-md)] bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <Button 
                        onClick={() => sendReminder(debtor)}
                        className="bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20 hover:bg-[#25D366]/20 h-10 px-4"
                      >
                        <MessageCircle className="w-4 h-4 fill-current" />
                        Recordar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
