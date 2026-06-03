const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    abstract: {
      type: String,
      required: [true, 'Abstract is required'],
    },
    keywords: [{ type: String }],
    articleType: {
      type: String,
      enum: [
        'original-research',
        'review',
        'case-report',
        'letter',
        'commentary',
        'methodological-innovation',
      ],
      required: true,
    },
    authors: [
      {
        name: String,
        email: String,
        affiliation: String,
        orcid: String,
        isCorresponding: { type: Boolean, default: false },
      },
    ],
    doi: {
      type: String,
      unique: true,
      sparse: true,
    },
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
    },
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
    },
    publishedAt: Date,
    volume: Number,
    issueNumber: Number,
    pageRange: String,
    aheadOfPrint: {
      type: Boolean,
      default: false,
    },
    pdfUrl: String,
    pdfKey: String,
    isPublished: {
      type: Boolean,
      default: true,
    },
    views: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
  },
  { timestamps: true }
);

articleSchema.index({ title: 'text', abstract: 'text', keywords: 'text' });

module.exports = mongoose.model('Article', articleSchema);
