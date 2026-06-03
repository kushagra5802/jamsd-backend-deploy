const contactService = require('../services/contact.service');

async function sendContactMessage(req, res, next) {
  try {
    const result = await contactService.sendContactMessage(req.body);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = { sendContactMessage };
