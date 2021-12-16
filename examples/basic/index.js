const Fastify = require('fastify')
const { request } = require('undici')

const fastifyWebhooks = require('../../')

const {
  PORT = 3000,
  GITHUB_USERNAME,
  GITHUB_REPO_NAME,
  GITHUB_ACCESS_TOKEN,
  NGROK_HOST
} = process.env

const GITHUB_BASE_WEBHOOKS_URL = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO_NAME}`

const webhooks = [
  // Register a webhook that receives events from the github api at /github
  {
    path: '/github',
    plugin: async (fastify, opts) => {
      fastify.post('/github', async (req, res) => {
        console.log('Receiving webhook request:', req.body.hook)
        res.send('OK')
      })
    },
    create: async () => {
      const { body, statusCode } = await request(
        `${GITHUB_BASE_WEBHOOKS_URL}/hooks`,
        makePostRequestInit({
          body: JSON.stringify({
            config: {
              url: `${NGROK_HOST}/github`,
              content_type: 'json',
              insecure_ssl: 1
            }
          })
        })
      )
      return { statusCode, body: await body.json() }
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

// Some event triggers github webhook creation.
app.post('/create-github-webhook', async (request, response) => {
  const createWebhook = app.webhooks.get('/github')
  const res = await createWebhook()
  response.code(res.statusCode).send(res.body)
})

// Trigger a created github webhook
app.post('/ping/:webhook_id', async (req, res) => {
  const { statusCode } = await request(
    `${GITHUB_BASE_WEBHOOKS_URL}/hooks/${req.params.webhook_id}/pings`,
    makePostRequestInit()
  )

  res.code(statusCode).send()
})

app.listen(PORT, (_, address) => { console.log(`listening on ${address}`) })

function makePostRequestInit (opts = {}) {
  return {
    method: 'POST',
    headers: {
      'User-Agent': 'request',
      Authorization: `token ${GITHUB_ACCESS_TOKEN}`,
      Accept: 'application/vnd.github.v3+json'
    },
    ...opts
  }
}
