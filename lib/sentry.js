const _ = require('lodash')
const Sentry = require('@sentry/node');
const logger = require('./log')

let sentryOpts = {
  beforeSend: (event, hint) => {
    let exception = hint.originalException || hint.syntheticException
    if (exception instanceof Promise) {
      exception.catch(logger.error)
    } else {
      logger.error(exception);
    }

    return event
  }
}

// If the WORKSPACE is set through the ENV use this as the environment
if (_.has(process, 'env.WORKSPACE')) {
  sentryOpts.environment = _.get(process, 'env.WORKSPACE')
}

Sentry.init(sentryOpts)

module.exports = Sentry
