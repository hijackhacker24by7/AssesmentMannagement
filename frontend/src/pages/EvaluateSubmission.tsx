import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSubmissionById, evaluateSubmission } from '../utils/api';
import SecureNotepad from '../components/SecureNotepad';

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

const EvaluateSubmission = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [grade, setGrade] = useState<number | ''>('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!user?.token || !id) {
        navigate('/admin-dashboard');
        return;
      }

      try {
        setLoading(true);
        const data = await getSubmissionById(user.token, id);
        setSubmission(data);
        
        // Pre-fill existing evaluation data if available
        if (data.evaluationStatus === 'evaluated') {
          setGrade(data.grade || '');
          setFeedback(data.feedback || '');
        }
      } catch (error) {
        console.error('Error fetching submission:', error);
        setError('Failed to load submission. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [id, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.token || !id) {
      return;
    }

    // Validate grade
    if (grade === '') {
      setError('Please provide a grade for this submission.');
      return;
    }

    const numericGrade = Number(grade);
    if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 100) {
      setError('Grade must be a number between 0 and 100.');
      return;
    }

    // Validate feedback - adding this check
    if (!feedback.trim()) {
      setError('Please provide feedback for this submission.');
      return;
    }

    try {
      setSubmitting(true);
      await evaluateSubmission(user.token, id, numericGrade, feedback);
      navigate('/admin-dashboard');
    } catch (error) {
      console.error('Error evaluating submission:', error);
      setError('Failed to save evaluation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
          <p>Please wait while we load the submission data.</p>
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
            onClick={() => navigate('/admin-dashboard')}
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
                Evaluate Submission: {submission.assessment.title}
              </h1>
              <p className="text-gray-600 mt-1">
                Submitted by: {submission.user.userId} ({submission.user.email})
              </p>
              <p className="text-gray-600">
                Submitted on: {new Date(submission.submittedAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => navigate('/admin-dashboard')}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back to Dashboard
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Assessment Questions:</h2>
            <div className="bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-line">
              {Array.isArray(submission.assessment.questions) ? (
                submission.assessment.questions.map((question, index) => (
                  <div key={question._id} className="mb-4">
                    <p className="font-bold">{index + 1}. {question.questionText}</p>
                    {question.instructions && (
                      <p className="text-gray-700 mt-1">{question.instructions}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">Points: {question.maxPoints}</p>
                  </div>
                ))
              ) : (
                <p>{submission.assessment.questions}</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Student's Response:</h2>
            <SecureNotepad 
              value={submission.content}
              onChange={() => {}}
              readOnly={true}
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
                Grade (0-100)
              </label>
              <input
                type="number"
                id="grade"
                min="0"
                max="100"
                value={grade}
                onChange={(e) => setGrade(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter grade"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
                Feedback
              </label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Provide feedback on the student's response"
              />
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
              >
                {submitting ? 'Saving...' : 'Save Evaluation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EvaluateSubmission;