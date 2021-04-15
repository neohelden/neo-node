# Neo SDK: Node.js

## @neohelden/node

> Neo SDK for Node.js with some additional libraries to support the development of Neo Sentinels (NSX).

## Terminology

- **Task**: A task (or Sentinel Task) is a job processed or created by so called Sentinels.
- **Sentinel**: Fancy name for a worker consuming / producing tasks. They are usually not that evil.
- **Particle**: All tasks / messages / responses flowing through the Neo internals are generalized as „particles“. Particles can be the payload for tasks, the response to the Neo client or just some metadata. Particles have to be objects.

## Installation

```bash
yarn add @neohelden/node
```

## Configuration

The Neo SDK can be configured through environment variables (ENVs in short). The following ENVs are supported:

- `NPQ_DISABLE_AUTOCONNECT`: Set to `true` in order to prevent the SDK from autoconnecting.
- `NPQ_NAME`: A identifiable name for your Sentinel.
- `NPQ_CA`: A base64 encoded CA used for The [NATS TLS Option](https://docs.nats.io/developing-with-nats/security/tls)
- `NPQ_CERT`: A base64 encoded string used as a client certificate (signed by the `NPQ_CA`)
- `NPQ_CERT_KEY`: A base64 encoded private key belonging to the `NPQ_CERT`.

## Tasks

```js
const neo = require('@neohelden/node')

// processing tasks requires a queue name
// the request object will be passed to the provided processor (a function)
// the "processor" should use async / await
// in case an error occurs, the exception will automatically be handled
neo.task.process('nsx.dev.example.sayHello', async function (req) {
  if (!'user' in req) {
    throw new Error('Username is required')
  }

  let res = `Hi there, ${req.user}`
  return res
})

// Using a function instead of an arrow function expression enables you to use "scoped helpers"
// like e.g. preconfigured i18n (scoped for the respective particle)
// more scoped helpers will be added in future releases
neo.task.process('nsx.dev.example.sayHello', async function (particle) {
  let translation = this.__('hello world')
  return { reply: { string: translation } }
})

// the task / message can contain anything
// for best compatibility it should be a particle
neo.task.create('nsx.dev.example.sayHello', {
  user: 'John',
})

// closing connection to the NATS
neo.task.disconnect()
```

## NPQ

```js
const npq = require('@neohelden/node').npq

// assuming the particle is defined somewhere else
npq.publish('channel.email', particle)
```

### Timeout

Tasks can run into timeouts if they are not being processed in a specific timeframe. The default value is defined as `TASK_TIMEOUT=8000` (8s). But you can overwrite the timeout in the optional `opts` parameter:

```js
neo.task.create(
  'nsx.dev.example.sayHello',
  {
    foo: 'bar',
  },
  { timeout: 3000 }
) // sets the timeout for this task to 3s
```

## Logging (optional)

> Module for logging information (based on Bristol).

```js
const logger = require('@neohelden/node').log

logger.info('Neo informs.')
logger.warn('Neo warns.')
logger.error('aaaah, houston?')
```

## i18n (optional)

> Module for Internationalization (based on i18n). Translations should be placed in the root folder under `/locales`.

```js
const i18n = require('@neohelden/node').i18n

// to simplify scoping and prevent polluting the global namespace,
// i18n allows you to register the i18n functions to an object
let foobar = {}
i18n(foobar)

foobar.__('hello world')

// you can set the locale explicitly by specifiying "this.locale"
let fixed_locale = {
  locale: 'de-DE',
}
fixed_locale.__('hello world') // would result in "hallo welt"
```

## Sentry (Exception logging)

```js
const sentry = require('@neohelden/node').sentry

// You can use .up() to initialize Sentry
// Most parameters will be filled out by default
// e.g. WORKSPACE will be taken from the ENV
//      or release will be taken from the parent package
sentry.up({
  release: 'v0.1.0',
})
```
