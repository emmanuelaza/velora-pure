import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  AlertCircle, 
  Calendar, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  TrendingUp,
  CreditCard,
  MoreHorizontal,
  Package,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { cn, getInitials } from '../lib/utils';

export default function Layout() {
  const { user, signOut } = useAuth();
  const { business } = useBusiness();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navGroups = [
    {
      label: 'Principal',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Users, label: 'Clientes', path: '/clients' },
        { icon: ClipboardList, label: 'Servicios', path: '/services' },
        { icon: FileText, label: 'Cotizaciones', path: '/quotes' },
      ]
    },
    {
      label: 'Gestión',
      items: [
        { icon: AlertCircle, label: 'Cobros', path: '/pending', badge: true },
        { icon: Calendar, label: 'Agenda', path: '/schedule' },
        { icon: Users, label: 'Empleados', path: '/employees' },
        { icon: Package, label: 'Paquetes', path: '/packages' },
        { icon: TrendingUp, label: 'Finanzas', path: '/financials' },
      ]
    },
    {
      label: 'Cuenta',
      items: [
        { icon: Settings, label: 'Configuración', path: '/settings' },
        { icon: CreditCard, label: 'Billing', path: '/billing' },
      ]
    }
  ];

  const mobileBottomItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Clientes', path: '/clients' },
    { icon: AlertCircle, label: 'Cobros', path: '/pending' },
    { icon: Calendar, label: 'Agenda', path: '/schedule' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col md:flex-row font-sans antialiased text-[var(--text-primary)]">
      
      {/* ═══════════════════════════════════════════
          MOBILE HEADER
      ═══════════════════════════════════════════ */}
      <header className="md:hidden flex items-center justify-between h-14 px-4 bg-[#FFFFFF]/80 backdrop-blur-xl border-b border-[var(--border)] shadow-[var(--shadow-sm)] sticky top-0 z-[100]">
        <button 
          onClick={() => setIsDrawerOpen(true)} 
          className="p-2 -ml-2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] rounded-[var(--radius-md)] hover:bg-[var(--bg-hover)] transition-all duration-200"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="absolute left-1/2 -translate-x-1/2">
          <Logo small />
        </div>
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent-light)] font-semibold text-[11px]">
            {getInitials(user?.email || 'U')}
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════
          DESKTOP SIDEBAR
      ═══════════════════════════════════════════ */}
      <aside className="hidden md:flex flex-col w-[240px] bg-[#FFFFFF] border-r border-[var(--border)] h-screen sticky top-0 shrink-0">
        
        {/* Sidebar Header */}
        <div className="px-5 pt-6 pb-4">
          <Logo />
          <p className="text-[12px] text-[var(--text-secondary)] mt-2 pl-[2px] truncate">
            {business?.business_name || 'Cargando...'}
          </p>
        </div>

        {/* Separator */}
        <div className="mx-4 h-px bg-[var(--border)]" />

        {/* Navigation */}
        <nav className="flex-1 px-3 overflow-y-auto pt-4 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <h3 className="section-label px-3 pb-1 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.08em]">
                {group.label}
              </h3>
              <div className="space-y-[2px]">
                {group.items.map((item) => (
                  <NavItem key={item.path} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent-light)] font-semibold text-[11px] shrink-0">
              {getInitials(user?.email || 'U')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] text-[var(--text-muted)] truncate">
                {user?.email}
              </p>
            </div>
            <button 
              onClick={handleSignOut}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-[var(--radius-md)] transition-all duration-200 shrink-0"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════
          MOBILE BOTTOM NAV
      ═══════════════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#FFFFFF]/90 backdrop-blur-xl border-t border-[var(--border)] z-[100] flex items-stretch justify-around safe-bottom">
        {mobileBottomItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center gap-0.5 py-2 px-1 min-w-[56px] flex-1 transition-all duration-200",
              isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-tight">{item.label}</span>
          </NavLink>
        ))}
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 py-2 px-1 min-w-[56px] flex-1 transition-all duration-200",
            isDrawerOpen ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
          )}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-tight">Más</span>
        </button>
      </nav>

      {/* ═══════════════════════════════════════════
          MOBILE DRAWER OVERLAY
      ═══════════════════════════════════════════ */}
      {isDrawerOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-[110]"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}
      
      {/* ═══════════════════════════════════════════
          MOBILE DRAWER
      ═══════════════════════════════════════════ */}
      <aside className={cn(
        "md:hidden fixed inset-y-0 left-0 w-[280px] bg-[#FFFFFF] border-r border-[var(--border)] z-[120] transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col",
        isDrawerOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Drawer Header */}
        <div className="px-5 pt-6 pb-4 flex items-start justify-between">
          <div>
            <Logo small />
            <p className="text-[12px] text-[var(--text-secondary)] mt-1.5 truncate">
              {business?.business_name || 'Cargando...'}
            </p>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(false)} 
            className="p-2 -mr-2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-[var(--radius-md)] transition-all duration-200"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Separator */}
        <div className="mx-4 h-px bg-[var(--border)]" />
        
        {/* Drawer Navigation */}
        <div className="flex-1 overflow-y-auto px-3 pt-4 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <h3 className="section-label px-3 pb-1 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.08em]">
                {group.label}
              </h3>
              <div className="space-y-[2px]">
                {group.items.map((item) => (
                  <NavItem 
                    key={item.path} 
                    item={item} 
                    onClick={() => setIsDrawerOpen(false)} 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-[var(--border)]">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-all duration-200"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════
          MAIN CONTENT AREA
      ═══════════════════════════════════════════ */}
      <main className="flex-1 min-w-0 flex flex-col pb-16 md:pb-0 h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 py-5 md:px-8 md:py-8">
          <div className="max-w-[1200px] mx-auto w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════
   NAV ITEM COMPONENT
═══════════════════════════════════════════ */
function NavItem({ item, onClick }: { item: any, onClick?: () => void }) {
  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive }) => cn(
        "nav-item flex items-center justify-between w-full px-3 py-2 rounded-[var(--radius-md)] text-[14px] font-medium group relative",
        "transition-all duration-200",
        isActive 
          ? "bg-[var(--accent-subtle)] text-[var(--accent-dark)]" 
          : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
      )}
    >
      {({ isActive }) => (
        <>
          {/* Linear-style active indicator — 3px left bar */}
          {isActive && (
            <div className="absolute left-0 top-[6px] bottom-[6px] w-[3px] rounded-r-full bg-[var(--accent)]" />
          )}
          
          <div className="flex items-center gap-3">
            <item.icon className={cn(
              "w-[18px] h-[18px] shrink-0 transition-colors duration-200",
              isActive ? "text-[var(--accent)]" : ""
            )} />
            <span className={cn(
              "transition-colors duration-200",
              isActive ? "font-semibold" : "font-medium"
            )}>{item.label}</span>
          </div>
          
          {item.badge && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--danger)] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--danger)]" />
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

/* ═══════════════════════════════════════════
   LOGO COMPONENT
═══════════════════════════════════════════ */
function Logo({ small }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 group cursor-default select-none">
      <div className={cn(
        "bg-gradient-to-br from-[var(--accent)] to-[var(--accent-light)] flex items-center justify-center font-bold text-white transition-transform duration-300 group-hover:scale-105",
        small ? "w-7 h-7 rounded-lg text-xs" : "w-8 h-8 rounded-lg text-sm"
      )}>
        V
      </div>
      <span
        className={cn(
          "font-bold tracking-tight font-display",
          small ? "text-base" : "text-[18px]"
        )}
        style={{
          color: "var(--text-primary)"
        }}
      >
        Velora Pure
      </span>
    </div>
  );
}
