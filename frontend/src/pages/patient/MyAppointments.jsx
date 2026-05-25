import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUserMd, FaCalendarAlt, FaClock, FaTimesCircle, FaMoneyBillWave } from 'react-icons/fa';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/appointment/StatusBadge';
import API from '../../utils/api';

const FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data } = await API.get('/appointments/my');
      setAppointments(data.appointments);
    } catch (err) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setCancellingId(id);
    try {
      await API.put(`/appointments/${id}/cancel`);
      toast.success('Appointment cancelled');
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: 'cancelled' } : a));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-gray-900">My Appointments</h1>
          <p className="text-gray-500 mt-1">Track and manage your medical appointments</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
                filter === f ? 'bg-primary-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}>
              {f}
              {f !== 'all' && (
                <span className="ml-1.5 text-xs opacity-75">
                  ({appointments.filter(a => a.status === f).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="card h-28 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-16 text-center">
            <FaCalendarAlt className="text-6xl text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No appointments found</h3>
            <p className="text-gray-400 text-sm mb-6">
              {filter === 'all' ? "You haven't booked any appointments yet." : `No ${filter} appointments.`}
            </p>
            <Link to="/doctors" className="btn-primary">Book an Appointment</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(apt => (
              <div key={apt._id} className="card p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  {/* Doctor Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {apt.doctor?.image ? (
                      <img src={apt.doctor.image} alt={apt.doctor.name}
                        className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <FaUserMd className="text-primary-400 text-xl" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">Dr. {apt.doctor?.name}</h3>
                      <p className="text-sm text-primary-600">{apt.doctor?.specialty}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <FaCalendarAlt size={10} className="text-primary-400" />
                          {format(new Date(apt.appointmentDate), 'MMM d, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaClock size={10} className="text-primary-400" />
                          {apt.timeSlot}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaMoneyBillWave size={10} className="text-green-500" />
                          ${apt.consultationFee}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0 sm:flex-col sm:items-end">
                    <StatusBadge status={apt.status} />
                    {['pending', 'confirmed'].includes(apt.status) && (
                      <button onClick={() => handleCancel(apt._id)} disabled={cancellingId === apt._id}
                        className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors disabled:opacity-50">
                        <FaTimesCircle size={12} />
                        {cancellingId === apt._id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>

                {apt.symptoms && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500"><span className="font-medium">Symptoms:</span> {apt.symptoms}</p>
                  </div>
                )}
                {apt.adminNotes && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500"><span className="font-medium">Doctor's Note:</span> {apt.adminNotes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAppointments;
