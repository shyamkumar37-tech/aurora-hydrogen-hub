const formatTimestamp = () => new Date().toISOString();

const logger = {
  info: (message, meta = {}) => {
    console.log(`[${formatTimestamp()}] [INFO] ${message}`, Object.keys(meta).length ? meta : '');
  },
  warn: (message, meta = {}) => {
    console.warn(`[${formatTimestamp()}] [WARN] ${message}`, Object.keys(meta).length ? meta : '');
  },
  error: (message, meta = {}) => {
    console.error(`[${formatTimestamp()}] [ERROR] ${message}`, Object.keys(meta).length ? meta : '');
  },
  audit: (action, actor, details = {}) => {
    console.log(`[${formatTimestamp()}] [AUDIT] ${actor} -> ${action}`, details);
  }
};

module.exports = logger;
