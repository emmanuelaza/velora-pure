import { useEffect, useState } from 'react';
import { 
  MessageCircle, 
  Search, 
  AlertCircle, 
  CheckCircle2,
  DollarSign,
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBusiness } from '../context/BusinessContext';
import { formatCurrency, getInitials, avatarColor, cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Cobros Pendientes</h1>
        <p className="text-[var(--text-secondary)] mt-1 font-medium italic opacity-80">Gestiona los saldos a favor y envía recordatorios automáticos</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Deuda Total Pendiente"
          value={formatCurrency(totalGlobalPending)}
          icon={TrendingDown}
          className="lg:col-span-2"
        />
        <Card variant="subtle" padding="none" className="lg:col-span-2 overflow-hidden flex flex-col justify-center bg-[var(--warning)]/5 border-[var(--warning)]/20 relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertCircle className="w-24 h-24 text-[var(--warning)] -rotate-12" />
          </div>
          <div className="flex items-start gap-4 p-6 relative z-10">
             <div className="p-3 bg-[var(--warning)]/15 rounded-xl shrink-0 border border-[var(--warning)]/20">
               <AlertCircle className="w-6 h-6 text-[var(--warning)]" />
             </div>
             <div className="space-y-1.5">
               <p className="text-[11px] font-bold text-[var(--warning)] uppercase tracking-widest">Aviso de Privacidad</p>
               <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium max-w-[320px]">
                 Las plantillas de WhatsApp incluyen automáticamente tus métodos de pago configurados en Settings.
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
            placeholder="Buscar cliente pendiente..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-secondary)] px-4 py-2 rounded-full border border-[var(--border)]">
          {filteredDebtors.length} Clientes pendientes
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
          description="No tienes ningún cobro pendiente en este momento. ¡Excelente trabajo!"
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
              <Card key={debtor.id} padding="none" className="group overflow-hidden border-[var(--border)] hover:border-[var(--warning)]/30 transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)] cursor-pointer" onClick={() => navigate(`/clients/${debtor.id}`)}>
                <div className="h-1.5 w-full bg-[var(--bg-secondary)] overflow-hidden">
                  <div className={cn("h-full transition-all duration-1000 ease-out", urgencyColor)} style={{ width: urgencyWidth }} />
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6">
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div 
                      className="w-16 h-16 rounded-[20px] flex items-center justify-center font-bold text-xl shrink-0 border border-white/5 shadow-inner ring-1 ring-white/5"
                      style={{ backgroundColor: `${avatarColor(debtor.name)}15`, color: avatarColor(debtor.name) }}
                    >
                      {getInitials(debtor.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center flex-wrap gap-2">
                        <h3 className="font-bold text-xl text-[var(--text-primary)] truncate tracking-tight">{debtor.name}</h3>
                        {isRed && <Badge variant="danger" className="text-[10px] uppercase font-black px-1.5 py-0">Crítico</Badge>}
                        {isYellow && !isRed && <Badge variant="warning" className="text-[10px] uppercase font-black px-1.5 py-0">Atrasado</Badge>}
                      </div>
                      <div className="flex items-center gap-4 mt-2 font-medium">
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                          <Badge variant="muted" className="bg-[var(--bg-secondary)] font-bold px-2 py-0.5 border-[var(--border)] text-[var(--accent-light)]">
                            {debtor.pending_count} {debtor.pending_count === 1 ? 'Job' : 'Jobs'}
                          </Badge>
                        </div>
                        <span className={cn("text-xs flex items-center gap-1.5", urgencyText)}>
                          <Clock className="w-3.5 h-3.5" />
                          {urgencyDays} días acumulados
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 md:gap-10 border-t md:border-t-0 md:border-l border-[var(--border)] pt-6 md:pt-0 md:pl-10">
                    <div className="text-right">
                      <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Monto Adeudado</p>
                      <p className="font-mono text-3xl font-bold text-[var(--text-primary)] tracking-tighter">{formatCurrency(debtor.total_amount)}</p>
                    </div>
                    
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/clients/${debtor.id}`);
                        }}
                        className="h-12 w-12 p-0 rounded-xl"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          sendReminder(debtor);
                        }}
                        className="bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20 hover:bg-[#25D366]/20 transition-all h-12 px-6 shadow-lg shadow-[#25D366]/5"
                      >
                        <MessageCircle className="w-5 h-5 fill-current" />
                        Recordar
                      </Button>
                    </div>
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
