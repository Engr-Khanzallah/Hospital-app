import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarCheck, FaUserMd, FaClock, FaTimesCircle, FaArrowRight } from 'react-icons/fa';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/appointment/StatusBadge';
import API from '../../utils/api';

const StatCard = ({ icon, label, value, color, to }) => (
  <Link to={to} className="card p-6 flex items-center gap-5 hover:-translate-y-0.5 transition-all duration-300">
    <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-xl flex-shrink-0`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold font-display text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  </Link>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/appointments/my')
      .then(({ data }) => setAppointments(data.appointments))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: appointments.length,
    upcoming: appointments.filter(a => ['pending','confirmed'].includes(a.status)).length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length
  };

  const recentAppointments = appointments.slice(0, 5);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-gray-900">
            Welcome back, {user?.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 mt-1">Here's your health overview</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<FaCalendarCheck className="text-blue-500" />} label="Total Appointments"
            value={stats.total} color="bg-blue-50" to="/my-appointments" />
          <StatCard icon={<FaClock className="text-amber-500" />} label="Upcoming"
            value={stats.upcoming} color="bg-amber-50" to="/my-appointments" />
          <StatCard icon={<FaCalendarCheck className="text-green-500" />} label="Completed"
            value={stats.completed} color="bg-green-50" to="/my-appointments" />
          <StatCard icon={<FaTimesCircle className="text-red-400" />} label="Cancelled"
            value={stats.cancelled} color="bg-red-50" to="/my-appointments" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Appointments */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold font-display text-gray-900">Recent Appointments</h2>
                <Link to="/my-appointments" className="text-sm text-primary-600 font-medium flex items-center gap-1 hover:gap-2 transition-all">
                  View all <FaArrowRight size={11} />
                </Link>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
              ) : recentAppointments.length === 0 ? (
                <div className="text-center py-10">
                  <FaCalendarCheck className="text-5xl text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No appointments yet</p>
                  <Link to="/doctors" className="btn-primary mt-4 inline-block text-sm">Book Your First Appointment</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAppointments.map(apt => (
                    <div key={apt._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      {apt.doctor?.image ? (
                        <img src={apt.doctor.image} alt={apt.doctor.name}
                          className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-11 h-11 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FaUserMd className="text-primary-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">Dr. {apt.doctor?.name}</p>
                        <p className="text-xs text-gray-500">{apt.doctor?.specialty}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-medium text-gray-700">{format(new Date(apt.appointmentDate), 'MMM d, yyyy')}</p>
                        <p className="text-xs text-gray-500">{apt.timeSlot}</p>
                      </div>
                      <StatusBadge status={apt.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <div className="card p-6">
              <h2 className="text-lg font-bold font-display text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link to="/doctors" className="flex items-center gap-3 p-3 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors group">
                  <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
                    <FaUserMd className="text-white text-sm" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary-700">Find a Doctor</span>
                  <FaArrowRight className="ml-auto text-gray-400 text-xs group-hover:text-primary-500" />
                </Link>
                <Link to="/my-appointments" className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-colors group">
                  <div className="w-9 h-9 bg-green-500 rounded-lg flex items-center justify-center">
                    <FaCalendarCheck className="text-white text-sm" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">My Appointments</span>
                  <FaArrowRight className="ml-auto text-gray-400 text-xs group-hover:text-green-500" />
                </Link>
                <Link to="/profile" className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors group">
                  <div className="w-9 h-9 bg-purple-500 rounded-lg flex items-center justify-center">
                    <FaUserMd className="text-white text-sm" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">Edit Profile</span>
                  <FaArrowRight className="ml-auto text-gray-400 text-xs group-hover:text-purple-500" />
                </Link>
              </div>
            </div>

            <div className="card p-6 bg-gradient-to-br from-primary-600 to-blue-700 text-white">
              <h3 className="font-bold font-display mb-2">Need Help?</h3>
              <p className="text-blue-100 text-sm mb-4">Our support team is available 24/7</p>
              <Link to="/contact" className="text-sm font-semibold bg-white text-primary-600 px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors inline-block">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
