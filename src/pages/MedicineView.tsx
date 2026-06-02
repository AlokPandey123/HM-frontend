import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, Pill, PackageOpen, AlertTriangle, CheckCircle, Loader2, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/axios';

interface Medicine { _id: string; name: string; genericName: string; category: string; sellingPrice: number; currentStock: number; minimumStock: number; unit: string; expiryDate: string; manufacturer: string; }

const CATEGORIES = ['tablet', 'capsule', 'syrup', 'injection', 'drops', 'cream', 'powder', 'other'];

const stockStatus = (m: Medicine) => {
  if (m.currentStock === 0) return { label: 'Out of Stock', icon: PackageOpen,   cls: 'bg-red-100 text-red-700 border-red-200',       card: 'border-red-200 bg-red-50/30' };
  if (m.currentStock <= m.minimumStock) return { label: 'Low Stock', icon: AlertTriangle, cls: 'bg-orange-100 text-orange-700 border-orange-200', card: 'border-orange-200 bg-orange-50/20' };
  return { label: 'Available',    icon: CheckCircle,   cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', card: 'border-slate-100' };
};

const categoryColors: Record<string, string> = {
  tablet: 'bg-blue-50 text-blue-700', capsule: 'bg-purple-50 text-purple-700', syrup: 'bg-teal-50 text-teal-700',
  injection: 'bg-red-50 text-red-700', drops: 'bg-cyan-50 text-cyan-700', cream: 'bg-pink-50 text-pink-700',
  powder: 'bg-amber-50 text-amber-700', other: 'bg-slate-100 text-slate-600',
};

export function MedicineView() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStock, setLowStock] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/medicine', { params: { search, category, lowStock: lowStock ? 'true' : undefined, page, limit: 20 } })
      .then(r => { setMedicines(r.data.data.medicines || []); setTotal(r.data.data.total || 0); })
      .finally(() => setLoading(false));
  }, [search, category, lowStock, page]);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medicine Inventory</h1>
          <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-0.5">
            <Pill size={13} /> {total} medicines total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5 flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search medicines…"
            className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors"
          />
        </div>
        <div className="relative">
          <SlidersHorizontal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-xl pl-8 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 appearance-none"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>
        <button
          onClick={() => { setLowStock(v => !v); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
            lowStock
              ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-orange-300 hover:text-orange-600'
          }`}
        >
          <Filter size={14} />
          Low Stock Only
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-teal-500 mb-3" />
          <p className="text-slate-400 text-sm">Loading medicines…</p>
        </div>
      ) : medicines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Pill size={40} className="mb-3 opacity-30" />
          <p className="font-medium">No medicines found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {medicines.map(m => {
              const status = stockStatus(m);
              const StatusIcon = status.icon;
              const catColor = categoryColors[m.category] ?? 'bg-slate-100 text-slate-600';
              return (
                <div key={m._id} className={`bg-white rounded-2xl p-4 border shadow-sm hover:shadow-md transition-all ${status.card}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-bold text-slate-900 text-sm truncate">{m.name}</p>
                      {m.genericName && <p className="text-xs text-slate-400 truncate mt-0.5">{m.genericName}</p>}
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border whitespace-nowrap ${status.cls}`}>
                      <StatusIcon size={10} /> {status.label}
                    </span>
                  </div>
                  <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg mb-3 ${catColor}`}>
                    {m.category}
                  </span>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Selling Price</span>
                      <span className="text-sm font-bold text-teal-600">₹{m.sellingPrice}/{m.unit}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Current Stock</span>
                      <span className={`text-sm font-semibold ${m.currentStock === 0 ? 'text-red-600' : m.currentStock <= m.minimumStock ? 'text-orange-600' : 'text-slate-700'}`}>
                        {m.currentStock} {m.unit}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${m.currentStock === 0 ? 'bg-red-400' : m.currentStock <= m.minimumStock ? 'bg-orange-400' : 'bg-emerald-400'}`}
                        style={{ width: `${Math.min(100, (m.currentStock / Math.max(m.minimumStock * 3, 1)) * 100)}%` }}
                      />
                    </div>
                    {m.expiryDate && (
                      <div className="flex justify-between items-center pt-0.5">
                        <span className="text-xs text-slate-400">Expiry</span>
                        <span className="text-xs font-medium text-slate-600">{new Date(m.expiryDate).toLocaleDateString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 px-1">
            <p className="text-sm text-slate-400">Showing {total === 0 ? 0 : Math.min((page-1)*20+1, total)}–{Math.min(page*20, total)} of {total}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p-1)}
                className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="flex items-center px-3 text-sm text-slate-500">Page {page} of {Math.ceil(total/20) || 1}</span>
              <button disabled={page * 20 >= total} onClick={() => setPage(p => p+1)}
                className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
