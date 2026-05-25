import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaSearch, FaFilter, FaTimes } from 'react-icons/fa';
import DoctorCard from '../components/doctor/DoctorCard';
import API from '../utils/api';

const SPECIALTIES = ['All', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics',
  'Dermatology', 'Ophthalmology', 'Dentistry', 'Immunology', 'Psychiatry', 'General Medicine'];

const Doctors = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [specialty, setSpecialty] = useState(searchParams.get('specialty') || 'All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchDoctors();
  }, [specialty, page]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 9 });
      if (search) params.append('search', search);
      if (specialty !== 'All') params.append('specialty', specialty);
      const { data } = await API.get(`/doctors?${params}`);
      setDoctors(data.doctors);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDoctors();
  };

  const handleSpecialtyFilter = (s) => {
    setSpecialty(s);
    setPage(1);
    setSearchParams(s !== 'All' ? { specialty: s } : {});
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-700 to-blue-700 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold font-display mb-3">Find a Doctor</h1>
          <p className="text-blue-100 text-lg mb-8">Book appointments with our expert medical professionals</p>
          <form onSubmit={handleSearch} className="flex max-w-xl mx-auto gap-3">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or specialty..."
                className="w-full pl-11 pr-4 py-3.5 rounded-xl text-gray-800 outline-none text-sm" />
            </div>
            <button type="submit" className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-6 py-3.5 rounded-xl transition-all text-sm">
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Specialty Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {SPECIALTIES.map(s => (
            <button key={s} onClick={() => handleSpecialtyFilter(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                specialty === s
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                  : 'bg-white text-gray-600 hover:bg-primary-50 hover:text-primary-600 border border-gray-200'
              }`}>
              {s}
            </button>
          ))}
        </div>

        {/* Results info */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            {loading ? 'Loading...' : `Showing ${doctors.length} of ${total} doctors`}
          </p>
          {specialty !== 'All' && (
            <button onClick={() => handleSpecialtyFilter('All')}
              className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700">
              <FaTimes size={12} /> Clear filter
            </button>
          )}
        </div>

        {/* Doctors Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="h-56 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-10 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : doctors.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map(doctor => <DoctorCard key={doctor._id} doctor={doctor} />)}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-50 hover:bg-gray-50 transition-colors">
                  Previous
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setPage(i+1)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      page === i+1 ? 'bg-primary-600 text-white' : 'border border-gray-200 hover:bg-gray-50'
                    }`}>
                    {i+1}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-50 hover:bg-gray-50 transition-colors">
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <FaFilter className="text-5xl text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No doctors found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Doctors;
