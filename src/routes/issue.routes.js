const express = require('express');
const issueController = require('../controllers/issue.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', issueController.listIssues);
router.get('/:id', issueController.getIssue);
router.post('/', authenticate, authorize('admin', 'superadmin'), issueController.createIssue);
router.patch('/:id/publish', authenticate, authorize('admin', 'superadmin', 'editor'), issueController.publishIssue);
router.patch('/:id/unpublish', authenticate, authorize('admin', 'superadmin', 'editor'), issueController.unpublishIssue);

module.exports = router;
