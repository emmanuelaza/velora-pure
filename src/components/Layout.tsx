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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { cn } from '../lib/utils';

export default function Layout() {
  const { user, signOut } = useAuth();
  const { business } = useBusiness();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Clientes', path: '/clients' },
    { icon: ClipboardList, label: 'Servicios', path: '/services' },
    { icon: AlertCircle, label: 'Cobros pendientes', path: '/pending', badge: true },
    { icon: Calendar, label: 'Agenda', path: '/schedule' },
    { icon: Users, label: 'Empleados', path: '/employees' },
    { icon: TrendingUp, label: 'Finanzas', path: '/financials' },
    { icon: Settings, label: 'Configuración', path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col md:flex-row font-sans antialiased text-[var(--text-primary)]">
      {/* Mobile TopBar */}
      <div className="md:hidden flex items-center justify-between h-16 px-4 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border)] sticky top-0 z-[100]">
        <button onClick={() => setIsDrawerOpen(true)} className="p-2 text-[var(--text-secondary)] hover:text-white transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <Logo small />
        <div className="w-10" />
      </div>

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-[240px] bg-[var(--bg-secondary)] border-r border-[var(--border)] h-screen sticky top-0 shrink-0">
        <div className="p-8">
          <Logo />
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--border)] space-y-3">
          <div className="mx-1 p-3 bg-[var(--bg-card)] rounded-[12px] border border-[var(--border)]">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Negocio</p>
            <p className="text-sm font-semibold truncate text-[var(--text-primary)]">{business?.business_name}</p>
          </div>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--danger)]/10 hover:text-[var(--danger)] transition-all group"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer (Overlay) */}
      {isDrawerOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}
      
      {/* Mobile Drawer (Content) */}
      <aside className={cn(
        "md:hidden fixed inset-y-0 left-0 w-[280px] bg-[var(--bg-secondary)] border-r border-[var(--border)] z-[120] transform transition-transform duration-300 ease-out flex flex-col",
        isDrawerOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 flex items-center justify-between">
          <Logo />
          <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-[var(--text-secondary)] hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-1.5">
          {menuItems.map((item) => (
            <NavItem key={item.path} item={item} onClick={() => setIsDrawerOpen(false)} />
          ))}
        </nav>
        <div className="p-4 border-t border-[var(--border)]">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-sm font-semibold text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/20 shadow-sm"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 transition-all overflow-x-hidden">
        {/* Header Desktop */}
        <header className="hidden md:flex items-center h-16 px-8 bg-[var(--bg-primary)]/70 backdrop-blur-[12px] border-b border-[var(--border)] sticky top-0 z-[90]">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] tracking-tight">Velora Pure Management</h2>
          <div className="ml-auto flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent-light)] font-bold text-xs ring-1 ring-[var(--accent)]/20">
                {user?.email?.[0].toUpperCase()}
             </div>
          </div>
        </header>

        <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavItem({ item, onClick }: { item: any, onClick?: () => void }) {
  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive }) => cn(
        "flex items-center justify-between w-full px-3 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-150 group relative",
        isActive 
          ? "bg-[var(--accent-subtle)] text-[var(--accent-light)] border-l-2 border-[var(--accent)]" 
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
      )}
    >
      <div className="flex items-center gap-2.5">
        <item.icon className={cn(
          "w-4.5 h-4.5 transition-transform duration-300 group-hover:scale-110",
          "group-[.active]:text-[var(--accent)]"
        )} />
        <span>{item.label}</span>
      </div>
      {item.badge && (
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)] shadow-[0_0_8px_rgba(248,113,113,0.6)]" />
      )}
    </NavLink>
  );
}

function Logo({ small }: { small?: boolean }) {
  const [logoError, setLogoError] = useState(false);

  if (logoError) {
    return (
      <span className={cn("font-extrabold tracking-tighter text-white", small ? "text-xl" : "text-2xl")}>
        <span className="text-[var(--accent)]">V</span>P
      </span>
    );
  }

  return (
    <img 
      src="/logo.png" 
      alt="Velora Pure" 
      className={cn("w-auto object-contain", small ? "max-h-8" : "max-h-12")}
      onError={() => setLogoError(true)}
    />
  );
}

