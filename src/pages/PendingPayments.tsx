import { useEffect, useState } from 'react';
import { 
  MessageCircle, 
  Search, 
  AlertCircle, 
  Users,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBusiness } from '../context/BusinessContext';
import { formatCurrency, getInitials, avatarColor, cn } from '../lib/utils';
import { Skeleton } from '../components/Skeleton';
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold">Cobros Pendientes</h1>
        <p className="text-[#888888]">Mira quién debe y envía recordatorios de WhatsApp en un clic</p>
      </header>

      {/* Summary Card */}
      <div className="card p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative border-t-2 border-t-[var(--warning)]">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <DollarSignLarge />
        </div>
        <div className="relative z-10">
          <p className="section-title mb-2">Deuda Total de Clientes</p>
          <p className="amount text-[42px] text-[var(--warning)]">{formatCurrency(totalGlobalPending)}</p>
          <div className="flex items-center gap-2 mt-4 text-[#888888]">
            <Users className="w-5 h-5" />
            <span className="font-medium">{debtors.length} clientes con saldos pendientes</span>
          </div>
        </div>
        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-[#888888] bg-black/20 p-3 rounded-xl border border-[#2A2A2A]">
            <AlertCircle className="w-4 h-4 text-[#FFB800]" />
            <span>Los recordatorios incluyen tus métodos de pago</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-[var(--bg-secondary)] border-[var(--border)] px-4 py-3 rounded-lg border w-full md:w-96">
        <Search className="w-5 h-5 text-[var(--text-secondary)]" />
        <input 
          type="text" 
          placeholder="Buscar deudor..." 
          className="bg-transparent border-none outline-none text-[var(--text-primary)] text-sm w-full placeholder-[var(--text-secondary)]"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : filteredDebtors.length === 0 ? (
        <EmptyState 
          icon={CheckCircle2}
          title="¡Estás al día!"
          description="No tienes ningún cobro pendiente en este momento."
        />
      ) : (
        <div className="space-y-4 shadow-none">
          {filteredDebtors.map(debtor => {
            const urgencyDays = Math.floor((Date.now() - new Date(debtor.last_service_date).getTime()) / (1000 * 60 * 60 * 24));
            const isRed = urgencyDays > 30;
            const isYellow = urgencyDays > 14;
            const urgencyColor = isRed ? 'bg-[var(--danger)]' : isYellow ? 'bg-[var(--warning)]' : 'bg-[var(--success)]';
            const urgencyText = isRed ? 'text-[var(--danger)]' : isYellow ? 'text-[var(--warning)]' : 'text-[var(--success)]';
            const urgencyWidth = Math.min((urgencyDays / 30) * 100, 100) + '%';
            
            return (
            <div key={debtor.id} className="card group hover:border-[var(--warning)]/30 transition-all flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 h-1.5 w-full bg-[var(--border)]">
                <div className={cn("h-full transition-all", urgencyColor)} style={{ width: urgencyWidth }} />
              </div>
              <div className="flex items-center justify-between gap-4 p-4 mt-1">
                <div className="flex items-center gap-4 flex-1">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0"
                    style={{ backgroundColor: `${avatarColor(debtor.name)}20`, color: avatarColor(debtor.name) }}
                  >
                    {getInitials(debtor.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-[var(--text-primary)] truncate">{debtor.name}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {debtor.pending_count} {debtor.pending_count === 1 ? 'servicio' : 'servicios'} · <span className={urgencyText}>{urgencyDays} días de atraso</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right border-r border-[var(--border)] pr-6">
                    <p className="section-title">Monto</p>
                    <p className="amount text-2xl text-[var(--text-primary)]">{formatCurrency(debtor.total_amount)}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => sendReminder(debtor)}
                      className="flex items-center gap-2 px-4 py-2 border border-[#25D366] text-[#25D366] font-medium rounded-lg hover:bg-[rgba(37,211,102,0.12)] bg-[rgba(37,211,102,0.08)] transition-colors active:scale-[0.98]"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="hidden md:block">WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}

function DollarSignLarge() {
  return (
    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-[#FFB800]">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
