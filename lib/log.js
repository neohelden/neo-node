
const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: process.env.NEO_LOGGING_LEVEL || 'debug',
  format: format.combine(
    format.colorize(),
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.splat(),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [new transports.Console()]
});

module.exports = logger;
