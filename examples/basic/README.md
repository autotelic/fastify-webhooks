# Basic Example

This example show an integration with Github repository webhooks.

## Prerequisites

- Install [ngrok](https://ngrok.com/)
- A github repository that you have permissions to create webhooks on.
- A github personal access token with scopes: `write:repo_hook`

## Running

- Start an ngrok tunnel to expose your server on port 3000
  - `ngrok http :3000`
- start the fastify server: `node index.js`
- create a github repository webhook and configure it to call:
  `<your-ngrok-subdomain>.ngrok.io/github`
  see the [docs here](https://docs.github.com/en/developers/webhooks-and-events/webhooks/creating-webhooks#setting-up-a-webhook)
  *note* - ensure the webhook content-type must be application/json
- Trigger the github webhook (You will need the hook ID)
  ```
  curl \
  -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token <GITHUB_PERSONAL_ACCESS_TOKEN>" \
  https://api.github.com/repos/<GITHUB_ORG>/<GITHUB_REPO>/hooks/<GITHUB_HOOK_ID>/pings
  ```
- After pinging the webhook, you will see a request is made to /github in the
  ngrok interface.
- The fastify server will log a message from the preValidation hook before
  running the `/github` route
- The fastify server will then log out the event payload that was sent via then
  webhook.

## Cleanup

Make sure to delete the repository webhook you created.
