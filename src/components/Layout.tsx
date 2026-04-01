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
    { icon: Settings, label: 'Configuración', path: '/settings' },
  ];


  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col md:flex-row">
      {/* Mobile TopBar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[var(--bg-secondary)] border-b border-[var(--border)] sticky top-0 z-50">
        <button onClick={() => setIsDrawerOpen(true)} className="p-2 text-[var(--text-secondary)] hover:text-white">
          <Menu className="w-6 h-6" />
        </button>
        <Logo small />
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-[var(--bg-secondary)] border-r border-[var(--border)] h-screen sticky top-0">
        <div className="p-8">
          <Logo />
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--border)]">
          <div className="mb-4 px-4 py-2 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
            <p className="text-xs text-[var(--text-secondary)] mb-1">Mi Negocio</p>
            <p className="text-sm font-semibold truncate text-[var(--text-primary)]">{business?.business_name}</p>
            <p className="text-[10px] text-[var(--text-secondary)] truncate">{user?.email}</p>
          </div>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[var(--text-secondary)] hover:bg-[var(--danger)]/10 hover:text-[var(--danger)] transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer (Overlay) */}
      {isDrawerOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}
      
      {/* Mobile Drawer (Content) */}
      <aside className={cn(
        "md:hidden fixed inset-y-0 left-0 w-72 bg-[var(--bg-secondary)] border-r border-[var(--border)] z-[70] transform transition-transform duration-300 flex flex-col",
        isDrawerOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 flex items-center justify-between">
          <Logo />
          <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-[var(--text-secondary)]">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => (
            <NavItem key={item.path} item={item} onClick={() => setIsDrawerOpen(false)} />
          ))}
        </nav>
        <div className="p-4 border-t border-[var(--border)]">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[var(--danger)] bg-[var(--danger)]/10"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 transition-all overflow-x-hidden">
        <div className="p-4 md:p-8">
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
        "flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-all group",
        isActive 
          ? "bg-[var(--accent-subtle)] text-[var(--accent-light)] border-l-2 border-[var(--accent)] rounded-l-none" 
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
      )}
    >
      <div className="flex items-center gap-3">
        <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
        <span>{item.label}</span>
      </div>
      {item.badge && (
        <span className="w-2 h-2 rounded-full bg-[var(--danger)]" />
      )}
    </NavLink>
  );
}

function Logo({ small }: { small?: boolean }) {
  const [logoError, setLogoError] = useState(false);

  if (logoError) {
    return (
      <span className={cn("font-extrabold tracking-tight text-white", small ? "text-xl" : "text-2xl")}>
        <span className="text-[var(--accent)]">V</span>elora Pure
      </span>
    );
  }

  return (
    <img 
      src="/logo.png" 
      alt="Velora Pure" 
      className={cn("w-auto object-contain", small ? "max-h-10" : "max-h-16")}
      onError={() => setLogoError(true)}
    />
  );
}
