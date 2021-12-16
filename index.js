'use strict'

const fp = require('fastify-plugin')

async function fastifyWebhook (fastify, options) {
  const {
    webhooks,
    verification,
    namespace = 'webhooks'
  } = options

  const creators = new Map()

  fastify.register(async (fastify) => {
    fastify.register(fp(verification))

    for (let webhook = 0; webhook < webhooks.length; webhook++) {
      const { path, plugin, create } = webhooks[webhook]
      fastify.register(plugin)
      if (create) creators.set(path, create)
    }
  })

  fastify.decorate(namespace, creators)
}

module.exports = fp(fastifyWebhook, { name: 'fastify-webhook' })
