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
    // The path for the incoming webhook. This is the key used to store
    // the webhook creator in the webhooks decorator.
    path: '/github',
    // The incoming webhook route. This is what is called by github when
    // a subscribed event occurs.
    plugin: async (fastify) => fastify.post('/github', (req, res) => {
      // do something with the event payload
      res.send('ok')
    }),
    create: async () => {
      // Add logic here for creating the webhook on the upstream service.
      // e.g https://docs.github.com/en/rest/reference/webhooks#create-a-repository-webhook
    }
  },
]

const verification = async (fastify, opts) => {
  // Define a plugin that registers a hook here that verifies the request.
  fastify.addHook('preValidation', async (request, response) => {
    // Signature verification should happen inside this hook
    // https://docs.github.com/en/developers/webhooks-and-events/webhooks/securing-your-webhooks
  })
}

const app = require('fastify')()

app.register(fastifyWebhook, { webhooks, verification })

app.post('/create-webhook', (request, response) => {
  const createWebhook = app.webhooks.get('/github')
  await createWebhook()
  res.send('ok')
})

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
###### - `path`
The path the webhook will be registered at in your   application

###### - `plugin`
A fastify plugin that will be registered to handle the webhook route.

###### - `create` (optional)
A function that may be called as a decorator to create an upstream webhook. (e.g:
an POST to a 3rd party service like [github](https://docs.github.com/en/restreference/webhooks#create-a-repository-webhook)

##### - `verification` (required)

A fastify plugin that will encapsulate the webhooks plugins. Typically a plugin
that registers a preValidation hook which is used to verify a request signature.

##### - `namespace` (optional)

The namespace under which all create functions will be exposed as decorators.

#### Decorators

All `create` methods will be added to the fastify instance under the provided
namespace. Each key in the namespace is the path for the webhook.

```js
const createUpstreamHello = fastify.webhooks.get('/hello')
await createUpstreamHello(some, args)
```

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
