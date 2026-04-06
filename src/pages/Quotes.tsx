import { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Plus, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  CheckCircle2, 
  Download, 
  Share2, 
  Save, 
  Clock, 
  DollarSign, 
  Zap,
  Lock,
  ArrowRight,
  RefreshCcw,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface QuoteData {
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  clean_type: string;
  frequency: string;
  extras: string[];
  base_price: number;
  multiplier: number;
  frequency_discount: number;
  extras_total: number;
  total_price: number;
  duration_hours: number;
  confidence_score: number;
}

interface SavedQuote {
  id: string;
  created_at: string;
  property_type: string;
  total_price: number;
  status: string;
  clean_type: string;
}

export default function Quotes() {
  const { business } = useBusiness();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Voy a ayudarte a crear tu presupuesto en menos de 1 minuto. ¿Qué tipo de propiedad necesitas limpiar?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<QuoteData | null>(null);
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isActive = business?.subscription_status === 'active';

  useEffect(() => {
    if (isActive) {
      fetchSavedQuotes();
    }
  }, [isActive]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSavedQuotes = async () => {
    const { data, error } = await supabase
      .from('quotes')
      .select('id, created_at, property_type, total_price, status, clean_type')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching quotes:', error);
    } else {
      setSavedQuotes(data || []);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages as Message[]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/quote-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      const data = await response.json();

      if (data.type === 'quote') {
        setCurrentQuote(data.data);
        setMessages(prev => [...prev, { role: 'assistant', content: '¡Presupuesto listo! Puedes verlo a la derecha.' }]);
      } else if (data.type === 'message') {
        setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
      } else {
        throw new Error(data.error || 'Error al obtener respuesta');
      }
    } catch (error) {
      toast.error('Hubo un error con el asistente. Inténtalo de nuevo.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([
      { role: 'assistant', content: '¡Hola! Voy a ayudarte a crear tu presupuesto en menos de 1 minuto. ¿Qué tipo de propiedad necesitas limpiar?' }
    ]);
    setCurrentQuote(null);
    setInput('');
  };

  const handleSaveQuote = async () => {
    if (!currentQuote || !business) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('quotes').insert({
        business_id: business.id,
        property_type: currentQuote.property_type,
        bedrooms: currentQuote.bedrooms,
        bathrooms: currentQuote.bathrooms,
        sqft: currentQuote.sqft,
        clean_type: currentQuote.clean_type,
        frequency: currentQuote.frequency,
        extras: currentQuote.extras,
        base_price: currentQuote.base_price,
        multiplier: currentQuote.multiplier,
        frequency_discount: currentQuote.frequency_discount,
        extras_total: currentQuote.extras_total,
        total_price: currentQuote.total_price,
        duration_hours: currentQuote.duration_hours,
        confidence_score: currentQuote.confidence_score,
        conversation: messages,
        status: 'draft'
      });

      if (error) throw error;
      toast.success('Cotización guardada correctamente');
      fetchSavedQuotes();
    } catch (error) {
      toast.error('Error al guardar la cotización');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!currentQuote) return;
    try {
      const response = await fetch('/api/generate-quote-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote: currentQuote, business })
      });
      const html = await response.text();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      }
    } catch (error) {
      toast.error('Error al generar el PDF');
    }
  };

  const handleShareWhatsApp = () => {
    if (!currentQuote || !business) return;
    
    const frequencyLabel: any = { once: 'Única vez', weekly: 'Semanal', biweekly: 'Bi-semanal', monthly: 'Mensual' };
    const cleanTypeLabel: any = { regular: 'Limpieza regular', deep_clean: 'Deep Clean', post_construction: 'Post-construcción', airbnb: 'Airbnb Turnover' };

    const message = `Hola! Aquí está tu cotización de ${business.business_name}:

🧹 Servicio: ${cleanTypeLabel[currentQuote.clean_type] || currentQuote.clean_type}
🏠 Propiedad: ${currentQuote.bedrooms} cuartos / ${currentQuote.bathrooms} baños
📅 Frecuencia: ${frequencyLabel[currentQuote.frequency] || currentQuote.frequency}

💰 *Total por visita: $${currentQuote.total_price.toFixed(2)}*
⏱ Duración estimada: ${currentQuote.duration_hours} horas

Esta cotización es válida por 7 días.
¿Te gustaría agendar tu primer servicio? 😊`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (!isActive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
        <Card className="max-w-md w-full p-8 text-center border-dashed border-2">
          <div className="w-16 h-16 bg-[var(--accent-subtle)] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-[var(--accent)]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Función exclusiva del plan activo</h2>
          <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
            Activa tu suscripción para acceder al asistente de cotización con IA y generar presupuestos profesionales en segundos.
          </p>
          <Button 
            className="w-full h-12 text-base shadow-[var(--shadow-accent)]"
            onClick={() => window.location.href = '/billing'}
          >
            Activar plan
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
            Cotizaciones
            <Badge variant="info" className="bg-[var(--accent-subtle)] text-[var(--accent-dark)] border-none px-2.5 py-0.5">
              ✨ Con IA
            </Badge>
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Genera presupuestos profesionales con IA en menos de 1 minuto.
          </p>
        </div>
        <Button onClick={resetChat} variant="secondary" className="h-10">
          <Plus className="w-4 h-4 mr-2" />
          Nueva cotización
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
        {/* Panel Izquierdo: Chat */}
        <Card className="lg:col-span-6 flex flex-col h-[600px] overflow-hidden p-0 border-[var(--border)] shadow-xl relative backdrop-blur-sm bg-white/80">
          <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[var(--accent)] rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-sm">Asistente de Cotización</span>
            </div>
            <button 
              onClick={resetChat}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              title="Reiniciar chat"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {messages.map((m, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex items-start gap-3 max-w-[85%] animate-in slide-in-from-bottom-2 duration-300",
                  m.role === 'assistant' ? "mr-auto" : "ml-auto flex-row-reverse"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  m.role === 'assistant' ? "bg-[var(--accent-subtle)]" : "bg-[var(--bg-secondary)]"
                )}>
                  {m.role === 'assistant' ? <Bot className="w-4 h-4 text-[var(--accent)]" /> : <User className="w-4 h-4 text-[var(--text-secondary)]" />}
                </div>
                <div className={cn(
                  "p-3.5 rounded-2xl text-[14px] leading-relaxed shadow-sm",
                  m.role === 'assistant' 
                    ? "bg-[#E0F2FE] text-[#0369A1] rounded-tl-none border border-[#BAE6FD]" 
                    : "bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-tr-none border border-[var(--border)]"
                )}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs animate-pulse ml-11">
                <Loader2 className="w-3 h-3 animate-spin" />
                El asistente está pensando...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-[var(--border)]">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu respuesta aquí..."
                className="flex-1 h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-all text-sm"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim()} className="shrink-0 w-11 h-11 p-0 rounded-xl">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </div>
          </form>
        </Card>

        {/* Panel Derecho: Cotización Generada */}
        <div className="lg:col-span-4 space-y-6">
          {currentQuote ? (
            <Card className="p-6 border-[var(--accent)]/20 shadow-2xl animate-in slide-in-from-right-4 duration-500 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <FileText className="w-20 h-20 text-[var(--accent)]" />
              </div>
              
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />
                Cotización Sugerida
              </h3>

              {/* Pills Resumen */}
              <div className="flex flex-wrap gap-2 mb-8">
                <Badge variant="info" className="px-3 py-1 rounded-lg">
                  {currentQuote.clean_type === 'deep_clean' ? 'Deep Clean' : currentQuote.clean_type}
                </Badge>
                <Badge variant="info" className="px-3 py-1 rounded-lg capitalize">
                  {currentQuote.property_type}
                </Badge>
                <Badge variant="info" className="px-3 py-1 rounded-lg">
                  {currentQuote.bedrooms}B / {currentQuote.bathrooms}Ba
                </Badge>
                {currentQuote.extras.length > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 px-3 py-1 rounded-lg">
                    +{currentQuote.extras.length} Extras
                  </Badge>
                )}
              </div>

              {/* Precio */}
              <div className="mb-8 p-6 bg-gradient-to-br from-[var(--bg-secondary)] to-white rounded-2xl border border-[var(--border)] shadow-inner">
                <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Total por visita</div>
                <div className="text-4xl font-black text-[var(--accent)] font-mono flex items-baseline gap-1">
                  <span className="text-2xl font-bold">$</span>
                  {currentQuote.total_price.toFixed(2)}
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]/50">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Duración</p>
                    <p className="text-sm font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                      {currentQuote.duration_hours} hrs
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Precio/Hr</p>
                    <p className="text-sm font-bold flex items-center gap-1.5 text-[var(--success)]">
                      <DollarSign className="w-3.5 h-3.5" />
                      {(currentQuote.total_price / currentQuote.duration_hours).toFixed(2)}/hr
                    </p>
                  </div>
                </div>
              </div>

              {/* Desglose */}
              <div className="space-y-3 mb-8 text-sm">
                <div className="flex justify-between py-1 border-b border-[var(--border)] border-dashed">
                  <span className="text-[var(--text-secondary)]">Limpieza base</span>
                  <span className="font-medium font-mono">${currentQuote.base_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border)] border-dashed">
                  <span className="text-[var(--text-secondary)]">Multiplicador tipo</span>
                  <span className="font-medium font-mono">×{currentQuote.multiplier}</span>
                </div>
                {currentQuote.frequency_discount > 0 && (
                  <div className="flex justify-between py-1 border-b border-[var(--border)] border-dashed">
                    <span className="text-[var(--success)]">Descuento ({currentQuote.frequency})</span>
                    <span className="font-medium font-mono text-[var(--success)]">-${currentQuote.frequency_discount.toFixed(2)}</span>
                  </div>
                )}
                {currentQuote.extras_total > 0 && (
                  <div className="flex justify-between py-1 border-b border-[var(--border)] border-dashed">
                    <span className="text-amber-600">Extras adicionales</span>
                    <span className="font-medium font-mono text-amber-600">+${currentQuote.extras_total.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Confianza */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold flex items-center gap-1 text-[var(--text-secondary)]">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    Confianza del precio
                  </span>
                  <span className="text-xs font-bold text-[var(--success)]">{currentQuote.confidence_score}%</span>
                </div>
                <div className="h-1.5 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[var(--success)] transition-all duration-1000" 
                    style={{ width: `${currentQuote.confidence_score}%` }}
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleDownloadPDF} variant="primary" className="h-11 shadow-md">
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button onClick={handleSaveQuote} variant="secondary" disabled={isSaving} className="h-11">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar
                </Button>
                <Button 
                  onClick={handleShareWhatsApp}
                  className="col-span-2 h-11 bg-[#25D366] hover:bg-[#128C7E] text-white border-none shadow-lg shadow-[#25D366]/20 transition-all font-bold"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Enviar por WhatsApp
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="h-[500px] flex flex-col items-center justify-center text-center p-8 bg-[var(--bg-secondary)]/30 border-dashed border-2">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <FileText className="w-8 h-8 text-[var(--text-muted)]" />
              </div>
              <p className="text-[var(--text-secondary)] font-medium max-w-[200px] leading-relaxed">
                Completa el chat para generar una cotización profesional.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Tabla de Cotizaciones Guardadas */}
      <div className="mt-12 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Cotizaciones Guardadas</h2>
          <Button variant="ghost" size="sm" onClick={fetchSavedQuotes}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
        
        <Card className="p-0 overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-secondary)]/50 border-b border-[var(--border)]">
                  <th className="px-6 py-4 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Propiedad</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {savedQuotes.length > 0 ? savedQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium">
                      {new Date(q.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant="info" className="capitalize">
                        {q.clean_type?.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                      {q.property_type}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-[var(--accent)] font-mono">
                      ${q.total_price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={cn(
                        "text-[10px] px-2 py-0.5",
                        q.status === 'draft' ? "bg-slate-100 text-slate-600" : "bg-green-100 text-green-600"
                      )}>
                        {q.status === 'draft' ? 'Borrador' : 'Enviado'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors" title="Ver Detalles">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <FileText className="w-12 h-12 text-[var(--text-muted)]/30 mb-4" />
                        <p className="text-[var(--text-secondary)]">No hay cotizaciones guardadas aún.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
