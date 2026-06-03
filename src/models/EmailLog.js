const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema(
  {
    to: {
      type: String,
      required: true,
    },
    from: {
      type: String,
      default: 'editor@jamsd.org',
    },
    subject: {
      type: String,
      required: true,
    },
    body: String,
    template: String,
    relatedSubmission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
    },
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending'],
      default: 'pending',
    },
    sentAt: Date,
    error: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmailLog', emailLogSchema);
