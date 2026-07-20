import { useEffect, useState } from 'react';
import { Search, Plus, Pencil, ClipboardList, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { Modal } from '../components/Modal';
import { SearchSelect } from '../components/SearchSelect';

interface Patient { _id: string; patientId: string; name: string; phone: string; patientType: string; }
interface Doctor { _id: string; name: string; specialization?: string; }
interface Checkup {
  _id: string; checkupId: string; visitDate: string; notes?: string;
  feeApplicable: boolean; fees: number; paymentStatus: string; paymentMode: string; amountPaid: number;
  patient: Patient; doctor: Doctor;
}

const emptyForm = {
  patientId: '', patientLabel: '',
  doctorId: '', doctorLabel: '',
  visitDate: new Date().toISOString().slice(0, 10),
  notes: '', feeApplicable: false,
  fees: '', paymentStatus: 'pending', paymentMode: 'cash', amountPaid: '',
};

const statusBadge: Record<string, string> = {
  paid: 'bg-green-50 text-green-700',
  pending: 'bg-yellow-50 text-yellow-700',
  partial: 'bg-orange-50 text-orange-700',
};

export function RegularCheckup() {
  const [checkups, setCheckups] = useState<Checkup[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/regular-checkup', { params: { limit: 25 } });
      setCheckups(r.data.data.checkups || []);
      setTotal(r.data.data.total || 0);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const searchPatients = async (q: string) => {
    const r = await api.get('/patients', { params: { search: q, patientType: 'regular', limit: 8 } });
    const list: Patient[] = r.data.data.patients || [];
    return list.map(p => ({ _id: p._id, label: p.name, sublabel: `${p.patientId} · ${p.phone}` }));
  };

  const searchDoctors = async (q: string) => {
    const r = await api.get('/doctors', { params: { search: q, limit: 8 } });
    const list: Doctor[] = r.data.data.doctors || [];
    return list.map(d => ({ _id: d._id, label: `Dr. ${d.name}`, sublabel: d.specialization }));
  };

  const openEdit = (c: Checkup) => {
    setForm({
      patientId: c.patient?._id || '', patientLabel: c.patient?.name || '',
      doctorId: c.doctor?._id || '', doctorLabel: c.doctor ? `Dr. ${c.doctor.name}` : '',
      visitDate: c.visitDate ? c.visitDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      notes: c.notes || '', feeApplicable: c.feeApplicable,
      fees: c.fees ? String(c.fees) : '', paymentStatus: c.paymentStatus || 'pending',
      paymentMode: c.paymentMode || 'cash', amountPaid: c.amountPaid ? String(c.amountPaid) : '',
    });
    setEditId(c._id);
    setModal(true);
  };

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        patient: form.patientId, doctor: form.doctorId,
        visitDate: form.visitDate, notes: form.notes,
        feeApplicable: form.feeApplicable,
      };
      if (form.feeApplicable) {
        payload.fees = Number(form.fees);
        payload.paymentStatus = form.paymentStatus;
        payload.paymentMode = form.paymentMode;
        payload.amountPaid = form.amountPaid ? Number(form.amountPaid) : 0;
      }
      if (editId) await api.put(`/regular-checkup/${editId}`, payload);
      else await api.post('/regular-checkup', payload);
      setModal(false);
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Regular Checkups</h1>
          <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-0.5">
            <ClipboardList size={13} /> {total} total checkups
          </p>
        </div>
        <button
          onClick={() => { setForm({ ...emptyForm }); setEditId(null); setModal(true); }}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-teal-700 shadow-sm shadow-teal-200 transition-colors"
        >
          <Plus size={16} /> Add Checkup
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-4">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search checkups…"
            className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['ID', 'Patient', 'Doctor', 'Visit Date', 'Notes', 'Fee', ''].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center">
                <Loader2 size={24} className="animate-spin text-teal-500 mx-auto" />
              </td></tr>
            ) : checkups.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-slate-400">
                <ClipboardList size={32} className="mx-auto mb-2 opacity-30" />
                No checkups found
              </td></tr>
            ) : checkups.map(c => (
              <tr key={c._id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3.5">
                  <span className="font-mono text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded-lg">{c.checkupId}</span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="font-semibold text-slate-800">{c.patient?.name}</div>
                  <div className="text-xs text-slate-400">{c.patient?.patientId} · <span className="capitalize">{c.patient?.patientType}</span></div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="font-medium text-slate-700">{c.doctor ? `Dr. ${c.doctor.name}` : '—'}</div>
                  {c.doctor?.specialization && <div className="text-xs text-slate-400">{c.doctor.specialization}</div>}
                </td>
                <td className="px-4 py-3.5 text-slate-600">{new Date(c.visitDate).toLocaleDateString()}</td>
                <td className="px-4 py-3.5 text-slate-500 max-w-[180px] truncate">{c.notes || <span className="text-slate-300">—</span>}</td>
                <td className="px-4 py-3.5">
                  {c.feeApplicable ? (
                    <div>
                      <div className="font-semibold text-slate-800">₹{c.fees}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusBadge[c.paymentStatus] ?? 'bg-slate-100 text-slate-600'}`}>{c.paymentStatus}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-300">No Fee</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <button onClick={() => openEdit(c)}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-teal-600 border border-slate-200 hover:border-teal-300 px-2.5 py-1.5 rounded-lg transition-colors">
                    <Pencil size={12} /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? 'Edit Checkup' : 'New Regular Checkup'} size="lg">
        <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">

          <SearchSelect
            label="Patient"
            value={form.patientId}
            displayValue={form.patientLabel}
            onSelect={(item) => setForm(f => ({ ...f, patientId: item?._id ?? '', patientLabel: item?.label ?? '' }))}
            onSearch={searchPatients}
            placeholder="Search regular patients…"
            required
          />

          <SearchSelect
            label="Doctor"
            value={form.doctorId}
            displayValue={form.doctorLabel}
            onSelect={(item) => setForm(f => ({ ...f, doctorId: item?._id ?? '', doctorLabel: item?.label ?? '' }))}
            onSearch={searchDoctors}
            placeholder="Search doctors…"
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Visit Date <span className="text-red-500">*</span></label>
            <input type="date" value={form.visitDate} onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors" required />
          </div>

          <div className="flex items-end pb-1">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className="relative">
                <input type="checkbox" checked={form.feeApplicable}
                  onChange={(e) => setForm({ ...form, feeApplicable: e.target.checked })} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:bg-teal-600 transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Fee Applicable</span>
            </label>
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              placeholder="Observations, diagnosis, instructions…"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white resize-none transition-colors" />
          </div>

          {form.feeApplicable && (
            <>
              <div className="col-span-2">
                <div className="border-t border-slate-100 pt-3 mb-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fee Details</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Consultation Fee (₹) <span className="text-red-500">*</span></label>
                <input type="number" value={form.fees} onChange={(e) => setForm({ ...form, fees: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors" required min="0" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Amount Paid (₹)</label>
                <input type="number" value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors" min="0" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Payment Status <span className="text-red-500">*</span></label>
                <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50" required>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Payment Mode <span className="text-red-500">*</span></label>
                <select value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50" required>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="insurance">Insurance</option>
                  <option value="online">Online</option>
                </select>
              </div>
            </>
          )}

          <div className="col-span-2 flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-teal-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {saving ? 'Saving…' : 'Save Checkup'}
            </button>
            <button type="button" onClick={() => setModal(false)}
              className="flex-1 border border-slate-200 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
