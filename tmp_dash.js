const fs = require('fs');

const path = 'c:\\velora pure\\src\\pages\\Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Imports
content = content.replace("import { StatusBadge }", "import { StatusBadge }\nimport { Modal } from '../components/Modal';\nimport { generateMonthlyPDF } from '../lib/pdf';\nimport toast from 'react-hot-toast';");
content = content.replace("AlertCircle \n}", "AlertCircle,\n  Zap,\n  FileText,\n  X, CheckCircle2\n}");

// Interfaces
content = content.replace("serviciosMes: number;", "serviciosMes: number;\n  totalServicios: number;\n  hasPaymentConfig: boolean;\n  hasClients: boolean;");

// Component Top
let componentTop = `
  const [fastServiceOpen, setFastServiceOpen] = useState(false);
  const [fastServiceData, setFastServiceData] = useState({ client_id: '', amount: '', status: 'pending' });
  const [allClients, setAllClients] = useState<{id: string, name: string}[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showSmartBanner, setShowSmartBanner] = useState(false);
  const [smartBannerCount, setSmartBannerCount] = useState(0);
`;
content = content.replace("const [loading, setLoading] = useState(true);", "const [loading, setLoading] = useState(true);" + componentTop);

// Fetch Logic
let newFetch = `
      const [
        { data: cobradoData },
        { data: pendienteData },
        { count: clientesCount },
        { count: serviciosMesCount }
      ] = await Promise.all([
        supabase.from('services').select('amount').eq('business_id', business.id).eq('status', 'paid').gte('date', primerDiaMes).lte('date', hoyISO),
        supabase.from('services').select('amount').eq('business_id', business.id).eq('status', 'pending'),
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('business_id', business.id).eq('active', true),
        supabase.from('services').select('id', { count: 'exact', head: true }).eq('business_id', business.id).gte('date', primerDiaMes)
      ]);
      
      const { count: totalServicesCount } = await supabase.from('services').select('id', { count: 'exact', head: true }).eq('business_id', business.id);
      const { data: clientsData } = await supabase.from('clients').select('id, name').eq('business_id', business.id).eq('active', true);
      setAllClients(clientsData || []);

      const totalCobrado = (cobradoData || []).reduce((acc, curr) => acc + Number(curr.amount), 0);
      const totalPendiente = (pendienteData || []).reduce((acc, curr) => acc + Number(curr.amount), 0);
      const hasPaymentConfig = !!(business.zelle_info || business.venmo_info || business.cashapp_info);

      setStats({
        totalCobrado,
        totalPendiente,
        clientesActivos: clientesCount || 0,
        serviciosMes: serviciosMesCount || 0,
        totalServicios: totalServicesCount || 0,
        hasPaymentConfig,
        hasClients: (clientesCount || 0) > 0
      });
`;
content = content.replace(/const \[\s+\{ data: cobradoData \}[\s\S]*?clientesActivos: clientesCount \|\| 0,\s+serviciosMes: serviciosCount \|\| 0\s+\}\);/, newFetch);

let bannerLogic = `
      let pendingOver7Count = 0;
      Object.values(debtorsMap).forEach(d => {
         if (d.oldest_pending_days > 7) pendingOver7Count++;
      });
      if (pendingOver7Count > 0 && localStorage.getItem(\`banner_\${business.id}\`) !== hoy.toISOString().split('T')[0]) {
         setShowSmartBanner(true);
         setSmartBannerCount(pendingOver7Count);
      }
`;
content = content.replace(/setPendingDebtors\(\s+Object\.values\(debtorsMap\)\s+\.sort[^>]+?\);\s+/g, match => match + bannerLogic);

// Remove the old completely empty view entirely to replace it with checklist in the main view
content = content.replace(/if \(stats\?\.clientesActivos === 0 && recentServices\.length === 0\).*?return \([\s\S]*?     \);\n  }/m, "");

// Fast service handler
let extraFunctions = `
  const handleFastService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !fastServiceData.client_id || !fastServiceData.amount) return;
    try {
      const { error } = await supabase.from('services').insert({
        business_id: business.id,
        client_id: fastServiceData.client_id,
        amount: Number(fastServiceData.amount),
        date: new Date().toISOString().split('T')[0],
        status: fastServiceData.status,
      });
      if (error) throw error;
      toast.success('Servicio registrado');
      setFastServiceOpen(false);
      fetchDashboardData();
    } catch (err: any) {
      // offline queue fallback here for pwa later
      const queue = JSON.parse(localStorage.getItem(\`offline_queue_\${business.id}\`) || '[]');
      queue.push({
        business_id: business.id,
        client_id: fastServiceData.client_id,
        amount: Number(fastServiceData.amount),
        date: new Date().toISOString().split('T')[0],
        status: fastServiceData.status
      });
      localStorage.setItem(\`offline_queue_\${business.id}\`, JSON.stringify(queue));
      toast.success('Guardado sin conexión. Se sincronizará luego.');
      setFastServiceOpen(false);
      fetchDashboardData();
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    const success = await generateMonthlyPDF(business);
    if (success) toast.success('Reporte descargado');
    setIsGeneratingPdf(false);
  };
`;
content = content.replace("return (", extraFunctions + "\n  return (");

