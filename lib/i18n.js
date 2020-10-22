const i18n = require('i18n')
const logger = require('./log')
const path = require('path')
const localesDir = path.resolve(process.cwd(), 'locales')

module.exports = function (obj) {
  i18n.configure({
    locales: ['en-US', 'de-DE'],
    directory: localesDir,
    defaultLocale: 'de-DE',
    register: obj,
    preserveLegacyCase: false,
    updateFiles: false,
  })
}
