import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  FaBars, FaTimes, FaUserCircle, FaStethoscope,
  FaChevronDown, FaCalendarCheck, FaUser,
  FaSignOutAlt, FaTachometerAlt
} from 'react-icons/fa'
import { MdLocalHospital } from 'react-icons/md'

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const close = (e) => { if (!e.target.closest('.user-menu')) setDropdownOpen(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
    setDropdownOpen(false)
  }

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/doctors', label: 'Doctors' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' }
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled
        ? 'bg-white shadow-lg shadow-gray-100/80 py-3'
        : 'bg-white/95 backdrop-blur-sm py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-primary-200 group-hover:scale-110 transition-all duration-300">
              <FaStethoscope className="text-white text-lg" />
            </div>
            <div>
              <span className="text-xl font-bold font-display text-gray-900">
                Medi<span className="gradient-text">Care</span>
              </span>
              <div className="text-xs text-gray-400 font-medium -mt-0.5">Healthcare Platform</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <NavLink key={link.to} to={link.to} end={link.to === '/'}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                    isActive
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                  }`
                }>
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative user-menu">
                <button onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-50 to-blue-50 hover:from-primary-100 hover:to-blue-100 transition-all duration-200 border border-primary-100">
                  <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user.name.split(' ')[0]}</span>
                  <FaChevronDown className={`text-xs text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-slideInDown">
                    <div className="px-4 py-3 border-b border-gray-50">
                      <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                    {isAdmin ? (
                      <Link to="/admin" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                        <FaTachometerAlt className="text-primary-400" /> Admin Panel
                      </Link>
                    ) : (
                      <>
                        <Link to="/dashboard" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                          <FaTachometerAlt className="text-primary-400" /> Dashboard
                        </Link>
                        <Link to="/my-appointments" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                          <FaCalendarCheck className="text-primary-400" /> My Appointments
                        </Link>
                        <Link to="/profile" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                          <FaUser className="text-primary-400" /> Profile
                        </Link>
                      </>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      <FaSignOutAlt /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-primary-600 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-all duration-200">
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2.5">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2.5 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors">
            {menuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-100 animate-slideInDown">
            <div className="pt-4 space-y-1">
              {navLinks.map(link => (
                <NavLink key={link.to} to={link.to} end={link.to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }>
                  {link.label}
                </NavLink>
              ))}
              <div className="pt-3 flex flex-col gap-2">
                {user ? (
                  <>
                    <Link to={isAdmin ? '/admin' : '/dashboard'}
                      onClick={() => setMenuOpen(false)} className="btn-secondary text-center text-sm">
                      {isAdmin ? 'Admin Panel' : 'Dashboard'}
                    </Link>
                    <button onClick={handleLogout} className="btn-primary text-center text-sm">Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary text-center text-sm">Login</Link>
                    <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary text-center text-sm">Get Started</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar