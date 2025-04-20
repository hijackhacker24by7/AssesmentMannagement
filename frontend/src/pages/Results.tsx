import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserSubmissions, submitChallenge } from '../utils/api';


interface Assessment {
  _id: string;
  title: string;
  description: string;
}

interface Submission {
  _id: string;
  assessment: Assessment;
  submittedAt: string;
  evaluationStatus: 'pending' | 'evaluated';
  grade: number | null;
  feedback?: string;
  evaluatedAt?: string;
  challenge?: {
    status: 'pending' | 'resolved' | 'accepted' | 'rejected';
    reason: string;
    adminResponse?: string;
    challengeDate: string;
  };
  categories?: { [key: string]: number };
}

const Results = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the selected submission ID from location state if available
  const selectedSubmissionId = location.state?.selectedSubmissionId || null;
  
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'evaluated' | 'pending'>('all');
  
  // Challenge state
  const [challengeSubmissionId, setChallengeSubmissionId] = useState<string | null>(selectedSubmissionId);
  const [challengeReason, setChallengeReason] = useState('');
  const [submittingChallenge, setSubmittingChallenge] = useState(false);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [challengeSuccess, setChallengeSuccess] = useState(false);
  
  // Sorting state
  const [sortField, setSortField] = useState<'submittedAt' | 'evaluatedAt' | 'grade'>('submittedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchSubmissions();
  }, [user]);

  const fetchSubmissions = async () => {
    if (!user?.token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await getUserSubmissions(user.token);
      setSubmissions(data);
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
      setError(error.message || 'Failed to load submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: 'submittedAt' | 'evaluatedAt' | 'grade') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedSubmissions = [...submissions].sort((a, b) => {
    if (sortField === 'grade') {
      const gradeA = a.grade ?? -1;
      const gradeB = b.grade ?? -1;
      return sortDirection === 'asc' ? gradeA - gradeB : gradeB - gradeA;
    } else if (sortField === 'evaluatedAt') {
      const dateA = a.evaluatedAt ? new Date(a.evaluatedAt).getTime() : 0;
      const dateB = b.evaluatedAt ? new Date(b.evaluatedAt).getTime() : 0;
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    } else {
      const dateA = new Date(a.submittedAt).getTime();
      const dateB = new Date(b.submittedAt).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    }
  });

  const filteredSubmissions = sortedSubmissions.filter(submission => {
    if (activeTab === 'evaluated') {
      return submission.evaluationStatus === 'evaluated';
    } else if (activeTab === 'pending') {
      return submission.evaluationStatus === 'pending';
    }
    return true;
  });

  const handleSubmitChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.token || !challengeSubmissionId) return;
    
    if (!challengeReason.trim()) {
      setChallengeError('Please provide a reason for your challenge.');
      return;
    }
    
    try {
      setSubmittingChallenge(true);
      setChallengeError(null);
      
      // First, get the latest submission data to ensure it doesn't already have a challenge
      try {
        // Refresh submissions list to get the latest data
        const updatedSubmissions = await getUserSubmissions(user.token);
        setSubmissions(updatedSubmissions);
        
        // Check if the submission already has a challenge
        const submissionToChallenge = updatedSubmissions.find((sub: Submission) => sub._id === challengeSubmissionId);
        if (submissionToChallenge?.challenge) {
          setChallengeError('This submission already has an active challenge. You can only submit one challenge per evaluation.');
          setSubmittingChallenge(false);
          return;
        }
      } catch (error) {
        console.log("Failed to refresh submission data, proceeding with challenge submission");
        // Continue with the challenge submission even if refresh fails
      }
      
      // Now submit the challenge
      await submitChallenge(user.token, challengeSubmissionId, challengeReason);
      
      // Update the local state to reflect the change
      setSubmissions(prev => prev.map(sub => {
        if (sub._id === challengeSubmissionId) {
          return {
            ...sub,
            challenge: {
              status: 'pending',
              reason: challengeReason,
              challengeDate: new Date().toISOString()
            }
          };
        }
        return sub;
      }));
      
      setChallengeSuccess(true);
      setChallengeReason('');
      
      // Clear the challenge form after a delay
      setTimeout(() => {
        setChallengeSubmissionId(null);
        setChallengeSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error('Error submitting challenge:', error);
      
      // Provide more specific error messages
      if (error.message.includes('already has an active challenge')) {
        setChallengeError('This submission already has an active challenge. You can only submit one challenge per evaluation.');
      } else {
        setChallengeError(error.message || 'Failed to submit challenge. Please try again.');
      }
      
      // Refresh submissions to update UI with current data
      fetchSubmissions();
    } finally {
      setSubmittingChallenge(false);
    }
  };

  // Method to get the current challenge (if any) for the selected submission
  const getSelectedChallenge = () => {
    const submission = submissions.find(s => s._id === challengeSubmissionId);
    return submission?.challenge;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
          <p>Please wait while we load your assessment results.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Your Assessment Results</h1>
            <button
              onClick={fetchSubmissions}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
            >
              Refresh
            </button>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {/* Tab navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px space-x-8">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 px-1 ${
                  activeTab === 'all'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } font-medium text-sm`}
              >
                All Submissions
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {submissions.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('evaluated')}
                className={`py-4 px-1 ${
                  activeTab === 'evaluated'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } font-medium text-sm`}
              >
                Evaluated
                <span className="ml-2 bg-green-100 text-green-600 py-0.5 px-2 rounded-full text-xs">
                  {submissions.filter(s => s.evaluationStatus === 'evaluated').length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-1 ${
                  activeTab === 'pending'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } font-medium text-sm`}
              >
                Pending Evaluation
                <span className="ml-2 bg-yellow-100 text-yellow-600 py-0.5 px-2 rounded-full text-xs">
                  {submissions.filter(s => s.evaluationStatus === 'pending').length}
                </span>
              </button>
            </nav>
          </div>
        </div>
        
        {submissions.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <h2 className="text-xl font-medium text-gray-900 mb-2">No submissions yet</h2>
            <p className="text-gray-500 mb-6">
              You haven't submitted any assessments yet. Take an assessment to see your results here.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <h2 className="text-xl font-medium text-gray-900 mb-2">No {activeTab} submissions found</h2>
            <p className="text-gray-500 mb-6">
              Try selecting a different filter to see your submissions.
            </p>
            <button
              onClick={() => setActiveTab('all')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
            >
              View All Submissions
            </button>
          </div>
        ) : (
          <div>
            {/* Results table */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assessment
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('submittedAt')}
                    >
                      <div className="flex items-center">
                        Submitted
                        {sortField === 'submittedAt' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('evaluatedAt')}
                    >
                      <div className="flex items-center">
                        Evaluated
                        {sortField === 'evaluatedAt' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('grade')}
                    >
                      <div className="flex items-center">
                        Grade
                        {sortField === 'grade' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {submission.assessment.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(submission.submittedAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {submission.evaluatedAt 
                            ? new Date(submission.evaluatedAt).toLocaleString()
                            : '-'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {submission.grade !== null ? (
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">
                              {submission.grade}/100
                            </span>
                            
                            {submission.categories && Object.keys(submission.categories).length > 0 && (
                              <span className="ml-2 group relative">
                                <span className="bg-blue-100 text-blue-800 text-xs py-0.5 px-1.5 rounded cursor-help">
                                  Details
                                </span>
                                
                                {/* Category Tooltip */}
                                <div className="hidden group-hover:block absolute z-10 right-0 mt-2 w-48 bg-white rounded-md shadow-lg p-2 text-sm">
                                  <div className="font-medium mb-1 pb-1 border-b border-gray-100">Category scores:</div>
                                  <div className="space-y-1">
                                    {Object.entries(submission.categories).map(([category, score]) => (
                                      <div key={category} className="flex justify-between">
                                        <span>{category}:</span>
                                        <span className="font-medium">{score}%</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {submission.evaluationStatus === 'pending' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending Evaluation
                          </span>
                        ) : submission.challenge ? (
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              submission.challenge.status === 'pending'
                                ? 'bg-orange-100 text-orange-800'
                                : submission.challenge.status === 'accepted' 
                                  ? 'bg-green-100 text-green-800'
                                  : submission.challenge.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-purple-100 text-purple-800'
                            }`}>
                              {submission.challenge.status === 'pending' ? 'Challenge Under Review' : 
                               submission.challenge.status === 'accepted' ? 'Challenge Accepted' :
                               submission.challenge.status === 'rejected' ? 'Challenge Rejected' :
                               'Challenge Resolved'}
                            </span>
                            <button 
                              className="block text-xs text-blue-600 mt-1 hover:underline" 
                              onClick={() => setChallengeSubmissionId(submission._id)}
                            >
                              View details
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Evaluated
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Link
                          to={`/submission/${submission._id}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          View
                        </Link>
                        
                        {submission.evaluationStatus === 'evaluated' && 
                         !submission.challenge && 
                         challengeSubmissionId !== submission._id && (
                          <button
                            onClick={() => setChallengeSubmissionId(submission._id)}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            Challenge
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Challenge Form or Challenge Details */}
            {challengeSubmissionId && (
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  {getSelectedChallenge() ? 'Challenge Status' : 'Challenge Evaluation'}
                </h2>
                
                {challengeSuccess ? (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                    Your challenge has been submitted successfully. An administrator will review it and respond soon.
                  </div>
                ) : getSelectedChallenge() ? (
                  <div>
                    <div className="bg-gray-50 p-4 rounded-md mb-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Status</h3>
                          <p className={`mt-1 font-medium ${
                            getSelectedChallenge()?.status === 'pending'
                              ? 'text-orange-600'
                              : getSelectedChallenge()?.status === 'accepted'
                                ? 'text-green-600'
                                : getSelectedChallenge()?.status === 'rejected'
                                  ? 'text-red-600'
                                  : 'text-purple-600'
                          }`}>
                            {getSelectedChallenge()?.status === 'pending'
                              ? 'Under Review'
                              : getSelectedChallenge()?.status === 'accepted'
                                ? 'Challenge Accepted'
                                : getSelectedChallenge()?.status === 'rejected'
                                  ? 'Challenge Rejected'
                                  : 'Resolved'}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Submitted On</h3>
                          <p className="mt-1">
                            {getSelectedChallenge()?.challengeDate
                              ? new Date(getSelectedChallenge()?.challengeDate as string).toLocaleString()
                              : 'N/A'
                            }
                          </p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-500">Your Reason</h3>
                        <p className="mt-1 text-gray-900 whitespace-pre-line">
                          {getSelectedChallenge()?.reason || 'No reason provided'}
                        </p>
                      </div>
                      
                      {getSelectedChallenge()?.adminResponse && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Admin Response</h3>
                          <p className="mt-1 text-gray-900 whitespace-pre-line">
                            {getSelectedChallenge()?.adminResponse}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        onClick={() => setChallengeSubmissionId(null)}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {challengeError && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {challengeError}
                      </div>
                    )}
                    
                    <form onSubmit={handleSubmitChallenge}>
                      <p className="text-gray-600 mb-4">
                        If you believe your assessment was graded incorrectly, you can challenge the evaluation. 
                        Please provide a detailed explanation of why you think the grading should be reconsidered.
                      </p>
                      
                      <div className="mb-4">
                        <label htmlFor="challenge-reason" className="block text-sm font-medium text-gray-700 mb-1">
                          Reason for Challenge
                        </label>
                        <textarea
                          id="challenge-reason"
                          value={challengeReason}
                          onChange={(e) => setChallengeReason(e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Explain why you believe the evaluation should be reconsidered..."
                          required
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setChallengeSubmissionId(null)}
                          className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submittingChallenge}
                          className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                        >
                          {submittingChallenge ? 'Submitting...' : 'Submit Challenge'}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;