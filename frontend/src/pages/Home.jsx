import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FaSearch, FaHeartbeat, FaBrain, FaBone, FaBaby,
  FaEye, FaTooth, FaAllergies, FaShieldAlt, FaStar,
  FaQuoteLeft, FaArrowRight, FaCheckCircle, FaUserMd,
  FaCalendarCheck, FaAmbulance, FaPlay, FaTimes,
  FaPhone, FaAward, FaHeart
} from 'react-icons/fa'
import { MdLocalHospital, MdHealthAndSafety } from 'react-icons/md'
import DoctorCard from '../components/doctor/DoctorCard'
import API from '../utils/api'

const specialties = [
  { icon: <FaHeartbeat />, name: 'Cardiology', color: 'from-red-400 to-pink-500', bg: 'bg-red-50', text: 'text-red-500', desc: 'Heart & Vascular' },
  { icon: <FaBrain />, name: 'Neurology', color: 'from-purple-400 to-indigo-500', bg: 'bg-purple-50', text: 'text-purple-500', desc: 'Brain & Nerves' },
  { icon: <FaBone />, name: 'Orthopedics', color: 'from-blue-400 to-cyan-500', bg: 'bg-blue-50', text: 'text-blue-500', desc: 'Bones & Joints' },
  { icon: <FaBaby />, name: 'Pediatrics', color: 'from-yellow-400 to-orange-500', bg: 'bg-yellow-50', text: 'text-yellow-500', desc: 'Child Healthcare' },
  { icon: <FaEye />, name: 'Ophthalmology', color: 'from-teal-400 to-green-500', bg: 'bg-teal-50', text: 'text-teal-500', desc: 'Eyes & Vision' },
  { icon: <FaTooth />, name: 'Dentistry', color: 'from-cyan-400 to-blue-500', bg: 'bg-cyan-50', text: 'text-cyan-500', desc: 'Oral Healthcare' },
  { icon: <FaAllergies />, name: 'Dermatology', color: 'from-pink-400 to-rose-500', bg: 'bg-pink-50', text: 'text-pink-500', desc: 'Skin & Hair' },
  { icon: <FaShieldAlt />, name: 'Immunology', color: 'from-green-400 to-emerald-500', bg: 'bg-green-50', text: 'text-green-500', desc: 'Immune System' },
]

const testimonials = [
  { name: 'Sarah Johnson', role: 'Patient since 2022', text: 'The booking process was incredibly smooth. Dr. Smith was professional, caring, and took time to explain everything. Best medical experience I have had!', rating: 5, avatar: 'SJ' },
  { name: 'Michael Chen', role: 'Regular Patient', text: 'MediCare has completely transformed how I manage my healthcare. The online booking saves so much time and the doctors are absolutely world-class.', rating: 5, avatar: 'MC' },
  { name: 'Emma Williams', role: 'Patient since 2021', text: 'I was nervous about my first visit but the entire team made me feel so comfortable. The platform is intuitive and the quality of care is outstanding!', rating: 5, avatar: 'EW' },
]

const Counter = ({ end, label, suffix = '' }) => {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true) },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    let current = 0
    const step = end / 60
    const timer = setInterval(() => {
      current += step
      if (current >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(current))
    }, 30)
    return () => clearInterval(timer)
  }, [started, end])

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl lg:text-5xl font-bold font-display text-white mb-2">
        {count}{suffix}
      </div>
      <div className="text-blue-200 text-sm font-medium">{label}</div>
    </div>
  )
}

