const test = require('ava')
const Fastify = require('fastify')

const fastifyWebhook = require('./')

const webhooks = [
  {
    path: '/webhook',
    plugin: async (fastify) => fastify.post('/webhook', (req, res) => 'OK'),
    create: async () => 'create for /webhook'
  },
  {
    path: '/webhook-2',
    plugin: (fastify, opts, done) => {
      fastify.post('/webhook-2', (req, res) => 'OK - 2')
      done()
    },
    create: async () => 'create for /webhook-2'
  },
  {
    path: '/webhook-no-create',
    plugin: (fastify, opts, done) => {
      fastify.post('/webhook-no-create', (req, res) => 'OK - No Create')
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

test('Decorates the namespace with upstream webhook \'create\' methods', async (t) => {
  const verification = async (fastify, opts) => {}
  const app = Fastify()
  app.register(fastifyWebhook, { webhooks, verification })

  await app.ready()

  const { webhooks: creators } = app
  const webhookCreator1 = creators.get('/webhook')
  const webhookCreator2 = creators.get('/webhook-2')
  const created1 = await webhookCreator1()
  const created2 = await webhookCreator2()
  t.is('create for /webhook', created1)
  t.is('create for /webhook-2', created2)
})

test('Does not decorate the namespace if a \'create\' method is not provided', async (t) => {
  const verification = async (fastify, opts) => {}
  const app = Fastify()
  app.register(fastifyWebhook, { webhooks, verification })

  await app.ready()

  const { webhooks: creators } = app
  t.false(creators.has('/webhook-no-create'))
})

test('Decorates the configured namespace with upstream webhook \'create\' methods', async (t) => {
  const verification = async (fastify, opts) => {}
  const app = Fastify()
  app.register(fastifyWebhook, {
    webhooks,
    verification,
    namespace: 'myNamespace'
  })

  await app.ready()

  const { myNamespace: creators } = app
  const webhookCreator1 = creators.get('/webhook')
  const webhookCreator2 = creators.get('/webhook-2')
  const created1 = await webhookCreator1()
  const created2 = await webhookCreator2()
  t.is('create for /webhook', created1)
  t.is('create for /webhook-2', created2)
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
        plugin: async (fastify) => fastify.post('/webhook-3', (req, res) => 'OK - 3'),
        create: async () => 'create for /webhook-3'
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
