'use strict'

const _ = require('lodash')
const i18n = require('./i18n')
const winston = require('./log')

const NATS_HOST = process.env.NATS_HOST // like nats.example.com:4222
const NATS_USER = process.env.NATS_USER
const NATS_PASS = process.env.NATS_PASS
const NATS_NAME = process.env.NATS_NAME // the client's name

const TASK_TIMEOUT = 8000

let natsOpts = {
  maxReconnectAttempts: -1,
  reconnectTimeWait: 2000,
  waitOnFirstConnect: true,

  url: `nats://${NATS_HOST}`,
  json: true
}

if (NATS_NAME) {
  natsOpts.name = NATS_NAME
}

if (NATS_USER) {
  natsOpts.user = NATS_USER
}

if (NATS_PASS) {
  natsOpts.pass = NATS_PASS
}

const nats = require('nats').connect(natsOpts)
nats.on('error', (err) => winston.error(err))
nats.on('connect', (nc) => winston.info(`[NEO:TASK] Connected to ${nc.currentServer.url.host}`))
nats.on('disconnect', () => winston.info('[NEO:TASK] Disconnect'))
nats.on('reconnecting', () => winston.info('[NEO:TASK] Reconnecting'))
nats.on('reconnect', (nc) => winston.info(`[NEO:TASK] Reconnect ${nc.currentServer.url.host}`))
nats.on('close', () => winston.info('[NEO:TASK] Close'))

module.exports = {
  create: (queue, particle) => {
    return new Promise((resolve, reject) => {
      nats.requestOne(queue, particle, {}, TASK_TIMEOUT, resolve)
    })
  },
  process: (queue, processor) => { // pun intended
    winston.info(`[NEO:TASK] Registering processor for "${queue}"`)
    nats.subscribe(queue, function (particle, replyTo) {
      let processorScope = {
        // Set the locale of the processor to simplify i18n usage
        locale: _.get(particle, 'request.locale', 'de-DE')
      }

      i18n(processorScope)

      Promise.resolve(processor.call(processorScope, particle)).then((res) => {
        winston.info(`[NEO:TASK] Done processing task for "${queue}"`)
        nats.publish(replyTo, res)
      })
    })
  }
}
