import { useEffect, useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Clock, 
  History,
  Briefcase,
  DollarSign,
  AlertCircle,
  TrendingUp,
  CreditCard,
  UserCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBusiness } from '../context/BusinessContext';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import toast from 'react-hot-toast';

// New UI Components
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/EmptyState';

interface Employee {
  id: string;
  name: string;
  role: string;
  payment_type: 'por_hora' | 'por_servicio' | 'salario_fijo';
  payment_rate: number;
  payment_period: 'semanal' | 'quincenal';
  is_active: boolean;
  notes?: string;
}

interface PayrollPayment {
  id: string;
  employee_id: string;
  amount: number;
  period_start: string;
  period_end: string;
  paid_at: string;
  notes?: string;
  employees?: {
    name: string;
  };
}

export default function Employees() {
  const { business } = useBusiness();
  const [activeTab, setActiveTab] = useState<'equipo' | 'nomina'>('equipo');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [history, setHistory] = useState<PayrollPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    role: 'Limpiador/a',
    payment_type: 'por_servicio' as 'por_hora' | 'por_servicio' | 'salario_fijo',
    payment_rate: '',
    payment_period: 'semanal' as 'semanal' | 'quincenal',
    is_active: true,
    notes: ''
  });

  // Payroll Form
  const [payForm, setPayForm] = useState({
    employee_id: '',
    employee_name: '',
    amount: 0,
    period_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    period_end: new Date().toISOString().split('T')[0],
    hours: ''
  });

  useEffect(() => {
    if (business) {
      fetchData();
    }
  }, [business]);

  const fetchData = async () => {
    if (!business) return;
    setLoading(true);
    try {
      const [empRes, histRes] = await Promise.all([
        supabase.from('employees').select('*').eq('business_id', business.id).order('name'),
        supabase.from('payroll_payments').select('*, employees(name)').eq('business_id', business.id).order('paid_at', { ascending: false }).limit(20)
      ]);

      if (empRes.error) throw empRes.error;
      if (histRes.error) throw histRes.error;

      setEmployees(empRes.data || []);
      setHistory(histRes.data || []);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setIsSubmitting(true);

    try {
      const data = {
        business_id: business.id,
        name: formData.name,
        role: formData.role,
        payment_type: formData.payment_type,
        payment_rate: Number(formData.payment_rate),
        payment_period: formData.payment_period,
        is_active: formData.is_active,
        notes: formData.notes
      };

      if (editingEmployee) {
        const { error } = await supabase.from('employees').update(data).eq('id', editingEmployee.id);
        if (error) throw error;
        toast.success('Empleado actualizado');
      } else {
        const { error } = await supabase.from('employees').insert(data);
        if (error) throw error;
        toast.success('Empleado agregado');
      }

      setIsModalOpen(false);
      setEditingEmployee(null);
      setFormData({
        name: '',
        role: 'Limpiador/a',
        payment_type: 'por_servicio',
        payment_rate: '',
        payment_period: 'semanal',
        is_active: true,
        notes: ''
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (employee: Employee) => {
    try {
      const { error } = await supabase.from('employees').update({ is_active: !employee.is_active }).eq('id', employee.id);
      if (error) throw error;
      setEmployees(employees.map(e => e.id === employee.id ? { ...e, is_active: !e.is_active } : e));
      toast.success(employee.is_active ? 'Empleado desactivado' : 'Empleado activado');
    } catch {
      toast.error('Error al actualizar estado');
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('payroll_payments').insert({
        business_id: business.id,
        employee_id: payForm.employee_id,
        amount: payForm.amount,
        period_start: payForm.period_start,
        period_end: payForm.period_end,
        paid_at: new Date().toISOString()
      });

      if (error) throw error;
      toast.success('Pago registrado correctamente');
      setIsPayModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Personal</h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium italic opacity-80">Gestiona tu equipo de trabajo y el control de nómina</p>
        </div>
        <Button 
          onClick={() => {
            setEditingEmployee(null);
            setFormData({
              name: '',
              role: 'Limpiador/a',
              payment_type: 'por_servicio',
              payment_rate: '',
              payment_period: 'semanal',
              is_active: true,
              notes: ''
            });
            setIsModalOpen(true);
          }}
          size="lg"
          className="shadow-xl shadow-[var(--accent)]/15"
        >
          <UserPlus className="w-5 h-5" />
          Agregar Empleado
        </Button>
      </header>

      {/* Tabs */}
      <div className="flex bg-[var(--bg-secondary)] p-1 rounded-[12px] border border-[var(--border)] max-w-xs">
        <button 
          onClick={() => setActiveTab('equipo')}
          className={cn(
            "flex-1 py-2.5 rounded-[10px] text-sm font-bold transition-all duration-200",
            activeTab === 'equipo' 
              ? "bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-soft)] shadow-[0_4px_12px_rgba(0,0,0,0.3)] translate-y-[-1px]" 
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          )}
        >
          <Users className="w-4 h-4 inline-block mr-2" />
          Equipo
        </button>
        <button 
          onClick={() => setActiveTab('nomina')}
          className={cn(
            "flex-1 py-2.5 rounded-[10px] text-sm font-bold transition-all duration-200",
            activeTab === 'nomina' 
              ? "bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-soft)] shadow-[0_4px_12px_rgba(0,0,0,0.3)] translate-y-[-1px]" 
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          )}
        >
          <CreditCard className="w-4 h-4 inline-block mr-2" />
          Nómina
        </button>
      </div>

      {activeTab === 'equipo' ? (
        <section className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => <div key={i} className="h-64 bg-[var(--bg-card)] rounded-[20px] animate-pulse" />)}
            </div>
          ) : employees.length === 0 ? (
            <EmptyState 
              icon={Users}
              title="No hay empleados inscritos"
              description="Comienza agregando a tu primer colaborador para asignarle servicios."
              actionLabel="Agregar Empleado"
              onAction={() => setIsModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees.map(emp => (
                <Card 
                  key={emp.id} 
                  padding="none" 
                  className={cn(
                    "flex flex-col justify-between transition-all group border border-[var(--border)] overflow-hidden", 
                    !emp.is_active && "grayscale opacity-50"
                  )}
                >
                  <div className="p-6 pb-0">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-[18px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] font-bold text-2xl group-hover:bg-[var(--accent)] group-hover:text-white transition-colors duration-300">
                          {emp.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-xl text-[var(--text-primary)] truncate tracking-tight">{emp.name}</h3>
                          <p className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-[0.15em] mt-1">{emp.role}</p>
                        </div>
                      </div>
                      <Badge variant={emp.is_active ? 'success' : 'muted'}>
                        {emp.is_active ? 'Activo' : 'Out'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-6 border-y border-[var(--border)] border-dashed">
                      <div className="space-y-1">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest flex items-center gap-1.5 line-clamp-1">
                           <Briefcase className="w-3 h-3" /> Esquema
                        </p>
                        <p className="text-sm font-bold text-[var(--text-primary)]">
                           {emp.payment_type === 'por_hora' ? 'Por hora' : emp.payment_type === 'por_servicio' ? 'Por servicio' : 'Sueldo fijo'}
                        </p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">Tarifa Base</p>
                        <p className="font-mono text-xl font-black text-[var(--text-primary)]">{formatCurrency(emp.payment_rate)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[var(--bg-secondary)]/50 flex gap-2">
                    <Button 
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingEmployee(emp);
                        setFormData({
                          name: emp.name,
                          role: emp.role,
                          payment_type: emp.payment_type,
                          payment_rate: emp.payment_rate.toString(),
                          payment_period: emp.payment_period,
                          is_active: emp.is_active,
                          notes: emp.notes || ''
                        });
                        setIsModalOpen(true);
                      }}
                      className="flex-1 bg-[var(--bg-card)] border-[var(--border)]"
                    >
                      Configurar
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(emp)}
                      className={cn(
                        "h-10 px-4",
                        emp.is_active ? "text-[var(--danger)] hover:bg-[var(--danger)]/10" : "text-[var(--success)] hover:bg-[var(--success)]/10"
                      )}
                      title={emp.is_active ? 'Desactivar' : 'Reactivar'}
                    >
                      {emp.is_active ? 'Desactivar' : 'Reactivar'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {employees.filter(e => e.is_active).map(emp => (
              <PayrollCard 
                key={emp.id} 
                employee={emp} 
                onPay={(amount) => {
                  setPayForm({
                    ...payForm,
                    employee_id: emp.id,
                    employee_name: emp.name,
                    amount: amount
                  });
                  setIsPayModalOpen(true);
                }} 
              />
            ))}
          </div>

          <div className="space-y-6">
            <div className="px-1 flex items-center justify-between">
               <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                <History className="w-6 h-6 text-[var(--accent)]" />
                Historial de Liquidaciones
              </h2>
              <Badge variant="muted">{history.length} Pagos</Badge>
            </div>
            
            <Card padding="none" className="overflow-hidden border border-[var(--border)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Empleado</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Período de Trabajo</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] text-right">Neto Pagado</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] text-center">Fecha Pago</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {history.map(pay => (
                      <tr key={pay.id} className="hover:bg-[var(--bg-hover)]/30 transition-colors">
                        <td className="px-6 py-5">
                          <p className="font-bold text-[var(--text-primary)] text-sm">{pay.employees?.name}</p>
                        </td>
                        <td className="px-6 py-5 text-xs text-[var(--text-secondary)] font-medium">
                          {formatDate(pay.period_start)} al {formatDate(pay.period_end)}
                        </td>
                        <td className="px-6 py-5 font-mono font-bold text-right text-[var(--success)]">{formatCurrency(pay.amount)}</td>
                        <td className="px-6 py-5 text-center text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest opacity-60">
                          {new Date(pay.paid_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {history.length === 0 && (
                <div className="py-20 text-center">
                   <EmptyState 
                    icon={CreditCard}
                    title="No hay pagos todavía"
                    description="Los pagos confirmados aparecerán en este historial cronológicamente."
                   />
                </div>
              )}
            </Card>
          </div>
        </section>
      )}

      {/* Modal Agregar/Editar */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingEmployee ? 'Configurar Perfil' : 'Nuevo Colaborador'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Nombre Completo"
            placeholder="María López"
            required
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />

          <Input 
            label="Cargo / Función"
            placeholder="Ej: Limpiador/a Senior"
            value={formData.role}
            onChange={e => setFormData({...formData, role: e.target.value})}
          />

          <div className="space-y-4">
            <label className="text-[13px] font-bold text-[var(--text-secondary)] px-1 uppercase tracking-widest">Esquema de Retribución</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'por_hora', label: 'Hora', icon: Clock },
                { id: 'por_servicio', label: 'Servicio', icon: Briefcase },
                { id: 'salario_fijo', label: 'Sueldo', icon: DollarSign }
              ].map(opt => (
                <button 
                  key={opt.id}
                  type="button"
                  onClick={() => setFormData({...formData, payment_type: opt.id as any})}
                  className={cn(
                    "py-5 rounded-2xl border flex flex-col items-center gap-2 transition-all duration-300",
                    formData.payment_type === opt.id 
                      ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)] shadow-[0_4px_16px_rgba(139,92,246,0.2)] ring-1 ring-[var(--accent)]/30" 
                      : "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-muted)] grayscale opacity-60 hover:opacity-100"
                  )}
                >
                  <opt.icon className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{opt.label}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <Input 
                label={formData.payment_type === 'por_hora' ? 'Pago por hora ($)' : formData.payment_type === 'por_servicio' ? 'Pago por trabajo ($)' : 'Sueldo Total ($)'}
                type="number" 
                step="0.01"
                required
                value={formData.payment_rate}
                onChange={e => setFormData({...formData, payment_rate: e.target.value})}
              />
              {formData.payment_type === 'salario_fijo' && (
                <Select 
                  label="Frecuencia de Pago"
                  value={formData.payment_period}
                  onChange={e => setFormData({...formData, payment_period: e.target.value as any})}
                >
                  <option value="semanal">Semanal</option>
                  <option value="quincenal">Quincenal</option>
                </Select>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[var(--text-secondary)] px-1">Notas del Perfil (Privadas)</label>
            <textarea 
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[12px] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent)]/15 transition-all h-24 resize-none"
              placeholder="Info de contacto, disponibilidad, etc..."
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)} className="flex-1">
              Descartar
            </Button>
            <Button type="submit" className="flex-1 shadow-lg shadow-[var(--accent)]/10" loading={isSubmitting} disabled={!formData.name || !formData.payment_rate} size="lg">
              {editingEmployee ? 'Guardar Cambios' : 'Registrar Empleado'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Pago */}
      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title="Confirmar Pago de Nómina">
        <form onSubmit={handlePay} className="space-y-6">
          <div className="flex items-center gap-4 p-5 bg-[var(--accent-subtle)] border border-[var(--accent)]/20 rounded-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <TrendingUp className="w-24 h-24 text-[var(--accent)]" />
            </div>
            <div className="w-14 h-14 bg-[var(--accent)] rounded-[18px] flex items-center justify-center text-white font-bold text-2xl shadow-inner relative z-10">
               {payForm.employee_name.charAt(0)}
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-[var(--accent-light)] uppercase tracking-[0.2em] mb-1">Pagando a</p>
              <p className="text-xl font-bold text-[var(--text-primary)] tracking-tight">{payForm.employee_name}</p>
            </div>
          </div>
          
          <div className="bg-[var(--bg-secondary)] p-8 rounded-3xl border border-[var(--border)] flex flex-col items-center shadow-inner">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--text-muted)] mb-3">Total Neto a Transferir</span>
            <span className="font-mono text-4xl font-black text-[var(--success)] drop-shadow-[0_4px_12px_rgba(52,211,153,0.2)]">{formatCurrency(payForm.amount)}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Desde"
              type="date" 
              required
              value={payForm.period_start}
              onChange={e => setPayForm({...payForm, period_start: e.target.value})}
            />
            <Input 
              label="Hasta"
              type="date" 
              required
              value={payForm.period_end}
              onChange={e => setPayForm({...payForm, period_end: e.target.value})}
            />
          </div>

          <div className="p-4 bg-[var(--warning)]/5 rounded-xl border border-[var(--warning)]/20 flex gap-3">
             <AlertCircle className="w-5 h-5 text-[var(--warning)] shrink-0" />
             <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium italic">
               Al confirmar, se registrará el pago en el historial y se considerará este período como liquidado para esta persona.
             </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button variant="secondary" type="button" onClick={() => setIsPayModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-[var(--success)] hover:bg-[var(--success-hover)] text-white border-none shadow-[0_12px_24px_rgba(52,211,153,0.3)] ring-1 ring-[var(--success)]/20" loading={isSubmitting}>
              Dispersar Pago
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function PayrollCard({ employee, onPay }: { employee: Employee, onPay: (amount: number) => void }) {
  const [count, setCount] = useState(0);
  const [hours, setHours] = useState('');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function fetchCalc() {
      setFetching(true);
      if (employee.payment_type === 'por_servicio') {
        const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count: svcCount } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_employee_id', employee.id)
          .gte('date', lastWeek);
        
        setCount(svcCount || 0);
      }
      setFetching(false);
    }
    fetchCalc();
  }, [employee]);

  const calculatedAmount = employee.payment_rate * (employee.payment_type === 'salario_fijo' ? 1 : employee.payment_type === 'por_servicio' ? count : Number(hours || 0));

  return (
    <Card padding="none" className="relative border border-[var(--border)] overflow-hidden hover:border-[var(--accent)]/30 transition-all duration-500 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[18px] bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--accent)] flex items-center justify-center font-bold text-2xl shadow-inner group-hover:scale-105 transition-transform">
              {employee.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-[var(--text-primary)] text-lg tracking-tight">{employee.name}</h3>
              <p className="text-[10px] text-[var(--text-muted)] uppercase font-black tracking-[0.2em] mt-1 line-clamp-1">{employee.role}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[var(--text-muted)] uppercase font-bold tracking-widest mb-1">Monto de Nómina</p>
            <p className="font-mono text-2xl font-black text-[var(--text-primary)]">{fetching ? '...' : formatCurrency(calculatedAmount)}</p>
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)]/50 p-5 rounded-2xl border border-[var(--border)] space-y-4">
          {employee.payment_type === 'por_hora' ? (
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                 <Clock className="w-3 h-3" /> Horas registradas
              </label>
              <input 
                type="number" 
                className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 text-3xl font-mono font-black text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all ring-offset-0 focus:ring-4 focus:ring-[var(--accent)]/5" 
                placeholder="0.0"
                value={hours}
                onChange={e => setHours(e.target.value)}
              />
            </div>
          ) : employee.payment_type === 'por_servicio' ? (
            <div className="flex justify-between items-center py-1">
              <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.1em] flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[var(--accent)]" /> 
                Servicios (Últimos 7 días)
              </span>
              <Badge variant="info" className="text-lg px-4 py-0.5 font-black">{fetching ? '..' : count}</Badge>
            </div>
          ) : (
            <div className="flex justify-between items-center py-1 px-1">
              <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.1em]">Ciclo Automático</span>
              <Badge variant="muted" className="text-[10px] px-3 py-1 font-black uppercase tracking-widest border-[var(--border)]">{employee.payment_period}</Badge>
            </div>
          )}
        </div>

        <Button 
          onClick={() => onPay(calculatedAmount)}
          disabled={calculatedAmount <= 0}
          variant="primary"
          className={cn(
            "w-full h-12 shadow-inner font-black uppercase tracking-[0.2em] text-[10px] duration-300",
            calculatedAmount > 0 
              ? "bg-[var(--accent)] shadow-[0_8px_20px_rgba(139,92,246,0.3)]" 
              : "opacity-30"
          )}
        >
          <CreditCard className="w-4 h-4" />
          Emitir Pago
        </Button>
      </div>
    </Card>
  );
}
