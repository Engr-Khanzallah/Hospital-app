import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaUserMd, FaTimes, FaSave } from 'react-icons/fa';
import toast from 'react-hot-toast';
import API from '../../utils/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const emptyDoctor = {
  name: '', email: '', phone: '', specialty: '', experience: '', consultationFee: '',
  about: '', qualification: '', isAvailable: true,
  availableSlots: DAYS.map(day => ({ day, startTime: '09:00', endTime: '17:00', isAvailable: false }))
};

const SPECIALTIES = ['Cardiology','Neurology','Orthopedics','Pediatrics','Dermatology',
  'Ophthalmology','Dentistry','Immunology','Psychiatry','General Medicine','Gynecology','Urology'];

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editDoctor, setEditDoctor] = useState(null);
  const [form, setForm] = useState(emptyDoctor);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchDoctors(); }, []);

  const fetchDoctors = async () => {
    try {
      const { data } = await API.get('/doctors?limit=100');
      setDoctors(data.doctors);
    } catch (err) { toast.error('Failed to load doctors'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditDoctor(null);
    setForm(emptyDoctor);
    setImageFile(null);
    setImagePreview('');
    setShowModal(true);
  };

  const openEdit = (doc) => {
    setEditDoctor(doc);
    setForm({
      ...doc,
      qualification: Array.isArray(doc.qualification) ? doc.qualification.join(', ') : doc.qualification || '',
      availableSlots: DAYS.map(day => {
        const existing = doc.availableSlots?.find(s => s.day === day);
        return existing || { day, startTime: '09:00', endTime: '17:00', isAvailable: false };
      })
    });
    setImagePreview(doc.image || '');
    setImageFile(null);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSlotChange = (day, field, value) => {
    setForm(p => ({
      ...p,
      availableSlots: p.availableSlots.map(s => s.day === day ? { ...s, [field]: value } : s)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'availableSlots') fd.append(k, JSON.stringify(v));
        else if (k !== '_id' && k !== '__v' && k !== 'createdAt' && k !== 'updatedAt' && k !== 'imagePublicId')
          fd.append(k, v);
      });
      if (imageFile) fd.append('image', imageFile);

      if (editDoctor) {
        const { data } = await API.put(`/doctors/${editDoctor._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setDoctors(prev => prev.map(d => d._id === editDoctor._id ? data.doctor : d));
        toast.success('Doctor updated');
      } else {
        const { data } = await API.post('/doctors', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setDoctors(prev => [data.doctor, ...prev]);
        toast.success('Doctor added');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this doctor?')) return;
    try {
      await API.delete(`/doctors/${id}`);
      setDoctors(prev => prev.filter(d => d._id !== id));
      toast.success('Doctor deleted');
    } catch (err) { toast.error('Failed to delete'); }
  };

  const filtered = doctors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900">Doctors</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your medical staff</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <FaPlus size={12} /> Add Doctor
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="relative">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or specialty..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <FaUserMd className="text-5xl text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No doctors found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Doctor','Specialty','Experience','Fee','Status','Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(doc => (
                  <tr key={doc._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {doc.image ? (
                          <img src={doc.image} alt={doc.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FaUserMd className="text-primary-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-800">Dr. {doc.name}</p>
                          <p className="text-xs text-gray-400">{doc.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{doc.specialty}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{doc.experience} yrs</td>
                    <td className="px-5 py-4 text-sm font-medium text-gray-800">${doc.consultationFee}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        doc.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {doc.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(doc)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                          <FaEdit size={14} />
                        </button>
                        <button onClick={() => handleDelete(doc._id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold font-display text-gray-900">
                {editDoctor ? 'Edit Doctor' : 'Add New Doctor'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Image Upload */}
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaUserMd className="text-gray-300 text-3xl" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="btn-secondary text-sm cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    Upload Photo
                  </label>
                  <p className="text-xs text-gray-400 mt-1.5">JPG, PNG up to 5MB</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'name', label: 'Full Name', type: 'text', required: true },
                  { name: 'email', label: 'Email', type: 'email', required: true },
                  { name: 'phone', label: 'Phone', type: 'tel', required: true }
                ].map(f => (
                  <div key={f.name} className={f.name === 'name' ? 'col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                    <input type={f.type} value={form[f.name]} required={f.required}
                      onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                      className="input-field text-sm" />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Specialty</label>
                  <select value={form.specialty} onChange={e => setForm(p => ({ ...p, specialty: e.target.value }))}
                    className="input-field text-sm" required>
                    <option value="">Select specialty</option>
                    {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Experience (yrs)</label>
                  <input type="number" min="0" value={form.experience} required
                    onChange={e => setForm(p => ({ ...p, experience: e.target.value }))}
                    className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Consultation Fee ($)</label>
                  <input type="number" min="0" value={form.consultationFee} required
                    onChange={e => setForm(p => ({ ...p, consultationFee: e.target.value }))}
                    className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Availability</label>
                  <select value={form.isAvailable} onChange={e => setForm(p => ({ ...p, isAvailable: e.target.value === 'true' }))}
                    className="input-field text-sm">
                    <option value="true">Available</option>
                    <option value="false">Not Available</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Qualifications (comma separated)</label>
                  <input type="text" value={form.qualification}
                    onChange={e => setForm(p => ({ ...p, qualification: e.target.value }))}
                    className="input-field text-sm" placeholder="MBBS, MD Cardiology, Fellowship..." />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">About</label>
                  <textarea rows={3} value={form.about}
                    onChange={e => setForm(p => ({ ...p, about: e.target.value }))}
                    className="input-field text-sm resize-none" />
                </div>
              </div>

              {/* Schedule */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Weekly Schedule</h3>
                <div className="space-y-2">
                  {DAYS.map(day => {
                    const slot = form.availableSlots?.find(s => s.day === day) || {};
                    return (
                      <div key={day} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <input type="checkbox" checked={slot.isAvailable || false}
                          onChange={e => handleSlotChange(day, 'isAvailable', e.target.checked)}
                          className="w-4 h-4 text-primary-600 rounded" />
                        <span className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">{day.slice(0,3)}</span>
                        <input type="time" value={slot.startTime || '09:00'} disabled={!slot.isAvailable}
                          onChange={e => handleSlotChange(day, 'startTime', e.target.value)}
                          className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-primary-400 disabled:bg-gray-100 disabled:text-gray-400" />
                        <span className="text-gray-400 text-sm">–</span>
                        <input type="time" value={slot.endTime || '17:00'} disabled={!slot.isAvailable}
                          onChange={e => handleSlotChange(day, 'endTime', e.target.value)}
                          className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-primary-400 disabled:bg-gray-100 disabled:text-gray-400" />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
                  <FaSave size={13} />
                  {submitting ? 'Saving...' : editDoctor ? 'Update Doctor' : 'Add Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDoctors;
