const adminService = require('../services/admin.service');

async function dashboard(req, res, next) {
  try {
    return res.json(await adminService.dashboard());
  } catch (error) {
    return next(error);
  }
}

async function listUsers(req, res, next) {
  try {
    return res.json(await adminService.listUsers(req.query));
  } catch (error) {
    return next(error);
  }
}

async function updateUserRole(req, res, next) {
  try {
    return res.json(await adminService.updateUserRole({ id: req.params.id, role: req.body.role }));
  } catch (error) {
    return next(error);
  }
}

async function listSubmissions(req, res, next) {
  try {
    return res.json(await adminService.listSubmissions(req.query));
  } catch (error) {
    return next(error);
  }
}

async function listEditorialDecisions(req, res, next) {
  try {
    return res.json(await adminService.listEditorialDecisions());
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  dashboard,
  listUsers,
  updateUserRole,
  listSubmissions,
  listEditorialDecisions,
};
