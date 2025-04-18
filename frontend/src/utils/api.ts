// Base API URL
const API_URL = 'http://localhost:5000/api';

// User Authentication API
export const registerUser = async (userData: any) => {
  try {
    const response = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error('Server returned non-JSON response: ' + (text.substring(0, 100) + '...'));
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const registerAdmin = async (userData: any) => {
  try {
    const response = await fetch(`${API_URL}/users/register-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error('Server returned non-JSON response: ' + (text.substring(0, 100) + '...'));
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Admin registration failed');
    }
    
    return data;
  } catch (error) {
    console.error('Admin registration error:', error);
    throw error;
  }
};

export const loginUser = async (credentials: any) => {
  try {
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error('Server returned non-JSON response: ' + (text.substring(0, 100) + '...'));
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const getUserProfile = async (token: string) => {
  try {
    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error('Server returned non-JSON response: ' + (text.substring(0, 100) + '...'));
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get user profile');
    }
    
    return data;
  } catch (error) {
    console.error('Profile fetch error:', error);
    throw error;
  }
};

// Assessment API
export const getAssessments = async (token: string) => {
  try {
    const response = await fetch(`${API_URL}/assessments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error('Server returned non-JSON response: ' + (text.substring(0, 100) + '...'));
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch assessments');
    }
    
    return data;
  } catch (error) {
    console.error('Fetch assessments error:', error);
    throw error;
  }
};

export const getAssessmentById = async (token: string, assessmentId: string) => {
  try {
    const response = await fetch(`${API_URL}/assessments/${assessmentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error('Server returned non-JSON response: ' + (text.substring(0, 100) + '...'));
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch assessment');
    }
    
    return data;
  } catch (error) {
    console.error('Fetch assessment error:', error);
    throw error;
  }
};

export const createAssessment = async (token: string, assessmentData: any) => {
  try {
    const response = await fetch(`${API_URL}/assessments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(assessmentData),
    });
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error('Server returned non-JSON response: ' + (text.substring(0, 100) + '...'));
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create assessment');
    }
    
    return data;
  } catch (error) {
    console.error('Create assessment error:', error);
    throw error;
  }
};

export const updateAssessment = async (token: string, assessmentId: string, assessmentData: any) => {
  try {
    const response = await fetch(`${API_URL}/assessments/${assessmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(assessmentData),
    });
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error('Server returned non-JSON response: ' + (text.substring(0, 100) + '...'));
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update assessment');
    }
    
    return data;
  } catch (error) {
    console.error('Update assessment error:', error);
    throw error;
  }
};

export const deleteAssessment = async (token: string, assessmentId: string) => {
  try {
    const response = await fetch(`${API_URL}/assessments/${assessmentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error('Server returned non-JSON response: ' + (text.substring(0, 100) + '...'));
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete assessment');
    }
    
    return data;
  } catch (error) {
    console.error('Delete assessment error:', error);
    throw error;
  }
};

// Submission API
export const getUserSubmissions = async (token: string) => {
  try {
    const response = await fetch(`${API_URL}/submissions/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error('Server returned non-JSON response: ' + (text.substring(0, 100) + '...'));
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch user submissions');
    }
    
    return data;
  } catch (error) {
    console.error('Fetch user submissions error:', error);
    throw error;
  }
};

export const getAllSubmissions = async (token: string) => {
  try {
    const response = await fetch(`${API_URL}/submissions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error('Server returned non-JSON response: ' + (text.substring(0, 100) + '...'));
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch all submissions');
    }
    
    return data;
  } catch (error) {
    console.error('Fetch all submissions error:', error);
    throw error;
  }
};

export const getSubmissionById = async (token: string, submissionId: string) => {
  try {
    const response = await fetch(`${API_URL}/submissions/${submissionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error('Server returned non-JSON response: ' + (text.substring(0, 100) + '...'));
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch submission');
    }
    
    return data;
  } catch (error) {
    console.error('Fetch submission error:', error);
    throw error;
  }
};

export const submitAssessment = async (token: string, assessmentId: string, content: string, tabSwitches?: number) => {
  try {
    const response = await fetch(`${API_URL}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ assessmentId, content, tabSwitches }),
    });
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error('Server returned non-JSON response: ' + (text.substring(0, 100) + '...'));
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit assessment');
    }
    
    return data;
  } catch (error) {
    console.error('Submit assessment error:', error);
    throw error;
  }
};

export const evaluateSubmission = async (token: string, submissionId: string, grade: number, feedback?: string) => {
  try {
    const response = await fetch(`${API_URL}/submissions/${submissionId}/evaluate`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ grade, feedback }),
    });
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error('Server returned non-JSON response: ' + (text.substring(0, 100) + '...'));
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to evaluate submission');
    }
    
    return data;
  } catch (error) {
    console.error('Evaluate submission error:', error);
    throw error;
  }
};