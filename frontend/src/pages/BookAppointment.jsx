import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaClock, FaUserMd, FaMoneyBillWave, FaCheckCircle } from 'react-icons/fa';
import { format, addDays, startOfToday, isToday } from 'date-fns';
import toast from 'react-hot-toast';
import API from '../utils/api';

const BookAppointment = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [step, setStep] = useState(1); // 1: select date/time, 2: confirm

  useEffect(() => {
    API.get(`/doctors/${doctorId}`)
      .then(({ data }) => setDoctor(data.doctor))
      .catch(() => navigate('/doctors'))
      .finally(() => setLoading(false));
  }, [doctorId]);

  // Generate next 14 available dates
  const getAvailableDates = () => {
    if (!doctor) return [];
    const availableDays = doctor.availableSlots?.filter(s => s.isAvailable).map(s => s.day) || [];
    const dates = [];
    let current = startOfToday();
    let count = 0;
    while (dates.length < 14 && count < 30) {
      const dayName = format(current, 'EEEE');
      if (availableDays.includes(dayName)) dates.push(new Date(current));
      current = addDays(current, 1);
      count++;
    }
    return dates;
  };

  const getTimeSlotsForDate = (date) => {
    if (!doctor || !date) return [];
    const dayName = format(date, 'EEEE');
    const slot = doctor.availableSlots?.find(s => s.day === dayName && s.isAvailable);
    if (!slot) return [];

    const slots = [];
    const [startH, startM] = slot.startTime.split(':').map(Number);
    const [endH, endM] = slot.endTime.split(':').map(Number);
    let h = startH, m = startM;
    while (h < endH || (h === endH && m < endM)) {
      const timeStr = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      slots.push(timeStr);
      m += 30;
      if (m >= 60) { h++; m = 0; }
    }
    return slots;
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select a date and time slot');
      return;
    }
    setSubmitting(true);
    try {
      await API.post('/appointments', {
        doctorId,
        appointmentDate: selectedDate.toISOString(),
        timeSlot: selectedTime,
        symptoms
      });
      toast.success('Appointment booked successfully!');
      navigate('/my-appointments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
    </div>
  );

  const availableDates = getAvailableDates();
  const timeSlots = getTimeSlotsForDate(selectedDate);

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to={`/doctors/${doctorId}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-6 transition-colors">
          <FaArrowLeft size={12} /> Back to Doctor Profile
        </Link>

        <h1 className="text-3xl font-bold font-display text-gray-900 mb-2">Book Appointment</h1>
        <p className="text-gray-500 mb-8">Schedule your consultation with Dr. {doctor?.name}</p>

        {/* Doctor Summary */}
        <div className="card p-5 mb-8 flex items-center gap-5">
          {doctor?.image ? (
            <img src={doctor.image} alt={doctor.name} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <FaUserMd className="text-primary-400 text-2xl" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900">Dr. {doctor?.name}</h3>
            <p className="text-primary-600 text-sm">{doctor?.specialty}</p>
          </div>
          <div className="flex items-center gap-2 text-green-600 font-semibold">
            <FaMoneyBillWave />
            <span>${doctor?.consultationFee}</span>
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-4 mb-8">
          {[1,2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'
              }`}>{s}</div>
              <span className={`text-sm font-medium ${step >= s ? 'text-gray-800' : 'text-gray-400'}`}>
                {s === 1 ? 'Select Schedule' : 'Confirm Booking'}
              </span>
              {s < 2 && <div className={`w-16 h-0.5 ${step > s ? 'bg-primary-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            {/* Date Selection */}
            <div className="card p-7">
              <h2 className="text-lg font-bold font-display text-gray-900 mb-5 flex items-center gap-2">
                <FaCalendarAlt className="text-primary-500" /> Select Date
              </h2>
              {availableDates.length === 0 ? (
                <p className="text-gray-400 text-sm">No available dates. Please check back later.</p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {availableDates.map((date, i) => {
                    const isSelected = selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                    return (
                      <button key={i} onClick={() => { setSelectedDate(date); setSelectedTime(''); }}
                        className={`p-3 rounded-xl text-center transition-all ${
                          isSelected
                            ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                            : 'bg-gray-50 hover:bg-primary-50 hover:border-primary-200 border border-gray-200'
                        }`}>
                        <p className="text-xs font-medium">{format(date, 'EEE')}</p>
                        <p className="text-lg font-bold">{format(date, 'd')}</p>
                        <p className="text-xs">{format(date, 'MMM')}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Time Slot Selection */}
            {selectedDate && (
              <div className="card p-7">
                <h2 className="text-lg font-bold font-display text-gray-900 mb-5 flex items-center gap-2">
                  <FaClock className="text-primary-500" /> Select Time Slot
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {timeSlots.map((time, i) => {
                    const isSelected = selectedTime === time;
                    return (
                      <button key={i} onClick={() => setSelectedTime(time)}
                        className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                            : 'bg-gray-50 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 text-gray-700'
                        }`}>
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Symptoms */}
            <div className="card p-7">
              <h2 className="text-lg font-bold font-display text-gray-900 mb-4">Reason for Visit <span className="text-gray-400 font-normal text-sm">(Optional)</span></h2>
              <textarea
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
                rows={4}
                placeholder="Briefly describe your symptoms or reason for visit..."
                className="input-field resize-none"
              />
            </div>

            <button onClick={() => {
              if (!selectedDate || !selectedTime) { toast.error('Please select date and time'); return; }
              setStep(2);
            }} className="btn-primary w-full py-4 text-base">
              Continue to Confirmation
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Confirmation */}
            <div className="card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <FaCheckCircle className="text-green-500 text-xl" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-display text-gray-900">Confirm Appointment</h2>
                  <p className="text-sm text-gray-500">Please review your booking details</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {[
                  { label: 'Doctor', value: `Dr. ${doctor?.name}` },
                  { label: 'Specialty', value: doctor?.specialty },
                  { label: 'Date', value: format(selectedDate, 'EEEE, MMMM d, yyyy') },
                  { label: 'Time', value: selectedTime },
                  { label: 'Consultation Fee', value: `$${doctor?.consultationFee}` },
                  ...(symptoms ? [{ label: 'Symptoms', value: symptoms }] : [])
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-3 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className="text-sm font-semibold text-gray-800 text-right max-w-xs">{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">
                  Change Details
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="btn-primary flex-1 disabled:opacity-60">
                  {submitting ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookAppointment;
