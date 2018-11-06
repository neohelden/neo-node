'use strict'

const winston = require('winston')

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize({message: true}),
    winston.format.simple(),
    winston.format.printf(msg =>  {
      return `${msg.timestamp} - ${msg.level}: ${msg.message}`
    })
  ),
  transports: [
    new winston.transports.Console()
  ]
})

module.exports = logger