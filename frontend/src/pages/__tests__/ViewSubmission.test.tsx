import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../../test/test-utils';
import ViewSubmission from '../ViewSubmission';
import * as api from '../../utils/api';

// Mock the API module
vi.mock('../../utils/api', () => ({
  getSubmissionById: vi.fn(),
}));

// Mock the secure notepad component
vi.mock('../../components/SecureNotepad', () => ({
  default: ({ value, readOnly }: { value: string; readOnly: boolean }) => (
    <div data-testid="secure-notepad">
      <div>Mock SecureNotepad</div>
      <div data-testid="notepad-content">{value}</div>
      {readOnly && <div data-testid="read-only">Read Only</div>}
    </div>
  ),
}));

// Mock the React Router's useParams hook
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'mock-submission-id' }),
    useNavigate: () => vi.fn(),
  };
});

describe('ViewSubmission Component', () => {
  // Sample user object for auth context
  const mockUser = {
    _id: 'user123',
    userId: 'testuser',
    email: 'test@example.com',
    role: 'user' as const,
    token: 'mock-token',
  };

  // Sample submission data
  const mockSubmission = {
    _id: 'submission123',
    assessment: {
      _id: 'assessment123',
      title: 'Test Assessment',
      description: 'Test Description',
      questions: [
        {
          _id: 'question1',
          questionText: 'Test Question 1',
          instructions: 'Write your answer',
          maxPoints: 10,
          categoryName: 'Category 1',
          type: 'descriptive',
        },
        {
          _id: 'question2',
          questionText: 'Test MCQ',
          instructions: 'Select all that apply',
          maxPoints: 5,
          categoryName: 'Category 2',
          type: 'mcq',
          options: [
            { text: 'Option 1', isCorrect: true },
            { text: 'Option 2', isCorrect: false },
          ],
        },
      ],
    },
    content: 'Test submission content',
    submittedAt: '2025-04-15T10:30:00Z',
    evaluationStatus: 'evaluated',
    grade: 85,
    feedback: 'Good job overall.',
    evaluatedAt: '2025-04-16T14:20:00Z',
    tabSwitches: 2,
    mcqResponses: {
      '1': ['Option 1'],
    },
    categoryScores: {
      'Category 1': 90,
      'Category 2': 80,
    },
  };

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('should show loading state initially', () => {
    // Mock pending API call
    vi.mocked(api.getSubmissionById).mockImplementation(() => new Promise(() => {}));
    
    // Render the component with auth context
    render(<ViewSubmission />, {
      authContext: { user: mockUser },
      routePath: '/submissions/:id',
      route: '/submissions/mock-submission-id',
    });
    
    // Assert loading state is shown
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Please wait while we load the submission details.')).toBeInTheDocument();
  });

  it('should display error message when API call fails', async () => {
    // Mock failed API call
    vi.mocked(api.getSubmissionById).mockRejectedValueOnce(new Error('Failed to fetch submission'));
    
    // Render the component with auth context
    render(<ViewSubmission />, {
      authContext: { user: mockUser },
      routePath: '/submissions/:id',
      route: '/submissions/mock-submission-id',
    });
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch submission')).toBeInTheDocument();
    });
  });

  it('should display submission details when loaded successfully', async () => {
    // Mock successful API call
    vi.mocked(api.getSubmissionById).mockResolvedValueOnce(mockSubmission);
    
    // Render the component with auth context
    render(<ViewSubmission />, {
      authContext: { user: mockUser },
      routePath: '/submissions/:id',
      route: '/submissions/mock-submission-id',
    });
    
    // Wait for content to load
    await waitFor(() => {
      // Check if assessment title is displayed
      expect(screen.getByRole('heading', { name: 'Test Assessment' })).toBeInTheDocument();
      
      // Check if evaluation status is displayed
      expect(screen.getByText('Evaluated')).toBeInTheDocument();
      
      // Check if grade is displayed
      expect(screen.getByText('85/100')).toBeInTheDocument();
      
      // Check if category scores are displayed - use a more specific selector
      const categoryScoresSections = screen.getAllByText('Category 1');
      expect(categoryScoresSections.length).toBeGreaterThan(0);
      
      // Finding the first category score section
      const scoreSection = screen.getAllByText(/90%/i)[0];
      expect(scoreSection).toBeInTheDocument();
      
      // Check if questions are displayed
      expect(screen.getByText(/Question 1: Test Question 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Question 2: Test MCQ/i)).toBeInTheDocument();
      
      // Check if feedback is displayed
      expect(screen.getByText('Feedback')).toBeInTheDocument();
      expect(screen.getByText('Good job overall.')).toBeInTheDocument();
      
      // Check if SecureNotepad is rendered for submission content
      expect(screen.getByTestId('secure-notepad')).toBeInTheDocument();
    });
  });

  it('should display challenge information when submission is challenged', async () => {
    // Create a challenged submission
    const challengedSubmission = {
      ...mockSubmission,
      challenge: {
        status: 'pending',
        reason: 'I disagree with my score',
        challengeDate: '2025-04-17T09:15:00Z',
      }
    };
    
    // Mock successful API call with challenged submission
    vi.mocked(api.getSubmissionById).mockResolvedValueOnce(challengedSubmission);
    
    // Render the component
    render(<ViewSubmission />, {
      authContext: { user: mockUser },
      routePath: '/submissions/:id',
      route: '/submissions/mock-submission-id',
    });
    
    // Wait for content to load
    await waitFor(() => {
      // Check if challenge status is displayed
      expect(screen.getByText('Challenge Pending Review')).toBeInTheDocument();
      
      // Check if challenge reason is displayed
      expect(screen.getByText(/I disagree with my score/i)).toBeInTheDocument();
    });
  });

  it('should display resolved challenge information when available', async () => {
    // Create a resolved challenge submission
    const resolvedChallengeSubmission = {
      ...mockSubmission,
      challenge: {
        status: 'resolved',
        reason: 'I disagree with my score',
        adminResponse: 'After review, your grade has been adjusted.',
        challengeDate: '2025-04-17T09:15:00Z',
      }
    };
    
    // Mock successful API call with resolved challenge
    vi.mocked(api.getSubmissionById).mockResolvedValueOnce(resolvedChallengeSubmission);
    
    // Render the component
    render(<ViewSubmission />, {
      authContext: { user: mockUser },
      routePath: '/submissions/:id',
      route: '/submissions/mock-submission-id',
    });
    
    // Wait for content to load
    await waitFor(() => {
      // Check if challenge resolution is displayed - use a more specific approach
      const statusElement = screen.getAllByText('Challenge Resolved')[0];
      expect(statusElement).toBeInTheDocument();
      
      // Check if admin response is displayed
      expect(screen.getByText('Administrator Response:')).toBeInTheDocument();
      expect(screen.getByText('After review, your grade has been adjusted.')).toBeInTheDocument();
    });
  });
});