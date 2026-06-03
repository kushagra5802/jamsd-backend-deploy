const articleService = require('../services/article.service');

async function listArticles(req, res, next) {
  try {
    return res.json(await articleService.listArticles(req.query));
  } catch (error) {
    return next(error);
  }
}

async function getArticle(req, res, next) {
  try {
    return res.json(await articleService.getArticle(req.params.id));
  } catch (error) {
    return next(error);
  }
}

async function createArticle(req, res, next) {
  try {
    return res.status(201).json(await articleService.createArticle({ body: req.body, files: req.files, user: req.user }));
  } catch (error) {
    return next(error);
  }
}

async function updateArticle(req, res, next) {
  try {
    return res.json(await articleService.updateArticle({ id: req.params.id, body: req.body, files: req.files, user: req.user }));
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
};
