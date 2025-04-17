import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAssessments, getUserSubmissions } from '../utils/api';

interface Assessment {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
}

interface Submission {
  _id: string;
  assessment: {
    _id: string;
    title: string;
  };
  submittedAt: string;
  evaluationStatus: 'pending' | 'evaluated';
  grade: number | null;
}

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!user || !user.token) {
          navigate('/login');
          return;
        }

        // Fetch assessments
        const assessmentsData = await getAssessments(user.token);
        setAssessments(assessmentsData);

        // Fetch user submissions
        const submissionsData = await getUserSubmissions(user.token);
        setSubmissions(submissionsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
          <p>Please wait while we load your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">Welcome, {user?.userId}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Available Assessments */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Available Assessments</h2>
          {assessments.length === 0 ? (
            <p className="text-gray-600">No assessments available at this time.</p>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {assessments.map((assessment) => (
                  <li key={assessment._id}>
                    <Link to={`/take-assessment/${assessment._id}`} className="block hover:bg-gray-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-medium text-blue-600 truncate">{assessment.title}</p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Available
                            </p>
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
                            <p>Added on {new Date(assessment.createdAt).toLocaleDateString()}</p>
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

        {/* Your Submissions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Submissions</h2>
          {submissions.length === 0 ? (
            <p className="text-gray-600">You haven't submitted any assessments yet.</p>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {submissions.map((submission) => (
                  <li key={submission._id}>
                    <Link to={`/submission/${submission._id}`} className="block hover:bg-gray-50">
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
                              {submission.evaluationStatus === 'evaluated' ? 'Evaluated' : 'Pending'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            {submission.evaluationStatus === 'evaluated' && (
                              <p className="flex items-center text-sm text-gray-500">
                                Grade: {submission.grade !== null ? submission.grade : 'N/A'}
                              </p>
                            )}
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
      </main>
    </div>
  );
};

export default Dashboard;