import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createAssessment, getAssessmentById, updateAssessment, getCategories, createCategory } from '../utils/api';

interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

interface Question {
  questionText: string;
  instructions: string;
  maxPoints: number;
  category?: string;
  type: 'descriptive' | 'mcq';
  options?: QuestionOption[];
}

interface Category {
  _id: string;
  name: string;
  description?: string;
}

const AssessmentForm = () => {
  const { id } = useParams(); // If id exists, we're editing an assessment
  const isEditMode = Boolean(id);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingAssessment, setFetchingAssessment] = useState(isEditMode);
  
  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.token) return;
      
      try {
        // Fetch categories
        setLoadingCategories(true);
        const categoriesData = await getCategories(user.token);
        setCategories(categoriesData);
        
        // If editing, fetch assessment data
        if (isEditMode && id) {
          setFetchingAssessment(true);
          const assessmentData = await getAssessmentById(user.token, id);
          setTitle(assessmentData.title);
          setDescription(assessmentData.description);
          
          // Convert questions if in old format (just to handle potential backwards compatibility)
          if (typeof assessmentData.questions === 'string') {
            setQuestions([{
              questionText: 'Assessment Questions',
              instructions: assessmentData.questions,
              maxPoints: 100,
              type: 'descriptive'
            }]);
          } else {
            // Map questions to ensure they have the new fields
            setQuestions(assessmentData.questions.map((q: any) => ({
              ...q,
              type: q.type || 'descriptive',
              category: q.category || '',
              options: q.options || []
            })));
          }
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        
        // If we're trying to create a new assessment and only category loading failed, 
        // we can still continue with empty categories
        if (!isEditMode) {
          setError('Failed to load categories. You can continue, but won\'t be able to categorize questions.');
        } else {
          setError('Failed to load necessary data. Please try again.');
        }
      } finally {
        setLoadingCategories(false);
        setFetchingAssessment(false);
      }
    };

    fetchData();
  }, [isEditMode, user, id]);

  const handleQuestionChange = (index: number, field: string, value: any) => {
    setQuestions((prevQuestions) => {
      const updatedQuestions = [...prevQuestions];
      updatedQuestions[index] = { 
        ...updatedQuestions[index], 
        [field]: value 
      };
      
      // If changing from descriptive to MCQ, initialize options array
      if (field === 'type' && value === 'mcq' && (!updatedQuestions[index].options || updatedQuestions[index].options!.length === 0)) {
        updatedQuestions[index].options = [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ];
      }
      
      return updatedQuestions;
    });
  };
  
  const handleOptionChange = (questionIndex: number, optionIndex: number, field: string, value: any) => {
    setQuestions((prevQuestions) => {
      const updatedQuestions = [...prevQuestions];
      if (!updatedQuestions[questionIndex].options) {
        updatedQuestions[questionIndex].options = [];
      }
      
      updatedQuestions[questionIndex].options![optionIndex] = {
        ...updatedQuestions[questionIndex].options![optionIndex],
        [field]: value
      };
      
      return updatedQuestions;
    });
  };
  
  const addOption = (questionIndex: number) => {
    setQuestions((prevQuestions) => {
      const updatedQuestions = [...prevQuestions];
      if (!updatedQuestions[questionIndex].options) {
        updatedQuestions[questionIndex].options = [];
      }
      
      updatedQuestions[questionIndex].options!.push({ text: '', isCorrect: false });
      return updatedQuestions;
    });
  };
  
  const removeOption = (questionIndex: number, optionIndex: number) => {
    setQuestions((prevQuestions) => {
      const updatedQuestions = [...prevQuestions];
      updatedQuestions[questionIndex].options!.splice(optionIndex, 1);
      return updatedQuestions;
    });
  };

  const addQuestion = () => {
    setQuestions((prevQuestions) => [
      ...prevQuestions, 
      { 
        questionText: '', 
        instructions: '', 
        maxPoints: 10,
        type: 'descriptive',
        category: categories.length > 0 ? categories[0]._id : ''
      }
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions((prevQuestions) => prevQuestions.filter((_, i) => i !== index));
  };
  
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      setCategoryError('Category name is required');
      return;
    }
    
    if (!user?.token) {
      setCategoryError('Authorization error. Please login again.');
      return;
    }
    
    try {
      // Use a separate loading state for category creation to avoid conflicts
      setCategoryError(null);
      const categoryData = {
        name: newCategoryName,
        description: newCategoryDescription || undefined
      };
      
      const newCategory = await createCategory(user.token, categoryData);
      
      // Add new category to the list
      setCategories(prev => [...prev, newCategory]);
      
      // Reset form
      setNewCategoryName('');
      setNewCategoryDescription('');
      setShowNewCategoryForm(false);
    } catch (error: any) {
      console.error('Error creating category:', error);
      setCategoryError(error.message || 'Failed to create category');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!title || !description) {
      setError('Title and description are required');
      return;
    }
    
    if (questions.length === 0) {
      setError('At least one question is required');
      return;
    }
    
    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText || !q.instructions) {
        setError(`Question ${i+1} is incomplete. Please fill in all required fields.`);
        return;
      }
      
      if (q.type === 'mcq') {
        // Validate MCQ options
        if (!q.options || q.options.length < 2) {
          setError(`Question ${i+1}: MCQs need at least 2 options.`);
          return;
        }
        
        let hasCorrectOption = false;
        for (const option of q.options) {
          if (!option.text.trim()) {
            setError(`Question ${i+1}: All option texts must be filled.`);
            return;
          }
          if (option.isCorrect) hasCorrectOption = true;
        }
        
        if (!hasCorrectOption) {
          setError(`Question ${i+1}: MCQs must have at least one correct option.`);
          return;
        }
      }
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

  if (fetchingAssessment || loadingCategories) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
          <p>Please wait while we load the data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
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

            <div className="mb-6">
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
            
            {/* Category Management Section */}
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-900">Question Categories</h3>
                <button
                  type="button"
                  onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  {showNewCategoryForm ? 'Cancel' : 'Add New Category'}
                </button>
              </div>
              
              {showNewCategoryForm && (
                <div className="mb-4 p-3 border border-gray-300 rounded-md bg-white">
                  <h4 className="text-md font-medium mb-2">Create New Category</h4>
                  
                  {categoryError && (
                    <div className="mb-3 p-2 bg-red-100 text-red-700 text-sm rounded">
                      {categoryError}
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name
                    </label>
                    <input
                      id="category-name"
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Technical, Aptitude, Logic"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="category-description" className="block text-sm font-medium text-gray-700 mb-1">
                      Category Description (Optional)
                    </label>
                    <input
                      id="category-description"
                      type="text"
                      value={newCategoryDescription}
                      onChange={(e) => setNewCategoryDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Brief description of this category"
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300"
                  >
                    {loading ? 'Creating...' : 'Create Category'}
                  </button>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 mt-3">
                {categories.length === 0 ? (
                  <p className="text-gray-500 italic">No categories available. Create one to categorize questions.</p>
                ) : (
                  categories.map(category => (
                    <span key={category._id} className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm">
                      {category.name}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-lg font-medium text-gray-900">
                  Questions
                </label>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add Question
                </button>
              </div>
              
              {questions.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 border border-dashed border-gray-300 rounded-md">
                  <p className="text-gray-500">No questions added yet. Click the button above to add a question.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((question, qIndex) => (
                    <div key={qIndex} className="border border-gray-200 rounded-md p-4 bg-white">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-md font-medium">Question {qIndex + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIndex)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Question Type
                          </label>
                          <select
                            value={question.type}
                            onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="descriptive">Descriptive (Notepad)</option>
                            <option value="mcq">Multiple Choice Question</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                          </label>
                          <select
                            value={question.category || ''}
                            onChange={(e) => handleQuestionChange(qIndex, 'category', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            disabled={categories.length === 0}
                          >
                            {categories.length === 0 ? (
                              <option value="">No categories available</option>
                            ) : (
                              categories.map(category => (
                                <option key={category._id} value={category._id}>
                                  {category.name}
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Question Text
                        </label>
                        <input
                          type="text"
                          value={question.questionText}
                          onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter the question"
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Instructions
                        </label>
                        <textarea
                          value={question.instructions}
                          onChange={(e) => handleQuestionChange(qIndex, 'instructions', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Instructions for answering this question"
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Points
                        </label>
                        <input
                          type="number"
                          value={question.maxPoints}
                          onChange={(e) => handleQuestionChange(qIndex, 'maxPoints', parseInt(e.target.value, 10) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Maximum points for this question"
                          min="0"
                        />
                      </div>
                      
                      {/* MCQ Options */}
                      {question.type === 'mcq' && (
                        <div className="mt-4 border-t border-gray-200 pt-4">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-medium text-gray-900">Answer Options</h4>
                            <button
                              type="button"
                              onClick={() => addOption(qIndex)}
                              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                            >
                              Add Option
                            </button>
                          </div>
                          
                          {question.options && question.options.length > 0 ? (
                            <div className="space-y-2">
                              {question.options.map((option, oIndex) => (
                                <div key={oIndex} className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={option.text}
                                    onChange={(e) => handleOptionChange(qIndex, oIndex, 'text', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder={`Option ${oIndex + 1}`}
                                  />
                                  <label className="flex items-center space-x-1">
                                    <input
                                      type="checkbox"
                                      checked={option.isCorrect}
                                      onChange={(e) => handleOptionChange(qIndex, oIndex, 'isCorrect', e.target.checked)}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Correct</span>
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => removeOption(qIndex, oIndex)}
                                    disabled={question.options!.length <= 2}
                                    className="text-red-600 hover:text-red-800 disabled:text-gray-400"
                                    title={question.options!.length <= 2 ? "MCQs must have at least 2 options" : "Remove option"}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">Add options for your multiple choice question.</p>
                          )}
                          
                          <div className="mt-2 text-xs text-gray-500">
                            * Check the box next to the correct answer(s). Multiple correct answers are allowed.
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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