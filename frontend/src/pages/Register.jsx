import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaStethoscope, FaEye, FaEyeSlash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error('Please fill in all required fields'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const user = await register(form);
      toast.success(`Welcome, ${user.name.split(' ')[0]}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <FaStethoscope className="text-white text-lg" />
            </div>
            <span className="text-2xl font-bold font-display">Medi<span className="text-primary-600">Care</span></span>
          </Link>
          <h1 className="text-2xl font-bold font-display text-gray-900">Create account</h1>
          <p className="text-gray-500 mt-1">Join thousands of patients</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-400">*</span></label>
              <input type="text" name="name" value={form.name} onChange={handleChange}
                className="input-field" placeholder="John Doe" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address <span className="text-red-400">*</span></label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                className="input-field" placeholder="you@example.com" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                className="input-field" placeholder="+1 (555) 000-0000" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password <span className="text-red-400">*</span></label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} name="password" value={form.password}
                  onChange={handleChange} className="input-field pr-12" placeholder="Min. 6 characters" required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3.5 text-base disabled:opacity-60">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
