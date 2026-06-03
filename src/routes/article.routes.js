const express = require('express');
const upload = require('../middleware/upload');
const articleController = require('../controllers/article.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const articleUpload = upload.fields([{ name: 'pdf', maxCount: 1 }]);

router.get('/', articleController.listArticles);
router.get('/:id', articleController.getArticle);
router.post('/', authenticate, authorize('editor', 'admin', 'superadmin'), articleUpload, articleController.createArticle);
router.put('/:id', authenticate, authorize('editor', 'admin', 'superadmin'), articleUpload, articleController.updateArticle);

module.exports = router;
