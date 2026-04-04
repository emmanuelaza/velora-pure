import { useEffect, useState } from 'react';
import { 
  MessageCircle, 
  Search, 
  AlertCircle, 
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBusiness } from '../context/BusinessContext';
import { formatCurrency, getInitials, avatarColor, cn } from '../lib/utils';

// New UI Components
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { MetricCard } from '../components/ui/MetricCard';
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
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] font-sans">Cobros Pendientes</h1>
        <p className="text-[var(--text-secondary)] mt-1">Gestiona los saldos a favor y envía recordatorios</p>
      </header>

      {/* Summary Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MetricCard 
          title="Deuda Total de Clientes"
          value={formatCurrency(totalGlobalPending)}
          icon={DollarSign}
          description={`${debtors.length} clientes con saldos pendientes`}
          trend={{ value: 12, isPositive: false }}
          className="lg:col-span-2"
        />
        <Card padding="md" variant="subtle" className="flex flex-col justify-center gap-4 bg-[var(--warning)]/5 border-[var(--warning)]/20">
          <div className="flex items-start gap-3">
             <div className="p-2 bg-[var(--warning)]/10 rounded-lg shrink-0">
               <AlertCircle className="w-5 h-5 text-[var(--warning)]" />
             </div>
             <div>
               <p className="text-[12px] font-bold text-[var(--warning)] uppercase tracking-widest mb-1">Recordatorios Smart</p>
               <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                 Las plantillas de WhatsApp incluyen automáticamente tus métodos de pago (Zelle, Venmo, CashApp).
               </p>
             </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-96">
          <Input 
            icon={Search}
            placeholder="Buscar por cliente..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-[var(--bg-card)] rounded-[20px] animate-pulse" />)}
        </div>
      ) : filteredDebtors.length === 0 ? (
        <EmptyState 
          icon={CheckCircle2}
          title="¡Estás al día!"
          description="No tienes ningún cobro pendiente en este momento."
        />
      ) : (
        <div className="space-y-4">
          {filteredDebtors.map(debtor => {
            const urgencyDays = Math.floor((Date.now() - new Date(debtor.last_service_date).getTime()) / (1000 * 60 * 60 * 24));
            const isRed = urgencyDays > 30;
            const isYellow = urgencyDays > 14;
            const urgencyColor = isRed ? 'bg-[var(--danger)]' : isYellow ? 'bg-[var(--warning)]' : 'bg-[var(--success)]';
            const urgencyText = isRed ? 'text-[var(--danger)]' : isYellow ? 'text-[var(--warning)]' : 'text-[var(--success)]';
            const urgencyWidth = Math.min((urgencyDays / 30) * 100, 100) + '%';
            
            return (
              <Card key={debtor.id} padding="none" className="group overflow-hidden border-[var(--border)] hover:border-[var(--warning)]/30 transition-colors">
                <div className="h-1 w-full bg-[var(--bg-secondary)] overflow-hidden">
                  <div className={cn("h-full transition-all duration-1000 ease-out", urgencyColor)} style={{ width: urgencyWidth }} />
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6">
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 border border-white/5 shadow-inner"
                      style={{ backgroundColor: `${avatarColor(debtor.name)}15`, color: avatarColor(debtor.name) }}
                    >
                      {getInitials(debtor.name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg text-[var(--text-primary)] truncate flex items-center gap-2">
                        {debtor.name}
                        {isRed && <Badge variant="danger" className="text-[9px] h-4">Crítico</Badge>}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5">
                        <Badge variant="muted" className="bg-[var(--bg-secondary)] font-bold px-2 py-0.5">
                          {debtor.pending_count} {debtor.pending_count === 1 ? 'Job' : 'Jobs'}
                        </Badge>
                        <span className={cn("text-xs font-semibold", urgencyText)}>
                          {urgencyDays} días acumulados
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 md:gap-10">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Monto Adeudado</p>
                      <p className="font-mono text-2xl font-bold text-[var(--text-primary)]">{formatCurrency(debtor.total_amount)}</p>
                    </div>
                    
                    <Button 
                      variant="secondary"
                      onClick={() => sendReminder(debtor)}
                      className="bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20 hover:bg-[#25D366]/20 transition-all h-12 px-6"
                    >
                      <MessageCircle className="w-5 h-5 fill-current" />
                      Recordar
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  );
}
