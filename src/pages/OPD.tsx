import { useEffect, useState } from 'react';
import { Plus, Stethoscope, Clock, Loader2, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import api from '../api/axios';
import { Modal } from '../components/Modal';
import { SearchSelect } from '../components/SearchSelect';

interface OPD { _id: string; opdId: string; patient: { name: string; patientId: string }; doctor: { name: string; specialization?: string } | null; visitDate: string; fees: number; paymentStatus: string; }
interface Patient { _id: string; name: string; patientId: string; }
interface Doctor { _id: string; name: string; specialization?: string; }

const statusConfig: Record<string, { label: string; class: string; icon: typeof CheckCircle }> = {
  paid:    { label: 'Paid',    class: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  pending: { label: 'Pending', class: 'bg-yellow-50 text-yellow-700 border-yellow-200',   icon: Clock },
  partial: { label: 'Partial', class: 'bg-orange-50 text-orange-700 border-orange-200',   icon: AlertCircle },
};

const empty = { patient: '', doctorId: '', doctorLabel: '', visitDate: new Date().toISOString().split('T')[0], fees: '', paymentStatus: 'pending', paymentMode: 'cash', amountPaid: '', notes: '' };

export function OPD() {
  const [opds, setOpds] = useState<OPD[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);

  const [patientSearch, setPatientSearch] = useState('');
  const [patientOpen, setPatientOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [patientLoading, setPatientLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const oRes = await api.get('/opd', { params: { page, limit: 20 } });
      setOpds(oRes.data.data.opds);
      setTotal(oRes.data.data.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  useEffect(() => {
    if (!patientSearch.trim()) { setPatientResults([]); return; }
    setPatientLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await api.get('/patients', { params: { search: patientSearch, limit: 10 } });
        const data = res.data.data;
        setPatientResults(Array.isArray(data) ? data : data.patients ?? []);
      } finally { setPatientLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [patientSearch]);

  const searchDoctors = async (q: string) => {
    const r = await api.get('/doctors', { params: { search: q, limit: 8 } });
    const list: Doctor[] = r.data.data.doctors || [];
    return list.map(d => ({ _id: d._id, label: `Dr. ${d.name}`, sublabel: d.specialization }));
  };

  const closeModal = () => {
    setModal(false);
    setForm({ ...empty });
    setPatientSearch('');
    setSelectedPatient(null);
    setPatientResults([]);
    setPatientOpen(false);
  };

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.patient) { alert('Please select a patient'); return; }
    if (!form.doctorId) { alert('Please select a doctor'); return; }
    setSaving(true);
    try {
      await api.post('/opd', { ...form, doctor: form.doctorId, fees: Number(form.fees), amountPaid: Number(form.amountPaid) });
      closeModal();
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
              {['OPD ID', 'Patient', 'Doctor', 'Date', 'Fees', 'Payment'].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center">
                <Loader2 size={24} className="animate-spin text-teal-500 mx-auto" />
              </td></tr>
            ) : opds.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-400">
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
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-slate-700">{o.doctor ? `Dr. ${o.doctor.name}` : '—'}</p>
                    {o.doctor?.specialization && <p className="text-xs text-slate-400">{o.doctor.specialization}</p>}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs">{new Date(o.visitDate).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3.5 font-bold text-slate-800">₹{o.fees}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.class}`}>
                      <StatusIcon size={11} /> {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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

      <Modal isOpen={modal} onClose={closeModal} title="New OPD Visit" size="lg">
        <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Patient <span className="text-red-500">*</span></label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                value={selectedPatient ? `${selectedPatient.name} (${selectedPatient.patientId})` : patientSearch}
                onChange={(e) => { setPatientSearch(e.target.value); setSelectedPatient(null); setForm(prev => ({ ...prev, patient: '' })); }}
                onFocus={() => setPatientOpen(true)}
                onBlur={() => setTimeout(() => setPatientOpen(false), 150)}
                placeholder="Search patient by name or ID…"
                className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors"
                autoComplete="off"
              />
              {patientOpen && (patientLoading || patientResults.length > 0) && (
                <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto mt-1">
                  {patientLoading ? (
                    <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
                      <Loader2 size={14} className="animate-spin" /> Searching…
                    </div>
                  ) : patientResults.map((p) => (
                    <button key={p._id} type="button" onMouseDown={() => {
                      setForm(prev => ({ ...prev, patient: p._id }));
                      setSelectedPatient(p);
                      setPatientSearch('');
                      setPatientOpen(false);
                      setPatientResults([]);
                    }} className="w-full text-left px-4 py-2.5 hover:bg-teal-50 flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium text-slate-800">{p.name}</span>
                      <span className="text-xs text-slate-400 font-mono">{p.patientId}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <SearchSelect
            label="Doctor"
            value={form.doctorId}
            displayValue={form.doctorLabel}
            onSelect={(item) => setForm(prev => ({ ...prev, doctorId: item?._id ?? '', doctorLabel: item?.label ?? '' }))}
            onSearch={searchDoctors}
            placeholder="Search doctors…"
            required
          />
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Visit Date <span className="text-red-500">*</span></label>
            <input type="date" value={form.visitDate} onChange={(e) => f('visitDate', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Consultation Fees (₹) <span className="text-red-500">*</span></label>
            <input type="number" value={form.fees} onChange={(e) => f('fees', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors" required min="0" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Amount Paid (₹) <span className="text-red-500">*</span></label>
            <input type="number" value={form.amountPaid} onChange={(e) => f('amountPaid', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors" required min="0" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Payment Status <span className="text-red-500">*</span></label>
            <select value={form.paymentStatus} onChange={(e) => f('paymentStatus', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50" required>
              {['pending', 'paid', 'partial'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Payment Mode <span className="text-red-500">*</span></label>
            <select value={form.paymentMode} onChange={(e) => f('paymentMode', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50" required>
              {['cash', 'card', 'upi', 'insurance', 'online'].map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => f('notes', e.target.value)} rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white resize-none transition-colors" placeholder="Additional notes..." />
          </div>
          <div className="col-span-2 flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-teal-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Stethoscope size={16} />}
              {saving ? 'Saving…' : 'Save OPD Record'}
            </button>
            <button type="button" onClick={closeModal}
              className="flex-1 border border-slate-200 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
