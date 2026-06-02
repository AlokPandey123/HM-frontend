import { useEffect, useState } from 'react';
import { Plus, Stethoscope, Clock, Loader2, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import { Modal } from '../components/Modal';

interface OPD { _id: string; opdId: string; patient: { name: string; patientId: string }; doctor: string; visitDate: string; fees: number; paymentStatus: string; diagnosis: string; }
interface Patient { _id: string; name: string; patientId: string; }

const statusConfig: Record<string, { label: string; class: string; icon: typeof CheckCircle }> = {
  paid:    { label: 'Paid',    class: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  pending: { label: 'Pending', class: 'bg-yellow-50 text-yellow-700 border-yellow-200',   icon: Clock },
  partial: { label: 'Partial', class: 'bg-orange-50 text-orange-700 border-orange-200',   icon: AlertCircle },
};

const empty = { patient: '', doctor: '', visitDate: new Date().toISOString().split('T')[0], symptoms: '', diagnosis: '', prescription: '', fees: '', paymentStatus: 'pending', paymentMode: 'cash', amountPaid: '', notes: '' };

export function OPD() {
  const [opds, setOpds] = useState<OPD[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const oRes = await api.get('/opd', { params: { page, limit: 20 } });
      setOpds(oRes.data.data.opds);
      setTotal(oRes.data.data.total);
    } finally { setLoading(false); }
    try {
      const pRes = await api.get('/patients', { params: { all: true } });
      setPatients(Array.isArray(pRes.data.data) ? pRes.data.data : []);
    } catch { /* form data only */ }
  };

  useEffect(() => { load(); }, [page]);

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/opd', { ...form, fees: Number(form.fees), amountPaid: Number(form.amountPaid || 0) });
      setModal(false);
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const f = (field: string, val: string) => setForm(p => ({ ...p, [field]: val }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">OPD Visits</h1>
          <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-0.5">
            <Stethoscope size={13} /> {total} total visits
          </p>
        </div>
        <button
          onClick={() => { setForm({ ...empty }); setModal(true); }}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-teal-700 shadow-sm shadow-teal-200 transition-colors"
        >
          <Plus size={16} /> New OPD Visit
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['OPD ID', 'Patient', 'Doctor', 'Date', 'Fees', 'Payment', 'Diagnosis'].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center">
                <Loader2 size={24} className="animate-spin text-teal-500 mx-auto" />
              </td></tr>
            ) : opds.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-slate-400">
                <Stethoscope size={32} className="mx-auto mb-2 opacity-30" />
                No OPD records found
              </td></tr>
            ) : opds.map(o => {
              const status = statusConfig[o.paymentStatus] ?? statusConfig.pending;
              const StatusIcon = status.icon;
              return (
                <tr key={o._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded-lg">{o.opdId}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-800 text-sm">{o.patient?.name}</p>
                    <p className="text-xs text-slate-400">{o.patient?.patientId}</p>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{o.doctor}</td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs">{new Date(o.visitDate).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3.5 font-bold text-slate-800">₹{o.fees}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.class}`}>
                      <StatusIcon size={11} /> {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 max-w-[160px] truncate">{o.diagnosis || <span className="text-slate-300">—</span>}</td>
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

      <Modal isOpen={modal} onClose={() => setModal(false)} title="New OPD Visit" size="lg">
        <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Patient</label>
            <select value={form.patient} onChange={(e) => f('patient', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50" required>
              <option value="">Select Patient</option>
              {patients.map(p => <option key={p._id} value={p._id}>{p.name} ({p.patientId})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Doctor Name</label>
            <input value={form.doctor} onChange={(e) => f('doctor', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Visit Date</label>
            <input type="date" value={form.visitDate} onChange={(e) => f('visitDate', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors" required />
          </div>
          {[
            { field: 'symptoms', label: 'Symptoms' },
            { field: 'diagnosis', label: 'Diagnosis' },
            { field: 'prescription', label: 'Prescription' },
          ].map(({ field, label }) => (
            <div key={field} className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">{label}</label>
              <textarea value={(form as Record<string, string>)[field]} onChange={(e) => f(field, e.target.value)} rows={2}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white resize-none transition-colors" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Consultation Fees (₹)</label>
            <input type="number" value={form.fees} onChange={(e) => f('fees', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors" required min="0" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Amount Paid (₹)</label>
            <input type="number" value={form.amountPaid} onChange={(e) => f('amountPaid', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors" min="0" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Payment Status</label>
            <select value={form.paymentStatus} onChange={(e) => f('paymentStatus', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50">
              {['pending', 'paid', 'partial'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Payment Mode</label>
            <select value={form.paymentMode} onChange={(e) => f('paymentMode', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50">
              {['cash', 'card', 'upi', 'insurance', 'online'].map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
            </select>
          </div>
          <div className="col-span-2 flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-teal-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Stethoscope size={16} />}
              {saving ? 'Saving…' : 'Save OPD Record'}
            </button>
            <button type="button" onClick={() => setModal(false)}
              className="flex-1 border border-slate-200 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
