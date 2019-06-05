# neo-node

> Meta library for common Node.js dependencies necessary / recommended for developing Neo Sentinels.

## Terminology
- **Neotask**: A Neotask is a job / task processed or created by so called Sentinels.
- **Sentinel**: Fancy name for a worker consuming / producing Neotasks. They are usually not that evil.
- **Particle**: All tasks / messages / responses flowing through the Neo internals are generalized as „particles“. Particles can be the payload for tasks, the response to the Neo client or just some metadata. Particles have to be objects – official particle types will be specified in the future.

## Installation
```bash
npm i --save neohelden/neo-node
```

## Tasks
```js
const neotask = require('neo-node').task

// processing tasks requires a queue name
// the particle will be passed to the provided processor
// the "processor" can then return a promise
neotask.process('neo.aurora.intent.hello_world', function (particle) {
  return { reply: { string: 'Hi there, how are you today?' } }
})

// Using a function instead of an arrow function expression enables you to use "scoped helpers"
// like e.g. preconfigured i18n (scoped for the respective particle)
// more scoped helpers will be added in future releases
neotask.process('neo.aurora.intent.hello_world', function (particle) {
  let translation = this.__('hello world')
  return { reply: { string: translation } }
})

// the task / message can contain anythin
// for best compatibility it should be a particle
neotask.create('neo.aurora.intent.hello_world', {
  foo: 'bar'
})

// create new connection to the NATS
neotask.connect()

// closing connection to the NATS
neotask.disconnect()
```

## Logging (optional)
> Module for logging information (based on Winston).
```js
const logger = require('neo-node').log

logger.info('Neo informs.')
logger.warn('Neo warns.')
logger.error('aaaah, houston?')
```

## i18n (optional)
> Module for Internationalization (based on i18n). Translations should be placed in the root folder under `/locales`.
```js
const i18n = require('neo-node').i18n

// to simplify scoping and prevent polluting the global namespace,
// i18n allows you to register the i18n functions to an object
let foobar = {}
i18n(foobar)

foobar.__('hello world')

// you can set the locale explicitly by specifiying "this.locale"
let fixed_locale = {
  locale: 'de-DE'
}
fixed_locale.__('hello world') // would result in "hallo welt"
```
