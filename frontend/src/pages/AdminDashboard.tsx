import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAssessments, getAllSubmissions, deleteAssessment } from '../utils/api';

interface Assessment {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
}

interface Submission {
  _id: string;
  user: {
    _id: string;
    userId: string;
    email: string;
  };
  assessment: {
    _id: string;
    title: string;
  };
  submittedAt: string;
  evaluationStatus: 'pending' | 'evaluated';
}

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'assessments' | 'submissions'>('assessments');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (!user || !user.token || user.role !== 'admin') {
          navigate('/admin-login');
          return;
        }

        // Fetch assessments
        const assessmentsData = await getAssessments(user.token);
        setAssessments(assessmentsData);

        // Fetch all submissions
        const submissionsData = await getAllSubmissions(user.token);
        setSubmissions(submissionsData);
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };
  
  const handleDeleteAssessment = async (id: string) => {
    if (!user?.token) return;
    
    if (window.confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
      try {
        await deleteAssessment(user.token, id);
        setAssessments(assessments.filter(assessment => assessment._id !== id));
      } catch (error) {
        console.error('Error deleting assessment:', error);
        setError('Failed to delete assessment. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
          <p>Please wait while we load the admin dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">Welcome, {user?.userId} (Admin)</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('assessments')}
              className={`${
                activeTab === 'assessments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Assessments
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`${
                activeTab === 'submissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Submissions
            </button>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {activeTab === 'assessments' ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Manage Assessments</h2>
              <Link
                to="/create-assessment"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create New Assessment
              </Link>
            </div>
            
            {assessments.length === 0 ? (
              <p className="text-gray-600">No assessments available. Create one to get started.</p>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {assessments.map((assessment) => (
                    <li key={assessment._id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-medium text-blue-600 truncate">{assessment.title}</p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <Link
                              to={`/edit-assessment/${assessment._id}`}
                              className="px-2 py-1 mr-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDeleteAssessment(assessment._id)}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              {assessment.description.length > 100
                                ? `${assessment.description.substring(0, 100)}...`
                                : assessment.description}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <p>Created on {new Date(assessment.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-4">Review Submissions</h2>
            
            {submissions.length === 0 ? (
              <p className="text-gray-600">No submissions available for review.</p>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {submissions.map((submission) => (
                    <li key={submission._id}>
                      <Link to={`/evaluate-submission/${submission._id}`} className="block hover:bg-gray-50">
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-medium text-blue-600 truncate">
                              {submission.assessment.title}
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  submission.evaluationStatus === 'evaluated'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {submission.evaluationStatus === 'evaluated' ? 'Evaluated' : 'Needs Review'}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                Submitted by: {submission.user.userId} ({submission.user.email})
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <p>Submitted on {new Date(submission.submittedAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;