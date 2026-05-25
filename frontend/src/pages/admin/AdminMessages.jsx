import { useState, useEffect } from 'react';
import { FaEnvelope, FaEnvelopeOpen, FaTrash, FaTimes } from 'react-icons/fa';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import API from '../../utils/api';

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    API.get('/contact')
      .then(({ data }) => setMessages(data.messages))
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    try {
      await API.put(`/contact/${id}/read`);
      setMessages(prev => prev.map(m => m._id === id ? { ...m, isRead: true } : m));
    } catch {}
  };

  const handleOpen = (msg) => {
    setSelected(msg);
    if (!msg.isRead) markRead(msg._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await API.delete(`/contact/${id}`);
      setMessages(prev => prev.filter(m => m._id !== id));
      if (selected?._id === id) setSelected(null);
      toast.success('Message deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const unread = messages.filter(m => !m.isRead).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900">Messages</h1>
        <p className="text-sm text-gray-500 mt-1">
          {messages.length} messages · <span className="text-primary-600 font-medium">{unread} unread</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-220px)]">
        {/* Messages List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm">Inbox</h2>
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center">
                <FaEnvelope className="text-4xl text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No messages yet</p>
              </div>
            ) : messages.map(msg => (
              <div key={msg._id}
                onClick={() => handleOpen(msg)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selected?._id === msg._id ? 'bg-primary-50 border-l-2 border-primary-600' : ''
                } ${!msg.isRead ? 'bg-blue-50/50' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${msg.isRead ? 'bg-gray-200' : 'bg-primary-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`text-sm truncate ${!msg.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {msg.name}
                      </p>
                      <p className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {format(new Date(msg.createdAt), 'MMM d')}
                      </p>
                    </div>
                    <p className="text-xs text-primary-600 truncate mb-1">{msg.subject}</p>
                    <p className="text-xs text-gray-400 truncate">{msg.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          {selected ? (
            <>
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900 truncate">{selected.subject}</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDelete(selected._id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <FaTrash size={13} />
                  </button>
                  <button onClick={() => setSelected(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <FaTimes size={15} />
                  </button>
                </div>
              </div>
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {selected.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{selected.name}</p>
                    <p className="text-sm text-gray-400">{selected.email}</p>
                    {selected.phone && <p className="text-sm text-gray-400">{selected.phone}</p>}
                  </div>
                  <p className="ml-auto text-xs text-gray-400">{format(new Date(selected.createdAt), 'MMMM d, yyyy · h:mm a')}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-5">
                  <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">{selected.message}</p>
                </div>
                <div className="mt-5">
                  <a href={`mailto:${selected.email}?subject=Re: ${selected.subject}`}
                    className="btn-primary text-sm inline-flex items-center gap-2">
                    <FaEnvelope size={12} /> Reply via Email
                  </a>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <FaEnvelopeOpen className="text-5xl text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">Select a message to read</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;
