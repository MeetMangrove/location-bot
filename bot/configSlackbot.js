/**
 * Created by thomasjeanneau on 08/02/2017.
 */

import Botkit from 'botkit';
import Airtable from 'airtable';
import settings from './settings';

const { SLACK_BOT_TOKEN, SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, AIRTABLE_API_KEY, AIRTABLE_BASE_KEY, PORT_BOT } = settings;

Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: AIRTABLE_API_KEY,
});

const base = Airtable.base(AIRTABLE_BASE_KEY);
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
  base('P2PL Tests').select({
    maxRecords: 150,
    view: "Main View",
    fields: ["Name", "Interests", "Skills"]
  }).eachPage(function page(records, fetchNextPage) {
    records.forEach(function (record) {
      if (record.get('Interests') && record.get('Skills')) {
        bot.reply(message, {
          'text': `:sparkles: _${record.get('Name')}_ :sparkles:`,
          'attachments': [
            {
              'title': ':sleuth_or_spy: Interests',
              'text': record.get('Interests').join(', '),
              'color': '#9575CD'
            },
            {
              'title': ':muscle: Skills',
              'text': record.get('Skills').join(', '),
              'color': '#E57373'
            }
          ],
        });
      }
    });
    fetchNextPage();
  }, function done(err) {
    if (err) {
      console.error(err);
      return;
    }
  });
});

export { controller, base };