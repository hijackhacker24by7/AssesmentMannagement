import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSubmissionById } from '../utils/api';
import SecureNotepad from '../components/SecureNotepad';

interface QuestionOption {
  text: string;
  isCorrect?: boolean;
}

interface Question {
  _id: string;
  questionText: string;
  instructions: string;
  maxPoints: number;
  categoryId?: string;
  categoryName?: string;
  type: 'descriptive' | 'mcq';
  options?: QuestionOption[];
}

interface Assessment {
  _id: string;
  title: string;
  description: string;
  questions: Question[];
}

interface Submission {
  _id: string;
  assessment: Assessment;
  content: string;
  mcqResponses?: Record<string, string[]>;
  submittedAt: string;
  evaluationStatus: 'pending' | 'evaluated';
  grade: number | null;
  feedback?: string;
  evaluatedAt?: string;
  tabSwitches: number;
  evaluatorNotes?: Record<string, string>;
  challenge?: {
    status: 'pending' | 'resolved';
    reason: string;
    adminResponse?: string;
    challengeDate: string;
  };
  categoryScores?: Record<string, number>;
}

const ViewSubmission = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!user?.token || !id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const data = await getSubmissionById(user.token, id);
        setSubmission(data);
      } catch (err: any) {
        console.error('Error fetching submission:', err);
        setError(err.message || 'Failed to load submission. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [user, id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
          <p>Please wait while we load the submission details.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-lg text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-600">Error</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/results')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Submission not found</h2>
          <button
            onClick={() => navigate('/results')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/results')}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Results
          </button>
        </div>

        {/* Submission Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{submission.assessment.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <div>
                  Submitted: <span className="font-medium">{new Date(submission.submittedAt).toLocaleString()}</span>
                </div>
                <div>
                  Tab Switches: <span className="font-medium">{submission.tabSwitches}</span>
                </div>
                {submission.evaluationStatus === 'evaluated' && submission.evaluatedAt && (
                  <div>
                    Evaluated: <span className="font-medium">{new Date(submission.evaluatedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                submission.evaluationStatus === 'pending' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : submission.challenge?.status === 'pending'
                  ? 'bg-orange-100 text-orange-800'
                  : submission.challenge?.status === 'resolved'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {submission.evaluationStatus === 'pending' 
                  ? 'Pending Evaluation' 
                  : submission.challenge?.status === 'pending'
                  ? 'Challenge Pending'
                  : submission.challenge?.status === 'resolved'
                  ? 'Challenge Resolved'
                  : 'Evaluated'
                }
              </div>
              
              {submission.evaluationStatus === 'evaluated' && submission.grade !== null && (
                <div className="mt-2 text-2xl font-bold text-gray-800">
                  {submission.grade}/100
                </div>
              )}
            </div>
          </div>
          
          {submission.categoryScores && Object.keys(submission.categoryScores).length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Category Scores:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(submission.categoryScores).map(([category, score]) => (
                  <div key={category} className="bg-gray-50 rounded p-3">
                    <div className="text-sm font-medium">{category}</div>
                    <div className="text-lg font-semibold mt-1">{score}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className={`h-2 rounded-full ${
                          score >= 80 ? 'bg-green-500' :
                          score >= 60 ? 'bg-blue-500' :
                          score >= 40 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Challenge Info */}
        {submission.challenge && (
          <div className={`mb-6 p-4 border-l-4 rounded-md ${
            submission.challenge.status === 'pending'
              ? 'bg-orange-50 border-orange-500'
              : 'bg-purple-50 border-purple-500'
          }`}>
            <h3 className="text-md font-semibold mb-2">
              {submission.challenge.status === 'pending'
                ? 'Challenge Pending Review'
                : 'Challenge Resolved'
              }
            </h3>
            <div className="mb-2">
              <span className="font-medium">Reason:</span> {submission.challenge.reason}
            </div>
            <div className="text-sm text-gray-500">
              Submitted on {new Date(submission.challenge.challengeDate).toLocaleString()}
            </div>
            
            {submission.challenge.status === 'resolved' && submission.challenge.adminResponse && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="font-medium">Administrator Response:</div>
                <div className="mt-1">{submission.challenge.adminResponse}</div>
              </div>
            )}
          </div>
        )}

        {/* Feedback */}
        {submission.evaluationStatus === 'evaluated' && submission.feedback && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Feedback</h2>
            <div className="p-4 bg-gray-50 rounded-md whitespace-pre-wrap">
              {submission.feedback}
            </div>
          </div>
        )}

        {/* Questions and Responses */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Assessment Questions</h2>
          
          <div className="space-y-8">
            {submission.assessment.questions.map((question, index) => {
              const evaluatorNote = submission.evaluatorNotes?.[question._id] || null;

              return (
                <div key={question._id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                  <div className="mb-4">
                    <h3 className="text-md font-semibold text-gray-900">
                      Question {index + 1}: {question.questionText}
                    </h3>
                    {question.categoryName && (
                      <span className="inline-block mt-1 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        {question.categoryName}
                      </span>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4">
                    <p className="text-sm text-gray-700">{question.instructions}</p>
                  </div>
                  
                  {/* MCQ Response */}
                  {question.type === 'mcq' && question.options && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Your Answer:</h4>
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => {
                          const isSelected = submission.mcqResponses && 
                            submission.mcqResponses[index] && 
                            submission.mcqResponses[index].includes(option.text);
                            
                          // Only show if the submission has been evaluated
                          const isCorrect = submission.evaluationStatus === 'evaluated' ? option.isCorrect : undefined;
                          
                          return (
                            <div 
                              key={optIndex} 
                              className={`p-3 border rounded-md ${
                                isSelected 
                                  ? isCorrect === true
                                    ? 'bg-green-50 border-green-300'
                                    : isCorrect === false
                                      ? 'bg-red-50 border-red-300'
                                      : 'bg-blue-50 border-blue-300'
                                  : isCorrect === true && submission.evaluationStatus === 'evaluated'
                                    ? 'bg-green-50 border-green-300 border-dashed'
                                    : 'border-gray-300'
                              }`}
                            >
                              <div className="flex items-center">
                                <div className="flex-shrink-0 mr-2">
                                  {question.options!.filter(o => o.isCorrect).length > 1 ? (
                                    // Checkbox style
                                    <div className={`h-5 w-5 border ${
                                      isSelected 
                                        ? isCorrect === true
                                          ? 'bg-green-600 border-green-600'
                                          : isCorrect === false
                                            ? 'bg-red-600 border-red-600'
                                            : 'bg-blue-600 border-blue-600'
                                        : 'border-gray-300'
                                      } rounded flex items-center justify-center`}>
                                      {isSelected && (
                                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                    </div>
                                  ) : (
                                    // Radio style
                                    <div className={`h-5 w-5 border ${
                                      isSelected 
                                        ? isCorrect === true
                                          ? 'bg-green-600 border-green-600'
                                          : isCorrect === false
                                            ? 'bg-red-600 border-red-600'
                                            : 'bg-blue-600 border-blue-600'
                                        : 'border-gray-300'
                                      } rounded-full flex items-center justify-center`}>
                                      {isSelected && (
                                        <div className="h-3 w-3 rounded-full bg-white"></div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <span className={`${
                                  isCorrect === true && submission.evaluationStatus === 'evaluated'
                                    ? 'font-medium text-green-700'
                                    : isSelected && isCorrect === false && submission.evaluationStatus === 'evaluated'
                                      ? 'text-red-700'
                                      : 'text-gray-700'
                                }`}>
                                  {option.text}
                                </span>
                                
                                {/* Show correct answer indicator */}
                                {isCorrect === true && submission.evaluationStatus === 'evaluated' && (
                                  <span className="ml-2 text-green-700 text-sm">
                                    (Correct)
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Evaluator Notes */}
                  {evaluatorNote && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Evaluator Notes:</h4>
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                        {evaluatorNote}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Descriptive Content */}
        {submission.content && submission.content !== "MCQ Assessment Submission" && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Your Solution</h2>
            <div className="h-96 border border-gray-300 rounded-md">
              <SecureNotepad value={submission.content} onChange={() => {}} readOnly />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewSubmission;