const express = require('express');
const router = express.Router();
const {
  createSubmission,
  getSubmissions,
  getSubmissionById,
  updateSubmission,
  evaluateSubmission,
  getSubmissionsByUser,
  getSubmissionsByAssessment,
  submitChallenge,
  respondToChallenge
} = require('../controllers/submissionController');
const { protect, admin } = require('../middleware/authMiddleware');

// Routes for regular users
router.post('/', protect, createSubmission);
router.get('/user', protect, getSubmissionsByUser);
router.post('/:id/challenge', protect, submitChallenge);

// Admin-only routes
router.get('/', protect, admin, getSubmissions);
router.get('/assessment/:assessmentId', protect, admin, getSubmissionsByAssessment);
router.put('/:id/evaluate', protect, admin, evaluateSubmission);
router.put('/:id/respond-challenge', protect, admin, respondToChallenge);

// Routes accessible by both regular users and admins
router.get('/:id', protect, getSubmissionById);
router.put('/:id', protect, updateSubmission);

module.exports = router;