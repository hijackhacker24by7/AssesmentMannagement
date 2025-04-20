const Submission = require('../models/Submission');
const Assessment = require('../models/Assessment');

// @desc    Create a new submission
// @route   POST /api/submissions
// @access  Private
const createSubmission = async (req, res) => {
  try {
    const { assessmentId, content, tabSwitches, multipleChoiceAnswers } = req.body;

    // Check if required fields are provided
    if (!assessmentId || !content) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if assessment exists
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check if assessment is active
    if (!assessment.isActive && req.user.role !== 'admin') {
      return res.status(400).json({ message: 'This assessment is no longer active' });
    }

    // Check if user already submitted
    const existingSubmission = await Submission.findOne({
      user: req.user._id,
      assessment: assessmentId,
    });

    if (existingSubmission) {
      return res.status(400).json({ message: 'You have already submitted this assessment' });
    }

    // Convert multipleChoiceAnswers to a format suitable for MongoDB storage
    let mcqResponses = {};
    if (multipleChoiceAnswers && typeof multipleChoiceAnswers === 'object') {
      // Copy the object rather than directly assigning to avoid reference issues
      Object.keys(multipleChoiceAnswers).forEach(key => {
        mcqResponses[key] = multipleChoiceAnswers[key];
      });
    }

    // Create new submission
    const submission = await Submission.create({
      user: req.user._id,
      assessment: assessmentId,
      content,
      mcqResponses,
      tabSwitches: tabSwitches || 0,
    });

    res.status(201).json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get submissions for a user
// @route   GET /api/submissions/user
// @access  Private
const getSubmissionsByUser = async (req, res) => {
  try {
    const submissions = await Submission.find({ user: req.user._id })
      .populate('assessment', 'title description')
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all submissions (for admin)
// @route   GET /api/submissions
// @access  Private/Admin
const getSubmissions = async (req, res) => {
  try {
    // Check if user has admin permission
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to access all submissions' });
    }

    const submissions = await Submission.find({})
      .populate('user', 'userId email')
      .populate('assessment', 'title description')
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get submission by ID
// @route   GET /api/submissions/:id
// @access  Private
const getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('user', 'userId email')
      .populate('assessment');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Check if user has permission to view this submission
    if (
      req.user.role !== 'admin' && 
      submission.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to view this submission' });
    }

    res.json(submission);
  } catch (error) {
    console.error(error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update submission
// @route   PUT /api/submissions/:id
// @access  Private
const updateSubmission = async (req, res) => {
  try {
    const { content, tabSwitches } = req.body;
    
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Check if user has permission to update this submission
    if (submission.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this submission' });
    }

    // Check if submission can be updated (not already evaluated)
    if (submission.evaluationStatus === 'evaluated' && req.user.role !== 'admin') {
      return res.status(400).json({ message: 'Cannot update an evaluated submission' });
    }

    // Update submission
    if (content) submission.content = content;
    if (tabSwitches) submission.tabSwitches = tabSwitches;
    
    const updatedSubmission = await submission.save();
    res.json(updatedSubmission);
  } catch (error) {
    console.error(error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Evaluate a submission
// @route   PUT /api/submissions/:id/evaluate
// @access  Private/Admin
const evaluateSubmission = async (req, res) => {
  try {
    const { grade, feedback } = req.body;

    // Validate input
    if (grade === undefined || !feedback) {
      return res.status(400).json({ message: 'Please provide both grade and feedback' });
    }

    if (grade < 0 || grade > 100) {
      return res.status(400).json({ message: 'Grade must be between 0 and 100' });
    }

    // Check if user has admin permission
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to evaluate submissions' });
    }

    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Update submission with evaluation
    submission.grade = grade;
    submission.feedback = feedback;
    submission.evaluationStatus = 'evaluated';
    submission.evaluatedAt = Date.now();

    const updatedSubmission = await submission.save();

    res.json(updatedSubmission);
  } catch (error) {
    console.error(error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get submissions by assessment
// @route   GET /api/submissions/assessment/:assessmentId
// @access  Private/Admin
const getSubmissionsByAssessment = async (req, res) => {
  try {
    // Check if user has admin permission
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to access assessment submissions' });
    }

    const { assessmentId } = req.params;
    
    // Check if assessment exists
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    const submissions = await Submission.find({ assessment: assessmentId })
      .populate('user', 'userId email')
      .populate('assessment', 'title description')
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (error) {
    console.error(error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Submit a challenge for a submission evaluation
// @route   POST /api/submissions/:id/challenge
// @access  Private
const submitChallenge = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Please provide a reason for the challenge' });
    }

    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Check if user has permission to challenge this submission
    if (submission.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to challenge this submission' });
    }

    // Check if submission is evaluated
    if (submission.evaluationStatus !== 'evaluated') {
      return res.status(400).json({ message: 'Only evaluated submissions can be challenged' });
    }

    // Check if submission already has a challenge
    if (submission.challenge && submission.challenge.status) {
      return res.status(400).json({ message: 'This submission already has an active challenge' });
    }

    // Add challenge to submission
    submission.challenge = {
      status: 'pending',
      reason,
      challengeDate: Date.now()
    };

    const updatedSubmission = await submission.save();
    res.json(updatedSubmission);
  } catch (error) {
    console.error(error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Respond to a challenge
// @route   PUT /api/submissions/:id/respond-challenge
// @access  Private/Admin
const respondToChallenge = async (req, res) => {
  try {
    const { response } = req.body;
    let challengeStatus = 'resolved';

    if (!response) {
      return res.status(400).json({ message: 'Please provide a response to the challenge' });
    }

    // Check if user has admin permission
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to respond to challenges' });
    }

    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Check if submission has a pending challenge
    if (!submission.challenge || (submission.challenge.status !== 'pending' && submission.challenge.status !== 'reviewing')) {
      return res.status(400).json({ message: 'This submission does not have a pending or reviewing challenge' });
    }

    // Determine status from response text
    if (response.includes('[Status: ACCEPTED]')) {
      challengeStatus = 'accepted';
    } else if (response.includes('[Status: REJECTED]')) {
      challengeStatus = 'rejected';
    } else if (response.includes('[Status: REVIEWING]')) {
      challengeStatus = 'reviewing';
    }

    // Update challenge status and add response
    submission.challenge.status = challengeStatus;
    submission.challenge.adminResponse = response;
    
    // Add resolved date if the challenge is being resolved
    if (challengeStatus !== 'reviewing') {
      submission.challenge.resolvedDate = Date.now();
    }

    const updatedSubmission = await submission.save();
    res.json(updatedSubmission);
  } catch (error) {
    console.error(error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createSubmission,
  getSubmissionsByUser,
  getSubmissions,
  getSubmissionById,
  updateSubmission,
  evaluateSubmission,
  getSubmissionsByAssessment,
  submitChallenge,
  respondToChallenge
};