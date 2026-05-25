import { FaHeart, FaUserMd, FaAward, FaGlobe, FaCheckCircle } from 'react-icons/fa';

const About = () => (
  <div className="bg-white">
    {/* Hero */}
    <div className="bg-gradient-to-r from-primary-700 to-blue-700 text-white py-20">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold font-display mb-4">About MediCare</h1>
        <p className="text-blue-100 text-xl">Dedicated to your health and well-being since 2008</p>
      </div>
    </div>

    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-16">
        <div>
          <h2 className="text-3xl font-bold font-display text-gray-900 mb-5">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            MediCare was founded with a simple but powerful mission: to make quality healthcare accessible to everyone. We believe that excellent medical care should not be a privilege but a right.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Through technology and compassion, we connect patients with the best doctors, making the journey to better health seamless and stress-free.
          </p>
          <div className="space-y-3">
            {['Patient-centered care', 'Evidence-based medicine', 'Continuous innovation', 'Compassionate service'].map(item => (
              <div key={item} className="flex items-center gap-3">
                <FaCheckCircle className="text-primary-500 flex-shrink-0" />
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: <FaUserMd className="text-2xl text-primary-500" />, value: '200+', label: 'Expert Doctors', color: 'bg-primary-50' },
            { icon: <FaHeart className="text-2xl text-red-400" />, value: '50K+', label: 'Happy Patients', color: 'bg-red-50' },
            { icon: <FaAward className="text-2xl text-amber-500" />, value: '15+', label: 'Years of Excellence', color: 'bg-amber-50' },
            { icon: <FaGlobe className="text-2xl text-green-500" />, value: '24/7', label: 'Support Available', color: 'bg-green-50' }
          ].map((item, i) => (
            <div key={i} className={`${item.color} p-6 rounded-2xl text-center`}>
              <div className="flex justify-center mb-3">{item.icon}</div>
              <p className="text-2xl font-bold font-display text-gray-900">{item.value}</p>
              <p className="text-sm text-gray-600 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-3xl p-10 text-center">
        <h2 className="text-2xl font-bold font-display text-gray-900 mb-3">Our Values</h2>
        <p className="text-gray-500 mb-8">The principles that guide everything we do</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { title: 'Integrity', desc: 'We uphold the highest ethical standards in every interaction.' },
            { title: 'Excellence', desc: 'We constantly strive to exceed expectations in healthcare delivery.' },
            { title: 'Empathy', desc: 'We treat every patient with dignity, respect, and compassion.' }
          ].map((v, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-primary-600 font-bold">{i+1}</div>
              <h3 className="font-bold text-gray-900 mb-2">{v.title}</h3>
              <p className="text-gray-500 text-sm">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default About;
