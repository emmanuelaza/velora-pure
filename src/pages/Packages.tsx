import { useEffect, useState } from 'react';
import { 
  Package, 
  Plus, 
  Clock, 
  Sparkles, 
  Check, 
  Edit2, 
  MessageCircle, 
  ChevronDown, 
  ChevronUp, 
  Image as ImageIcon,
  ExternalLink,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBusiness } from '../context/BusinessContext';
import { formatCurrency, cn } from '../lib/utils';
import toast from 'react-hot-toast';

// UI Components
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/EmptyState';
import { Select } from '../components/ui/Select';

interface ServicePackage {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_hours: number | null;
  photo_url: string | null;
  tasks: string[];
  areas: string[];
  products: string[];
  is_active: boolean;
}

interface Employee {
  id: string;
  name: string;
  phone: string | null;
  is_active: boolean;
}

export default function Packages() {
  const { business } = useBusiness();
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSAModalOpen, setIsSAModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_hours: '',
    photo_url: '',
    tasks: [] as string[],
    areas: [] as string[],
    products: [] as string[],
    is_active: true
  });

  // Tag inputs state
  const [currTask, setCurrTask] = useState('');
  const [currArea, setCurrArea] = useState('');
  const [currProduct, setCurrProduct] = useState('');

  useEffect(() => {
    if (business) {
      fetchData();
    }
  }, [business]);

  const fetchData = async () => {
    if (!business) return;
    setLoading(true);
    try {
      const [packRes, empRes] = await Promise.all([
        supabase.from('service_packages').select('*').eq('business_id', business.id).order('created_at', { ascending: false }),
        supabase.from('employees').select('id, name, phone, is_active').eq('business_id', business.id).eq('is_active', true).order('name')
      ]);

      if (packRes.error) throw packRes.error;
      if (empRes.error) throw empRes.error;

      setPackages(packRes.data || []);
      setEmployees(empRes.data || []);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !business) return;
    
    setUploading(true);
    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${business.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('package-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('package-photos')
        .getPublicUrl(fileName);

      setFormData({ ...formData, photo_url: urlData.publicUrl });
      toast.success('Imagen subida');
    } catch (error) {
      toast.error('Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  const addTag = (type: 'tasks' | 'areas' | 'products') => {
    const value = type === 'tasks' ? currTask : type === 'areas' ? currArea : currProduct;
    if (!value.trim()) return;
    
    if (!formData[type].includes(value.trim())) {
      setFormData({ ...formData, [type]: [...formData[type], value.trim()] });
    }
    
    if (type === 'tasks') setCurrTask('');
    else if (type === 'areas') setCurrArea('');
    else setCurrProduct('');
  };

  const removeTag = (type: 'tasks' | 'areas' | 'products', tag: string) => {
    setFormData({ ...formData, [type]: formData[type].filter(t => t !== tag) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setIsSubmitting(true);

    try {
      const data = {
        business_id: business.id,
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        duration_hours: formData.duration_hours ? Number(formData.duration_hours) : null,
        photo_url: formData.photo_url,
        tasks: formData.tasks,
        areas: formData.areas,
        products: formData.products,
        is_active: formData.is_active
      };

      if (editingPackage) {
        const { error } = await supabase.from('service_packages').update(data).eq('id', editingPackage.id);
        if (error) throw error;
        toast.success('Paquete actualizado');
      } else {
        const { error } = await supabase.from('service_packages').insert(data);
        if (error) throw error;
        toast.success('Paquete creado');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateWhatsAppMessage = () => {
    if (!selectedPackage) return '';
    
    const tasksPart = selectedPackage.tasks.length > 0 
      ? `✅ *Tareas a realizar:*\n${selectedPackage.tasks.map(t => `• ${t}`).join('\n')}\n\n` 
      : '';
    
    const areasPart = selectedPackage.areas.length > 0 
      ? `🏠 *Áreas a cubrir:*\n${selectedPackage.areas.map(a => `• ${a}`).join('\n')}\n\n` 
      : '';
      
    const productsPart = selectedPackage.products.length > 0 
      ? `🧴 *Productos a usar:*\n${selectedPackage.products.map(p => `• ${p}`).join('\n')}\n\n` 
      : '';

    return `Hola ${employees.find(e => e.id === selectedEmployeeId)?.name || 'equipo'} 👋\n\nPara tu próximo servicio usarás el paquete *${selectedPackage.name}*:\n\n💰 Precio del servicio: ${formatCurrency(selectedPackage.price)}\n⏱ Duración estimada: ${selectedPackage.duration_hours || 'N/A'} horas\n\n${tasksPart}${areasPart}${productsPart}${selectedPackage.description ? `${selectedPackage.description}\n\n` : ''}Cualquier duda me avisas 💪\n— ${business?.business_name}`;
  };

  const handleSendWA = () => {
    const employee = employees.find(e => e.id === selectedEmployeeId);
    if (!employee?.phone) {
      toast.error('El empleado no tiene teléfono registrado');
      return;
    }
    const phone = employee.phone.replace(/\D/g, '');
    const message = encodeURIComponent(generateWhatsAppMessage());
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Paquetes de Servicio</h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium italic opacity-80">Crea y gestiona los planes que ofreces</p>
        </div>
        <Button 
          onClick={() => {
            setEditingPackage(null);
            setFormData({
              name: '',
              description: '',
              price: '',
              duration_hours: '',
              photo_url: '',
              tasks: [],
              areas: [],
              products: [],
              is_active: true
            });
            setIsModalOpen(true);
          }}
          size="lg"
          className="shadow-xl shadow-[var(--accent)]/15"
        >
          <Plus className="w-5 h-5" />
          Nuevo paquete
        </Button>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-96 bg-[var(--bg-card)] rounded-[20px] animate-pulse" />)}
        </div>
      ) : packages.length === 0 ? (
        <EmptyState 
          icon={Package}
          title="Sin paquetes todavía"
          description="Crea tu primer paquete para organizar mejor tus servicios y el equipo."
          actionLabel="Crear Paquete"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {packages.map(pkg => (
            <PackageCard 
              key={pkg.id} 
              pkg={pkg} 
              onEdit={() => {
                setEditingPackage(pkg);
                setFormData({
                  name: pkg.name,
                  description: pkg.description || '',
                  price: pkg.price.toString(),
                  duration_hours: pkg.duration_hours?.toString() || '',
                  photo_url: pkg.photo_url || '',
                  tasks: pkg.tasks,
                  areas: pkg.areas,
                  products: pkg.products,
                  is_active: pkg.is_active
                });
                setIsModalOpen(true);
              }}
              onShare={() => {
                setSelectedPackage(pkg);
                setIsSAModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* CRUD Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingPackage ? 'Editar Paquete' : 'Nuevo Paquete'}
      >
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto px-1 pr-2 custom-scrollbar">
          {/* Photo Upload */}
          <div className="space-y-3">
            <label className="text-[13px] font-bold text-[var(--text-secondary)] px-1 uppercase tracking-widest">Foto del Paquete</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] overflow-hidden flex items-center justify-center shrink-0">
                {formData.photo_url ? (
                  <img src={formData.photo_url} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-[var(--border)]" />
                )}
              </div>
              <div className="flex-1">
                <input 
                  type="file" 
                  id="photo-upload" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <label 
                  htmlFor="photo-upload"
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm font-bold text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-hover)] transition-all",
                    uploading && "opacity-50 pointer-events-none"
                  )}
                >
                  {uploading ? 'Subiendo...' : formData.photo_url ? 'Cambiar foto' : 'Subir foto'}
                </label>
                <p className="text-[10px] text-[var(--text-muted)] mt-2 italic px-1">Recomendado: 16:9 ratio</p>
              </div>
            </div>
          </div>

          <Input 
            label="Nombre del Paquete"
            placeholder="Ej: Deep Clean Premium"
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Precio ($)"
              type="number"
              step="0.01"
              required
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: e.target.value })}
            />
            <Input 
              label="Duración (Horas)"
              type="number"
              step="0.5"
              placeholder="4"
              value={formData.duration_hours}
              onChange={e => setFormData({ ...formData, duration_hours: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[var(--text-secondary)] px-1">Descripción</label>
            <textarea 
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[12px] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all h-20 resize-none"
              placeholder="Breve descripción del plan..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Tag Inputs: Tasks, Areas, Products */}
          <TagInput 
            label="Tareas Incluidas" 
            placeholder="Escribe una tarea y presiona Enter..."
            tags={formData.tasks}
            value={currTask}
            onChange={setCurrTask}
            onAdd={() => addTag('tasks')}
            onRemove={(t) => removeTag('tasks', t)}
          />

          <TagInput 
            label="Áreas Cubiertas" 
            placeholder="Escribe una área (ej: Cocina) y presiona Enter..."
            tags={formData.areas}
            value={currArea}
            onChange={setCurrArea}
            onAdd={() => addTag('areas')}
            onRemove={(a) => removeTag('areas', a)}
          />

          <TagInput 
            label="Productos Incluidos" 
            placeholder="Escribe un producto y presiona Enter..."
            tags={formData.products}
            value={currProduct}
            onChange={setCurrProduct}
            onAdd={() => addTag('products')}
            onRemove={(p) => removeTag('products', p)}
          />

          <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)]">
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-[var(--text-primary)]">Estado del paquete</p>
              <p className="text-xs text-[var(--text-muted)]">Los paquetes inactivos no aparecerán en las citas.</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                formData.is_active ? "bg-[var(--success)]" : "bg-[var(--border)]"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                formData.is_active ? "left-7" : "left-1"
              )} />
            </button>
          </div>

          <div className="flex gap-4 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 shadow-lg shadow-[var(--accent)]/10" loading={isSubmitting} disabled={!formData.name || !formData.price}>
              {editingPackage ? 'Guardar Cambios' : 'Crear Paquete'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Share Modal */}
      <Modal 
        isOpen={isSAModalOpen} 
        onClose={() => setIsSAModalOpen(false)} 
        title="Enviar paquete a empleado"
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-[13px] font-bold text-[var(--text-secondary)] px-1 uppercase tracking-widest">Seleccionar Empleado</label>
            <Select 
              value={selectedEmployeeId}
              onChange={e => setSelectedEmployeeId(e.target.value)}
            >
              <option value="">Selecciona un colaborador...</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-3">
            <label className="text-[13px] font-bold text-[var(--text-secondary)] px-1 uppercase tracking-widest">Vista previa del mensaje</label>
            <textarea
              readOnly
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4 text-[13px] text-[var(--text-secondary)] font-mono h-64 resize-none focus:outline-none"
              value={generateWhatsAppMessage()}
            />
          </div>

          <div className="flex gap-4">
            <Button variant="secondary" onClick={() => setIsSAModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button 
              className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white border-none shadow-lg shadow-[#25D366]/20" 
              onClick={handleSendWA}
              disabled={!selectedEmployeeId || !selectedPackage}
            >
              <ExternalLink className="w-4 h-4" />
              Abrir WhatsApp
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function PackageCard({ pkg, onEdit, onShare }: { pkg: ServicePackage, onEdit: () => void, onShare: () => void }) {
  const [expanded, setExpanded] = useState<'none' | 'tasks' | 'areas' | 'products'>('none');

  return (
    <Card padding="none" className={cn(
      "overflow-hidden flex flex-col h-full border border-[var(--border)] transition-all hover:border-[var(--accent)]/30",
      !pkg.is_active && "grayscale opacity-60"
    )}>
      {/* Image / Header */}
      <div className="h-44 relative bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        {pkg.photo_url ? (
          <img src={pkg.photo_url} alt={pkg.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-card)]">
            <Sparkles className="w-10 h-10 text-[var(--accent)] opacity-20" />
          </div>
        )}
        {!pkg.is_active && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <Badge variant="muted">Inactivo</Badge>
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-xl text-[var(--text-primary)] leading-tight">{pkg.name}</h3>
          <span className="font-mono text-2xl font-black text-[var(--accent-light)]">{formatCurrency(pkg.price)}</span>
        </div>

        <div className="flex items-center gap-4 text-[13px] text-[var(--text-muted)] mb-4 font-medium">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {pkg.duration_hours || 'N/A'} hrs.
          </div>
        </div>

        {pkg.description && (
          <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-6 leading-relaxed italic opacity-80">
            "{pkg.description}"
          </p>
        )}

        <div className="h-px bg-[var(--border)] border-dashed opacity-30 mb-6" />

        {/* Collapsible Sections */}
        <div className="space-y-4 mb-8">
          <Section 
            icon={Check}
            label="Tareas Incluidas"
            count={pkg.tasks.length}
            active={expanded === 'tasks'}
            onToggle={() => setExpanded(expanded === 'tasks' ? 'none' : 'tasks')}
            items={pkg.tasks}
          />
          <Section 
            icon={Package}
            label="Áreas Cubiertas"
            count={pkg.areas.length}
            active={expanded === 'areas'}
            onToggle={() => setExpanded(expanded === 'areas' ? 'none' : 'areas')}
            items={pkg.areas}
          />
          <Section 
            icon={Sparkles}
            label="Productos"
            count={pkg.products.length}
            active={expanded === 'products'}
            onToggle={() => setExpanded(expanded === 'products' ? 'none' : 'products')}
            items={pkg.products}
          />
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2">
          <Button variant="secondary" size="sm" onClick={onEdit} className="h-9 text-xs">
            <Edit2 className="w-3.5 h-3.5" />
            Editar
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onShare}
            className="h-9 text-xs text-[#25D366] hover:bg-[#25D366]/10 border border-[#25D366]/20 bg-[#25D366]/5"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Enviar
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Section({ icon: Icon, label, count, active, onToggle, items }: { icon: any, label: string, count: number, active: boolean, onToggle: () => void, items: string[] }) {
  return (
    <div className="space-y-2">
      <button 
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-wider transition-colors",
          active ? "text-[var(--accent-light)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        )}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" />
          {label} ({count})
        </div>
        {active ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {active && (
        <div className="flex flex-wrap gap-1.5 animate-in slide-in-from-top-1 duration-200">
          {items.map((item, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[11px] text-[var(--text-secondary)]">
              {item}
            </span>
          ))}
          {items.length === 0 && <span className="text-[11px] text-[var(--text-muted)] italic px-1">Sin elementos</span>}
        </div>
      )}
    </div>
  );
}

function TagInput({ label, placeholder, tags, value, onChange, onAdd, onRemove }: { label: string, placeholder: string, tags: string[], value: string, onChange: (v: string) => void, onAdd: () => void, onRemove: (t: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-[13px] font-medium text-[var(--text-secondary)] px-1">{label}</label>
      <div className="space-y-3">
        <div className="flex gap-2">
          <input 
            type="text"
            placeholder={placeholder}
            className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[12px] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                onAdd();
              }
            }}
          />
          <Button type="button" onClick={onAdd} variant="secondary" size="sm">
            Agregar
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <span key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--accent)]/30 text-[12px] text-[var(--text-primary)] animate-in zoom-in-50 duration-200">
              {tag}
              <button type="button" onClick={() => onRemove(tag)} className="text-[var(--text-muted)] hover:text-[var(--danger)]">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
