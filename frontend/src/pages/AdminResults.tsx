import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllSubmissions, respondToChallenge } from '../utils/api';

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
  evaluationStatus: 'pending' | 'evaluated';
  grade: number | null;
  submittedAt: string;
  evaluatedAt: string | null;
  feedback: string;
  challenge?: {
    status: 'pending' | 'resolved' | 'accepted' | 'rejected' | 'reviewing';
    reason: string;
    adminResponse?: string;
    challengeDate: string;
  };
}

const AdminResults = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'challenged' | 'pending'>('all');
  
  // Challenge response form state
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [challengeStatus, setChallengeStatus] = useState<'accepted' | 'rejected' | 'reviewing'>('reviewing');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);
  const [responseSuccess, setResponseSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, [user]);
  
  const fetchSubmissions = async () => {
    if (!user?.token || user.role !== 'admin') return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await getAllSubmissions(user.token);
      // Sort by submission date (newest first)
      data.sort((a: Submission, b: Submission) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      setSubmissions(data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setError('Failed to load submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResponseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!selectedSubmission || !responseText.trim()) {
      setResponseError('Please provide a response to the challenge');
      return;
    }
    
    if (!user?.token) {
      setResponseError('Authentication error. Please log in again.');
      return;
    }
    
    try {
      setIsSubmittingResponse(true);
      setResponseError(null);
      setResponseSuccess(null);
      
      // Include the challenge status in the response
      const fullResponse = `[Status: ${challengeStatus.toUpperCase()}] ${responseText}`;
      
      // Submit response
      await respondToChallenge(user.token, selectedSubmission, fullResponse);
      
      // Update local state to reflect the response
      setSubmissions(submissions.map(sub => {
        if (sub._id === selectedSubmission && sub.challenge) {
          return {
            ...sub,
            challenge: {
              ...sub.challenge,
              status: challengeStatus,
              adminResponse: fullResponse
            }
          };
        }
        return sub;
      }));
      
      // Reset form
      setSelectedSubmission(null);
      setResponseText('');
      setChallengeStatus('reviewing');
      setResponseSuccess('Your response has been submitted successfully');
      
      // Refresh submissions data
      fetchSubmissions();
    } catch (error: any) {
      console.error('Error submitting response:', error);
      setResponseError(error.message || 'Failed to submit response. Please try again.');
    } finally {
      setIsSubmittingResponse(false);
    }
  };
  
  // Filter submissions based on selected filter
  const filteredSubmissions = submissions.filter(submission => {
    if (filter === 'all') return true;
    if (filter === 'challenged') return submission.challenge && submission.challenge.status === 'pending';
    if (filter === 'pending') return submission.evaluationStatus === 'pending';
    return true;
  });

  // Count of challenges needing response
  const challengesCount = submissions.filter(sub => 
    sub.challenge && (sub.challenge.status === 'pending' || sub.challenge.status === 'reviewing')
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
          <p>Please wait while we load the submissions data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">Assessment Results Management</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {responseSuccess && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
            {responseSuccess}
          </div>
        )}
        
        {/* Filter Controls */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-medium text-gray-900">Filter Results</h2>
            <div className="flex space-x-2">
              <button 
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button 
                onClick={() => setFilter('challenged')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === 'challenged' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Challenged
                {challengesCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-600 text-white rounded-full text-xs">
                    {challengesCount}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === 'pending' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Pending Evaluation
              </button>
            </div>
          </div>
        </div>
        
        <button 
          onClick={fetchSubmissions} 
          className="mb-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          Refresh Data
        </button>
        
        {filteredSubmissions.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-600">No submissions match the selected filter.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Results Table */}
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assessment
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission._id} className={submission.challenge && submission.challenge.status === 'pending' ? 'bg-orange-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {submission.user.userId}
                        <div className="text-xs text-gray-500">{submission.user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {submission.assessment.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(submission.submittedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {submission.evaluationStatus === 'evaluated' ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Evaluated
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                        {submission.challenge && (
                          <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            submission.challenge.status === 'pending' || submission.challenge.status === 'reviewing'
                              ? 'bg-red-100 text-red-800'
                              : submission.challenge.status === 'accepted'
                                ? 'bg-green-100 text-green-800'
                                : submission.challenge.status === 'rejected'
                                  ? 'bg-gray-300 text-gray-800'
                                  : 'bg-purple-100 text-purple-800'
                          }`}>
                            {submission.challenge.status === 'pending' ? 'Challenge Pending' :
                             submission.challenge.status === 'reviewing' ? 'Under Review' :
                             submission.challenge.status === 'accepted' ? 'Challenge Accepted' :
                             submission.challenge.status === 'rejected' ? 'Challenge Rejected' :
                             'Challenge Resolved'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {submission.evaluationStatus === 'evaluated' ? (
                          submission.grade !== null ? `${submission.grade}/100` : 'N/A'
                        ) : (
                          'Pending'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {submission.evaluationStatus === 'pending' ? (
                          <Link 
                            to={`/evaluate-submission/${submission._id}`}
                            className="text-blue-600 hover:text-blue-900 mr-2"
                          >
                            Evaluate
                          </Link>
                        ) : (
                          <Link 
                            to={`/evaluate-submission/${submission._id}`}
                            className="text-blue-600 hover:text-blue-900 mr-2"
                          >
                            Review
                          </Link>
                        )}
                        
                        {submission.challenge && (submission.challenge.status === 'pending' || submission.challenge.status === 'reviewing') && (
                          <button
                            onClick={() => {
                              setSelectedSubmission(submission._id);
                              setChallengeStatus('reviewing');
                            }}
                            className="text-red-600 hover:text-red-900 ml-2"
                          >
                            Respond
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Challenge Response Form */}
            {selectedSubmission && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Respond to Challenge</h2>
                
                {responseError && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                    {responseError}
                  </div>
                )}
                
                {submissions.find(s => s._id === selectedSubmission)?.challenge && (
                  <div className="mb-6 bg-gray-50 border border-gray-200 p-4 rounded-md">
                    <h3 className="font-medium text-gray-900 mb-2">Student's Challenge:</h3>
                    <p className="text-gray-700 whitespace-pre-line">
                      {submissions.find(s => s._id === selectedSubmission)?.challenge?.reason}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Submitted on: {
                        submissions.find(s => s._id === selectedSubmission)?.challenge?.challengeDate
                          ? new Date(submissions.find(s => s._id === selectedSubmission)?.challenge?.challengeDate!).toLocaleString()
                          : 'Unknown date'
                      }
                    </p>
                  </div>
                )}
                
                <form onSubmit={handleResponseSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assessment
                    </label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                      {submissions.find(s => s._id === selectedSubmission)?.assessment.title}
                      <span className="ml-2 text-sm text-gray-500">
                        (Student: {submissions.find(s => s._id === selectedSubmission)?.user.userId})
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Challenge Status
                    </label>
                    <div className="flex space-x-4">
                      <label className="inline-flex items-center">
                        <input 
                          type="radio" 
                          className="form-radio h-5 w-5 text-blue-600" 
                          checked={challengeStatus === 'reviewing'} 
                          onChange={() => setChallengeStatus('reviewing')}
                        />
                        <span className="ml-2 text-gray-700">Still Reviewing</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input 
                          type="radio" 
                          className="form-radio h-5 w-5 text-green-600" 
                          checked={challengeStatus === 'accepted'} 
                          onChange={() => setChallengeStatus('accepted')}
                        />
                        <span className="ml-2 text-gray-700">Accept Challenge</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input 
                          type="radio" 
                          className="form-radio h-5 w-5 text-red-600" 
                          checked={challengeStatus === 'rejected'} 
                          onChange={() => setChallengeStatus('rejected')}
                        />
                        <span className="ml-2 text-gray-700">Reject Challenge</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="response-text" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Response
                    </label>
                    <textarea
                      id="response-text"
                      rows={4}
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Provide your response to the student's challenge..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setSelectedSubmission(null)}
                      className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingResponse}
                      className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                    >
                      {isSubmittingResponse ? 'Submitting...' : 'Submit Response'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminResults;