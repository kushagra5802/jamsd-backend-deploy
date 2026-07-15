const Submission = require('../models/Submission');
const EditorialDecision = require('../models/EditorialDecision');
const Article = require('../models/Article');
const Issue = require('../models/Issue');
const { uploadToS3 } = require('../utils/uploadToS3');
const {
  sendJournalEmail,
  submissionConfirmationEmail,
  editorialDecisionEmail,
} = require('../utils/journalEmail');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const Counter = require('../models/Counter');

const editableAuthorStatuses = new Set(['draft', 'submitted', 'revision-required']);

function parseJson(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function normalizeKeywords(value) {
  const parsed = parseJson(value, value);
  if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
  return String(parsed || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeReviewers(value) {
  const parsed = parseJson(value, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.map((reviewer) => ({
    name: String(reviewer?.name || '').trim(),
    email: String(reviewer?.email || '').trim(),
    affiliation: String(reviewer?.affiliation || '').trim(),
  }));
}

function assertReviewers({ suggestedReviewers }) {
  const completeReviewers = (suggestedReviewers || []).filter((r) => r.name && r.email && r.affiliation);
  if (completeReviewers.length < 3) {
    const error = new Error('Please provide 3 peer reviewer suggestions with name, email, and affiliation.');
    error.status = 400;
    throw error;
  }
}

function ensureAuthorAccess(submission, user) {
  const isOwner = String(submission.correspondingAuthor) === String(user._id);
  const isStaff = ['editor', 'admin', 'superadmin'].includes(user.role);
  if (!isOwner && !isStaff) {
    const error = new Error('You do not have access to this submission.');
    error.status = 403;
    throw error;
  }
}

// async function nextSubmissionId() {
//   const year = new Date().getFullYear();
//   const count = await Submission.countDocuments({
//     submissionId: new RegExp(`^JAMSD-${year}-`),
//   });
//   return `JAMSD-${year}-${String(count + 1).padStart(4, '0')}`;
// }
async function nextSubmissionId() {
  const year = new Date().getFullYear();

  const counter = await Counter.findOneAndUpdate(
    { _id: `submission-${year}` },
    { $inc: { seq: 1 } },
    {
      new: true,
      upsert: true,
    }
  );

  return `JAMSD-${year}-${String(counter.seq).padStart(4, '0')}`;
}

async function uploadSubmissionFiles(files, userId) {
  const coverPageFiles = files?.coverLetter || [];
  const manuscriptFiles = files?.manuscript || [];
  const supplementaryFiles = files?.supplementary || [];
  if (supplementaryFiles.length > 5) {
    const error = new Error('A maximum of 5 supplementary files is allowed.');
    error.status = 400;
    throw error;
  }
  const [coverPages, manuscripts, supplementary] = await Promise.all([
    uploadToS3({ files: coverPageFiles, userId, folder: 'jamsd/cover-pages' }),
    uploadToS3({ files: manuscriptFiles, userId, folder: 'jamsd/manuscripts' }),
    uploadToS3({ files: supplementaryFiles, userId, folder: 'jamsd/supplementary' }),
  ]);
  return {
    coverPageFile: coverPages[0],
    manuscriptFile: manuscripts[0],
    supplementaryFiles: supplementary,
  };
}

function ensureSubmissionDocument(file, label) {
  if (!file) {
    const error = new Error(`${label} is required.`);
    error.status = 400;
    throw error;
  }
}

function createS3Client() {
  return new S3Client({
    region: process.env.REGION,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY,
      secretAccessKey: process.env.ACCESS_SECRET,
    },
  });
}

async function addSignedUrlToFile(s3Client, file) {
  if (!file?.key) return;
  const command = new GetObjectCommand({
    Bucket: process.env.BUCKET,
    Key: file.key,
  });
  file.publicUrl = await getSignedUrl(s3Client, command, { expiresIn: 180000 });
}

async function addSignedDocumentUrls(submissions) {
  if (!process.env.BUCKET || !process.env.REGION || !process.env.ACCESS_KEY || !process.env.ACCESS_SECRET) {
    return submissions;
  }

  const s3Client = createS3Client();
  const list = Array.isArray(submissions) ? submissions : [submissions];

  await Promise.all(list.map(async (submission) => {
    await Promise.all([
      addSignedUrlToFile(s3Client, submission.coverPageFile),
      addSignedUrlToFile(s3Client, submission.manuscriptFile),
      ...(submission.supplementaryFiles || []).map((file) => addSignedUrlToFile(s3Client, file)),
    ]);
  }));

  return submissions;
}

async function publishAcceptedSubmission(submission, issueId, userId) {
  if (!issueId) {
    const error = new Error('Accepted manuscripts must be assigned to a volume and issue.');
    error.status = 400;
    throw error;
  }

  const issue = await Issue.findById(issueId);
  if (!issue) {
    const error = new Error('Selected issue was not found.');
    error.status = 404;
    throw error;
  }

  let article = await Article.findOne({ submission: submission._id });
  const articleData = {
    title: submission.title,
    abstract: submission.abstract,
    keywords: submission.keywords,
    articleType: submission.articleType,
    authors: submission.authors,
    issue: issue._id,
    submission: submission._id,
    volume: issue.volume,
    issueNumber: issue.issueNumber,
    publishedAt: new Date(),
    pdfUrl: submission.manuscriptFile?.url || submission.manuscriptFile?.publicUrl,
    pdfKey: submission.manuscriptFile?.key,
    isPublished: true,
  };

  if (article) {
    Object.assign(article, articleData);
    await article.save();
  } else {
    article = await Article.create(articleData);
  }

  await Issue.findByIdAndUpdate(issue._id, {
    $addToSet: { articles: article._id },
    $set: { isPublished: true },
  });

  submission.auditLog.push({
    actor: userId,
    action: 'article-created',
    toStatus: submission.status,
    comments: `Article assigned to Vol. ${issue.volume}, Issue ${issue.issueNumber}.`,
  });

  return article;
}

async function createSubmission({ body, files, user }) {
  const isDraft = body.saveAsDraft === 'true' || body.status === 'draft';
  const authors = parseJson(body.authors, []);
  const declarations = parseJson(body.declarations, {});
  const suggestedReviewers = normalizeReviewers(body.suggestedReviewers);
  if (!isDraft) {
    const required = ['articleType', 'title', 'abstract'];
    const missing = required.filter((field) => !body[field]);
    if (missing.length) {
      const error = new Error(`Missing required fields: ${missing.join(', ')}.`);
      error.status = 400;
      throw error;
    }
    if (!declarations.officialTemplate || !declarations.coverLetterComplete || !declarations.ethics || !declarations.journalPolicies) {
      const error = new Error('Official template, cover page, ethics, and journal policy declarations are required.');
      error.status = 400;
      throw error;
    }
    assertReviewers({ suggestedReviewers });
  }

  const uploaded = await uploadSubmissionFiles(files, user._id);
  if (!isDraft) {
    ensureSubmissionDocument(uploaded.coverPageFile, 'Cover page file');
    ensureSubmissionDocument(uploaded.manuscriptFile, 'Manuscript file');
  }
  const submission = await Submission.create({
    submissionId: isDraft ? undefined : await nextSubmissionId(),
    articleType: body.articleType,
    title: body.title,
    abstract: body.abstract,
    keywords: normalizeKeywords(body.keywords),
    authors,
    correspondingAuthor: user._id,
    coverPageFile: uploaded.coverPageFile,
    manuscriptFile: uploaded.manuscriptFile,
    supplementaryFiles: uploaded.supplementaryFiles,
    coverLetter: body.coverLetter,
    conflictOfInterest: body.conflictOfInterest,
    ethicalApprovalNumber: body.ethicalApprovalNumber,
    suggestedReviewers,
    declarations,
    status: isDraft ? 'draft' : 'submitted',
    submittedAt: isDraft ? undefined : new Date(),
    auditLog: [
      {
        actor: user._id,
        action: isDraft ? 'draft-saved' : 'submitted',
        toStatus: isDraft ? 'draft' : 'submitted',
        comments: isDraft ? 'Draft saved by author.' : 'Submission received.',
      },
    ],
  });

  if (!isDraft) {
    const authorEmails = (authors || []).map((a) => a.email).filter(Boolean);
    const recipients = [...new Set([user.email, ...authorEmails].filter(Boolean))];
    const mail = submissionConfirmationEmail({
      submissionId: submission.submissionId,
      title: submission.title,
      authorName: user.fullName || user.email,
      articleType: submission.articleType,
    });
    sendJournalEmail({ to: recipients, ...mail }).catch((err) =>
      console.error('[email error] submission confirmation:', err.message)
    );
  }

  return { success: true, data: submission };
}

async function listSubmissions({ user, query }) {
  const filter = {};
  if (!['editor', 'admin', 'superadmin'].includes(user.role)) {
    filter.correspondingAuthor = user._id;
  }
  if (query.status) filter.status = query.status;
  if (query.q) filter.$text = { $search: query.q };

  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
  const [data, total] = await Promise.all([
    Submission.find(filter)
      .populate('correspondingAuthor', 'fullName email affiliation')
      .populate('assignedIssue', 'volume issueNumber season year isPublished')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Submission.countDocuments(filter),
  ]);

  await addSignedDocumentUrls(data);

  return { success: true, data, total, page, limit };
}

async function getSubmission({ id, user }) {
  const submission = await Submission.findById(id)
    .populate('correspondingAuthor', 'fullName email affiliation orcid')
    .populate('auditLog.actor', 'fullName email role')
    .populate('assignedIssue', 'volume issueNumber season year isPublished');
  if (!submission) {
    const error = new Error('Submission not found.');
    error.status = 404;
    throw error;
  }
  // ensureAuthorAccess(submission, user);
  await addSignedDocumentUrls(submission);
  return { success: true, data: submission };
}

async function updateSubmission({ id, body, files, user }) {
  const submission = await Submission.findById(id);
  if (!submission) {
    const error = new Error('Submission not found.');
    error.status = 404;
    throw error;
  }
  ensureAuthorAccess(submission, user);

  if (String(submission.correspondingAuthor) !== String(user._id)) {
    const error = new Error('Only the corresponding author can update or revise a submission.');
    error.status = 403;
    throw error;
  }
  if (!editableAuthorStatuses.has(submission.status)) {
    const error = new Error('Submissions can only be edited while draft, submitted, or revision required.');
    error.status = 400;
    throw error;
  }

  const isRevision = submission.status === 'revision-required';
  const uploaded = await uploadSubmissionFiles(files, user._id);
  const previousStatus = submission.status;

  ['articleType', 'title', 'abstract', 'coverLetter', 'conflictOfInterest', 'ethicalApprovalNumber'].forEach((field) => {
    if (body[field] !== undefined) submission[field] = body[field];
  });
  if (body.keywords !== undefined) submission.keywords = normalizeKeywords(body.keywords);
  if (body.authors !== undefined) submission.authors = parseJson(body.authors, submission.authors);
  if (body.declarations !== undefined) submission.declarations = parseJson(body.declarations, submission.declarations);
  if (body.suggestedReviewers !== undefined) submission.suggestedReviewers = normalizeReviewers(body.suggestedReviewers);
  if (uploaded.coverPageFile) submission.coverPageFile = uploaded.coverPageFile;
  if (uploaded.manuscriptFile) submission.manuscriptFile = uploaded.manuscriptFile;
  if (uploaded.supplementaryFiles.length) submission.supplementaryFiles = uploaded.supplementaryFiles;

  const willRemainDraft = previousStatus === 'draft' && body.saveAsDraft === 'true';
  if (!willRemainDraft) {
    assertReviewers({ suggestedReviewers: submission.suggestedReviewers });
  }

  if (submission.status === 'draft' && body.saveAsDraft !== 'true') {
    submission.submissionId = submission.submissionId || await nextSubmissionId();
    submission.status = 'submitted';
    submission.submittedAt = new Date();
  } else if (isRevision) {
    submission.status = 'submitted';
    submission.revisions.push({
      manuscriptFile: uploaded.manuscriptFile || submission.manuscriptFile,
      supplementaryFiles: uploaded.supplementaryFiles,
      coverLetter: body.coverLetter,
      submittedAt: new Date(),
    });
  }

  submission.auditLog.push({
    actor: user._id,
    action: isRevision ? 'revision-submitted' : 'updated',
    fromStatus: previousStatus,
    toStatus: submission.status,
    comments: isRevision ? 'Author submitted a revised manuscript.' : 'Submission updated by author.',
  });

  await submission.save();
  return { success: true, data: submission };
}

async function withdrawSubmission({ id, user }) {
  const submission = await Submission.findById(id);
  if (!submission) {
    const error = new Error('Submission not found.');
    error.status = 404;
    throw error;
  }
  if (String(submission.correspondingAuthor) !== String(user._id)) {
    const error = new Error('Only the corresponding author can withdraw a submission.');
    error.status = 403;
    throw error;
  }
  if (['accepted', 'rejected'].includes(submission.status)) {
    const error = new Error('Finalized submissions cannot be withdrawn.');
    error.status = 400;
    throw error;
  }
  const previousStatus = submission.status;
  submission.status = 'withdrawn';
  submission.auditLog.push({
    actor: user._id,
    action: 'withdrawn',
    fromStatus: previousStatus,
    toStatus: 'withdrawn',
    comments: 'Submission withdrawn by author.',
  });
  await submission.save();
  return { success: true, data: submission };
}

async function updateStatus({ id, user, body }) {
  const { decision, comments, issue } = body;
  if (!['accept', 'request-revision', 'reject', 'under-review'].includes(decision)) {
    const error = new Error('Decision must be accept, request-revision, reject, or under-review.');
    error.status = 400;
    throw error;
  }
  if (decision !== 'under-review' && !comments) {
    const error = new Error('Decision comments are required.');
    error.status = 400;
    throw error;
  }

  const submission = await Submission.findById(id).populate('correspondingAuthor', 'fullName email');
  if (!submission) {
    const error = new Error('Submission not found.');
    error.status = 404;
    throw error;
  }

  const statusMap = {
    accept: 'accepted',
    'request-revision': 'revision-required',
    reject: 'rejected',
    'under-review': 'under-review',
  };
  const previousStatus = submission.status;
  submission.status = statusMap[decision];
  submission.auditLog.push({
    actor: user._id,
    action: 'editorial-decision',
    fromStatus: previousStatus,
    toStatus: submission.status,
    comments,
  });
  await submission.save();

  if (decision !== 'under-review') {
    await EditorialDecision.create({
      submission: submission._id,
      editor: user._id,
      decision,
      comments,
      round: Math.max(submission.revisions.length + 1, 1),
    });
  }

  const dashboardUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/dashboard` : null;
  const mail = editorialDecisionEmail({
    submissionId: submission.submissionId || 'Draft',
    title: submission.title,
    authorName: submission.correspondingAuthor?.fullName || submission.correspondingAuthor?.email || 'Author',
    status: submission.status,
    decision,
    comment: comments || null,
    dashboardUrl,
  });
  sendJournalEmail({ to: submission.correspondingAuthor?.email, ...mail }).catch((err) =>
    console.error('[email error] editorial decision:', err.message)
  );

  return { success: true, data: submission };
}

async function publishSubmission({ id, user, body }) {
  const { issue: issueId } = body;

  if (!issueId) {
    const error = new Error('A volume and issue must be selected before publishing.');
    error.status = 400;
    throw error;
  }

  const submission = await Submission.findById(id).populate('correspondingAuthor', 'fullName email orcid');
  if (!submission) {
    const error = new Error('Submission not found.');
    error.status = 404;
    throw error;
  }

  if (submission.status !== 'accepted') {
    const error = new Error('Only accepted submissions can be published.');
    error.status = 400;
    throw error;
  }

  const issue = await Issue.findById(issueId);
  if (!issue) {
    const error = new Error('Selected issue was not found.');
    error.status = 404;
    throw error;
  }

  if (!issue.isPublished) {
    const error = new Error(`Vol. ${issue.volume}, Issue ${issue.issueNumber} (${issue.year}) has not been published yet. Please publish the issue first before publishing this manuscript.`);
    error.status = 400;
    throw error;
  }

  let article = await Article.findOne({ submission: submission._id });
  const articleData = {
    title: submission.title,
    abstract: submission.abstract,
    keywords: submission.keywords,
    articleType: submission.articleType,
    authors: submission.authors,
    issue: issue._id,
    submission: submission._id,
    volume: issue.volume,
    issueNumber: issue.issueNumber,
    publishedAt: new Date(),
    pdfUrl: submission.manuscriptFile?.url || submission.manuscriptFile?.publicUrl,
    pdfKey: submission.manuscriptFile?.key,
    isPublished: true,
  };

  if (article) {
    Object.assign(article, articleData);
    await article.save();
  } else {
    article = await Article.create(articleData);
  }

  await Issue.findByIdAndUpdate(issue._id, {
    $addToSet: { articles: article._id },
  });

  const previousStatus = submission.status;
  submission.status = 'published';
  submission.auditLog.push({
    actor: user._id,
    action: 'published',
    fromStatus: previousStatus,
    toStatus: 'published',
    comments: `Published to Vol. ${issue.volume}, Issue ${issue.issueNumber} (${issue.year}).`,
  });
  await submission.save();

  const dashboardUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/dashboard` : null;
  const mail = editorialDecisionEmail({
    submissionId: submission.submissionId || 'Draft',
    title: submission.title,
    authorName: submission.correspondingAuthor?.fullName || submission.correspondingAuthor?.email || 'Author',
    status: 'published',
    decision: 'publish',
    comment: `Your article has been published in Vol. ${issue.volume}, Issue ${issue.issueNumber} (${issue.year}).`,
    dashboardUrl,
  });
  sendJournalEmail({ to: submission.correspondingAuthor?.email, ...mail }).catch((err) =>
    console.error('[email error] publish notification:', err.message)
  );

  return { success: true, data: submission };
}

async function assignIssue({ id, user, body }) {
  const { issueId } = body;

  const submission = await Submission.findById(id);
  if (!submission) {
    const error = new Error('Submission not found.');
    error.status = 404;
    throw error;
  }

  // Cannot change assignment once published
  if (submission.status === 'published') {
    const error = new Error('Issue assignment is locked after a submission is published.');
    error.status = 400;
    throw error;
  }

  if (issueId) {
    const issue = await Issue.findById(issueId);
    if (!issue) {
      const error = new Error('Issue not found.');
      error.status = 404;
      throw error;
    }
    submission.assignedIssue = issue._id;
  } else {
    submission.assignedIssue = null;
  }

  await submission.save();

  // Return with populated issue
  const populated = await Submission.findById(submission._id)
    .populate('assignedIssue', 'volume issueNumber season year isPublished')
    .populate('correspondingAuthor', 'fullName email affiliation');

  return { success: true, data: populated };
}

module.exports = {
  createSubmission,
  listSubmissions,
  getSubmission,
  updateSubmission,
  withdrawSubmission,
  updateStatus,
  publishSubmission,
  assignIssue,
};
