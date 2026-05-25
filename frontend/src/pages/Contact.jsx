import { useState } from 'react';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import toast from 'react-hot-toast';
import API from '../utils/api';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/contact', form);
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    { icon: <FaMapMarkerAlt className="text-primary-500 text-xl" />, title: 'Address', info: '123 Medical Center Drive, Health City, HC 45678' },
    { icon: <FaPhone className="text-primary-500 text-xl" />, title: 'Phone', info: '+1 (123) 456-7890' },
    { icon: <FaEnvelope className="text-primary-500 text-xl" />, title: 'Email', info: 'info@medicare.com' },
    { icon: <FaClock className="text-primary-500 text-xl" />, title: 'Hours', info: 'Mon–Fri: 8AM–8PM, Sat–Sun: 9AM–5PM' }
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-primary-700 to-blue-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold font-display mb-3">Contact Us</h1>
          <p className="text-blue-100 text-lg">We're here to help. Reach out anytime.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-4">
            {contactInfo.map((item, i) => (
              <div key={i} className="card p-5 flex items-start gap-4">
                <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-0.5">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.info}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="card p-8">
              <h2 className="text-xl font-bold font-display text-gray-900 mb-6">Send a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                    <input type="text" name="name" value={form.name} onChange={handleChange}
                      className="input-field" placeholder="Your name" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange}
                      className="input-field" placeholder="your@email.com" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                    <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                      className="input-field" placeholder="Your phone" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
                    <input type="text" name="subject" value={form.subject} onChange={handleChange}
                      className="input-field" placeholder="How can we help?" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label>
                  <textarea name="message" value={form.message} onChange={handleChange}
                    rows={5} className="input-field resize-none"
                    placeholder="Tell us more about your inquiry..." required />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base disabled:opacity-60">
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
