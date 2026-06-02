import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UserRound,
  Stethoscope,
  FlaskConical,
  Pill,
  Receipt,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  module?: string;
}

const navItems: NavItem[] = [
  { to: '/',         label: 'Dashboard',    icon: LayoutDashboard, exact: true },
  { to: '/patients', label: 'Patients',     icon: UserRound,   module: 'patients' },
  { to: '/opd',      label: 'OPD Visits',   icon: Stethoscope, module: 'opd' },
  { to: '/tests',    label: 'Test Booking', icon: FlaskConical,module: 'pathology' },
  { to: '/medicine', label: 'Medicines',    icon: Pill,        module: 'medicine_stock' },
  { to: '/billing',  label: 'Billing',      icon: Receipt,     module: 'billing' },
  { to: '/returns',  label: 'Returns',      icon: RotateCcw,   module: 'returns' },
];

export function AppSidebar() {
  const { hasPermission, user } = useAuthStore();

  const isVisible = (item: NavItem) => {
    if (!item.module || user?.role === 'superadmin') return true;
    return hasPermission(item.module, 'view');
  };

  return (
    <aside className="w-60 flex flex-col shrink-0 overflow-y-auto" style={{ background: 'linear-gradient(180deg, #0d2d2a 0%, #134e4a 100%)' }}>
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #0d9488, #0891b2)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm leading-tight tracking-wide">HMS Staff</p>
          <p className="text-teal-300/70 text-xs mt-0.5">Staff Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.filter(isVisible).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-teal-500/90 text-white shadow-lg shadow-teal-900/40'
                    : 'text-teal-200/70 hover:text-white hover:bg-white/8'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`shrink-0 transition-colors ${isActive ? 'text-white' : 'text-teal-400/60 group-hover:text-teal-200'}`}>
                    <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                  </span>
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
          <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shrink-0" />
          <span className="text-teal-300/60 text-xs">System Online</span>
          <span className="ml-auto text-teal-500/40 text-xs">v1.0</span>
        </div>
      </div>
    </aside>
  );
}
