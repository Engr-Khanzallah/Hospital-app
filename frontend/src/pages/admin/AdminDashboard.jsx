import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaUsers, FaUserMd, FaCalendarCheck, FaMoneyBillWave,
  FaHourglassHalf, FaCheckCircle, FaTimesCircle, FaEnvelope, FaArrowRight
} from 'react-icons/fa';
import { format } from 'date-fns';
import StatusBadge from '../../components/appointment/StatusBadge';
import API from '../../utils/api';

const StatCard = ({ icon, label, value, color, sub }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="text-3xl font-bold font-display text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-xl`}>
        {icon}
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/dashboard')
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  );

  const { stats, recentAppointments } = data || {};

  const statCards = [
    { icon: <FaUsers className="text-blue-500" />, label: 'Total Patients', value: stats?.totalPatients || 0, color: 'bg-blue-50' },
    { icon: <FaUserMd className="text-purple-500" />, label: 'Active Doctors', value: stats?.totalDoctors || 0, color: 'bg-purple-50' },
    { icon: <FaCalendarCheck className="text-green-500" />, label: 'Total Appointments', value: stats?.totalAppointments || 0, color: 'bg-green-50' },
    { icon: <FaMoneyBillWave className="text-amber-500" />, label: 'Total Revenue', value: `$${stats?.revenue?.toLocaleString() || 0}`, color: 'bg-amber-50' }
  ];

  const appointmentStats = [
    { icon: <FaHourglassHalf className="text-yellow-500" />, label: 'Pending', value: stats?.pendingAppointments || 0, color: 'bg-yellow-50' },
    { icon: <FaCheckCircle className="text-blue-500" />, label: 'Confirmed', value: stats?.confirmedAppointments || 0, color: 'bg-blue-50' },
    { icon: <FaCheckCircle className="text-green-500" />, label: 'Completed', value: stats?.completedAppointments || 0, color: 'bg-green-50' },
    { icon: <FaTimesCircle className="text-red-400" />, label: 'Cancelled', value: stats?.cancelledAppointments || 0, color: 'bg-red-50' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Appointment Stats */}
      <div>
        <h2 className="text-base font-bold text-gray-700 mb-3">Appointment Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {appointmentStats.map((s, i) => <StatCard key={i} {...s} />)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Appointments Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Recent Appointments</h2>
            <Link to="/admin/appointments" className="text-sm text-primary-600 font-medium flex items-center gap-1 hover:gap-2 transition-all">
              View all <FaArrowRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentAppointments?.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">No appointments yet</div>
            ) : (
              recentAppointments?.map(apt => (
                <div key={apt._id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{apt.patient?.name}</p>
                    <p className="text-xs text-gray-500">Dr. {apt.doctor?.name} · {apt.doctor?.specialty}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium text-gray-600">
                      {format(new Date(apt.appointmentDate), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-gray-400">{apt.timeSlot}</p>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Stats Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">Quick Links</h2>
            <div className="space-y-2">
              {[
                { to: '/admin/doctors', icon: <FaUserMd className="text-purple-500" />, label: 'Manage Doctors', color: 'bg-purple-50' },
                { to: '/admin/appointments', icon: <FaCalendarCheck className="text-green-500" />, label: 'View Appointments', color: 'bg-green-50' },
                { to: '/admin/patients', icon: <FaUsers className="text-blue-500" />, label: 'Patient List', color: 'bg-blue-50' },
                { to: '/admin/messages', icon: <FaEnvelope className="text-amber-500" />, label: `Messages (${stats?.unreadMessages || 0} unread)`, color: 'bg-amber-50' }
              ].map((item, i) => (
                <Link key={i} to={item.to}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className={`w-8 h-8 ${item.color} rounded-lg flex items-center justify-center text-sm`}>
                    {item.icon}
                  </div>
                  <span className="text-sm text-gray-700 group-hover:text-primary-600 font-medium">{item.label}</span>
                  <FaArrowRight className="ml-auto text-xs text-gray-300 group-hover:text-primary-400" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
