import { useEffect, useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Clock, 
  History,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBusiness } from '../context/BusinessContext';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { Modal } from '../components/Modal';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import toast from 'react-hot-toast';

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
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Equipo y Nómina</h1>
          <p className="text-[#888888]">Gestiona tu personal y el historial de pagos</p>
        </div>
        <button 
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
          className="btn-primary flex items-center justify-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          <span>Agregar Empleado</span>
        </button>
      </header>

      {/* Custom Tabs */}
      <div className="flex bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border)] max-w-xs">
        <button 
          onClick={() => setActiveTab('equipo')}
          className={cn(
            "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
            activeTab === 'equipo' ? "bg-[var(--accent)] text-white shadow-lg" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          )}
        >
          Equipo
        </button>
        <button 
          onClick={() => setActiveTab('nomina')}
          className={cn(
            "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
            activeTab === 'nomina' ? "bg-[var(--accent)] text-white shadow-lg" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          )}
        >
          Nómina
        </button>
      </div>

      {activeTab === 'equipo' ? (
        <section className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
            </div>
          ) : employees.length === 0 ? (
            <EmptyState 
              icon={Users}
              title="No hay empleados"
              description="Comienza agregando a tu equipo para asignarles trabajos."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map(emp => (
                <div key={emp.id} className={cn("card p-6 flex flex-col justify-between transition-all group", !emp.is_active && "grayscale opacity-60")}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] font-bold text-lg">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-[var(--text-primary)]">{emp.name}</h3>
                        <p className="text-xs text-[var(--text-secondary)] uppercase font-bold tracking-wider">{emp.role}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase tracking-widest",
                      emp.is_active ? "bg-[var(--success)]/10 text-[var(--success)]" : "bg-[var(--text-secondary)]/10 text-[var(--text-secondary)]"
                    )}>
                      {emp.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="space-y-3 py-4 border-t border-[var(--border)]">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">Tipo de pago</span>
                      <span className="font-medium text-[var(--text-primary)]">
                        {emp.payment_type === 'por_hora' ? 'Por hora' : emp.payment_type === 'por_servicio' ? 'Por servicio' : 'Salario fijo'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">Tarifa / Monto</span>
                      <span className="amount text-[var(--text-primary)]">{formatCurrency(emp.payment_rate)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
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
                      className="flex-1 py-2 rounded-xl text-xs font-bold border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleToggleActive(emp)}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-bold transition-all",
                        emp.is_active ? "bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20" : "bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20"
                      )}
                    >
                      {emp.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-[var(--accent)]" />
              Historial de Pagos
            </h2>
            <div className="card overflow-hidden !p-0">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Empleado</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Período</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] text-right">Monto</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] text-right">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {history.map(pay => (
                    <tr key={pay.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-[var(--text-primary)]">{pay.employees?.name}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                        {formatDate(pay.period_start)} - {formatDate(pay.period_end)}
                      </td>
                      <td className="px-6 py-4 amount text-right text-[var(--success)]">{formatCurrency(pay.amount)}</td>
                      <td className="px-6 py-4 text-right text-xs text-[var(--text-secondary)]">
                        {new Date(pay.paid_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {history.length === 0 && (
                <div className="p-8 text-center text-[var(--text-secondary)]">No hay registros de pagos aún.</div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Modal Agregar/Editar */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingEmployee ? 'Editar Empleado' : 'Agregar Nuevo Empleado'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Nombre Completo *</label>
            <input 
              type="text" 
              required
              className="input-field w-full"
              placeholder="Ej: Maria Lopez"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Rol</label>
            <input 
              type="text" 
              className="input-field w-full"
              placeholder="Ej: Limpiador/a Senior"
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value})}
            />
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Esquema de Pago</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'por_hora', label: 'Hora' },
                { id: 'por_servicio', label: 'Servicio' },
                { id: 'salario_fijo', label: 'Fijo' }
              ].map(opt => (
                <button 
                  key={opt.id}
                  type="button"
                  onClick={() => setFormData({...formData, payment_type: opt.id as any})}
                  className={cn(
                    "py-2 rounded-xl border text-[10px] font-bold uppercase transition-all",
                    formData.payment_type === opt.id ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)]" : "bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                  {formData.payment_type === 'por_hora' ? 'Tarifa ($/h)' : formData.payment_type === 'por_servicio' ? 'Monto ($/serv)' : 'Monto Fijo ($)'}
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  className="input-field w-full"
                  value={formData.payment_rate}
                  onChange={e => setFormData({...formData, payment_rate: e.target.value})}
                />
              </div>
              {formData.payment_type === 'salario_fijo' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Período</label>
                  <select 
                    className="input-field w-full"
                    value={formData.payment_period}
                    onChange={e => setFormData({...formData, payment_period: e.target.value as any})}
                  >
                    <option value="semanal">Semanal</option>
                    <option value="quincenal">Quincenal</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Notas</label>
            <textarea 
              className="input-field w-full h-20 resize-none"
              placeholder="Info adicional, días disponibles, etc."
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-3 rounded-xl border border-[var(--border)] font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 btn-primary"
              disabled={!formData.name || !formData.payment_rate}
            >
              Guardar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Pago */}
      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title="Marcar como pagado">
        <form onSubmit={handlePay} className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">Confirmar pago para <span className="text-[var(--text-primary)] font-bold">{payForm.employee_name}</span></p>
          
          <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border)] flex justify-between items-center">
            <span className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]">Total a pagar</span>
            <span className="amount text-2xl text-[var(--success)]">{formatCurrency(payForm.amount)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Desde</label>
              <input 
                type="date" 
                required
                className="input-field w-full text-xs"
                value={payForm.period_start}
                onChange={e => setPayForm({...payForm, period_start: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Hasta</label>
              <input 
                type="date" 
                required
                className="input-field w-full text-xs"
                value={payForm.period_end}
                onChange={e => setPayForm({...payForm, period_end: e.target.value})}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => setIsPayModalOpen(false)}
              className="flex-1 py-3 rounded-xl border border-[var(--border)] font-bold text-[var(--text-secondary)]"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 py-3 rounded-xl bg-[var(--success)] text-white font-bold hover:shadow-lg shadow-[var(--success)]/20 transition-all"
            >
              Confirmar Pago
            </button>
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
      // Si es por servicio, contamos servicios completados en la última semana
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

  const calculatedAmount = employee.payment_type === 'salario_fijo' 
    ? employee.payment_rate 
    : employee.payment_type === 'por_servicio' 
      ? employee.payment_rate * count 
      : employee.payment_rate * Number(hours || 0);

  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold">
            {employee.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-[var(--text-primary)]">{employee.name}</h3>
            <p className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">{employee.role}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">Por pagar</p>
          <p className="amount text-xl text-[var(--text-primary)]">{formatCurrency(calculatedAmount)}</p>
        </div>
      </div>

      <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border)] space-y-4">
        {employee.payment_type === 'por_hora' ? (
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Horas trabajadas</label>
            <input 
              type="number" 
              className="input-field w-full text-lg font-bold" 
              placeholder="0.0"
              value={hours}
              onChange={e => setHours(e.target.value)}
            />
          </div>
        ) : employee.payment_type === 'por_servicio' ? (
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Servicios completados</span>
            <span className="text-lg font-bold text-[var(--text-primary)]">{count}</span>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Período de salario</span>
            <span className="text-xs font-bold text-[var(--text-primary)] uppercase">{employee.payment_period}</span>
          </div>
        )}
      </div>

      <button 
        onClick={() => onPay(calculatedAmount)}
        disabled={calculatedAmount <= 0}
        className="w-full py-3 bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/30 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[var(--warning)]/20 transition-all disabled:opacity-30"
      >
        <Clock className="w-4 h-4" />
        Marcar como pagado
      </button>
    </div>
  );
}