// Main UI inserts
let uiHeader = `
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Buenos días, {business?.business_name || 'Negocio'} 👋</h1>
          <p className="text-[var(--text-secondary)] mt-1">Mira cómo va tu negocio este mes</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Descargar reporte
          </button>
          <button 
            onClick={() => setFastServiceOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Registrar rápido
          </button>
        </div>
      </header>

      {/* Smart Banner */}
      {showSmartBanner && (
        <div className="flex items-start md:items-center justify-between bg-[rgba(251,191,36,0.08)] border border-[rgba(251,191,36,0.2)] rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 text-[var(--warning)]">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">⚠️ Tienes {smartBannerCount} clientes con cobros de más de 7 días. Te enviamos un resumen por email.</p>
          </div>
          <div className="flex items-center gap-4 mt-2 md:mt-0">
            <NavLink to="/pending" className="text-sm font-bold text-[var(--warning)] hover:underline whitespace-nowrap">Ver cobros →</NavLink>
            <button 
              onClick={() => {
                setShowSmartBanner(false);
                localStorage.setItem(\`banner_\${business?.id}\`, new Date().toISOString().split('T')[0]);
              }}
              className="text-[var(--warning)] opacity-60 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Onboarding Checklist */}
      {(stats && (!stats.hasClients || !stats.totalServicios || !stats.hasPaymentConfig)) && localStorage.getItem(\`onboarding_\${business?.id}\`) !== 'true' && (
        <div className="card border-[var(--accent)]/30 bg-[var(--accent-subtle)] p-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">¡Bienvenido a Velora Pure! 🚀</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-6">Completa estos 3 pasos para empezar:</p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {stats.hasClients ? <CheckCircle2 className="w-6 h-6 text-[var(--accent)]" /> : <div className="w-6 h-6 rounded-full border-2 border-[var(--border)]" />}
                <p className="font-medium text-[var(--text-primary)]">Agrega tu primer cliente</p>
              </div>
              {!stats.hasClients && <button onClick={() => navigate('/clients')} className="text-sm text-[var(--accent)] font-medium hover:underline">Agregar cliente →</button>}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {stats.totalServicios > 0 ? <CheckCircle2 className="w-6 h-6 text-[var(--accent)]" /> : <div className="w-6 h-6 rounded-full border-2 border-[var(--border)]" />}
                <p className="font-medium text-[var(--text-primary)]">Registra tu primer servicio</p>
              </div>
              {!stats.totalServicios && <button onClick={() => setFastServiceOpen(true)} className="text-sm text-[var(--accent)] font-medium hover:underline">Registrar servicio →</button>}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {stats.hasPaymentConfig ? <CheckCircle2 className="w-6 h-6 text-[var(--accent)]" /> : <div className="w-6 h-6 rounded-full border-2 border-[var(--border)]" />}
                <p className="font-medium text-[var(--text-primary)]">Configura tus métodos de pago</p>
              </div>
              {!stats.hasPaymentConfig && <button onClick={() => navigate('/settings')} className="text-sm text-[var(--accent)] font-medium hover:underline">Ir a configuración →</button>}
            </div>
          </div>
          
          {stats.hasClients && stats.totalServicios > 0 && stats.hasPaymentConfig && (
            <button 
              onClick={() => {
                localStorage.setItem(\`onboarding_\${business?.id}\`, 'true');
                fetchDashboardData(); // to re-render and hide
              }}
              className="mt-6 w-full py-3 bg-[var(--accent)] text-white rounded-lg font-bold hover:bg-[var(--accent-hover)] transition-all"
            >
              ¡Comenzar a usar Velora Pure!
            </button>
          )}
        </div>
      )}
`;

content = content.replace(/<header>[\s\S]*?<\/header>/, uiHeader);

let modalHTML = `
      {/* Modals */}
      <Modal isOpen={fastServiceOpen} onClose={() => setFastServiceOpen(false)} title="⚡ Registro Rápido">
        <form onSubmit={handleFastService} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Cliente</label>
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
            <label className="text-sm font-medium text-[var(--text-secondary)]">Monto ($)</label>
            <input 
              type="number"
              required
              className="input-field w-full"
              value={fastServiceData.amount}
              onChange={e => setFastServiceData({...fastServiceData, amount: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Estado</label>
            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => setFastServiceData({...fastServiceData, status: 'pending'})}
                className={cn("flex-1 p-3 rounded-lg border transition-all text-sm font-bold", fastServiceData.status === 'pending' ? "bg-[var(--warning)]/10 border-[var(--warning)] text-[var(--warning)]" : "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)]")}
              >PENDIENTE</button>
              <button 
                type="button"
                onClick={() => setFastServiceData({...fastServiceData, status: 'paid'})}
                className={cn("flex-1 p-3 rounded-lg border transition-all text-sm font-bold", fastServiceData.status === 'paid' ? "bg-[var(--success)]/10 border-[var(--success)] text-[var(--success)]" : "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)]")}
              >PAGADO</button>
            </div>
          </div>
          <button type="submit" className="w-full btn-primary py-3 mt-4">Guardar Servicio</button>
        </form>
      </Modal>
    </div>
`;
content = content.replace(/    <\/div>\n  \);\n}/, modalHTML + "\n  );\n}");

fs.writeFileSync(path, content);
console.log('Dashboard rewritten!');
