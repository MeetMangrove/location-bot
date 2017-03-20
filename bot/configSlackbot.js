/**
 * Created by thomasjeanneau on 08/02/2017.
 */

import Botkit from 'botkit';
import jsonfile from 'jsonfile';
import Airtable from 'airtable';
import { exec } from 'child_process';

const settings = jsonfile.readFileSync('settings.json');

Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: settings.airtable_api_key
});

const port = process.env.PORT || 3000;
const base = Airtable.base(settings.airtable_base_key);
const controller = Botkit.slackbot({
  debug: false,
  interactive_replies: true
});

controller.configureSlackApp({
  clientId: settings.slack_client_id,
  clientSecret: settings.slack_client_secret,
  redirectUri: 'https://mangrove-pairing.herokuapp.com/',
  scopes: ['bot']
});

controller.setupWebserver(port, function (err, webserver) {
  controller
    .createHomepageEndpoint(webserver)
    .createOauthEndpoints(webserver, function (err, req, res) {
      res.send(':)');
    })
    .createWebhookEndpoints(webserver);
});

controller.spawn({
  token: settings.bot_access_token,
}).startRTM();

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