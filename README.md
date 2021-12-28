# fastify-webhooks

A plugin for implementing incoming webhooks for fastify applications.

## Install

```
npm i @autotelic/fastify-webhooks
```

## Usage

```js
'use strict'

const fastifyWebhooks = require('@autotelic/fastify-webhooks')

const webhooks = [
  {
    plugin: async (fastify) => fastify.post('/webhook', (req, res) => {
      // do something with the event payload
      res.send('ok')
    }),
  },
]

const verification = async (fastify, opts) => {
  // Define a plugin that registers a hook here that verifies the request.
  fastify.addHook('preValidation', async (request, response) => {
    // Signature verification should happen inside this hook.
  })
}

const app = require('fastify')()

app.register(fastifyWebhook, { webhooks, verification })

await app.ready()

app.listen((err, address) => { console.log(`listening at ${address}`)})

```

## Examples

We provide the following usage examples and recipes:
- [basic](./examples/basic/README.md)

## API

### Plugin

#### Options

The configuration object accepts the following fields":

##### - `webhooks` (required)

An array of webhook configuration objects. Each entry must contain the following
fields:

###### - `plugin`
A fastify plugin that will be registered to handle the webhook route.

##### - `verification` (required)

A fastify plugin that will encapsulate the webhooks plugins. Typically a plugin
that registers a preValidation hook which is used to verify a request signature.

## Github Actions/Workflows

#### Triggering a Release

* Trigger the release workflow via release tag
  ```sh
  git checkout main && git pull
  npm version { minor | major | path }
  git push --follow-tags
  ```

## License

This project is covered under the [MIT](./LICENSE) license.
