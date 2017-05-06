/**
 * Created by thomasjeanneau on 08/02/2017.
 */

import Botkit from 'botkit'
import settings from '../../settings'
import { base } from '../../airtable/index'

const { SLACK_BOT_TOKEN, SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, PORT_BOT } = settings

const controller = Botkit.slackbot({
  debug: false,
  interactive_replies: true,
  require_delivery: true
})

controller.configureSlackApp({
  clientId: SLACK_CLIENT_ID,
  clientSecret: SLACK_CLIENT_SECRET,
  redirectUri: 'https://mangrove-pairing.herokuapp.com/',
  scopes: ['bot', 'chat:write:learningbot', 'groups:history', 'groups:read', 'groups:write', 'users:read', 'users:read.email']
})

controller.setupWebserver(PORT_BOT, function (err, webServer) {
  if (err) {
    console.log(err)
  } else {
    controller
      .createHomepageEndpoint(webServer)
      .createOauthEndpoints(webServer, function (err, req, res) {
        if (err) {
          console.log(err)
        } else {
          res.send(':)')
        }
      })
      .createWebhookEndpoints(webServer)
  }
})

controller.spawn({
  token: SLACK_BOT_TOKEN
})
  .configureIncomingWebhook({url: 'https://hooks.slack.com/services/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'})
  .startRTM()

export { controller, base }
