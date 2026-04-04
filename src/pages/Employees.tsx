import { useEffect, useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Clock, 
  History,
  Briefcase,
  DollarSign,
  AlertCircle
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
      toast.success('Pago registrado');
      setIsPayModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Equipo y Nómina</h1>
          <p className="text-[var(--text-secondary)] mt-1">Gestiona tu personal y el historial de pagos</p>
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
        >
          <UserPlus className="w-5 h-5" />
          Agregar Empleado
        </Button>
      </header>

      {/* Custom Tabs */}
      <div className="flex bg-[var(--bg-secondary)] p-1 rounded-[12px] border border-[var(--border)] max-w-xs">
        <button 
          onClick={() => setActiveTab('equipo')}
          className={cn(
            "flex-1 py-2.5 rounded-[10px] text-sm font-bold transition-all",
            activeTab === 'equipo' ? "bg-[var(--accent)] text-white shadow-lg" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          )}
        >
          Equipo
        </button>
        <button 
          onClick={() => setActiveTab('nomina')}
          className={cn(
            "flex-1 py-2.5 rounded-[10px] text-sm font-bold transition-all",
            activeTab === 'nomina' ? "bg-[var(--accent)] text-white shadow-lg" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          )}
        >
          Nómina
        </button>
      </div>

      {activeTab === 'equipo' ? (
        <section className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => <div key={i} className="h-56 bg-[var(--bg-card)] rounded-[20px] animate-pulse" />)}
            </div>
          ) : employees.length === 0 ? (
            <EmptyState 
              icon={Users}
              title="No hay empleados"
              description="Comienza agregando a tu equipo para asignarles trabajos."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees.map(emp => (
                <Card key={emp.id} padding="lg" className={cn("flex flex-col justify-between transition-all group", !emp.is_active && "grayscale opacity-60")}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[14px] bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] font-bold text-xl">
                        {emp.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-[var(--text-primary)] truncate">{emp.name}</h3>
                        <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest mt-1">{emp.role}</p>
                      </div>
                    </div>
                    <Badge variant={emp.is_active ? 'success' : 'muted'} className="px-2 py-0.5">
                      {emp.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>

                  <div className="space-y-3.5 py-5 border-y border-[var(--border)] mb-6">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--text-secondary)] font-medium">Esquema</span>
                      <Badge variant="info" className="font-bold">
                        {emp.payment_type === 'por_hora' ? 'Por hora' : emp.payment_type === 'por_servicio' ? 'Por servicio' : 'Salario fijo'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--text-secondary)] font-medium">Tarifa</span>
                      <span className="font-mono text-lg font-bold text-[var(--text-primary)]">{formatCurrency(emp.payment_rate)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
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
                      className="flex-1"
                    >
                      Editar
                    </Button>
                    <Button 
                      variant={emp.is_active ? 'ghost' : 'secondary'}
                      size="sm"
                      onClick={() => handleToggleActive(emp)}
                      className={cn(
                        "flex-1",
                        emp.is_active ? "text-[var(--danger)] hover:bg-[var(--danger)]/5" : "text-[var(--success)]"
                      )}
                    >
                      {emp.is_active ? 'Desactivar' : 'Activar'}
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
            <div className="px-1">
               <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                <History className="w-6 h-6 text-[var(--accent)]" />
                Historial de Pagos Recientes
              </h2>
            </div>
            
            <Card padding="none" className="overflow-hidden border border-[var(--border)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[var(--bg-secondary)]/50 border-b border-[var(--border)]">
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Empleado</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Período</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] text-right">Monto</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] text-right">Fecha Pago</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {history.map(pay => (
                      <tr key={pay.id} className="hover:bg-[var(--bg-hover)]/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-[var(--text-primary)]">{pay.employees?.name}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--text-secondary)] font-medium">
                          {formatDate(pay.period_start)} - {formatDate(pay.period_end)}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-right text-[var(--success)]">{formatCurrency(pay.amount)}</td>
                        <td className="px-6 py-4 text-right text-xs text-[var(--text-muted)] font-medium">
                          {new Date(pay.paid_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {history.length === 0 && (
                <div className="py-20 text-center text-[var(--text-secondary)]">No hay registros de pagos aún.</div>
              )}
            </Card>
          </div>
        </section>
      )}

      {/* Modal Agregar/Editar */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingEmployee ? 'Editar Empleado' : 'Agregar Nuevo Empleado'}
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
            <label className="text-[13px] font-bold text-[var(--text-secondary)] px-1 uppercase tracking-widest">Esquema de Pago</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'por_hora', label: 'Hora', icon: Clock },
                { id: 'por_servicio', label: 'Servicio', icon: Briefcase },
                { id: 'salario_fijo', label: 'Fijo', icon: DollarSign }
              ].map(opt => (
                <button 
                  key={opt.id}
                  type="button"
                  onClick={() => setFormData({...formData, payment_type: opt.id as any})}
                  className={cn(
                    "py-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all",
                    formData.payment_type === opt.id 
                      ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)] shadow-[0_4px_12px_rgba(139,92,246,0.1)]" 
                      : "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-muted)] grayscale"
                  )}
                >
                  <opt.icon className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{opt.label}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <Input 
                label={formData.payment_type === 'por_hora' ? 'Tarifa ($/h)' : formData.payment_type === 'por_servicio' ? 'Monto ($/serv)' : 'Monto Fijo ($)'}
                type="number" 
                step="0.01"
                required
                value={formData.payment_rate}
                onChange={e => setFormData({...formData, payment_rate: e.target.value})}
              />
              {formData.payment_type === 'salario_fijo' && (
                <Select 
                  label="Frecuencia"
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
            <label className="text-[13px] font-medium text-[var(--text-secondary)] px-1">Notas Internas</label>
            <textarea 
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[12px] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 transition-all h-24 resize-none"
              placeholder="Info adicional, disponibilidad..."
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={!formData.name || !formData.payment_rate}>
              {editingEmployee ? 'Actualizar' : 'Guardar Empleado'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Pago */}
      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title="Confirmar Pago de Nómina">
        <form onSubmit={handlePay} className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-[var(--accent-subtle)] border border-[var(--accent)]/20 rounded-2xl">
            <div className="w-12 h-12 bg-[var(--accent)] rounded-full flex items-center justify-center text-white font-bold text-xl">
               {payForm.employee_name.charAt(0)}
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-widest">Beneficiario</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">{payForm.employee_name}</p>
            </div>
          </div>
          
          <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border)] flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Total a Transferir</span>
            <span className="font-mono text-4xl font-bold text-[var(--success)]">{formatCurrency(payForm.amount)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Fecha Inicio"
              type="date" 
              required
              value={payForm.period_start}
              onChange={e => setPayForm({...payForm, period_start: e.target.value})}
            />
            <Input 
              label="Fecha Fin"
              type="date" 
              required
              value={payForm.period_end}
              onChange={e => setPayForm({...payForm, period_end: e.target.value})}
            />
          </div>

          <div className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] flex gap-3">
             <AlertCircle className="w-5 h-5 text-[var(--warning)] shrink-0" />
             <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
               Al confirmar, se registrará el pago en el historial y se considerará este período como liquidado.
             </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button variant="secondary" type="button" onClick={() => setIsPayModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-[var(--success)] hover:bg-[var(--success)]/90 text-white border-none shadow-[0_8px_20px_rgba(52,211,153,0.2)]">
              Confirmar Pago
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

  useEffect(() => {
    async function fetchCalc() {
      if (employee.payment_type === 'por_servicio') {
        const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count: svcCount } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_employee_id', employee.id)
          .gte('date', lastWeek);
        
        setCount(svcCount || 0);
      }
    }
    fetchCalc();
  }, [employee]);

  const calculatedAmount = employee.payment_rate * (employee.payment_type === 'salario_fijo' ? 1 : employee.payment_type === 'por_servicio' ? count : Number(hours || 0));

  return (
    <Card padding="lg" className="space-y-6 border border-[var(--border)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[14px] bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--accent)] flex items-center justify-center font-bold text-xl">
            {employee.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-[var(--text-primary)] text-lg">{employee.name}</h3>
            <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest mt-1">{employee.role}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest mb-1">Por pagar</p>
          <p className="font-mono text-2xl font-bold text-[var(--text-primary)]">{formatCurrency(calculatedAmount)}</p>
        </div>
      </div>

      <div className="bg-[var(--bg-secondary)] p-5 rounded-2xl border border-[var(--border)] space-y-4">
        {employee.payment_type === 'por_hora' ? (
          <div className="space-y-2.5">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">Horas en el período</label>
            <input 
              type="number" 
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 text-2xl font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all" 
              placeholder="0.0"
              value={hours}
              onChange={e => setHours(e.target.value)}
            />
          </div>
        ) : employee.payment_type === 'por_servicio' ? (
          <div className="flex justify-between items-center py-2 px-1">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Servicios completados</span>
            <Badge variant="info" className="text-lg px-3 py-1 font-bold">{count}</Badge>
          </div>
        ) : (
          <div className="flex justify-between items-center py-2 px-1">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Ciclo de Nómina</span>
            <Badge variant="muted" className="text-xs px-3 py-1 font-bold uppercase">{employee.payment_period}</Badge>
          </div>
        )}
      </div>

      <Button 
        onClick={() => onPay(calculatedAmount)}
        disabled={calculatedAmount <= 0}
        variant={calculatedAmount > 0 ? 'secondary' : 'ghost'}
        className={cn(
          "w-full h-12 shadow-sm font-bold uppercase tracking-widest text-[11px]",
          calculatedAmount > 0 && "border-[var(--warning)]/30 text-[var(--warning)] hover:bg-[var(--warning)]/5"
        )}
      >
        <Clock className="w-4 h-4" />
        Emitir Pago
      </Button>
    </Card>
  );
}
