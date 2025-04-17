const express = require('express');
const router = express.Router();
const {
  createAssessment,
  getAssessments,
  getAssessmentById,
  updateAssessment,
  deleteAssessment,
  activateAssessment,
  deactivateAssessment
} = require('../controllers/assessmentController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin-only routes
router.post('/', protect, admin, createAssessment);
router.put('/:id', protect, admin, updateAssessment);
router.delete('/:id', protect, admin, deleteAssessment);
router.put('/:id/activate', protect, admin, activateAssessment);
router.put('/:id/deactivate', protect, admin, deactivateAssessment);

// Routes for both admin and regular users
router.get('/', protect, getAssessments);
router.get('/:id', protect, getAssessmentById);

module.exports = router;