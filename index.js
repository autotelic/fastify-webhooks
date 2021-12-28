'use strict'

const fp = require('fastify-plugin')

async function fastifyWebhook (fastify, options) {
  const {
    webhooks,
    verification
  } = options

  fastify.register(async (fastify) => {
    fastify.register(fp(verification))
    for (let webhook = 0; webhook < webhooks.length; webhook++) {
      const { plugin } = webhooks[webhook]
      fastify.register(plugin)
    }
  })
}

module.exports = fp(fastifyWebhook, { name: 'fastify-webhook' })
