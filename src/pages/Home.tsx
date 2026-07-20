import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Hospital, FlaskConical, IndianRupee, AlertTriangle,
  UserPlus, Stethoscope, TestTube, Receipt, TrendingUp, ArrowUpRight,
  ClipboardList, CreditCard,
} from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

interface Stats {
  patients: { total: number; today: number };
  opd: { total: number; today: number };
  billing: { total: number; todayRevenue: number };
  tests: { pending: number; completed: number };
  medicine: { lowStock: number };
  regularCheckups: { total: number; today: number; feeApplicable: number; totalRevenue: number };
}

export function Home() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard')
      .then(r => setStats(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const statCards = [
    {
      label: 'Total Patients', value: stats?.patients.total ?? 0,
      sub: `+${stats?.patients.today ?? 0} today`,
      icon: Users, gradient: 'from-teal-500 to-cyan-600', to: '/patients',
    },
    {
      label: 'OPD Visits Today', value: stats?.opd.today ?? 0,
      sub: `${stats?.opd.total ?? 0} total`,
      icon: Hospital, gradient: 'from-blue-500 to-indigo-600', to: '/opd',
    },
    {
      label: 'Pending Tests', value: stats?.tests.pending ?? 0,
      sub: `${stats?.tests.completed ?? 0} completed`,
      icon: FlaskConical, gradient: 'from-violet-500 to-purple-600', to: '/tests',
    },
    {
      label: "Today's Revenue", value: `₹${(stats?.billing.todayRevenue ?? 0).toLocaleString('en-IN')}`,
      sub: `${stats?.billing.total ?? 0} total bills`,
      icon: IndianRupee, gradient: 'from-emerald-500 to-teal-600', to: '/billing',
    },
    {
      label: 'Low Stock Alert', value: stats?.medicine.lowStock ?? 0,
      sub: 'medicines below minimum',
      icon: AlertTriangle, gradient: 'from-orange-400 to-rose-500', to: '/medicine',
    },
    {
      label: 'Regular Checkups', value: stats?.regularCheckups.total ?? 0,
      sub: `+${stats?.regularCheckups.today ?? 0} today`,
      icon: ClipboardList, gradient: 'from-sky-500 to-cyan-600', to: '/regular-checkup',
    },
    {
      label: 'Checkup Revenue', value: `₹${(stats?.regularCheckups.totalRevenue ?? 0).toLocaleString('en-IN')}`,
      sub: `${stats?.regularCheckups.feeApplicable ?? 0} fee-based`,
      icon: CreditCard, gradient: 'from-indigo-500 to-violet-600', to: '/regular-checkup',
    },
  ];

  const actions = [
    { label: 'Register Patient', icon: UserPlus,    to: '/patients', gradient: 'from-teal-500 to-cyan-600' },
    { label: 'New OPD Visit',    icon: Stethoscope, to: '/opd',      gradient: 'from-blue-500 to-indigo-600' },
    { label: 'Book Tests',       icon: TestTube,    to: '/tests',    gradient: 'from-violet-500 to-purple-600' },
    { label: 'Create Bill',      icon: Receipt,     to: '/billing',  gradient: 'from-emerald-500 to-teal-600' },
    { label: 'Regular Checkup',  icon: ClipboardList, to: '/regular-checkup', gradient: 'from-sky-500 to-cyan-600' },
  ];

  return (
    <div>
      {/* Greeting */}
      <div className="mb-7 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting}, <span className="text-teal-600">{user?.name?.split(' ')[0]}!</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-xl px-4 py-2">
          <TrendingUp size={16} className="text-teal-600" />
          <span className="text-teal-700 text-sm font-medium">Dashboard Overview</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.to}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-5 shadow-lg shadow-slate-200/60 group hover:scale-[1.02] transition-transform`}
            >
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Icon size={20} className="text-white" strokeWidth={1.8} />
                  </div>
                  <ArrowUpRight size={16} className="text-white/60 group-hover:text-white transition-colors" />
                </div>
                {loading ? (
                  <div className="w-12 h-7 bg-white/20 rounded animate-pulse mb-1" />
                ) : (
                  <p className="text-2xl font-bold text-white leading-none">{card.value}</p>
                )}
                <p className="text-white/60 text-[11px] mt-1 font-medium">{card.label}</p>
                <p className="text-white/50 text-[10px] mt-0.5">{card.sub}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {actions.map(action => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.to}
                className={`relative overflow-hidden flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-gradient-to-br ${action.gradient} text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all`}
              >
                <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity" />
                <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                  <Icon size={22} strokeWidth={1.8} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-center leading-tight">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
