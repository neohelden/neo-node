const _ = require('lodash')
const SentryDSN = _.get(process, 'env.SENTRY_DSN', null);
const Sentry = require('@sentry/node');
const logger = require('./log')
const readPkgUp = require('read-pkg-up');

let sentryOpts = {
  dsn: SentryDSN,
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

module.exports = Sentry

module.exports.up = async function (opts) {
  let parentPkg = await readPkgUp()
  sentryOpts.release = parentPkg.package.version

  return Sentry.init(_.merge(sentryOpts, opts))
}