const Home = () => {
  const [search, setSearch] = useState('')
  const [featuredDoctors, setFeaturedDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    API.get('/doctors/featured')
      .then(({ data }) => setFeaturedDoctors(data.doctors || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial(p => (p + 1) % testimonials.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) navigate(`/doctors?search=${encodeURIComponent(search)}`)
  }

  return (
    <div className="overflow-x-hidden">

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen animated-gradient flex items-center overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />

        {/* Floating shapes */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-400/10 rounded-full blur-2xl" />

        {/* Spinning ring decoration */}
        <div className="absolute top-32 right-32 w-32 h-32 border-2 border-white/10 rounded-full animate-spin-slow hidden lg:block" />
        <div className="absolute bottom-32 left-32 w-20 h-20 border-2 border-white/10 rounded-full animate-spin-slow hidden lg:block" style={{ animationDirection: 'reverse' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left Content */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-white text-sm mb-8 animate-slideInDown">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Trusted by 50,000+ patients worldwide
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display text-white leading-tight mb-6 animate-fadeInLeft">
                Your Health
                <br />
                <span className="relative inline-block">
                  <span className="text-yellow-300">Matters</span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                    <path d="M2 9C50 3 150 1 298 9" stroke="#fde047" strokeWidth="3" strokeLinecap="round" strokeDasharray="300" strokeDashoffset="300" style={{ animation: 'draw 1s ease forwards 0.8s' }} />
                  </svg>
                </span>
                <br />
                <span className="text-blue-200">Most</span>
              </h1>

              <p className="text-lg text-blue-100 mb-10 leading-relaxed max-w-xl animate-fadeInLeft delay-200">
                Connect with world-class doctors instantly. Book appointments across 15+ specialties with real-time availability and expert care.
              </p>

              {/* Search Box */}
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-10 animate-fadeInLeft delay-300">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search doctors, specialties..."
                    className="w-full pl-12 pr-4 py-4 rounded-2xl text-gray-800 outline-none text-sm font-medium shadow-lg focus:ring-4 focus:ring-white/30 border-0"
                  />
                </div>
                <button type="submit"
                  className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-8 py-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-105 text-sm whitespace-nowrap">
                  Find Doctor
                </button>
              </form>

              {/* Quick specialty links */}
              <div className="flex flex-wrap gap-2 animate-fadeInLeft delay-400">
                <span className="text-blue-200 text-sm">Popular:</span>
                {['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics'].map(s => (
                  <Link key={s} to={`/doctors?specialty=${s}`}
                    className="px-3 py-1.5 glass hover:bg-white/20 rounded-full text-white text-xs font-medium transition-all duration-200 hover:scale-105">
                    {s}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Content — Visual Cards */}
            <div className="hidden lg:block relative animate-fadeInRight">
              {/* Main card */}
              <div className="relative">
                {/* Big hospital illustration card */}
                <div className="glass rounded-3xl p-8 text-white text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />

                  {/* Big medical cross icon */}
                  <div className="relative z-10 mb-6">
                    <div className="w-32 h-32 mx-auto bg-white/20 rounded-3xl flex items-center justify-center animate-float">
                      <MdLocalHospital className="text-7xl text-white" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold font-display mb-2">MediCare Hospital</h3>
                  <p className="text-blue-200 text-sm mb-6">Excellence in Healthcare</p>

                  {/* Mini stats inside card */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { val: '200+', label: 'Doctors' },
                      { val: '15+', label: 'Specialties' },
                      { val: '50K+', label: 'Patients' }
                    ].map((s, i) => (
                      <div key={i} className="bg-white/10 rounded-2xl p-3">
                        <div className="text-xl font-bold">{s.val}</div>
                        <div className="text-xs text-blue-200">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 glass rounded-2xl px-4 py-3 text-white animate-bounce-slow">
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-green-400" />
                    <span className="text-sm font-semibold">Verified Doctors</span>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 glass rounded-2xl px-4 py-3 text-white animate-bounce-slow delay-300">
                  <div className="flex items-center gap-2">
                    <FaCalendarCheck className="text-yellow-400" />
                    <span className="text-sm font-semibold">Instant Booking</span>
                  </div>
                </div>

                <div className="absolute top-1/2 -right-8 glass rounded-2xl px-3 py-2 text-white animate-float">
                  <div className="flex items-center gap-1.5">
                    <FaStar className="text-yellow-400 text-sm" />
                    <span className="text-sm font-bold">4.9 Rating</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 100H1440V40C1200 80 960 20 720 40C480 60 240 10 0 40V100Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section className="py-20 animated-gradient relative overflow-hidden -mt-1">
        <div className="absolute inset-0 bg-hero-pattern opacity-10" />
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
            <Counter end={200} suffix="+" label="Expert Doctors" />
            <Counter end={50000} suffix="+" label="Happy Patients" />
            <Counter end={15} suffix="+" label="Specialties" />
            <Counter end={98} suffix="%" label="Satisfaction Rate" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none">
            <path d="M0 60H1440V20C1100 50 800 5 500 20C300 30 150 10 0 20V60Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-widest bg-primary-50 px-4 py-2 rounded-full">How It Works</span>
            <h2 className="section-title mt-4">Book in 3 Simple Steps</h2>
            <p className="section-subtitle max-w-2xl mx-auto">Getting the care you need has never been easier</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200" />

            {[
              { step: '01', icon: <FaSearch className="text-3xl" />, title: 'Find Your Doctor', desc: 'Search by specialty, name, or availability. Browse verified doctor profiles with ratings and reviews.', color: 'from-blue-500 to-primary-600' },
              { step: '02', icon: <FaCalendarCheck className="text-3xl" />, title: 'Book Appointment', desc: 'Choose your preferred date and time slot. Get instant confirmation via our smart booking system.', color: 'from-primary-600 to-indigo-600' },
              { step: '03', icon: <FaHeart className="text-3xl" />, title: 'Get Expert Care', desc: 'Visit your doctor and receive personalized, world-class medical care tailored to your needs.', color: 'from-indigo-600 to-purple-600' },
            ].map((item, i) => (
              <div key={i} className={`text-center group animate-fadeInUp delay-${(i + 1) * 200}`}>
                <div className="relative inline-block mb-6">
                  <div className={`w-24 h-24 bg-gradient-to-br ${item.color} rounded-3xl flex items-center justify-center text-white mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300 group-hover:shadow-xl group-hover:shadow-primary-200`}>
                    {item.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-gray-900 shadow-md">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold font-display text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SPECIALTIES SECTION ===== */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-widest bg-primary-50 px-4 py-2 rounded-full">Our Services</span>
            <h2 className="section-title mt-4">Medical Specialties</h2>
            <p className="section-subtitle max-w-2xl mx-auto">Expert care across a comprehensive range of medical specialties</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {specialties.map((s, i) => (
              <Link key={i} to={`/doctors?specialty=${s.name}`}
                className={`group card p-6 text-center hover-lift cursor-pointer animate-fadeInUp delay-${(i % 4 + 1) * 100}`}>
                <div className={`w-16 h-16 ${s.bg} rounded-2xl flex items-center justify-center mx-auto mb-4 ${s.text} text-2xl group-hover:scale-110 transition-all duration-300 group-hover:shadow-lg`}>
                  {s.icon}
                </div>
                <h3 className="font-bold text-gray-800 text-sm mb-1 group-hover:text-primary-600 transition-colors">{s.name}</h3>
                <p className="text-xs text-gray-500">{s.desc}</p>
                <div className="mt-3 flex items-center justify-center gap-1 text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-xs font-medium">Explore</span>
                  <FaArrowRight size={10} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED DOCTORS ===== */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-14">
            <div>
              <span className="text-primary-600 font-semibold text-sm uppercase tracking-widest bg-primary-50 px-4 py-2 rounded-full">Our Team</span>
              <h2 className="section-title mt-4">Meet Our Specialists</h2>
              <p className="section-subtitle">Highly qualified doctors ready to serve you</p>
            </div>
            <Link to="/doctors" className="btn-outline mt-6 sm:mt-0 flex items-center gap-2 group">
              View All
              <FaArrowRight className="text-xs group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="card overflow-hidden">
                  <div className="h-56 shimmer" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 shimmer rounded w-3/4" />
                    <div className="h-3 shimmer rounded w-1/2" />
                    <div className="h-10 shimmer rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredDoctors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredDoctors.map((doctor, i) => (
                <div key={doctor._id} className={`animate-fadeInUp delay-${(i + 1) * 100}`}>
                  <DoctorCard doctor={doctor} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <FaUserMd className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No doctors added yet</p>
              <p className="text-gray-400 text-sm mt-1">Add doctors from the admin panel</p>
            </div>
          )}
        </div>
      </section>

      {/* ===== WHY CHOOSE US ===== */}
      <section className="py-24 animated-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-display text-white mb-4">Why Choose MediCare?</h2>
            <p className="text-blue-200 text-lg">We deliver healthcare excellence with every interaction</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <FaUserMd className="text-3xl" />, title: 'Expert Doctors', desc: 'Board-certified specialists with decades of combined experience', color: 'from-blue-400 to-blue-600' },
              { icon: <FaCalendarCheck className="text-3xl" />, title: 'Easy Booking', desc: 'Book appointments in under 2 minutes, anytime anywhere', color: 'from-green-400 to-emerald-600' },
              { icon: <FaShieldAlt className="text-3xl" />, title: 'Secure & Private', desc: 'Your health data is protected with enterprise-grade security', color: 'from-purple-400 to-purple-600' },
              { icon: <FaAward className="text-3xl" />, title: 'Award Winning', desc: 'Recognized for excellence in patient care and satisfaction', color: 'from-yellow-400 to-orange-500' },
            ].map((item, i) => (
              <div key={i} className="glass rounded-3xl p-7 text-white text-center group hover:bg-white/20 transition-all duration-300 hover-lift">
                <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold font-display mb-3">{item.title}</h3>
                <p className="text-blue-100 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-widest bg-primary-50 px-4 py-2 rounded-full">Testimonials</span>
            <h2 className="section-title mt-4">What Patients Say</h2>
          </div>

          {/* Active testimonial */}
          <div className="relative">
            <div className="card p-10 text-center max-w-2xl mx-auto animate-scaleIn">
              <FaQuoteLeft className="text-primary-200 text-5xl mx-auto mb-6" />
              <p className="text-gray-600 leading-relaxed text-lg mb-8 italic">
                "{testimonials[activeTestimonial].text}"
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {testimonials[activeTestimonial].avatar}
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">{testimonials[activeTestimonial].name}</p>
                  <p className="text-sm text-gray-500">{testimonials[activeTestimonial].role}</p>
                  <div className="flex gap-0.5 mt-1">
                    {[...Array(5)].map((_, j) => <FaStar key={j} className="text-yellow-400 text-sm" />)}
                  </div>
                </div>
              </div>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setActiveTestimonial(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === activeTestimonial
                      ? 'w-8 h-3 bg-primary-600'
                      : 'w-3 h-3 bg-gray-300 hover:bg-primary-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== EMERGENCY BANNER ===== */}
      <section className="py-12 bg-red-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-10" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-white">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse">
                <FaAmbulance className="text-2xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display">24/7 Emergency Services</h3>
                <p className="text-red-200 text-sm">Immediate medical attention available round the clock</p>
              </div>
            </div>
            <a href="tel:+11234567890"
              className="flex items-center gap-3 bg-white text-red-600 font-bold px-8 py-4 rounded-2xl hover:bg-red-50 transition-all duration-300 hover:scale-105 shadow-lg">
              <FaPhone className="animate-bounce-slow" />
              Call Emergency: +1 (123) 456-7890
            </a>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-primary-50 via-blue-50 to-indigo-50 rounded-4xl p-14 border border-primary-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100/50 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl animate-float">
                <MdHealthAndSafety className="text-4xl text-white" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold font-display text-gray-900 mb-4">
                Start Your Health Journey Today
              </h2>
              <p className="text-gray-500 mb-10 text-lg max-w-2xl mx-auto">
                Join over 50,000 patients who trust MediCare for exceptional healthcare. Book your first appointment in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/doctors" className="btn-primary text-base py-4 px-8 hover:scale-105">
                  Browse All Doctors
                </Link>
                <Link to="/register" className="btn-outline text-base py-4 px-8 hover:scale-105">
                  Create Free Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

export default Home