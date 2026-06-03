const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    submissionId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    abstract: {
      type: String,
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
    correspondingAuthor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    coverPageFile: {
      filename: String,
      name: String,
      key: String,
      url: String,
      publicUrl: String,
      mimetype: String,
      size: Number,
      uploadedAt: Date,
    },
    manuscriptFile: {
      filename: String,
      name: String,
      key: String,
      url: String,
      publicUrl: String,
      mimetype: String,
      size: Number,
      uploadedAt: Date,
    },
    supplementaryFiles: [
      {
        filename: String,
        name: String,
        key: String,
        url: String,
        publicUrl: String,
        mimetype: String,
        size: Number,
        uploadedAt: Date,
      },
    ],
    status: {
      type: String,
      enum: [
        'draft',
        'submitted',
        'under-review',
        'revision-required',
        'accepted',
        'rejected',
        'withdrawn',
        'published',
      ],
      default: 'submitted',
    },
    coverLetter: String,
    declarations: {
      authorship: { type: Boolean, default: false },
      conflictOfInterest: { type: Boolean, default: false },
      ethics: { type: Boolean, default: false },
      officialTemplate: { type: Boolean, default: false },
      coverPageComplete: { type: Boolean, default: false },
      journalPolicies: { type: Boolean, default: false },
    },
    conflictOfInterest: String,
    ethicalApprovalNumber: String,
    revisions: [
      {
        manuscriptFile: {
          filename: String,
          name: String,
          key: String,
          url: String,
          publicUrl: String,
          mimetype: String,
          size: Number,
          uploadedAt: Date,
        },
        supplementaryFiles: [
          {
            filename: String,
            name: String,
            key: String,
            url: String,
            publicUrl: String,
            mimetype: String,
            size: Number,
            uploadedAt: Date,
          },
        ],
        coverLetter: String,
        submittedAt: Date,
      },
    ],
    auditLog: [
      {
        actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        action: String,
        fromStatus: String,
        toStatus: String,
        comments: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    assignedIssue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      default: null,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

submissionSchema.index({ title: 'text', abstract: 'text', keywords: 'text', submissionId: 'text' });

module.exports = mongoose.model('Submission', submissionSchema);
