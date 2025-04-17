import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminLogin from './pages/AdminLogin'
import AdminRegister from './pages/AdminRegister'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import AssessmentForm from './pages/AssessmentForm'
import TakeAssessment from './pages/TakeAssessment'
import ViewSubmission from './pages/ViewSubmission'
import EvaluateSubmission from './pages/EvaluateSubmission'
import './App.css'

// Protected route component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const userData = localStorage.getItem('user');
  
  if (!userData) {
    return <Navigate to="/login" />;
  }
  
  try {
    const user = JSON.parse(userData);
    
    // If admin role is required but user is not admin
    if (requireAdmin && user.role !== 'admin') {
      return <Navigate to="/dashboard" />;
    }
    
    return children;
  } catch (error) {
    localStorage.removeItem('user');
    return <Navigate to="/login" />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-register" element={<AdminRegister />} />
          
          {/* Protected User Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/take-assessment/:id" 
            element={
              <ProtectedRoute>
                <TakeAssessment />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/submission/:id" 
            element={
              <ProtectedRoute>
                <ViewSubmission />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected Admin Routes */}
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/create-assessment" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AssessmentForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/edit-assessment/:id" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AssessmentForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/evaluate-submission/:id" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <EvaluateSubmission />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
