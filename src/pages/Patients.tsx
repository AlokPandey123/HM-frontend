import { useEffect, useState } from 'react';
import { Search, UserPlus, Pencil, Users, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { Modal } from '../components/Modal';

interface Patient { _id: string; patientId: string; name: string; age: number; gender: string; phone: string; bloodGroup: string; city?: { name: string }; }
interface City { _id: string; name: string; state: string; }

const empty = { name: '', age: '', gender: 'male', phone: '', email: '', address: '', city: '', bloodGroup: '', emergencyContact: '' };

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
      const payload = { ...form, age: Number(form.age) };
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
    setForm({ name: p.name, age: String(p.age), gender: p.gender, phone: p.phone, email: '', address: '', city: '', bloodGroup: p.bloodGroup || '', emergencyContact: '' });
    setEditId(p._id);
    setModal(true);
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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Patient ID', 'Name', 'Age', 'Gender', 'Phone', 'Blood', 'City', ''].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={8} className="py-12 text-center">
                <Loader2 size={24} className="animate-spin text-teal-500 mx-auto" />
              </td></tr>
            ) : patients.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-slate-400">
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
                <td className="px-4 py-3.5">
                  {p.bloodGroup ? <span className="text-xs font-bold bg-red-50 text-red-600 px-2 py-1 rounded-lg">{p.bloodGroup}</span> : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-4 py-3.5 text-slate-500">{p.city?.name || <span className="text-slate-300">—</span>}</td>
                <td className="px-4 py-3.5">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-teal-600 border border-slate-200 hover:border-teal-300 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? 'Edit Patient' : 'Register New Patient'} size="lg">
        <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
          {[
            { f: 'name', l: 'Full Name', t: 'text', req: true },
            { f: 'phone', l: 'Phone Number', t: 'tel', req: true },
            { f: 'email', l: 'Email Address', t: 'email', req: false },
            { f: 'emergencyContact', l: 'Emergency Contact', t: 'tel', req: false },
          ].map(({ f, l, t, req }) => (
            <div key={f}>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">{l}</label>
              <input type={t} value={(form as Record<string, string>)[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors" required={req} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Age</label>
            <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors" required min="0" max="150" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Gender</label>
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50">
              {['male', 'female', 'other'].map(g => <option key={g} value={g} className="capitalize">{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Blood Group</label>
            <select value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50">
              <option value="">Select</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => <option key={g}>{g}</option>)}
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
