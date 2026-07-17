const express = require('express');
const upload = require('../middleware/upload');
const issueController = require('../controllers/issue.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const issueUpload = upload.fields([{ name: 'image', maxCount: 1 }]);

router.get('/', issueController.listIssues);
router.get('/:id', issueController.getIssue);
router.post('/', authenticate, authorize('admin', 'superadmin'), issueUpload, issueController.createIssue);
router.patch('/:id/publish', authenticate, authorize('admin', 'superadmin', 'editor'), issueController.publishIssue);
router.patch('/:id/unpublish', authenticate, authorize('admin', 'superadmin', 'editor'), issueController.unpublishIssue);

module.exports = router;
