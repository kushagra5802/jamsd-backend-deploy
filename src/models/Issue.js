const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
  {
    volume: {
      type: Number,
      required: [true, 'Volume number is required'],
    },
    issueNumber: {
      type: Number,
      required: [true, 'Issue number is required'],
    },
    season: {
      type: String,
      enum: ['Spring', 'Fall', 'Special'],
      default: 'Spring',
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
    },
    title: String,
    description: String,
    coverImageUrl: String,
    publishedAt: Date,
    isPublished: {
      type: Boolean,
      default: false,
    },
    articles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Article',
      },
    ],
  },
  { timestamps: true }
);

issueSchema.index({ volume: 1, issueNumber: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Issue', issueSchema);
