# Basic Example

This example show an integration with Github repository webhooks.

## Prerequisites

- Install [ngrok](https://ngrok.com/)
- Generate a github personal access token with scopes: ``
- A github repository that you may create webhooks on.

## Running

- Start an ngrok tunnel to expose your server on port 3000
  - `ngrok http :3000`
- Set the following environment variables:
  ```
  PORT=3000
  GITHUB_ACCESS_TOKEN=<YOUR PAT WITH REPOSITORY WEBHOOK SCOPES>
  GITHUB_USERNAME=<USERNAME>
  GITHUB_REPO_NAME=<REPO NAME>
  NGROK_HOST=<NGROK TUNNEL HOST>
  ```
- start the fastify server: `node index.js`
- create a webhook by making a POST request to /create-github-webhook
  ```
  curl -v -X POST http://localhost:3000/create-github-webhook
  ```
- Obtain the webhook ID from the response payload
- Trigger the github webhook by making a POST request to /ping/:webhook_id
  with the id of the webhook you just created.
  ```
  curl -v -X POST http://localhost:3000/ping/<WEBHOOK_ID
  ```
- After pinging the webhook, you will see a request is made to /github in the
  ngrok interface.
- The fastify server will log a message from the preValidation hook before
  running the `/github` route
- The fastify server will then log out the event payload that was sent via then
  webhook.

## Cleanup

Make sure to delete the repository webhook you created.
