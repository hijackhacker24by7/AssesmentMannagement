import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  
  return (
    <nav className="bg-blue-600 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link to={isAdmin ? '/admin-dashboard' : '/dashboard'} className="text-white font-bold text-xl">
                Secure Notepad
              </Link>
            </div>
            <div className="ml-10 flex items-center space-x-4">
              {isAdmin ? (
                <>
                  <Link 
                    to="/admin-dashboard" 
                    className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/create-assessment" 
                    className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Create Assessment
                  </Link>
                  <Link 
                    to="/admin-results" 
                    className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Results
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/dashboard" 
                    className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/results" 
                    className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Results
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex items-center ml-4 md:ml-6">
              <Link to="/profile" className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="ml-4 text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
              <div className="ml-3 relative">
                <div className="bg-blue-800 text-white p-2 rounded-full">
                  {user.userId?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;