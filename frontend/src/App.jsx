import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/common/Layout';
import Home from './pages/Home';
import Doctors from './pages/Doctors';
import DoctorDetail from './pages/DoctorDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/patient/Dashboard';
import MyAppointments from './pages/patient/MyAppointments';
import Profile from './pages/patient/Profile';
import BookAppointment from './pages/BookAppointment';

// Admin
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDoctors from './pages/admin/AdminDoctors';
import AdminAppointments from './pages/admin/AdminAppointments';
import AdminPatients from './pages/admin/AdminPatients';
import AdminMessages from './pages/admin/AdminMessages';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;
  return user?.role === 'admin' ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="doctors" element={<Doctors />} />
        <Route path="doctors/:id" element={<DoctorDetail />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="book/:doctorId" element={<ProtectedRoute><BookAppointment /></ProtectedRoute>} />
        {/* Patient Dashboard */}
        <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="my-appointments" element={<ProtectedRoute><MyAppointments /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Route>
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="doctors" element={<AdminDoctors />} />
        <Route path="appointments" element={<AdminAppointments />} />
        <Route path="patients" element={<AdminPatients />} />
        <Route path="messages" element={<AdminMessages />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
