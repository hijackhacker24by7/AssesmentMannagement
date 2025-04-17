const Assessment = require('../models/Assessment');
const Submission = require('../models/Submission');

// @desc    Create a new assessment
// @route   POST /api/assessments
// @access  Private/Admin
const createAssessment = async (req, res) => {
  try {
    const { title, description, questions, timeLimit } = req.body;

    // Check if required fields are provided
    if (!title || !description || !questions || questions.length === 0) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Create new assessment
    const assessment = await Assessment.create({
      title,
      description,
      questions,
      timeLimit: timeLimit || 60,
      createdBy: req.user._id,
    });

    res.status(201).json(assessment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all assessments
// @route   GET /api/assessments
// @access  Private
const getAssessments = async (req, res) => {
  try {
    // If user is admin, show all assessments
    // If user is student, show only active assessments
    const filter = req.user.role === 'admin' ? {} : { isActive: true };
    
    const assessments = await Assessment.find(filter)
      .populate('createdBy', 'userId email');
    
    res.json(assessments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get assessment by ID
// @route   GET /api/assessments/:id
// @access  Private
const getAssessmentById = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate('createdBy', 'userId email');
    
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check if user has permission to view
    if (req.user.role !== 'admin' && !assessment.isActive) {
      return res.status(403).json({ message: 'Not authorized to access this assessment' });
    }

    res.json(assessment);
  } catch (error) {
    console.error(error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update assessment
// @route   PUT /api/assessments/:id
// @access  Private/Admin
const updateAssessment = async (req, res) => {
  try {
    const { title, description, questions, isActive, timeLimit } = req.body;

    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check if user has permission to update
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this assessment' });
    }

    // Check if assessment has submissions already
    const hasSubmissions = await Submission.exists({ assessment: assessment._id });
    
    if (hasSubmissions && questions) {
      return res.status(400).json({ 
        message: 'Cannot modify questions for an assessment that already has submissions' 
      });
    }

    // Update fields
    assessment.title = title || assessment.title;
    assessment.description = description || assessment.description;
    assessment.questions = questions || assessment.questions;
    assessment.isActive = isActive !== undefined ? isActive : assessment.isActive;
    assessment.timeLimit = timeLimit || assessment.timeLimit;

    const updatedAssessment = await assessment.save();
    res.json(updatedAssessment);
  } catch (error) {
    console.error(error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete assessment
// @route   DELETE /api/assessments/:id
// @access  Private/Admin
const deleteAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check if user has permission to delete
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this assessment' });
    }

    // Check if assessment has submissions already
    const hasSubmissions = await Submission.exists({ assessment: assessment._id });
    
    if (hasSubmissions) {
      return res.status(400).json({ 
        message: 'Cannot delete an assessment that already has submissions' 
      });
    }

    await assessment.remove();
    res.json({ message: 'Assessment removed' });
  } catch (error) {
    console.error(error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Activate assessment
// @route   PUT /api/assessments/:id/activate
// @access  Private/Admin
const activateAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check if user has permission to activate
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to activate this assessment' });
    }

    assessment.isActive = true;
    const updatedAssessment = await assessment.save();
    
    res.json(updatedAssessment);
  } catch (error) {
    console.error(error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Deactivate assessment
// @route   PUT /api/assessments/:id/deactivate
// @access  Private/Admin
const deactivateAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check if user has permission to deactivate
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to deactivate this assessment' });
    }

    assessment.isActive = false;
    const updatedAssessment = await assessment.save();
    
    res.json(updatedAssessment);
  } catch (error) {
    console.error(error);
    
    // Check if error is due to invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createAssessment,
  getAssessments,
  getAssessmentById,
  updateAssessment,
  deleteAssessment,
  activateAssessment,
  deactivateAssessment
};