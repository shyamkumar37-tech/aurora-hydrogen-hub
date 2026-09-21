const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

const recordAudit = (action, getDetails = null) => {
  return async (req, res, next) => {
    // Intercept response finish to ensure action succeeded
    const originalJson = res.json;
    res.json = function (data) {
      // Restore and call original
      res.json = originalJson;
      const response = res.json.apply(this, arguments);

      // Async write to audit log
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const details = typeof getDetails === 'function' ? getDetails(req, data) : (req.body || {});
        
        AuditLog.create({
          action,
          actorId: req.user ? req.user._id : null,
          actorRole: req.user ? req.user.role : 'anonymous',
          actorEmail: req.user ? req.user.email : null,
          targetResource: req.baseUrl + req.path,
          targetId: req.params.id || req.body.stationId || null,
          details,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent')
        }).catch((err) => logger.error('Failed to write audit log entry', { error: err.message }));
      }

      return response;
    };

    next();
  };
};

module.exports = { recordAudit };
