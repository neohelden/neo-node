const i18n = require('i18n')
const winston = require('./log')
const path = require('path')
const localesDir = path.resolve(process.cwd(), 'locales')

winston.debug(`[NEO:I18N] Loading locales from ${localesDir}`)

module.exports = function (obj) {
  i18n.configure({
    locales: ['en-US', 'de-DE'],
    directory: localesDir,
    defaultLocale: 'de-DE',
    register: obj,
    preserveLegacyCase: false,
    updateFiles: false
  })
}
