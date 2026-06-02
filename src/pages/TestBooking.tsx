import { useEffect, useState } from 'react';
import { FlaskConical, Plus, CheckCircle, Clock, AlertCircle, Loader2, TestTube, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import { Modal } from '../components/Modal';

interface Test { _id: string; name: string; code: string; category: string; price: number; processingTime: string; }
interface Booking { _id: string; bookingId: string; patient: { name: string; patientId: string }; tests: { test: { name: string; code: string }; status: string; result: string }[]; netAmount: number; paymentStatus: string; bookedDate: string; }
interface Patient { _id: string; name: string; patientId: string; }

const payStatusConfig: Record<string, { label: string; class: string; icon: typeof CheckCircle }> = {
  paid:    { label: 'Paid',    class: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  pending: { label: 'Pending', class: 'bg-yellow-50 text-yellow-700 border-yellow-200',   icon: Clock },
  partial: { label: 'Partial', class: 'bg-orange-50 text-orange-700 border-orange-200',   icon: AlertCircle },
};

export function TestBooking() {
  const [tests, setTests] = useState<Test[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [bookingTotal, setBookingTotal] = useState(0);
  const [bookingPage, setBookingPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'history' | 'available'>('history');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ patient: '', testIds: [] as string[], discount: '', paymentStatus: 'pending', paymentMode: 'cash', amountPaid: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [tRes, bRes] = await Promise.all([
        api.get('/pathology/tests', { params: { all: true } }),
        api.get('/pathology/bookings', { params: { page: bookingPage, limit: 20 } }),
      ]);
      setTests(Array.isArray(tRes.data.data) ? tRes.data.data : tRes.data.data.tests || []);
      setBookings(bRes.data.data.bookings);
      setBookingTotal(bRes.data.data.total);
    } finally { setLoading(false); }
    try {
      const pRes = await api.get('/patients', { params: { all: true } });
      setPatients(Array.isArray(pRes.data.data) ? pRes.data.data : []);
    } catch { /* form data only */ }
  };

  useEffect(() => { load(); }, [bookingPage]);

  const toggleTest = (id: string) => {
    setForm(p => ({ ...p, testIds: p.testIds.includes(id) ? p.testIds.filter(t => t !== id) : [...p.testIds, id] }));
  };

  const selectedTotal = tests.filter(t => form.testIds.includes(t._id)).reduce((s, t) => s + t.price, 0);
  const netAmount = selectedTotal - Number(form.discount || 0);

  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (form.testIds.length === 0) { alert('Select at least one test'); return; }
    setSaving(true);
    try {
      await api.post('/pathology/bookings', { ...form, discount: Number(form.discount || 0), amountPaid: Number(form.amountPaid || 0) });
      setModal(false);
      setForm({ patient: '', testIds: [], discount: '', paymentStatus: 'pending', paymentMode: 'cash', amountPaid: '', notes: '' });
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Test Booking</h1>
          <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-0.5">
            <FlaskConical size={13} /> Book pathology tests for patients
          </p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-teal-700 shadow-sm shadow-teal-200 transition-colors">
          <Plus size={16} /> Book Tests
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(['history', 'available'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t ? 'bg-teal-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-600'}`}>
            {t === 'history' ? 'Booking History' : 'Available Tests'}
          </button>
        ))}
      </div>

      {tab === 'history' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Booking ID', 'Patient', 'Tests', 'Amount', 'Payment', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center">
                  <Loader2 size={24} className="animate-spin text-teal-500 mx-auto" />
                </td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-400">
                  <FlaskConical size={32} className="mx-auto mb-2 opacity-30" />No bookings found
                </td></tr>
              ) : bookings.map(b => {
                const status = payStatusConfig[b.paymentStatus] ?? payStatusConfig.pending;
                const StatusIcon = status.icon;
                return (
                  <tr key={b._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded-lg">{b.bookingId}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-800">{b.patient?.name}</p>
                      <p className="text-xs text-slate-400">{b.patient?.patientId}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {b.tests.map((t, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium border border-purple-100">{t.test?.name}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800">₹{b.netAmount}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.class}`}>
                        <StatusIcon size={11} /> {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{new Date(b.bookedDate).toLocaleDateString('en-IN')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full flex justify-center py-16">
              <Loader2 size={32} className="animate-spin text-teal-500" />
            </div>
          ) : tests.map(t => (
            <div key={t._id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                  <TestTube size={18} className="text-white" strokeWidth={1.8} />
                </div>
                <span className="text-xl font-bold text-teal-600">₹{t.price}</span>
              </div>
              <p className="font-bold text-slate-900 mb-0.5">{t.name}</p>
              <p className="text-xs text-slate-400 mb-3">{t.code} · {t.category}</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock size={12} className="text-slate-400" />
                <span>Processing: {t.processingTime}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-sm text-slate-400">Showing {bookingTotal === 0 ? 0 : Math.min((bookingPage-1)*20+1, bookingTotal)}–{Math.min(bookingPage*20, bookingTotal)} of {bookingTotal}</p>
          <div className="flex gap-2">
            <button disabled={bookingPage === 1} onClick={() => setBookingPage(p => p-1)}
              className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="flex items-center px-3 text-sm text-slate-500">Page {bookingPage} of {Math.ceil(bookingTotal/20) || 1}</span>
            <button disabled={bookingPage * 20 >= bookingTotal} onClick={() => setBookingPage(p => p+1)}
              className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Book Tests for Patient" size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Patient</label>
            <select value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50" required>
              <option value="">Select Patient</option>
              {patients.map(p => <option key={p._id} value={p._id}>{p.name} ({p.patientId})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Select Tests</label>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-50">
              {tests.map(t => (
                <label key={t._id} className="flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2.5">
                    <input type="checkbox" checked={form.testIds.includes(t._id)} onChange={() => toggleTest(t._id)}
                      className="w-4 h-4 rounded accent-teal-600" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.code}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-teal-600">₹{t.price}</span>
                </label>
              ))}
            </div>
            {form.testIds.length > 0 && (
              <div className="mt-2 px-3 py-2.5 bg-teal-50 border border-teal-100 rounded-xl flex justify-between items-center">
                <span className="text-sm text-teal-700 font-medium">{form.testIds.length} test(s) selected</span>
                <span className="text-base font-bold text-teal-700">₹{netAmount}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { l: 'Discount (₹)', f: 'discount' },
              { l: 'Amount Paid (₹)', f: 'amountPaid' },
            ].map(({ l, f }) => (
              <div key={f}>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">{l}</label>
                <input type="number" value={(form as unknown as Record<string, string>)[f]}
                  onChange={(e) => setForm({ ...form, [f]: e.target.value })} min="0"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white transition-colors" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Payment Status</label>
              <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50">
                {['pending', 'paid', 'partial'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Payment Mode</label>
              <select value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50">
                {['cash', 'card', 'upi', 'insurance', 'online'].map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-teal-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <FlaskConical size={16} />}
              {saving ? 'Booking…' : 'Book Tests'}
            </button>
            <button type="button" onClick={() => setModal(false)}
              className="px-6 border border-slate-200 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
