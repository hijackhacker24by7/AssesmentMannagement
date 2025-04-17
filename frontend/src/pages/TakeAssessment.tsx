import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAssessmentById, submitAssessment } from '../utils/api';
import SecureNotepad from '../components/SecureNotepad';

interface Assessment {
  _id: string;
  title: string;
  description: string;
  questions: string;
}

const TakeAssessment = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  useEffect(() => {
    const fetchAssessment = async () => {
      if (!user?.token || !id) {
        navigate('/dashboard');
        return;
      }

      try {
        setLoading(true);
        const data = await getAssessmentById(user.token, id);
        setAssessment(data);
      } catch (error) {
        console.error('Error fetching assessment:', error);
        setError('Failed to load assessment. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [id, user, navigate]);

  // Handle tab switch detection for logging purposes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setTabSwitchCount(prev => prev + 1);
        // You could also log this event to the server in a real application
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleSubmit = async () => {
    if (!user?.token || !id || !response.trim()) {
      setError('Please enter your response before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      await submitAssessment(user.token, id, response);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting assessment:', error);
      setError('Failed to submit your assessment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
          <p>Please wait while we load the assessment.</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Assessment Not Found</h2>
          <p>The requested assessment could not be found.</p>
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
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{assessment.title}</h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back to Dashboard
            </button>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Description:</h2>
            <p className="text-gray-700">{assessment.description}</p>
          </div>
          
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2">Questions:</h2>
            <div className="bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-line">
              {assessment.questions}
            </div>
          </div>
          
          {tabSwitchCount > 0 && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
              <p className="font-bold">Warning:</p>
              <p>You have switched tabs {tabSwitchCount} time(s). This activity is being monitored.</p>
            </div>
          )}
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Your Answer:</h2>
            <SecureNotepad 
              value={response}
              onChange={setResponse}
              placeholder="Type your answer here..."
            />
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {submitting ? 'Submitting...' : 'Submit Response'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeAssessment;