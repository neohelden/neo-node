
const pino = require('pino')

const log = pino({
  prettyPrint: {
    levelFirst: true,
    colorize: true,
    translateTime: true
  }
})

module.exports = log