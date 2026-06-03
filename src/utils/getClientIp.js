// utils/getClientIp.js
exports.getClientIp = (req = {}) => {
  try {
    const forwarded = req.headers && req.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    console.log({
  'x-forwarded-for': req.headers?.['x-forwarded-for'],
  'req.ip': req.ip,
  'req.socket.remoteAddress': req.socket?.remoteAddress,
  'req.connection.remoteAddress': req.connection?.remoteAddress,
  'req.headers.host': req.headers?.host,
});
    return (
      req.socket?.remoteAddress ||
      req.connection?.remoteAddress ||
      req.ip ||
      'Unknown'
    );
  } catch (err) {
    console.error('Error extracting client IP:', err.message);
    return 'Unknown';
  }
};
