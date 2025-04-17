const mongoose = require('mongoose');

const AssessmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Assessment title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Assessment description is required'],
    },
    questions: [
      {
        questionText: {
          type: String,
          required: true,
        },
        instructions: {
          type: String,
          default: '',
        },
        maxPoints: {
          type: Number,
          default: 10,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    timeLimit: {
      type: Number, // Time limit in minutes
      default: 60,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Assessment', AssessmentSchema);