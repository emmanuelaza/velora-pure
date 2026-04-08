import { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
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
  ExternalLink,
  Home,
  Building2,
  Store,
  Plane,
  Construction,
  Users,
  Info,
  Sparkles,
  Calculator,
  Loader2
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

// Pricing Constants
const BASE_PRICE: Record<number, number> = {
  0: 80,  // studio
  1: 90,
  2: 110,
  3: 140,
  4: 170,
  5: 200
};

const EXTRA_BATHROOM_PRICE = 15;

const CLEAN_TYPE_MULTIPLIER: Record<string, number> = {
  regular: 1.0,
  deep_clean: 1.4,
  post_construction: 2.0,
  airbnb: 1.2,
  move_in_out: 1.5
};

const FREQUENCY_DISCOUNT: Record<string, number> = {
  once: 0,
  monthly: 0.05,
  biweekly: 0.10,
  weekly: 0.15
};

const EXTRAS_PRICES: Record<string, number> = {
  pet: 15,
  fridge: 25,
  windows: 20,
  oven: 15,
  laundry: 20,
  cabinets: 20,
  walls: 30
};

interface SavedQuote {
  id: string;
  created_at: string;
  property_type: string;
  total_price: number;
  status: string;
  clean_type: string;
  client_name?: string;
}

interface Client {
  id: string;
  name: string;
}

export default function Quotes() {
  const { business } = useBusiness();
  const [clients, setClients] = useState<Client[]>([]);
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [form, setForm] = useState({
    property_type: 'house',
    bedrooms: 2,
    bathrooms: 1,
    sqft: '',
    clean_type: 'regular',
    frequency: 'once',
    extras: [] as string[],
    client_id: '',
    client_name: '',
    manual_price: null as number | null
  });

  const isActive = business?.subscription_status === 'active' || business?.subscription_status === 'trialing';

  useEffect(() => {
    if (isActive) {
      fetchData();
    }
  }, [isActive]);

  const fetchData = async () => {
    // Fetch Saved Quotes
    const { data: quotesData, error: quotesError } = await supabase
      .from('quotes')
      .select('id, created_at, property_type, total_price, status, clean_type')
      .order('created_at', { ascending: false })
      .limit(10);

    if (quotesError) console.error('Error fetching quotes:', quotesError);
    else setSavedQuotes(quotesData || []);

    // Fetch Clients
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('id, name')
      .order('name');

    if (clientsError) console.error('Error fetching clients:', clientsError);
    else setClients(clientsData || []);
  };

  // Real-time Calculation Logic
  const calculatedQuote = useMemo(() => {
    // 1. Base Price by Bedrooms
    let basePrice = form.bedrooms > 5 
      ? 200 + (form.bedrooms - 5) * 25 
      : BASE_PRICE[form.bedrooms] || 80;

    // 2. Extra Bathroom Surcharge
    const bathroomsPrice = form.bathrooms > 1 
      ? (form.bathrooms - 1) * EXTRA_BATHROOM_PRICE 
      : 0;

    const baseWithBaths = basePrice + bathroomsPrice;

    // 3. Multiplier by Clean Type
    const multiplier = CLEAN_TYPE_MULTIPLIER[form.clean_type] || 1.0;
    const subtotal = baseWithBaths * multiplier;

    // 4. Frequency Discount
    const discountRate = FREQUENCY_DISCOUNT[form.frequency] || 0;
    const frequency_discount = subtotal * discountRate;

    // 5. Extras Total
    const extras_total = form.extras.reduce((sum, extra) => sum + (EXTRAS_PRICES[extra] || 0), 0);

    // 6. Final Total
    const total_price = subtotal - frequency_discount + extras_total;

    // 7. Duration
    const duration_hours = Math.round(((baseWithBaths * multiplier) / 45) * 2) / 2;

    // 8. Confidence
    const confidence_score = form.sqft ? 90 : 75;

    return {
      base_price: basePrice,
      bathrooms_extra: bathroomsPrice,
      multiplier,
      subtotal,
      frequency_discount,
      extras_total,
      total_price: form.manual_price !== null ? form.manual_price : total_price,
      duration_hours,
      confidence_score,
      is_custom: form.manual_price !== null
    };
  }, [form]);

  const toggleExtra = (extra: string) => {
    setForm(prev => ({
      ...prev,
      extras: prev.extras.includes(extra) 
        ? prev.extras.filter(e => e !== extra)
        : [...prev.extras, extra]
    }));
  };

  const resetForm = () => {
    setForm({
      property_type: 'house',
      bedrooms: 2,
      bathrooms: 1,
      sqft: '',
      clean_type: 'regular',
      frequency: 'once',
      extras: [],
      client_id: '',
      client_name: '',
      manual_price: null
    });
  };

  const handleSaveQuote = async () => {
    if (!business) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('quotes').insert({
        business_id: business.id,
        property_type: form.property_type,
        bedrooms: form.bedrooms,
        bathrooms: form.bathrooms,
        sqft: form.sqft ? parseInt(form.sqft) : null,
        clean_type: form.clean_type,
        frequency: form.frequency,
        extras: form.extras,
        base_price: calculatedQuote.base_price,
        multiplier: calculatedQuote.multiplier,
        frequency_discount: calculatedQuote.frequency_discount,
        extras_total: calculatedQuote.extras_total,
        total_price: calculatedQuote.total_price,
        duration_hours: calculatedQuote.duration_hours,
        confidence_score: calculatedQuote.confidence_score,
        status: 'draft',
        notes: form.manual_price !== null ? 'Precio ajustado manualmente' : ''
      });

      if (error) throw error;
      toast.success('Cotización guardada');
      fetchData();
    } catch (error) {
      toast.error('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch('/api/generate-quote-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          quote: { ...form, ...calculatedQuote }, 
          business 
        })
      });
      const html = await response.text();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      }
    } catch (error) {
      toast.error('Error al generar PDF');
    }
  };

  const handleShareWhatsApp = () => {
    const frequencyLabel: any = { once: 'Única vez', weekly: 'Semanal', biweekly: 'Bi-semanal', monthly: 'Mensual' };
    const cleanTypeLabel: any = { regular: 'Limpieza regular', deep_clean: 'Deep Clean', post_construction: 'Post-construcción', airbnb: 'Airbnb Turnover', move_in_out: 'Move in/out' };
    const extrasLabel: any = { pet: 'Mascotas', fridge: 'Nevera', windows: 'Ventanas', oven: 'Horno', laundry: 'Lavandería', cabinets: 'Gabinetes', walls: 'Paredes' };

    const extrasText = form.extras.length > 0 
      ? `\n✨ Extras: ${form.extras.map(e => extrasLabel[e]).join(', ')}`
      : '';

    const message = `Hola! Aquí está tu cotización de ${business?.business_name || 'tu limpieza'} 🧹

🏠 Propiedad: ${form.property_type}, ${form.bedrooms} cuartos / ${form.bathrooms} baños
🧹 Servicio: ${cleanTypeLabel[form.clean_type] || form.clean_type}
📅 Frecuencia: ${frequencyLabel[form.frequency] || form.frequency}${extrasText}

💰 *Total por visita: $${calculatedQuote.total_price.toFixed(2)}*
⏱ Duración estimada: ${calculatedQuote.duration_hours} horas

Esta cotización es válida por 7 días.
¿Te gustaría agendar? 😊
— ${business?.business_name || 'Velora Pure'}`;

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
            Activa tu suscripción para acceder al generador de cotizaciones inteligente y profesionalizar tu negocio.
          </p>
          <Button className="w-full h-12" onClick={() => window.location.href = '/billing'}>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
            Cotizador Inteligente
            <Badge variant="info" className="bg-[var(--accent-subtle)] border-none">✨ PRO</Badge>
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">Calcula presupuestos profesionales en tiempo real.</p>
        </div>
        <Button onClick={resetForm} variant="secondary">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Limpiar Todo
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
        {/* Panel Izquierdo: Formulario */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="p-0 overflow-hidden border-[var(--border)] shadow-xl bg-white/80 backdrop-blur-sm">
            <div className="p-6 bg-[var(--bg-secondary)]/30 border-b border-[var(--border)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                <Calculator className="w-6 h-6 text-[var(--accent)]" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Nueva cotización</h3>
                <p className="text-xs text-[var(--text-secondary)]">Sigue los pasos para calcular el total</p>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Sección 1: Propiedad */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  <Home className="w-4 h-4 text-[var(--accent)]" />
                  1. Datos de la Propiedad
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[var(--text-muted)]">Tipo de propiedad</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'house', icon: Home, label: 'Casa' },
                        { id: 'apartment', icon: Building2, label: 'Apto' },
                        { id: 'airbnb', icon: Plane, label: 'Airbnb' },
                        { id: 'office', icon: Store, label: 'Oficina' },
                        { id: 'post_con', icon: Construction, label: 'Obra' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setForm({ ...form, property_type: t.id })}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1.5",
                            form.property_type === t.id 
                              ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent-dark)]" 
                              : "border-[var(--border)] bg-white hover:border-[var(--text-muted)]"
                          )}
                        >
                          <t.icon className={cn("w-5 h-5", form.property_type === t.id ? "text-[var(--accent)]" : "text-[var(--text-muted)]")} />
                          <span className="text-[10px] font-bold">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-[var(--text-muted)]">Cuartos</label>
                      <select 
                        value={form.bedrooms}
                        onChange={(e) => setForm({ ...form, bedrooms: parseInt(e.target.value) })}
                        className="w-full h-10 px-3 rounded-lg border border-[var(--border)] text-sm focus:ring-2 focus:ring-[var(--accent)]/10"
                      >
                        <option value={0}>Studio</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n} {n===1?'Cuarto':'Cuartos'}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-[var(--text-muted)]">Baños</label>
                      <select
                        value={form.bathrooms}
                        onChange={(e) => setForm({ ...form, bathrooms: parseInt(e.target.value) })}
                        className="w-full h-10 px-3 rounded-lg border border-[var(--border)] text-sm focus:ring-2 focus:ring-[var(--accent)]/10"
                      >
                        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} {n===1?'Baño':'Baños'}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Pies Cuadrados (SqFt)</label>
                  <Input 
                    type="number"
                    placeholder="Ejem: 1200 (Mejora la precisión)"
                    value={form.sqft}
                    onChange={(e) => setForm({ ...form, sqft: e.target.value })}
                  />
                </div>
              </div>

              {/* Sección 2: Servicio */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                  2. Tipo de Limpieza y Frecuencia
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[var(--text-muted)]">Modalidad de servicio</label>
                    <div className="space-y-2">
                      {[
                        { id: 'regular', name: 'Regular', desc: 'Mantenimiento' },
                        { id: 'deep_clean', name: 'Deep Clean', desc: 'Profunda' },
                        { id: 'post_construction', name: 'Obra', desc: 'Post-con' },
                        { id: 'airbnb', name: 'Airbnb', desc: 'Cambio huéspedes' },
                        { id: 'move_in_out', name: 'Move In/Out', desc: 'Entrega apto' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setForm({ ...form, clean_type: t.id })}
                          className={cn(
                            "w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all",
                            form.clean_type === t.id 
                              ? "border-[var(--accent)] bg-[var(--accent-subtle)]" 
                              : "border-[var(--border)] bg-white hover:bg-gray-50"
                          )}
                        >
                          <div>
                            <p className="text-sm font-bold">{t.name}</p>
                            <p className="text-[10px] text-[var(--text-secondary)]">{t.desc}</p>
                          </div>
                          <div className={cn(
                            "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                            form.clean_type === t.id ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--border)]"
                          )}>
                            {form.clean_type === t.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[var(--text-muted)]">Frecuencia</label>
                    <div className="space-y-2">
                      {[
                        { id: 'once', name: 'Única vez', desc: 'Sin descuento' },
                        { id: 'monthly', name: 'Mensual', desc: '5% Descuento' },
                        { id: 'biweekly', name: 'Bi-semanal', desc: '10% Descuento' },
                        { id: 'weekly', name: 'Semanal', desc: '15% Descuento' }
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setForm({ ...form, frequency: f.id })}
                          className={cn(
                            "w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all",
                            form.frequency === f.id 
                              ? "border-[var(--accent)] bg-[var(--accent-subtle)]" 
                              : "border-[var(--border)] bg-white hover:bg-gray-50"
                          )}
                        >
                          <div>
                            <p className="text-sm font-bold">{f.name}</p>
                            <p className="text-[10px] text-[var(--text-secondary)]">{f.desc}</p>
                          </div>
                          {f.id !== 'once' && (
                            <Badge variant="success" className="text-[9px] py-0">{parseInt(f.desc)%100}% OFF</Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 3: Extras */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  <Plus className="w-4 h-4 text-[var(--accent)]" />
                  3. Extras Adicionales
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { id: 'pet', label: '🐾 Mascotas', price: 15 },
                    { id: 'fridge', label: '❄️ Nevera', price: 25 },
                    { id: 'windows', label: '🪟 Ventanas', price: 20 },
                    { id: 'oven', label: '🍳 Horno', price: 15 },
                    { id: 'laundry', label: '👕 Lavandería', price: 20 },
                    { id: 'cabinets', label: '🗄️ Gabinetes', price: 20 },
                    { id: 'walls', label: '🧱 Paredes', price: 30 }
                  ].map((ext) => (
                    <button
                      key={ext.id}
                      onClick={() => toggleExtra(ext.id)}
                      className={cn(
                        "p-3 rounded-xl border text-left flex flex-col items-center justify-center transition-all gap-1 text-center",
                        form.extras.includes(ext.id)
                          ? "border-amber-400 bg-amber-50 text-amber-700 shadow-sm"
                          : "border-[var(--border)] bg-white hover:border-amber-200"
                      )}
                    >
                      <span className="text-sm font-medium">{ext.label}</span>
                      <span className="text-[10px] font-bold text-[var(--text-muted)]">+${ext.price}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sección 4: Cliente */}
              <div className="pt-4 border-t border-[var(--border)] space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  <Users className="w-4 h-4 text-[var(--accent)]" />
                  4. Datos del Cliente
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[var(--text-muted)]">Cliente Existente</label>
                    <select
                      value={form.client_id}
                      onChange={(e) => {
                        const client = clients.find(c => c.id === e.target.id);
                        setForm({ ...form, client_id: e.target.value, client_name: client?.name || '' });
                      }}
                      className="w-full h-10 px-3 rounded-lg border border-[var(--border)] text-sm"
                    >
                      <option value="">-- Seleccionar cliente --</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[var(--text-muted)]">O Nombre de Nuevo Cliente</label>
                    <Input 
                      placeholder="Nombre completo"
                      value={form.client_name}
                      onChange={(e) => setForm({ ...form, client_name: e.target.value, client_id: '' })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-8">
                 <Button onClick={handleSaveQuote} disabled={isSaving} className="w-full h-14 text-lg font-bold shadow-xl">
                   {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6 mr-3" />}
                   Guardar Cotización Oficial
                 </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Panel Derecho: Resumen en Tiempo Real */}
        <div className="lg:col-span-4 sticky top-8">
          <Card className="p-6 border-[var(--accent)] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all pointer-events-none">
              <Sparkles className="w-32 h-32 text-[var(--accent)]" />
            </div>

            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black tracking-tight text-[var(--text-primary)]">Resumen</h3>
              <Badge variant="success" className="animate-pulse">Live Tracking</Badge>
            </div>

            {/* Pills Summary */}
            <div className="flex flex-wrap gap-2 mb-8">
              <Badge variant="info" className="px-3 py-1 rounded-lg">
                {form.clean_type.replace('_', ' ').toUpperCase()}
              </Badge>
              <Badge variant="info" className="px-3 py-1 rounded-lg">
                {form.bedrooms > 0 ? `${form.bedrooms}B` : 'Studio'} / {form.bathrooms}Ba
              </Badge>
              <Badge variant="info" className="px-3 py-1 rounded-lg">
                Frec: {form.frequency}
              </Badge>
              {form.extras.map(e => (
                <Badge key={e} className="bg-amber-100 text-amber-700 border-amber-200">
                  +{e.toUpperCase()}
                </Badge>
              ))}
            </div>

            {/* Precio Destacado */}
            <div className="mb-8 p-6 bg-gradient-to-br from-[var(--bg-secondary)] to-white rounded-2xl border-2 border-[var(--accent)]/10 shadow-inner group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Total por Visita</span>
                {calculatedQuote.is_custom && (
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[9px] py-0 anime-in slide-in-from-right-1">Precio Ajustado</Badge>
                )}
              </div>
              <div className="text-5xl font-black text-[var(--accent)] font-mono flex items-baseline gap-1">
                <span className="text-2xl font-bold">$</span>
                {calculatedQuote.total_price.toFixed(2)}
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border)] border-dashed grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase">Duración Estimada</p>
                  <p className="text-sm font-black flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                    {calculatedQuote.duration_hours}h
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase">Precio / Hora</p>
                  <p className="text-sm font-black text-[var(--success)]">
                    ${(calculatedQuote.total_price / calculatedQuote.duration_hours).toFixed(2)}/h
                  </p>
                </div>
              </div>
            </div>

            {/* Desglose Tabla */}
            <div className="space-y-3 mb-8 text-[13px]">
              <div className="flex justify-between py-1.5 border-b border-[var(--border)] border-dashed">
                <span className="text-[var(--text-secondary)]">Precio Base ({form.bedrooms}B)</span>
                <span className="font-bold font-mono">${calculatedQuote.base_price.toFixed(2)}</span>
              </div>
              {calculatedQuote.bathrooms_extra > 0 && (
                <div className="flex justify-between py-1.5 border-b border-[var(--border)] border-dashed">
                  <span className="text-[var(--text-secondary)]">Baños extra ({form.bathrooms})</span>
                  <span className="font-bold font-mono">+${calculatedQuote.bathrooms_extra.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-[var(--border)] border-dashed">
                <span className="text-[var(--text-secondary)]">Multiplicador Limpieza (×{calculatedQuote.multiplier})</span>
                <span className="font-bold font-mono">${(calculatedQuote.subtotal).toFixed(2)}</span>
              </div>
              {calculatedQuote.frequency_discount > 0 && (
                <div className="flex justify-between py-1.5 border-b border-[var(--border)] border-dashed">
                  <span className="text-[var(--success)] font-bold">Descuento {form.frequency}</span>
                  <span className="font-bold font-mono text-[var(--success)]">-${calculatedQuote.frequency_discount.toFixed(2)}</span>
                </div>
              )}
              {calculatedQuote.extras_total > 0 && (
                <div className="flex justify-between py-1.5 border-b border-[var(--border)] border-dashed">
                  <span className="text-amber-600 font-bold">Extras Seleccionados</span>
                  <span className="font-bold font-mono text-amber-600">+${calculatedQuote.extras_total.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Ajuste Manual */}
            <div className="mb-8 p-4 bg-purple-50/50 rounded-xl border border-purple-100">
               <div className="flex items-center gap-2 mb-2 text-xs font-bold text-purple-700">
                 <DollarSign className="w-3.5 h-3.5" />
                 ¿AJUSTAR PRECIO FINAL?
               </div>
               <Input 
                 type="number"
                 placeholder="Opcional - Ingresa monto final"
                 className="h-9 border-purple-200 focus:ring-purple-200 bg-white"
                 value={form.manual_price || ''}
                 onChange={(e) => setForm({ ...form, manual_price: e.target.value ? parseFloat(e.target.value) : null })}
               />
            </div>

            {/* Confianza */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-black flex items-center gap-1 text-[var(--text-muted)] uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  Confianza Estimada
                </span>
                <span className={cn("text-xs font-black", calculatedQuote.confidence_score > 80 ? "text-[var(--success)]" : "text-yellow-600")}>
                  {calculatedQuote.confidence_score}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden border border-[var(--border)]">
                <div 
                  className={cn("h-full transition-all duration-1000", calculatedQuote.confidence_score > 80 ? "bg-[var(--success)]" : "bg-yellow-500")}
                  style={{ width: `${calculatedQuote.confidence_score}%` }}
                />
              </div>
              <p className="text-[9px] text-[var(--text-secondary)] mt-1.5 leading-tight">
                {form.sqft 
                  ? "✓ Alta precisión basada en pies cuadrados reales."
                  : "ⓘ Métrica estimada según promedio de cuartos."}
              </p>
            </div>

            {/* Acciones */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleDownloadPDF} variant="primary" className="h-12 shadow-lg group">
                  <Download className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                  Imprimir PDF
                </Button>
                <Button onClick={handleShareWhatsApp} className="h-12 bg-[#25D366] hover:bg-[#128C7E] text-white border-none shadow-lg shadow-[#25D366]/20 font-bold">
                  <Share2 className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              </div>
              <div className="bg-[var(--bg-secondary)]/50 p-3 rounded-lg flex items-start gap-2 border border-[var(--border)]">
                <Info className="w-4 h-4 text-[var(--text-muted)] shrink-0 mt-0.5" />
                <p className="text-[10px] text-[var(--text-muted)]">
                  Esta cotización será válida por 7 días naturales desde su generación actual.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Tabla de Historial (Reutilizada) */}
      <div className="mt-12 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Últimas Cotizaciones</h2>
          <Button variant="ghost" size="sm" onClick={fetchData}>
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
                  <th className="px-6 py-4 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {savedQuotes.length > 0 ? savedQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium">
                      {new Date(q.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                      {q.client_name || 'Prospecto'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant="info" className="capitalize text-[10px]">
                        {q.clean_type?.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-[var(--accent)] font-mono">
                      ${q.total_price?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={cn(
                        "text-[10px] px-2 py-0.5",
                        q.status === 'draft' ? "bg-slate-100 text-slate-600" : "bg-green-100 text-green-600"
                      )}>
                        {q.status === 'draft' ? 'BORRADOR' : 'ACEPTADA'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"><ExternalLink className="w-4 h-4" /></button>
                        <button className="p-2 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <FileText className="w-12 h-12 text-[var(--text-muted)]/10 mb-4" />
                        <p className="text-[var(--text-secondary)]">No hay registros aún.</p>
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
