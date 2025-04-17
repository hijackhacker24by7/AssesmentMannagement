import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSubmissionById } from '../utils/api';
import SecureNotepad from '../components/SecureNotepad';

interface Submission {
  _id: string;
  assessment: {
    _id: string;
    title: string;
    description: string;
    questions: string;
  };
  content: string;
  evaluationStatus: 'pending' | 'evaluated';
  grade: number | null;
  feedback: string;
  submittedAt: string;
  evaluatedAt: string | null;
}

const ViewSubmission = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!user?.token || !id) {
        navigate('/dashboard');
        return;
      }

      try {
        setLoading(true);
        const data = await getSubmissionById(user.token, id);
        setSubmission(data);
      } catch (error) {
        console.error('Error fetching submission:', error);
        setError('Failed to load submission. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [id, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
          <p>Please wait while we load your submission.</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Submission Not Found</h2>
          <p>The requested submission could not be found.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 mb-4">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Your Submission: {submission.assessment.title}
              </h1>
              <p className="text-gray-600">
                Submitted on: {new Date(submission.submittedAt).toLocaleString()}
              </p>
              <p className="text-gray-600">
                Status: {submission.evaluationStatus === 'evaluated' ? 'Evaluated' : 'Pending Review'}
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back to Dashboard
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Assessment Questions:</h2>
            <div className="bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-line">
              {submission.assessment.questions}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Your Response:</h2>
            <SecureNotepad 
              value={submission.content}
              onChange={() => {}}
              readOnly={true}
            />
          </div>

          {submission.evaluationStatus === 'evaluated' && (
            <>
              <div className="mt-8 p-4 bg-blue-50 rounded-md border border-blue-200">
                <h2 className="text-lg font-semibold mb-2 text-blue-800">Evaluation Results</h2>
                <div className="mb-4">
                  <p className="font-medium">Grade: {submission.grade !== null ? submission.grade : 'Not graded'}/100</p>
                  <p className="text-gray-600 text-sm">
                    Evaluated on: {submission.evaluatedAt ? new Date(submission.evaluatedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Feedback:</h3>
                  {submission.feedback ? (
                    <div className="whitespace-pre-line text-gray-700">{submission.feedback}</div>
                  ) : (
                    <p className="text-gray-500 italic">No feedback provided.</p>
                  )}
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewSubmission;