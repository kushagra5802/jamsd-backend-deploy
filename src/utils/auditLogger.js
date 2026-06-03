const AuditLog = require('../modules/auditLog/auditLog.model');

exports.createAuditLog = async ({ userId,userName, userRole, action, details, ipAddress }) => {
  try {
    console.log("userId,userName, userRole, action, details",userId,userName, userRole, action, details)
    await AuditLog.create({ userId, userName, userRole, action, details, ipAddress });
  } catch (err) {
    console.error('Error saving audit log:', err);
  }
};