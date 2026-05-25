import { Link } from 'react-router-dom';
import { FaStethoscope, FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
                <FaStethoscope className="text-white" />
              </div>
              <span className="text-xl font-bold font-display text-white">Medi<span className="text-primary-400">Care</span></span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400 mb-5">
              Providing world-class healthcare with compassion and innovation. Your health is our priority.
            </p>
            <div className="flex gap-3">
              {[FaFacebook, FaTwitter, FaInstagram, FaLinkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 bg-gray-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors duration-200">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-5 font-display">Quick Links</h4>
            <ul className="space-y-3">
              {[['/', 'Home'], ['/doctors', 'Find Doctors'], ['/about', 'About Us'], ['/contact', 'Contact']].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-gray-400 hover:text-primary-400 transition-colors flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />{label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Specialties */}
          <div>
            <h4 className="text-white font-semibold mb-5 font-display">Specialties</h4>
            <ul className="space-y-3">
              {['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology'].map(s => (
                <li key={s}>
                  <Link to={`/doctors?specialty=${s}`} className="text-sm text-gray-400 hover:text-primary-400 transition-colors flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />{s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-5 font-display">Contact Info</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-gray-400">
                <FaMapMarkerAlt className="text-primary-400 mt-0.5 flex-shrink-0" />
                123 Medical Center Drive, Health City, HC 45678
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <FaPhone className="text-primary-400 flex-shrink-0" />
                <a href="tel:+11234567890" className="hover:text-primary-400 transition-colors">+1 (123) 456-7890</a>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <FaEnvelope className="text-primary-400 flex-shrink-0" />
                <a href="mailto:info@medicare.com" className="hover:text-primary-400 transition-colors">info@medicare.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} MediCare. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-gray-500 hover:text-primary-400 transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-gray-500 hover:text-primary-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
