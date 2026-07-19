import { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Receipt, CheckCircle, Clock, AlertCircle, Loader2, FileDown, Banknote, CreditCard, Smartphone, Shield, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import { Modal } from '../components/Modal';
import { printInvoice } from '../utils/printInvoice';

interface Bill { _id: string; billId: string; patient: { name: string; patientId: string }; totalAmount: number; amountPaid: number; paymentStatus: string; paymentMode: string; createdAt: string; }
interface Patient { _id: string; name: string; patientId: string; }
interface Medicine { _id: string; name: string; sellingPrice: number; currentStock: number; unit: string; }
interface Item { referenceId: string; name: string; quantity: number; unitPrice: number; total: number; }

const statusConfig: Record<string, { label: string; class: string; icon: typeof CheckCircle }> = {
  paid:    { label: 'Paid',    class: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  pending: { label: 'Pending', class: 'bg-yellow-50 text-yellow-700 border-yellow-200',   icon: Clock },
  partial: { label: 'Partial', class: 'bg-orange-50 text-orange-700 border-orange-200',   icon: AlertCircle },
};

const MODE_ICONS = { cash: Banknote, card: CreditCard, upi: Smartphone, insurance: Shield, online: Globe };

export function Billing() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [billForm, setBillForm] = useState({ patient: '', paymentStatus: 'pending', paymentMode: 'cash', amountPaid: '', discount: '', tax: '', notes: '' });
  const [items, setItems] = useState<Item[]>([]);
  const [medSearch, setMedSearch] = useState('');
  const [filteredMeds, setFilteredMeds] = useState<Medicine[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientOpen, setPatientOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [patientLoading, setPatientLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const bRes = await api.get('/billing', { params: { page, limit: 20 } });
      setBills(bRes.data.data.bills);
      setTotal(bRes.data.data.total);
    } finally { setLoading(false); }
    try {
      const mRes = await api.get('/medicine', { params: { all: true } });
      setMedicines(Array.isArray(mRes.data.data) ? mRes.data.data : []);
    } catch { /* form data only — ok to fail */ }
  };

  useEffect(() => { load(); }, [page]);
  useEffect(() => {
    setFilteredMeds(medSearch ? medicines.filter(m => m.name.toLowerCase().includes(medSearch.toLowerCase())) : []);
  }, [medSearch, medicines]);
  useEffect(() => {
    if (!patientSearch) { setPatientResults([]); return; }
    const timer = setTimeout(async () => {
      setPatientLoading(true);
      try {
        const res = await api.get('/patients', { params: { search: patientSearch, limit: 10 } });
        setPatientResults(res.data.data.patients || []);
      } catch { setPatientResults([]); }
      finally { setPatientLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  const closeModal = () => {
    setModal(false);
    setItems([]);
    setSelectedPatient(null);
    setPatientSearch('');
    setPatientResults([]);
  };

  const addMedicine = (med: Medicine) => {
    const exists = items.find(i => i.referenceId === med._id);
    if (exists) {
      setItems(prev => prev.map(i => i.referenceId === med._id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice } : i));
    } else {
      setItems(prev => [...prev, { referenceId: med._id, name: med.name, quantity: 1, unitPrice: med.sellingPrice, total: med.sellingPrice }]);
    }
    setMedSearch('');
  };

  const updateQty = (idx: number, qty: number) =>
    setItems(prev => prev.map((i, ii) => ii === idx ? { ...i, quantity: qty, total: qty * i.unitPrice } : i));

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const totalAmount = subtotal - Number(billForm.discount || 0) + Number(billForm.tax || 0);

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!billForm.patient) { alert('Please select a patient'); return; }
    if (items.length === 0) { alert('Add at least one medicine'); return; }
    setSaving(true);
    const snapItems = items;
    const snapForm = billForm;
    const snapSubtotal = subtotal;
    const snapTotal = totalAmount;
    const snapPatient = selectedPatient;
    try {
      const billItems = snapItems.map(i => ({ itemType: 'medicine', referenceId: i.referenceId, name: i.name, quantity: i.quantity, unitPrice: i.unitPrice, discount: 0, tax: 0, total: i.total }));
      const res = await api.post('/billing', { ...snapForm, items: billItems, discount: Number(snapForm.discount || 0), tax: Number(snapForm.tax || 0), amountPaid: Number(snapForm.amountPaid || 0) });
      const created = res.data?.data?.bill || res.data?.data;
      setModal(false);
      setItems([]);
      setBillForm({ patient: '', paymentStatus: 'pending', paymentMode: 'cash', amountPaid: '', discount: '', tax: '', notes: '' });
      setSelectedPatient(null);
      setPatientSearch('');
      load();
      printInvoice({
        billId: created?.billId || 'N/A',
        createdAt: created?.createdAt || new Date().toISOString(),
        patient: { name: snapPatient?.name || '', patientId: snapPatient?.patientId || '' },
        items: snapItems.map(i => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice, total: i.total })),
        subtotal: snapSubtotal,
        discount: Number(snapForm.discount || 0),
        tax: Number(snapForm.tax || 0),
        totalAmount: snapTotal,
        amountPaid: Number(snapForm.amountPaid || 0),
        paymentMode: snapForm.paymentMode,
        paymentStatus: snapForm.paymentStatus,
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Error creating bill');
    } finally { setSaving(false); }
  };

  const handlePrintBill = async (bill: Bill) => {
    try {
      const res = await api.get(`/billing/${bill._id}`);
      const detail = res.data?.data?.bill || res.data?.data;
      printInvoice({
        billId: detail.billId,
        createdAt: detail.createdAt,
        patient: { name: detail.patient?.name || bill.patient?.name || '', patientId: detail.patient?.patientId || bill.patient?.patientId || '' },
        items: (detail.items || []).map((i: { name: string; quantity: number; unitPrice: number; total: number }) => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice, total: i.total })),
        subtotal: detail.subtotal ?? detail.totalAmount,
        discount: detail.discount ?? 0,
        tax: detail.tax ?? 0,
        totalAmount: detail.totalAmount,
        amountPaid: detail.amountPaid,
        paymentMode: detail.paymentMode,
        paymentStatus: detail.paymentStatus,
      });
    } catch { alert('Could not load invoice'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
          <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-0.5">
            <Receipt size={13} /> {total} total bills · Stock auto-deducted on billing
          </p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-teal-700 shadow-sm shadow-teal-200 transition-colors"
        >
          <Plus size={16} /> Create Bill
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Bill ID', 'Patient', 'Total', 'Paid', 'Status', 'Mode', 'Date', 'Invoice'].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={8} className="py-12 text-center">
                <Loader2 size={24} className="animate-spin text-teal-500 mx-auto" />
              </td></tr>
            ) : bills.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-slate-400">
                <Receipt size={32} className="mx-auto mb-2 opacity-30" />No bills found
              </td></tr>
            ) : bills.map(b => {
              const status = statusConfig[b.paymentStatus] ?? statusConfig.pending;
              const StatusIcon = status.icon;
              const ModeIcon = MODE_ICONS[b.paymentMode as keyof typeof MODE_ICONS] ?? Banknote;
              return (
                <tr key={b._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded-lg">{b.billId}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-800">{b.patient?.name}</p>
                    <p className="text-xs text-slate-400">{b.patient?.patientId}</p>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-slate-800">₹{b.totalAmount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3.5 font-semibold text-emerald-600">₹{b.amountPaid.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.class}`}>
                      <StatusIcon size={11} /> {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 capitalize">
                      <ModeIcon size={13} />{b.paymentMode}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">{new Date(b.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3.5">
                    <button onClick={() => handlePrintBill(b)} title="Download Invoice"
                      className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-800 border border-teal-200 hover:bg-teal-50 px-2.5 py-1.5 rounded-lg transition-colors">
                      <FileDown size={13} /> Invoice
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 px-1">
        <p className="text-sm text-slate-400">Showing {total === 0 ? 0 : Math.min((page-1)*20+1, total)}-{Math.min(page*20, total)} of {total}</p>
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

      <Modal isOpen={modal} onClose={closeModal} title="Create Medicine Bill" size="xl">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">

            {/* Searchable patient combobox */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Patient</label>
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  value={patientSearch !== '' ? patientSearch : (selectedPatient ? `${selectedPatient.name} (${selectedPatient.patientId})` : '')}
                  onFocus={() => setPatientOpen(true)}
                  onChange={(e) => { setPatientSearch(e.target.value); setPatientOpen(true); setSelectedPatient(null); setBillForm(f => ({ ...f, patient: '' })); }}
                  onBlur={() => setTimeout(() => setPatientOpen(false), 150)}
                  placeholder="Search patient by name or ID…"
                  className={`w-full border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors ${selectedPatient ? 'border-teal-300' : 'border-slate-200'}`}
                />
              </div>
              {patientOpen && (patientLoading || patientResults.length > 0) && (
                <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto mt-1">
                  {patientLoading ? (
                    <div className="px-4 py-3 flex items-center justify-center gap-2 text-sm text-slate-400">
                      <Loader2 size={14} className="animate-spin" /> Searching…
                    </div>
                  ) : patientResults.map(p => (
                    <button key={p._id} type="button"
                      onMouseDown={() => { setBillForm(f => ({ ...f, patient: p._id })); setSelectedPatient(p); setPatientSearch(''); setPatientOpen(false); setPatientResults([]); }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-teal-50 border-b border-slate-50 last:border-0 transition-colors flex justify-between items-center">
                      <span className="font-medium text-slate-800">{p.name}</span>
                      <span className="text-xs text-slate-400 font-mono">{p.patientId}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Search & Add Medicine</label>
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={medSearch} onChange={(e) => setMedSearch(e.target.value)} placeholder="Type medicine name…"
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors" />
              </div>
              {filteredMeds.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto mt-1">
                  {filteredMeds.map(m => (
                    <button key={m._id} type="button" onClick={() => addMedicine(m)} disabled={m.currentStock === 0}
                      className={`w-full text-left px-4 py-2.5 text-sm flex justify-between items-center hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors ${m.currentStock === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                      <div>
                        <span className="font-medium text-slate-800">{m.name}</span>
                        {m.currentStock === 0 && <span className="text-xs text-red-500 ml-2">Out of stock</span>}
                      </div>
                      <span className="text-teal-600 font-semibold text-xs">₹{m.sellingPrice} · {m.currentStock} {m.unit}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {items.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2.5 flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Medicine</span>
                <div className="flex gap-8 items-center">
                  <span>Qty</span><span>Unit Price</span><span>Total</span><span></span>
                </div>
              </div>
              <div className="divide-y divide-slate-50">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex-1 text-sm font-medium text-slate-800">{item.name}</span>
                    <input type="number" value={item.quantity} min="1" onChange={(e) => updateQty(idx, Number(e.target.value))}
                      className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    <span className="w-20 text-right text-sm text-slate-500">₹{item.unitPrice}</span>
                    <span className="w-20 text-right text-sm font-bold text-slate-800">₹{item.total}</span>
                    <button type="button" onClick={() => setItems(prev => prev.filter((_, ii) => ii !== idx))}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Discount (₹)</label>
              <input type="number" value={billForm.discount} onChange={(e) => setBillForm({ ...billForm, discount: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors" min="0" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Tax (₹)</label>
              <input type="number" value={billForm.tax} onChange={(e) => setBillForm({ ...billForm, tax: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors" min="0" />
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100 rounded-xl p-3 flex flex-col justify-center">
              <p className="text-xs text-teal-600 font-semibold">Total Amount</p>
              <p className="text-2xl font-bold text-teal-700">₹{totalAmount.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Amount Paid (₹)</label>
              <input type="number" value={billForm.amountPaid} onChange={(e) => setBillForm({ ...billForm, amountPaid: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors" min="0" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Payment Status</label>
              <select value={billForm.paymentStatus} onChange={(e) => setBillForm({ ...billForm, paymentStatus: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50">
                {['pending', 'paid', 'partial'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Payment Mode</label>
              <select value={billForm.paymentMode} onChange={(e) => setBillForm({ ...billForm, paymentMode: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50">
                {['cash', 'card', 'upi', 'insurance', 'online'].map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-teal-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-teal-700 disabled:opacity-50 shadow-sm shadow-teal-200 transition-colors">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Receipt size={16} />}
              {saving ? 'Creating…' : `Create Bill — ₹${totalAmount.toFixed(2)}`}
            </button>
            <button type="button" onClick={closeModal}
              className="px-6 border border-slate-200 py-3 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
