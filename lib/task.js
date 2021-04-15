'use strict'

const _ = require('lodash')
const Nats = require('nats')
const i18n = require('./i18n')
const log = require('./log')
const logger = log.child({ context: 'NPQ' })
const sentry = require('./sentry')

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
  json: true,
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

if (process.env.NPQ_CA && process.env.NPQ_CERT && process.env.NPQ_CERT_KEY) {
  natsOpts.tls = {
    ca: Buffer.from(process.env.NPQ_CA, 'base64'),
    cert: Buffer.from(process.env.NPQ_CERT, 'base64'),
    key: Buffer.from(process.env.NPQ_CERT_KEY, 'base64'),
  }
}

function initializeNats() {
  nats = Nats.connect(natsOpts)
  nats.on('error', (err) => logger.error(err))
  nats.on('connect', (nc) =>
    logger.info(`Connected to ${nc.currentServer.url.host}`)
  )
  nats.on('disconnect', () => logger.info('Disconnected'))
  nats.on('reconnecting', () => logger.info('Reconnecting'))
  nats.on('reconnect', (nc) =>
    logger.info(`Reconnecting ${nc.currentServer.url.host}`)
  )
  nats.on('close', () => logger.debug('Connection closed'))
}

if (!process.env.NPQ_DISABLE_AUTOCONNECT) {
  initializeNats()
}

module.exports = {
  npq: nats,
  create: (queue, particle, opts) => {
    return new Promise((resolve, reject) => {
      nats.requestOne(
        queue,
        particle,
        {},
        _.get(opts, 'timeout', TASK_TIMEOUT),
        (response) => {
          if (
            response instanceof Nats.NatsError &&
            response.code === Nats.REQ_TIMEOUT
          ) {
            response.message = `The request timed out for task: ${queue}`
            reject(response)
          } else if (_.get(response, 'error')) {
            let err = new Error(
              _.get(response, 'error.message', 'Unknown error')
            )
            err.id = _.get(response, 'error.id')
            reject(err)
          } else {
            resolve(response)
          }
        }
      )
    })
  },
  process: (queue, processor) => {
    nats.subscribe(queue, async function (particle, replyTo, subject) {
      let processorScope = {
        // Set the locale of the processor to simplify i18n usage
        locale: _.get(particle, 'request.locale', 'de-DE'),
      }

      i18n(processorScope)

      try {
        let res = await processor.call(processorScope, particle, subject)
        if (replyTo && !_.isUndefined(res)) {
          nats.publish(replyTo, res)
        }
      } catch (e) {
        let sentryId = sentry.captureException(e)
        logger.error(
          `[NEO:TASK] Error processing task for ${queue} (Sentry-ID: ${sentryId})`
        )

        if (replyTo) {
          let res = {
            error: {
              id: sentryId,
              code: '500',
              name: e.name,
              message: e.message,
            },
          }

          nats.publish(replyTo, res)
        }
      }
    })
  },
  connect: initializeNats,
  disconnect: () => {
    logger.debug('Closing connection to NPQ')
    nats.close()
  },
}
