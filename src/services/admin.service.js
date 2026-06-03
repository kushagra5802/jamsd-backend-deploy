const User = require('../models/User');
const Submission = require('../models/Submission');
const Article = require('../models/Article');
const EditorialDecision = require('../models/EditorialDecision');
const { publicUser } = require('./auth.service');

async function dashboard() {
  const [submissionCounts, userCount, articleCount, recentSubmissions] = await Promise.all([
    Submission.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    User.countDocuments(),
    Article.countDocuments({ isPublished: true }),
    Submission.find().sort({ createdAt: -1 }).limit(8).select('submissionId title status createdAt articleType'),
  ]);

  return {
    success: true,
    data: {
      submissionCounts: submissionCounts.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      userCount,
      publishedArticleCount: articleCount,
      recentSubmissions,
    },
  };
}

async function listUsers(query) {
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.q) {
    filter.$or = [
      { fullName: new RegExp(query.q, 'i') },
      { email: new RegExp(query.q, 'i') },
      { affiliation: new RegExp(query.q, 'i') },
    ];
  }
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(100);
  return { success: true, data: users.map(publicUser), total: users.length };
}

async function updateUserRole({ id, role }) {
  if (!['author', 'reviewer', 'editor', 'admin', 'superadmin'].includes(role)) {
    const error = new Error('Invalid role.');
    error.status = 400;
    throw error;
  }
  const user = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true });
  if (!user) {
    const error = new Error('User not found.');
    error.status = 404;
    throw error;
  }
  return { success: true, data: publicUser(user) };
}

async function listSubmissions(query) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.q) filter.$text = { $search: query.q };
  const submissions = await Submission.find(filter)
    .populate('correspondingAuthor', 'fullName email affiliation')
    .populate('assignedIssue', 'volume issueNumber season year isPublished')
    .sort({ createdAt: -1 })
    .limit(100);
  return { success: true, data: submissions, total: submissions.length };
}

async function listEditorialDecisions() {
  const decisions = await EditorialDecision.find()
    .populate('submission', 'submissionId title status')
    .populate('editor', 'fullName email')
    .sort({ decidedAt: -1 })
    .limit(100);
  return { success: true, data: decisions, total: decisions.length };
}

module.exports = {
  dashboard,
  listUsers,
  updateUserRole,
  listSubmissions,
  listEditorialDecisions,
};
