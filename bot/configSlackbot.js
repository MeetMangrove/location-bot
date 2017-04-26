/**
 * Created by thomasjeanneau on 08/02/2017.
 */

import Botkit from 'botkit'
import settings from './settings'
import {getAllPeople, base} from '../airtable'

const { SLACK_BOT_TOKEN, SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, PORT_BOT } = settings;

const controller = Botkit.slackbot({
  debug: false,
  interactive_replies: true,
  require_delivery: true,
});

controller.configureSlackApp({
  clientId: SLACK_CLIENT_ID,
  clientSecret: SLACK_CLIENT_SECRET,
  redirectUri: 'https://mangrove-pairing.herokuapp.com/',
  scopes: ['bot', 'chat:write:bot', 'groups:history', 'groups:read', 'groups:write', 'users:read', 'users:read.email']
});

controller.setupWebserver(PORT_BOT, function (err, webserver) {
  controller
    .createHomepageEndpoint(webserver)
    .createOauthEndpoints(webserver, function (err, req, res) {
      res.send(':)');
    })
    .createWebhookEndpoints(webserver);
});

controller.spawn({
  token: SLACK_BOT_TOKEN,
})
  .configureIncomingWebhook({url: 'https://hooks.slack.com/services/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'})
  .startRTM();

controller.hears('show P2PL applicants', ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  getAllPeople('P2PL Tests', (err, people) => {
    if (err) {
      console.error('ERROR', err)
      return
    }
    people.forEach((person) => {
      bot.reply(message, {
        'text': `:sparkles: _${person.name}_ :sparkles:`,
        'attachments': [
          {
            'title': ':sleuth_or_spy: Interests',
            'text': person.interests.join(', '),
            'color': '#9575CD'
          },
          {
            'title': ':muscle: Skills',
            'text': person.skills.join(', '),
            'color': '#E57373'
          }
        ],
      })
    })
  })
})

export { controller, base };
