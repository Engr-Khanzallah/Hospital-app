import { useState, useEffect } from 'react';
import { FaUser, FaLock, FaSave, FaCheckCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: '', email: '', phone: '', gender: '', dateOfBirth: '', bloodGroup: '',
    address: { street: '', city: '', state: '', zipCode: '' }
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        gender: user.gender || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        bloodGroup: user.bloodGroup || '',
        address: user.address || { street: '', city: '', state: '', zipCode: '' }
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const key = name.split('.')[1];
      setProfile(p => ({ ...p, address: { ...p.address, [key]: value } }));
    } else {
      setProfile(p => ({ ...p, [name]: value }));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.put('/users/profile', profile);
      updateUser(data.user);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match'); return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    setLoading(true);
    try {
      await API.put('/users/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      toast.success('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "input-field";

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-gray-900">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your personal information</p>
        </div>

        {/* Profile Header Card */}
        <div className="card p-6 mb-6 flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-blue-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full">
              <FaCheckCircle size={10} /> Verified Patient
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white p-1.5 rounded-xl border border-gray-200 mb-6 w-fit">
          {[
            { id: 'profile', icon: <FaUser size={13}/>, label: 'Profile Info' },
            { id: 'password', icon: <FaLock size={13}/>, label: 'Change Password' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
          <div className="card p-8">
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input type="text" name="name" value={profile.name} onChange={handleProfileChange} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input type="email" value={profile.email} className={inputClass} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <input type="tel" name="phone" value={profile.phone} onChange={handleProfileChange} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
                  <select name="gender" value={profile.gender} onChange={handleProfileChange} className={inputClass}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth</label>
                  <input type="date" name="dateOfBirth" value={profile.dateOfBirth} onChange={handleProfileChange} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Blood Group</label>
                  <select name="bloodGroup" value={profile.bloodGroup} onChange={handleProfileChange} className={inputClass}>
                    <option value="">Select blood group</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <input type="text" name="address.street" value={profile.address?.street} onChange={handleProfileChange}
                      className={inputClass} placeholder="Street address" />
                  </div>
                  <input type="text" name="address.city" value={profile.address?.city} onChange={handleProfileChange}
                    className={inputClass} placeholder="City" />
                  <input type="text" name="address.state" value={profile.address?.state} onChange={handleProfileChange}
                    className={inputClass} placeholder="State" />
                  <input type="text" name="address.zipCode" value={profile.address?.zipCode} onChange={handleProfileChange}
                    className={inputClass} placeholder="Zip Code" />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary flex items-center gap-2 disabled:opacity-60">
                <FaSave size={14} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="card p-8">
            <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md">
              {[
                { name: 'currentPassword', label: 'Current Password' },
                { name: 'newPassword', label: 'New Password' },
                { name: 'confirmPassword', label: 'Confirm New Password' }
              ].map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
                  <input type="password" value={passwords[field.name]}
                    onChange={e => setPasswords(p => ({ ...p, [field.name]: e.target.value }))}
                    className={inputClass} placeholder="••••••••" required />
                </div>
              ))}
              <button type="submit" disabled={loading}
                className="btn-primary flex items-center gap-2 disabled:opacity-60">
                <FaLock size={14} />
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
