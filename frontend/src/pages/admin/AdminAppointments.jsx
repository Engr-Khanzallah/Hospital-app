import { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaCheck, FaTimes, FaCalendarCheck, FaEye } from 'react-icons/fa';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/appointment/StatusBadge';
import API from '../../utils/api';

const STATUSES = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedApt, setSelectedApt] = useState(null);
  const [updating, setUpdating] = useState(null);

  useEffect(() => { fetchAppointments(); }, [filter, page]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (filter !== 'all') params.append('status', filter);
      const { data } = await API.get(`/appointments?${params}`);
      setAppointments(data.appointments);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch { toast.error('Failed to load appointments'); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      const { data } = await API.put(`/appointments/${id}/status`, { status });
      setAppointments(prev => prev.map(a => a._id === id ? data.appointment : a));
      toast.success(`Appointment ${status}`);
    } catch { toast.error('Failed to update'); }
    finally { setUpdating(null); }
  };

  const filtered = appointments.filter(a =>
    !search || a.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.doctor?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900">Appointments</h1>
        <p className="text-sm text-gray-500 mt-1">Manage all patient appointments</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search patient or doctor..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => { setFilter(s); setPage(1); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                filter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 text-sm text-gray-500">
          {loading ? 'Loading...' : `${total} appointments total`}
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <FaCalendarCheck className="text-5xl text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No appointments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Patient','Doctor','Date & Time','Fee','Status','Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(apt => (
                  <tr key={apt._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-800">{apt.patient?.name}</p>
                      <p className="text-xs text-gray-400">{apt.patient?.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-700">Dr. {apt.doctor?.name}</p>
                      <p className="text-xs text-gray-400">{apt.doctor?.specialty}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700">{format(new Date(apt.appointmentDate), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-gray-400">{apt.timeSlot}</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-gray-800">${apt.consultationFee}</td>
                    <td className="px-5 py-4"><StatusBadge status={apt.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setSelectedApt(apt)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                          <FaEye size={13} />
                        </button>
                        {apt.status === 'pending' && (
                          <button onClick={() => updateStatus(apt._id, 'confirmed')}
                            disabled={updating === apt._id}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Confirm">
                            <FaCheck size={13} />
                          </button>
                        )}
                        {apt.status === 'confirmed' && (
                          <button onClick={() => updateStatus(apt._id, 'completed')}
                            disabled={updating === apt._id}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Complete">
                            <FaCalendarCheck size={13} />
                          </button>
                        )}
                        {['pending','confirmed'].includes(apt.status) && (
                          <button onClick={() => updateStatus(apt._id, 'cancelled')}
                            disabled={updating === apt._id}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Cancel">
                            <FaTimes size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50">Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Appointment Details</h2>
              <button onClick={() => setSelectedApt(null)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
            </div>
            <div className="p-5 space-y-3">
              {[
                ['Patient', selectedApt.patient?.name],
                ['Email', selectedApt.patient?.email],
                ['Doctor', `Dr. ${selectedApt.doctor?.name}`],
                ['Specialty', selectedApt.doctor?.specialty],
                ['Date', format(new Date(selectedApt.appointmentDate), 'MMMM d, yyyy')],
                ['Time', selectedApt.timeSlot],
                ['Fee', `$${selectedApt.consultationFee}`],
                ['Status', selectedApt.status],
                ...(selectedApt.symptoms ? [['Symptoms', selectedApt.symptoms]] : []),
                ...(selectedApt.adminNotes ? [['Notes', selectedApt.adminNotes]] : [])
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-800 text-right max-w-xs">{value}</span>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-2 flex-wrap">
              {selectedApt.status === 'pending' && (
                <button onClick={() => { updateStatus(selectedApt._id, 'confirmed'); setSelectedApt(null); }}
                  className="btn-primary text-sm flex items-center gap-1.5"><FaCheck size={11} /> Confirm</button>
              )}
              {selectedApt.status === 'confirmed' && (
                <button onClick={() => { updateStatus(selectedApt._id, 'completed'); setSelectedApt(null); }}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-xl text-sm">
                  Mark Completed
                </button>
              )}
              {['pending','confirmed'].includes(selectedApt.status) && (
                <button onClick={() => { updateStatus(selectedApt._id, 'cancelled'); setSelectedApt(null); }}
                  className="bg-red-50 hover:bg-red-100 text-red-500 font-semibold py-2 px-4 rounded-xl text-sm flex items-center gap-1.5">
                  <FaTimes size={11} /> Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAppointments;
