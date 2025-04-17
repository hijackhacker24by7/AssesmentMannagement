const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Submission content is required'],
    },
    tabSwitches: {
      type: Number,
      default: 0,
    },
    evaluationStatus: {
      type: String,
      enum: ['pending', 'evaluated'],
      default: 'pending',
    },
    grade: {
      type: Number,
      min: 0,
      max: 100,
    },
    feedback: {
      type: String,
    },
    evaluatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index to ensure a user can only submit once per assessment
SubmissionSchema.index({ user: 1, assessment: 1 }, { unique: true });

module.exports = mongoose.model('Submission', SubmissionSchema);