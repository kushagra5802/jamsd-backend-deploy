const submissionService = require('../services/submission.service');

async function createSubmission(req, res, next) {
  try {
    return res.status(201).json(await submissionService.createSubmission({ body: req.body, files: req.files, user: req.user }));
  } catch (error) {
    return next(error);
  }
}

async function listSubmissions(req, res, next) {
  try {
    return res.json(await submissionService.listSubmissions({ user: req.user, query: req.query }));
  } catch (error) {
    return next(error);
  }
}

async function getSubmission(req, res, next) {
  try {
    return res.json(await submissionService.getSubmission({ id: req.params.id, user: req.user }));
  } catch (error) {
    return next(error);
  }
}

async function updateSubmission(req, res, next) {
  try {
    return res.json(await submissionService.updateSubmission({ id: req.params.id, body: req.body, files: req.files, user: req.user }));
  } catch (error) {
    return next(error);
  }
}

async function withdrawSubmission(req, res, next) {
  try {
    return res.json(await submissionService.withdrawSubmission({ id: req.params.id, user: req.user }));
  } catch (error) {
    return next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    return res.json(await submissionService.updateStatus({ id: req.params.id, user: req.user, body: req.body }));
  } catch (error) {
    return next(error);
  }
}

async function publishSubmission(req, res, next) {
  try {
    return res.json(await submissionService.publishSubmission({ id: req.params.id, user: req.user, body: req.body }));
  } catch (error) {
    return next(error);
  }
}

async function assignIssue(req, res, next) {
  try {
    return res.json(await submissionService.assignIssue({ id: req.params.id, user: req.user, body: req.body }));
  } catch (error) {
    return next(error);
  }
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
