import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Bell, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const routeLabels: Record<string, string> = {
  '/':         'Dashboard',
  '/patients': 'Patients',
  '/opd':      'OPD Visits',
  '/tests':    'Test Booking',
  '/medicine': 'Medicines',
  '/billing':  'Billing',
  '/returns':  'Returns',
};

const roleConfig: Record<string, { label: string; color: string }> = {
  superadmin: { label: 'Super Admin', color: 'text-purple-700' },
  admin:      { label: 'Admin',       color: 'text-teal-700'   },
  manager:    { label: 'Manager',     color: 'text-blue-700'   },
};

export function AppHeader() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const pageLabel = routeLabels[location.pathname] ?? 'Sunrise IVF Center';
  const role = roleConfig[user?.role ?? 'manager'];
  const initials = (user?.name ?? 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header className="bg-white border-b border-slate-100 px-6 h-16 flex items-center justify-between shrink-0 shadow-sm">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-400 font-medium">Sunrise IVF Center</span>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="text-slate-800 font-semibold">{pageLabel}</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors">
          <Bell size={16} />
        </button>

        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #0d9488, #0891b2)' }}>
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.name}</p>
            <span className={`text-[10px] font-bold ${role.color}`}>{role.label}</span>
          </div>
        </div>

        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 bg-slate-50 hover:bg-red-50 px-3 py-2 rounded-xl transition-all"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline font-medium">Logout</span>
        </button>
      </div>
    </header>
  );
}
