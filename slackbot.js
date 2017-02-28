/**
 * Created by thomasjeanneau on 08/02/2017.
 */

import Botkit from 'botkit';
import jsonfile from 'jsonfile';
import Airtable from 'airtable';

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

controller.setupWebserver(port, function(err, webserver) {
  controller
    .createHomepageEndpoint(webserver)
    .createOauthEndpoints(webserver,function(err,req,res) {
      res.send(':)');
    })
    .createWebhookEndpoints(webserver);
});

controller.spawn({
  token: settings.bot_access_token,
}).startRTM();

controller.hears('hello', ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.reply(message, 'Hello you :D');
});

controller.hears('show mangrove friends', ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  base('P2PL Tests').select({
    maxRecords: 150,
    view: "Main View",
  }).eachPage(function page(records, fetchNextPage) {
    records.forEach(function (record) {
      bot.reply(message, record.get('Name'));
    });
    fetchNextPage();
  }, function done(err) {
    if (err) {
      console.error(err);
      return;
    }
  });
});

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

controller.hears('feedback', 'direct_message', function (bot, message) {
  bot.startConversation(message, function (err, convo) {
    convo.ask({
        attachments: [
          {
            title: 'Hey you ! I\'ve you done your last pairing ? ',
            callback_id: '123',
            attachment_type: 'default',
            actions: [
              {
                "name": "yes",
                "text": "Yes",
                "value": "yes",
                "type": "button",
              },
              {
                "name": "no",
                "text": "No",
                "value": "no",
                "type": "button",
              }
            ]
          }
        ]
      },
      [
        {
          pattern: 'yes',
          callback: function (response, convo) {
            convo.say('Great! I will continue...');
            // do something else...
            convo.next();

          }
        },
        {
          pattern: 'no',
          callback: function (response, convo) {
            convo.say('Perhaps later.');
            // do something else...
            convo.next();
          }
        },
        {
          default: true,
          callback: function (response, convo) {
            // just repeat the question
            convo.repeat();
            convo.next();
          }
        }
      ]
    )
    ;

  })

});