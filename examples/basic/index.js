const Fastify = require('fastify')

const fastifyWebhooks = require('../../')

const { PORT = 3000 } = process.env

const webhooks = [
  // Register a webhook that receives events from the github api at /github
  {
    plugin: async (fastify, opts) => {
      fastify.post('/github', async (req, res) => {
        console.log('Receiving webhook request:', req.body.hook)
        res.send('OK')
      })
    }
  }
]

const verification = async (fastify, opts) => {
  fastify.addHook('preValidation', async (request, response) => {
    // This is where you would validate the webhook request signature
    // https://docs.github.com/en/developers/webhooks-and-events/webhooks/securing-your-webhooks
    console.log('Validation runs here before the webhooks route is run')
  })
}

const app = Fastify()

app.register(fastifyWebhooks, { webhooks, verification })

app.listen(PORT, (_, address) => { console.log(`listening on ${address}`) })
