import { Link } from 'react-router-dom'
import { FaStar, FaUserMd, FaClock, FaMoneyBillWave, FaCalendarCheck } from 'react-icons/fa'

const getImageUrl = (image) => {
  if (!image) return null
  if (image.startsWith('http')) return image
  return `http://localhost:5000${image}`
}

const DoctorCard = ({ doctor }) => {
  const { _id, name, specialty, experience, consultationFee, image, rating, isAvailable, department } = doctor

  return (
    <div className="group bg-white rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-500 hover:-translate-y-2 border border-gray-100">

      {/* Image Section */}
      <div className="relative h-60 bg-gradient-to-br from-primary-100 via-blue-50 to-indigo-100 overflow-hidden">
        {getImageUrl(image) ? (
          <img src={getImageUrl(image)} alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-24 h-24 bg-white/50 rounded-full flex items-center justify-center">
              <FaUserMd className="text-5xl text-primary-300" />
            </div>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Available badge */}
        <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm ${
          isAvailable ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
        }`}>
          {isAvailable ? '● Available' : '● Busy'}
        </div>

        {/* Rating badge */}
        <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5">
          <FaStar className="text-yellow-400 text-xs" />
          <span className="text-xs font-bold text-gray-800">{rating?.toFixed(1) || '4.9'}</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Department tag */}
        <span className="inline-block text-xs font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full mb-3">
          {department?.name || specialty}
        </span>

        <h3 className="text-lg font-bold font-display text-gray-900 mb-1 group-hover:text-primary-600 transition-colors duration-300">
          Dr. {name}
        </h3>
        <p className="text-sm text-gray-500 mb-4">{specialty}</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-gray-50 rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-primary-500 mb-1">
              <FaClock size={12} />
              <span className="text-xs text-gray-500">Experience</span>
            </div>
            <p className="text-sm font-bold text-gray-800">{experience} Years</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-green-500 mb-1">
              <FaMoneyBillWave size={12} />
              <span className="text-xs text-gray-500">Consult Fee</span>
            </div>
            <p className="text-sm font-bold text-gray-800">${consultationFee}</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <Link to={`/doctors/${_id}`}
            className="flex-1 text-center py-2.5 text-sm font-semibold text-primary-600 border-2 border-primary-100 rounded-xl hover:bg-primary-50 hover:border-primary-300 transition-all duration-200">
            Profile
          </Link>
          <Link to={`/book/${_id}`}
            className="flex-1 text-center py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-blue-600 rounded-xl hover:from-primary-700 hover:to-blue-700 transition-all duration-200 hover:shadow-lg hover:shadow-primary-200 flex items-center justify-center gap-1.5">
            <FaCalendarCheck size={12} />
            Book Now
          </Link>
        </div>
      </div>
    </div>
  )
}

export default DoctorCard