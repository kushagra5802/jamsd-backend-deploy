const express = require('express');
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, authorize('admin', 'superadmin', 'editor'));

router.get('/dashboard', adminController.dashboard);
router.get('/users', adminController.listUsers);
router.put('/users/:id/role', authorize('admin', 'superadmin'), adminController.updateUserRole);
router.get('/submissions', adminController.listSubmissions);
router.get('/editorial-decisions', adminController.listEditorialDecisions);

module.exports = router;
