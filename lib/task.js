'use strict'

const _ = require('lodash')
const Nats = require('nats')
const i18n = require('./i18n')
const winston = require('./log')

const NPQ_HOST = process.env.NPQ_HOST || 'npq'
const NPQ_PORT = process.env.NPQ_PORT || 4222
const NPQ_USER = process.env.NPQ_USER || 'neo'
const NPQ_PASS = process.env.NPQ_PASS
const NPQ_NAME = process.env.NPQ_NAME // the client's name

let nats = null
const TASK_TIMEOUT = 8000

let natsOpts = {
  maxReconnectAttempts: -1,
  reconnectTimeWait: 2000,
  waitOnFirstConnect: true,

  url: `nats://${NPQ_HOST}:${NPQ_PORT}`,
  json: true
}

if (NPQ_NAME) {
  natsOpts.name = NPQ_NAME
}

if (NPQ_USER) {
  natsOpts.user = NPQ_USER
}

if (NPQ_PASS) {
  natsOpts.pass = NPQ_PASS
}

function initializeNats() {
  nats = Nats.connect(natsOpts)
  nats.on('error', (err) => winston.error(err))
  nats.on('connect', (nc) => winston.info(`[NEO:TASK] Connected to ${nc.currentServer.url.host}`))
  nats.on('disconnect', () => winston.info('[NEO:TASK] Disconnect'))
  nats.on('reconnecting', () => winston.info('[NEO:TASK] Reconnecting'))
  nats.on('reconnect', (nc) => winston.info(`[NEO:TASK] Reconnect ${nc.currentServer.url.host}`))
  nats.on('close', () => winston.debug('[NEO:TASK] Close'))
}

initializeNats()

module.exports = {
  create: (queue, particle, opts) => {
    return new Promise((resolve, reject) => {
      nats.requestOne(queue, particle, {}, _.get(opts, 'timeout', TASK_TIMEOUT), (response) => {
        if (response instanceof Nats.NatsError && response.code === Nats.REQ_TIMEOUT) {
          reject(response)
        } else {
          resolve(response)
        }
      })
    })
  },
  process: (queue, processor) => { // pun intended
    winston.debug(`[NEO:TASK] Registering processor for "${queue}"`)
    nats.subscribe(queue, function (particle, replyTo, subject) {
      let processorScope = {
        // Set the locale of the processor to simplify i18n usage
        locale: _.get(particle, 'request.locale', 'de-DE')
      }

      i18n(processorScope)

      Promise.resolve(processor.call(processorScope, particle, subject)).then((res) => {
        winston.debug(`[NEO:TASK] Done processing task for "${queue}"`)
        if (_.isUndefined(res)) {
          winston.debug(`[NEO:TASK] Result for task "${queue}" was undefined. Skipping reply.`)
          return
        }

        nats.publish(replyTo, res)
      }).catch(e => {
        winston.error(`[NEO:TASK] Error processing task for ${queue}`)
        console.error(e)
      })
    })
  },
  connect: initializeNats,
  disconnect: () => {
    winston.debug('[NEO:TASK] Closing connection to NPQ')
    nats.close()
  }
}
