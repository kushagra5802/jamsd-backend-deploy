const express = require('express');
const upload = require('../middleware/upload');
const submissionController = require('../controllers/submission.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const submissionUpload = upload.fields([
  { name: 'coverLetter', maxCount: 1 },
  { name: 'manuscript', maxCount: 1 },
  { name: 'supplementary', maxCount: 5 },
]);
const publishUpload = upload.fields([{ name: 'image', maxCount: 1 }]);

router.use(authenticate);

router.post('/', submissionUpload, submissionController.createSubmission);
router.get('/', submissionController.listSubmissions);
router.get('/:id', submissionController.getSubmission);
router.put('/:id', submissionUpload, submissionController.updateSubmission);
router.delete('/:id', submissionController.withdrawSubmission);
router.post('/:id/status', authorize('editor', 'admin', 'superadmin'), submissionController.updateStatus);
router.post('/:id/publish', authorize('editor', 'admin', 'superadmin'), publishUpload, submissionController.publishSubmission);
router.patch('/:id/assign-issue', authorize('editor', 'admin', 'superadmin'), submissionController.assignIssue);

module.exports = router;
