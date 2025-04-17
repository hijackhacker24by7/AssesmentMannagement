import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createAssessment, getAssessmentById, updateAssessment } from '../utils/api';

const AssessmentForm = () => {
  const { id } = useParams(); // If id exists, we're editing an assessment
  const isEditMode = Boolean(id);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingAssessment, setFetchingAssessment] = useState(isEditMode);

  useEffect(() => {
    // If editing an existing assessment, fetch its data
    const fetchAssessment = async () => {
      if (isEditMode && user?.token && id) {
        try {
          setFetchingAssessment(true);
          const assessment = await getAssessmentById(user.token, id);
          setTitle(assessment.title);
          setDescription(assessment.description);
          setQuestions(assessment.questions);
        } catch (error) {
          console.error('Error fetching assessment:', error);
          setError('Failed to load assessment. Please try again.');
        } finally {
          setFetchingAssessment(false);
        }
      }
    };

    fetchAssessment();
  }, [isEditMode, user, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!title || !description || !questions) {
      setError('All fields are required');
      return;
    }
    
    if (!user?.token) {
      setError('You must be logged in to perform this action');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const assessmentData = { title, description, questions };
      
      if (isEditMode && id) {
        await updateAssessment(user.token, id, assessmentData);
      } else {
        await createAssessment(user.token, assessmentData);
      }
      
      navigate('/admin-dashboard');
    } catch (error) {
      console.error('Error saving assessment:', error);
      setError(`Failed to ${isEditMode ? 'update' : 'create'} assessment. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingAssessment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
          <p>Please wait while we load the assessment data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {isEditMode ? 'Edit Assessment' : 'Create New Assessment'}
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Assessment Title"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter a description for this assessment"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="questions" className="block text-sm font-medium text-gray-700 mb-1">
                Questions/Content
              </label>
              <textarea
                id="questions"
                value={questions}
                onChange={(e) => setQuestions(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter the assessment questions or content here"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/admin-dashboard')}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {loading ? 'Saving...' : isEditMode ? 'Update Assessment' : 'Create Assessment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssessmentForm;