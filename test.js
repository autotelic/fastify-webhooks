const test = require('ava')
const Fastify = require('fastify')

const fastifyWebhook = require('./')

const webhooks = [
  {
    path: '/webhook',
    plugin: async (fastify) => fastify.post('/webhook', (req, res) => 'OK')
  },
  {
    path: '/webhook-2',
    plugin: (fastify, opts, done) => {
      fastify.post('/webhook-2', (req, res) => 'OK - 2')
      done()
    }
  }
]

test('Encapsulates the validation to the webhooks routes only', async (t) => {
  const verification = async (fastify, opts) => {
    fastify.addHook('preValidation', async (request, response) => {
      if (request.body.user !== 'admin') throw new Error('no good')
    })
  }
  const app = Fastify()
  app.register(fastifyWebhook, { webhooks, verification })

  app.post('/not-webhook', (req, res) => 'OK - not webhook')

  await app.ready()

  function makeRequest ({ url, payload }) {
    return {
      method: 'POST',
      url,
      payload
    }
  }

  const requests = [
    // Includes user body, should trigger and pass the validation hook
    { url: '/webhook', payload: { user: 'admin' } },
    // Includes user body, should trigger and pass the validation hook
    { url: '/webhook-2', payload: { user: 'admin' } },
    // No user body, should fail at the validation hook
    { url: '/webhook', payload: {} },
    // No user body, should fail at the validation hook
    { url: '/webhook-2', payload: {} },
    // No user body, but should not trigger the validation hook.
    { url: '/not-webhook', payload: {} }
  ]

  const [
    webhookSuccessResponse1,
    webhookSuccessResponse2,
    webhookFailResponse1,
    webhookFailResponse2,
    notWebhookSuccess
  ] = await Promise.all(requests.map(r => app.inject(makeRequest(r))))
  t.is('OK', webhookSuccessResponse1.body)
  t.is('OK - 2', webhookSuccessResponse2.body)
  t.is(500, webhookFailResponse1.statusCode)
  t.is(500, webhookFailResponse2.statusCode)
  t.is(200, notWebhookSuccess.statusCode)
  t.is('OK - not webhook', notWebhookSuccess.body)
})

test('Each registered plugin instance is encapsulated', async (t) => {
  const verification = async (fastify, opts) => {
    fastify.addHook('preValidation', async (request, response) => {
      if (request.body.user !== 'admin') throw new Error('no good')
    })
  }
  const verification2 = async (fastify, opts) => {
    fastify.addHook('preValidation', async (request, response) => {
      if (request.body.user !== 'owner') throw new Error('no good')
    })
  }
  const app = Fastify()
  app.register(fastifyWebhook, { webhooks, verification })
  app.register(fastifyWebhook, {
    webhooks: [
      {
        path: '/webhook-3',
        plugin: async (fastify) => fastify.post('/webhook-3', (req, res) => 'OK - 3')
      }
    ],
    verification: verification2,
    namespace: 'myNamespace'
  })

  await app.ready()

  function makeRequest ({ url, payload }) {
    return {
      method: 'POST',
      url,
      payload
    }
  }

  const requests = [
    // Includes user body, should trigger and pass the validation hook
    { url: '/webhook', payload: { user: 'admin' } },
    // Includes user body, should trigger and pass the validation hook
    { url: '/webhook-2', payload: { user: 'admin' } },
    // Should trigger validation2 hook and pass
    { url: '/webhook-3', payload: { user: 'owner' } },
    // No user body, should fail at the validation hook
    { url: '/webhook', payload: {} },
    // No user body, should fail at the validation hook
    { url: '/webhook-2', payload: {} },
    // Should trigger validation2 hook and fail.
    { url: '/webhook-3', payload: { user: 'admin' } }
  ]

  const [
    webhookSuccessResponse1,
    webhookSuccessResponse2,
    webhookSuccessResponse3,
    webhookFailResponse1,
    webhookFailResponse2,
    webhookFailResponse3
  ] = await Promise.all(requests.map(r => app.inject(makeRequest(r))))
  t.is('OK', webhookSuccessResponse1.body)
  t.is('OK - 2', webhookSuccessResponse2.body)
  t.is('OK - 3', webhookSuccessResponse3.body)
  t.is(500, webhookFailResponse1.statusCode)
  t.is(500, webhookFailResponse2.statusCode)
  t.is(500, webhookFailResponse3.statusCode)
})
