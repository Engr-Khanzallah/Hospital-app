import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FaUserMd, FaStar, FaClock, FaMoneyBillWave, FaGraduationCap,
  FaCalendarAlt, FaCheckCircle, FaArrowLeft, FaPhone
} from 'react-icons/fa';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DoctorDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/doctors/${id}`)
      .then(({ data }) => setDoctor(data.doctor))
      .catch(() => navigate('/doctors'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
    </div>
  );

  if (!doctor) return null;

  const availableDays = doctor.availableSlots?.map(s => s.day) || [];

  // Add this helper at the top of the file, above the component
const getImageUrl = (image) => {
  if (!image) return null
  if (image.startsWith('http')) return image
  return `http://localhost:5000${image}`
}

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/doctors" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-6 transition-colors">
          <FaArrowLeft size={12} /> Back to Doctors
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Profile Card */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
             <div className="relative mb-5">
  {getImageUrl(doctor.image) ? (
    <img
      src={getImageUrl(doctor.image)}
      alt={doctor.name}
      className="w-full h-64 object-cover rounded-2xl"
      onError={(e) => {
        e.target.onerror = null
        e.target.style.display = 'none'
      }}
    />
  ) : (
    <div className="w-full h-64 bg-gradient-to-br from-primary-50 to-blue-100 rounded-2xl flex items-center justify-center">
      <FaUserMd className="text-7xl text-primary-300" />
    </div>
  )}
  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${
    doctor.isAvailable
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-600'
  }`}>
    {doctor.isAvailable ? '● Available' : '● Unavailable'}
  </div>
</div>

              <h1 className="text-2xl font-bold font-display text-gray-900">Dr. {doctor.name}</h1>
              <p className="text-primary-600 font-medium mb-1">{doctor.specialty}</p>
              {doctor.department && (
                <p className="text-sm text-gray-500 mb-4">{doctor.department.icon} {doctor.department.name}</p>
              )}

              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="text-center p-3 bg-primary-50 rounded-xl">
                  <FaStar className="text-amber-400 mx-auto mb-1" />
                  <p className="text-sm font-bold text-gray-800">{doctor.rating?.toFixed(1) || '4.5'}</p>
                  <p className="text-xs text-gray-500">Rating</p>
                </div>
                <div className="text-center p-3 bg-primary-50 rounded-xl">
                  <FaClock className="text-primary-400 mx-auto mb-1" />
                  <p className="text-sm font-bold text-gray-800">{doctor.experience}+</p>
                  <p className="text-xs text-gray-500">Years</p>
                </div>
                <div className="text-center p-3 bg-primary-50 rounded-xl">
                  <FaMoneyBillWave className="text-green-500 mx-auto mb-1" />
                  <p className="text-sm font-bold text-gray-800">${doctor.consultationFee}</p>
                  <p className="text-xs text-gray-500">Fee</p>
                </div>
              </div>

              {doctor.isAvailable ? (
                <Link to={user ? `/book/${doctor._id}` : '/login'}
                  className="btn-primary w-full text-center block text-sm">
                  Book Appointment
                </Link>
              ) : (
                <button disabled className="w-full py-3 rounded-xl bg-gray-200 text-gray-400 text-sm font-semibold cursor-not-allowed">
                  Currently Unavailable
                </button>
              )}
              {!user && (
                <p className="text-xs text-center text-gray-400 mt-2">
                  <Link to="/login" className="text-primary-500 hover:underline">Login</Link> to book an appointment
                </p>
              )}
            </div>
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <div className="card p-7">
              <h2 className="text-lg font-bold font-display text-gray-900 mb-4">About Doctor</h2>
              <p className="text-gray-600 leading-relaxed text-sm">
                {doctor.about || `Dr. ${doctor.name} is an experienced ${doctor.specialty} specialist with ${doctor.experience} years of practice. Committed to providing compassionate and evidence-based medical care to all patients.`}
              </p>
            </div>

            {/* Qualifications */}
            {doctor.qualification?.length > 0 && (
              <div className="card p-7">
                <h2 className="text-lg font-bold font-display text-gray-900 mb-4 flex items-center gap-2">
                  <FaGraduationCap className="text-primary-500" /> Qualifications
                </h2>
                <div className="space-y-2">
                  {doctor.qualification.map((q, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <FaCheckCircle className="text-primary-400 flex-shrink-0" size={14} />
                      <span className="text-gray-600 text-sm">{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Schedule */}
            {doctor.availableSlots?.length > 0 && (
              <div className="card p-7">
                <h2 className="text-lg font-bold font-display text-gray-900 mb-5 flex items-center gap-2">
                  <FaCalendarAlt className="text-primary-500" /> Available Schedule
                </h2>
                <div className="grid grid-cols-7 gap-2 mb-5">
                  {DAYS.map(day => {
                    const slot = doctor.availableSlots.find(s => s.day === day);
                    const isAvail = slot?.isAvailable;
                    return (
                      <div key={day} className={`text-center p-2 rounded-xl text-xs font-medium ${
                        isAvail
                          ? 'bg-primary-50 text-primary-700 border border-primary-200'
                          : 'bg-gray-50 text-gray-400 border border-gray-100'
                      }`}>
                        <p className="font-bold">{day.slice(0,3)}</p>
                        <p className="mt-1">{isAvail ? '✓' : '–'}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  {doctor.availableSlots.filter(s => s.isAvailable).map((slot, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
                      <span className="text-sm font-medium text-gray-700">{slot.day}</span>
                      <span className="text-sm text-gray-500">{slot.startTime} – {slot.endTime}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Book Appointment CTA */}
            <div className="card p-7 bg-gradient-to-br from-primary-50 to-blue-50 border-primary-100">
              <h2 className="text-lg font-bold font-display text-gray-900 mb-2">Ready to Book?</h2>
              <p className="text-gray-500 text-sm mb-5">
                Consultation fee: <span className="font-bold text-primary-600 text-base">${doctor.consultationFee}</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to={user ? `/book/${doctor._id}` : '/login'}
                  className="btn-primary flex-1 text-center text-sm">
                  Book Appointment Now
                </Link>
                <a href="tel:+11234567890"
                  className="btn-secondary flex-1 text-center text-sm flex items-center justify-center gap-2">
                  <FaPhone size={12} /> Call Hospital
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDetail;
