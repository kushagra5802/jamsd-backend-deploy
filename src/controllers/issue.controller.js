const issueService = require('../services/issue.service');

async function listIssues(req, res, next) {
  try {
    return res.json(await issueService.listIssues(req.query));
  } catch (error) {
    return next(error);
  }
}

async function getIssue(req, res, next) {
  try {
    return res.json(await issueService.getIssue(req.params.id));
  } catch (error) {
    return next(error);
  }
}

async function createIssue(req, res, next) {
  try {
    return res.status(201).json(await issueService.createIssue(req.body));
  } catch (error) {
    return next(error);
  }
}

async function publishIssue(req, res, next) {
  try {
    return res.json(await issueService.publishIssue(req.params.id));
  } catch (error) {
    return next(error);
  }
}

async function unpublishIssue(req, res, next) {
  try {
    return res.json(await issueService.unpublishIssue(req.params.id));
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listIssues,
  getIssue,
  createIssue,
  publishIssue,
  unpublishIssue,
};
