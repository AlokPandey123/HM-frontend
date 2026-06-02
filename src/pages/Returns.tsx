import { useEffect, useState } from 'react';
import { RotateCcw, Info, CheckCircle, Clock, XCircle, Loader2, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import { Modal } from '../components/Modal';

interface Return { _id: string; returnId: string; patient: { name: string; patientId: string }; originalBill: { billId: string }; totalReturnAmount: number; totalDeduction: number; status: string; reason: string; createdAt: string; }
interface Bill { _id: string; billId: string; items: { itemType: string; referenceId: string; name: string; unitPrice: number; quantity: number }[]; }

const statusConfig: Record<string, { label: string; class: string; icon: typeof CheckCircle }> = {
  approved: { label: 'Approved', class: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  pending:  { label: 'Pending',  class: 'bg-yellow-50 text-yellow-700 border-yellow-200',   icon: Clock },
  rejected: { label: 'Rejected', class: 'bg-red-50 text-red-700 border-red-200',            icon: XCircle },
};

export function Returns() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ originalBill: '', reason: '', notes: '' });
  const [returnItems, setReturnItems] = useState<{ medicineId: string; name: string; originalPrice: number; quantity: number }[]>([]);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/returns', { params: { page, limit: 20 } });
      setReturns(r.data.data.returns);
      setTotal(r.data.data.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const loadBills = async () => {
    const r = await api.get('/billing', { params: { limit: 100 } });
    setBills(r.data.data.bills.filter((b: Bill) => b.items?.some((i: { itemType: string }) => i.itemType === 'medicine')));
  };

  const handleBillChange = (billId: string) => {
    const bill = bills.find(b => b._id === billId);
    setSelectedBill(bill || null);
    setForm(p => ({ ...p, originalBill: billId }));
    setReturnItems(bill?.items?.filter(i => i.itemType === 'medicine').map(i => ({ medicineId: i.referenceId, name: i.name, originalPrice: i.unitPrice, quantity: 1 })) || []);
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.originalBill) { alert('Select a bill'); return; }
    setSaving(true);
    try {
      await api.post('/returns', { ...form, items: returnItems });
      setModal(false);
      setReturnItems([]);
      setSelectedBill(null);
      setForm({ originalBill: '', reason: '', notes: '' });
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const previewReturn = returnItems.reduce((s, i) => s + i.originalPrice * i.quantity * 0.8, 0);
  const previewDeduct = returnItems.reduce((s, i) => s + i.originalPrice * i.quantity * 0.2, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medicine Returns</h1>
          <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-0.5">
            <RotateCcw size={13} /> 20% deduction applied · Requires admin approval
          </p>
        </div>
        <button
          onClick={async () => { await loadBills(); setModal(true); }}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-teal-700 shadow-sm shadow-teal-200 transition-colors"
        >
          <RotateCcw size={16} /> New Return
        </button>
      </div>

      {/* Policy notice */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
        <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <span className="font-bold">Return Policy: </span>
          A 20% deduction is applied on the selling price of returned medicines. Stock is restored automatically upon admin approval.
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Return ID', 'Patient', 'Original Bill', 'Return Amt', 'Deduction (20%)', 'Status', 'Reason', 'Date'].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={8} className="py-12 text-center">
                <Loader2 size={24} className="animate-spin text-teal-500 mx-auto" />
              </td></tr>
            ) : returns.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-slate-400">
                <RotateCcw size={32} className="mx-auto mb-2 opacity-30" />No returns found
              </td></tr>
            ) : returns.map(r => {
              const status = statusConfig[r.status] ?? statusConfig.pending;
              const StatusIcon = status.icon;
              return (
                <tr key={r._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded-lg">{r.returnId}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-800">{r.patient?.name}</p>
                    <p className="text-xs text-slate-400">{r.patient?.patientId}</p>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{r.originalBill?.billId || '—'}</td>
                  <td className="px-4 py-3.5 font-bold text-emerald-600">₹{r.totalReturnAmount.toFixed(2)}</td>
                  <td className="px-4 py-3.5 font-semibold text-red-500">₹{r.totalDeduction.toFixed(2)}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.class}`}>
                      <StatusIcon size={11} /> {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 max-w-[120px] truncate">{r.reason || <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
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

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Create Return Request" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Select Original Bill</label>
            <select value={form.originalBill} onChange={(e) => handleBillChange(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50" required>
              <option value="">Select Bill</option>
              {bills.map(b => <option key={b._id} value={b._id}>{b.billId}</option>)}
            </select>
          </div>

          {selectedBill && returnItems.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Items to Return</label>
              <div className="space-y-2 mb-3">
                {returnItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                      <p className="text-xs text-slate-400">₹{item.originalPrice}/unit</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-500">Qty:</span>
                      <input type="number" value={item.quantity} min="1"
                        onChange={(e) => setReturnItems(prev => prev.map((r, i) => i === idx ? { ...r, quantity: Number(e.target.value) } : r))}
                        className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div className="text-right text-xs shrink-0">
                      <p className="font-bold text-emerald-600">+₹{(item.originalPrice * item.quantity * 0.8).toFixed(2)}</p>
                      <p className="text-red-400">-₹{(item.originalPrice * item.quantity * 0.2).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                  <p className="text-xs text-emerald-600 font-semibold mb-1">Net Return Amount</p>
                  <p className="text-lg font-bold text-emerald-700">₹{previewReturn.toFixed(2)}</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                  <p className="text-xs text-red-500 font-semibold mb-1 flex items-center justify-center gap-1">
                    <TrendingDown size={11} /> 20% Deduction
                  </p>
                  <p className="text-lg font-bold text-red-600">₹{previewDeduct.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Reason for Return</label>
            <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white resize-none transition-colors"
              placeholder="Describe the reason for return…" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-teal-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
              {saving ? 'Submitting…' : 'Submit Return Request'}
            </button>
            <button type="button" onClick={() => setModal(false)}
              className="px-6 border border-slate-200 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
