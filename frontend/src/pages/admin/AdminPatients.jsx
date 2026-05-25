import { useState, useEffect } from 'react';
import { FaSearch, FaTrash, FaUsers, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import API from '../../utils/api';

const AdminPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => { fetchPatients(); }, [page]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.append('search', search);
      const { data } = await API.get(`/users?${params}`);
      setPatients(data.users);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch { toast.error('Failed to load patients'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this patient?')) return;
    try {
      await API.delete(`/users/${id}`);
      setPatients(prev => prev.filter(p => p._id !== id));
      toast.success('Patient deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleToggleStatus = async (id) => {
    try {
      const { data } = await API.put(`/users/${id}/toggle-status`);
      setPatients(prev => prev.map(p => p._id === id ? data.user : p));
      toast.success('Status updated');
    } catch { toast.error('Failed to update status'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900">Patients</h1>
        <p className="text-sm text-gray-500 mt-1">{total} registered patients</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex gap-4">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchPatients()}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400" />
        </div>
        <button onClick={fetchPatients} className="btn-primary text-sm px-5">Search</button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : patients.length === 0 ? (
          <div className="p-16 text-center">
            <FaUsers className="text-5xl text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No patients found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Patient','Phone','Joined','Status','Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {patients.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {p.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{p.phone || '—'}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{format(new Date(p.createdAt), 'MMM d, yyyy')}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleToggleStatus(p._id)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                          {p.isActive ? <FaToggleOn size={16} className="text-green-500" /> : <FaToggleOff size={16} />}
                        </button>
                        <button onClick={() => handleDelete(p._id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <FaTrash size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50">Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPatients;
