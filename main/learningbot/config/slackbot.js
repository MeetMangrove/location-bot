/**
 * Created by thomasjeanneau on 08/02/2017.
 */

import Botkit from 'botkit'
import settings from '../../settings'

const {
  SLACK_BOT_TOKEN,
  SLACK_CLIENT_ID,
  SLACK_CLIENT_SECRET,
  PORT_BOT,
  SLACK_REDIRECT_URI,
  SLACK_INCOMING_WEBHOOK
} = settings

const controller = Botkit.slackbot({
  debug: false,
  interactive_replies: true,
  require_delivery: true
})

controller.configureSlackApp({
  clientId: SLACK_CLIENT_ID,
  clientSecret: SLACK_CLIENT_SECRET,
  redirectUri: SLACK_REDIRECT_URI,
  scopes: ['bot', 'chat:write:learningbot', 'groups:history', 'groups:read', 'groups:write', 'users:read', 'users:read.email']
})

controller.setupWebserver(PORT_BOT, function (err) {
  if (err) return console.log(err)
  controller
    .createWebhookEndpoints(controller.webserver)
    .createHomepageEndpoint(controller.webserver)
    .createOauthEndpoints(controller.webserver, function (err, req, res) {
      if (err) return res.status(500).send('ERROR: ' + err)
      res.send('Success!')
    })
})

controller.spawn({
  token: SLACK_BOT_TOKEN
})
  .configureIncomingWebhook({url: SLACK_INCOMING_WEBHOOK})
  .startRTM()

export { controller }
