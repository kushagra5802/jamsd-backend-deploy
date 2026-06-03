const mongoose = require('mongoose');

const editorialDecisionSchema = new mongoose.Schema(
  {
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
    },
    editor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    decision: {
      type: String,
      enum: ['accept', 'request-revision', 'reject'],
      required: true,
    },
    comments: {
      type: String,
      required: true,
    },
    round: {
      type: Number,
      default: 1,
    },
    decidedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EditorialDecision', editorialDecisionSchema);
