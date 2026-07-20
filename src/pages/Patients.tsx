import { useEffect, useState } from 'react';
import { Search, UserPlus, Pencil, Users, Loader2, Eye } from 'lucide-react';
import api from '../api/axios';
import { Modal } from '../components/Modal';

interface Patient { _id: string; patientId: string; name: string; age: number; gender: string; phone: string; address?: string; city?: { name: string }; marriageYear?: number; patientType: string; }
interface City { _id: string; name: string; state: string; }

const empty = { name: '', age: '', gender: 'male', phone: '', city: '', address: '', marriageYear: '', patientType: 'regular' };

const genderBadge: Record<string, string> = {
  male: 'bg-blue-50 text-blue-700',
  female: 'bg-pink-50 text-pink-700',
  other: 'bg-slate-100 text-slate-600',
};

export function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState({ patient: null as Patient | null, opds: [] as any[], regularCheckups: [] as any[], testBookings: [] as any[], bills: [] as any[], returns: [] as any[] });
  const [form, setForm] = useState({ ...empty });
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        api.get('/patients', { params: { search, limit: 25 } }),
        api.get('/cities', { params: { all: true } }),
      ]);
      setPatients(pRes.data.data.patients || pRes.data.data);
      setTotal(pRes.data.data.total || 0);
      setCities(Array.isArray(cRes.data.data) ? cRes.data.data : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, age: Number(form.age), marriageYear: form.marriageYear ? Number(form.marriageYear) : undefined };
      if (editId) await api.put(`/patients/${editId}`, payload);
      else await api.post('/patients', payload);
      setModal(false);
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const openEdit = (p: Patient) => {
    setForm({ name: p.name, age: String(p.age), gender: p.gender, phone: p.phone, city: '', address: p.address || '', marriageYear: p.marriageYear ? String(p.marriageYear) : '', patientType: p.patientType || 'regular' });
    setEditId(p._id);
    setModal(true);
  };

  const openView = async (p: Patient) => {
    setDetailModal(true);
    setDetailLoading(true);
    setDetailData({ patient: null, opds: [], regularCheckups: [], testBookings: [], bills: [], returns: [] });
    try {
      const res = await api.get(`/patients/${p._id}/view`);
      setDetailData(res.data.data || { patient: null, opds: [], regularCheckups: [], testBookings: [], bills: [], returns: [] });
    } catch {
      alert('Could not load patient details');
      setDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-0.5">
            <Users size={13} /> {total} registered patients
          </p>
        </div>
        <button
          onClick={() => { setForm({ ...empty }); setEditId(null); setModal(true); }}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-teal-700 shadow-sm shadow-teal-200 transition-colors"
        >
          <UserPlus size={16} />
          Register Patient
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-4">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, ID…"
            className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Patient ID', 'Patient Name', 'Age', 'Gender', 'Phone', 'City', 'Address', 'Married Yrs', 'Type', ''].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={10} className="py-12 text-center">
                <Loader2 size={24} className="animate-spin text-teal-500 mx-auto" />
              </td></tr>
            ) : patients.length === 0 ? (
              <tr><td colSpan={10} className="py-12 text-center text-slate-400">
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                No patients found
              </td></tr>
            ) : patients.map(p => (
              <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3.5">
                  <span className="font-mono text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded-lg">{p.patientId}</span>
                </td>
                <td className="px-4 py-3.5 font-semibold text-slate-800">{p.name}</td>
                <td className="px-4 py-3.5 text-slate-600">{p.age} yrs</td>
                <td className="px-4 py-3.5">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${genderBadge[p.gender] ?? 'bg-slate-100 text-slate-600'}`}>{p.gender}</span>
                </td>
                <td className="px-4 py-3.5 text-slate-600">{p.phone}</td>
                <td className="px-4 py-3.5 text-slate-500">{p.city?.name || <span className="text-slate-300">—</span>}</td>
                <td className="px-4 py-3.5 text-slate-500 max-w-[160px] truncate">{p.address || <span className="text-slate-300">—</span>}</td>
                <td className="px-4 py-3.5 text-slate-500">{p.marriageYear || <span className="text-slate-300">—</span>}</td>
                <td className="px-4 py-3.5">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${p.patientType === 'regular' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>{p.patientType || 'regular'}</span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openView(p)} className="flex items-center justify-center text-slate-500 hover:text-teal-600" title="View patient details">
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-teal-600 border border-slate-200 hover:border-teal-300 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Patient Details Modal */}
      <Modal isOpen={detailModal} onClose={() => setDetailModal(false)} title={detailLoading ? 'Loading patient details...' : (detailData.patient?.name || 'Patient details')} size="xl">
        {detailLoading ? (
          <div className="flex items-center justify-center py-10 text-slate-500"><Loader2 size={20} className="mr-2 animate-spin" /> Loading...</div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <div className="flex flex-wrap gap-4">
                <div><span className="font-semibold text-slate-700">Patient ID:</span> {detailData.patient?.patientId}</div>
                <div><span className="font-semibold text-slate-700">Phone:</span> {detailData.patient?.phone}</div>
                <div><span className="font-semibold text-slate-700">Age:</span> {detailData.patient?.age} yrs</div>
                <div><span className="font-semibold text-slate-700">Gender:</span> {detailData.patient?.gender}</div>
                <div><span className="font-semibold text-slate-700">Type:</span> {detailData.patient?.patientType || 'regular'}</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">OPD Visits</h3>
              {detailData.opds.length === 0 ? <p className="text-sm text-slate-400">No OPD visits found.</p> : detailData.opds.map((opd: any) => (
                <div key={opd._id} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600 mb-2">
                  <div className="flex justify-between gap-3">
                    <span className="font-semibold text-slate-800">{opd.opdId || 'OPD'}</span>
                    <span>{opd.visitDate ? new Date(opd.visitDate).toLocaleDateString('en-IN') : '-'}</span>
                  </div>
                  <div className="mt-1">Doctor: {opd.doctor?.name ? `${opd.doctor.name}${opd.doctor.specialization ? ` (${opd.doctor.specialization})` : ''}` : '—'}</div>
                  <div>Fees: ₹{Number(opd.fees || 0).toLocaleString('en-IN')} · Paid: ₹{Number(opd.amountPaid || 0).toLocaleString('en-IN')} · Status: {opd.paymentStatus || 'pending'}</div>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Regular Checkups</h3>
              {detailData.regularCheckups.length === 0 ? <p className="text-sm text-slate-400">No regular checkups found.</p> : detailData.regularCheckups.map((checkup: any) => (
                <div key={checkup._id} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600 mb-2">
                  <div className="flex justify-between gap-3">
                    <span className="font-semibold text-slate-800">{checkup.checkupId || 'Checkup'}</span>
                    <span>{checkup.visitDate ? new Date(checkup.visitDate).toLocaleDateString('en-IN') : '-'}</span>
                  </div>
                  <div className="mt-1">Doctor: {checkup.doctor?.name ? `${checkup.doctor.name}${checkup.doctor.specialization ? ` (${checkup.doctor.specialization})` : ''}` : '—'}</div>
                  <div>Fee Applicable: {checkup.feeApplicable ? 'Yes' : 'No'} · Fees: ₹{Number(checkup.fees || 0).toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Pathology Tests</h3>
              {detailData.testBookings.length === 0 ? <p className="text-sm text-slate-400">No pathology bookings found.</p> : detailData.testBookings.map((booking: any) => (
                <div key={booking._id} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600 mb-2">
                  <div className="flex justify-between gap-3">
                    <span className="font-semibold text-slate-800">{booking.bookingId || 'Booking'}</span>
                    <span>{booking.bookedDate ? new Date(booking.bookedDate).toLocaleDateString('en-IN') : '-'}</span>
                  </div>
                  <div className="mt-1">Total: ₹{Number(booking.totalAmount || 0).toLocaleString('en-IN')} · Net: ₹{Number(booking.netAmount || 0).toLocaleString('en-IN')} · Status: {booking.paymentStatus || 'pending'}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? 'Edit Patient' : 'Register New Patient'} size="lg">
        <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Patient Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Phone Number</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Age</label>
            <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors" required min="0" max="150" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Gender</label>
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50" required>
              {['male', 'female', 'other'].map(g => <option key={g} value={g} className="capitalize">{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">City</label>
            <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50">
              <option value="">Select City</option>
              {cities.map(c => <option key={c._id} value={c._id}>{c.name}, {c.state}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Years Married</label>
            <input type="number" inputMode="numeric" value={form.marriageYear} onChange={(e) => setForm({ ...form, marriageYear: e.target.value.replace(/[^0-9]/g, '') })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors" min="0" step="1" placeholder="e.g. 5" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Patient Type</label>
            <select value={form.patientType} onChange={(e) => setForm({ ...form, patientType: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50" required>
              <option value="regular">Regular</option>
              <option value="irregular">Irregular</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Address</label>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white resize-none transition-colors" />
          </div>
          <div className="col-span-2 flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-teal-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              {saving ? 'Saving…' : 'Save Patient'}
            </button>
            <button type="button" onClick={() => setModal(false)}
              className="flex-1 border border-slate-200 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
