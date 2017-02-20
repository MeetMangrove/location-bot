/**
 * Created by thomasjeanneau on 08/02/2017.
 */

import Botkit from 'botkit';
import jsonfile from 'jsonfile';
import Airtable from 'airtable';

const settings = jsonfile.readFileSync('settings.json');
const controller = Botkit.slackbot({
  debug: false
});

Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: settings.airtable_api_key
});

const base = Airtable.base('appHUSN6KmmkMAgV7');

controller.spawn({
  token: settings.bot_access_token,
}).startRTM();

controller.hears('hello', ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.reply(message, 'Hello yourself.');
});

controller.hears('show mangrove friends', ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  base('Members').select({
    // Selecting the first 3 records in Main View:
    maxRecords: 150,
    view: "Main View"
  }).eachPage(function page(records, fetchNextPage) {
    // This function (`page`) will get called for each page of records.

    records.forEach(function(record) {
      bot.reply(message, record.get('Name'));
      console.log('Retrieved', record.get('Name'));
    });

    // To fetch the next page of records, call `fetchNextPage`.
    // If there are more records, `page` will get called again.
    // If there are no more records, `done` will get called.
    fetchNextPage();

  }, function done(err) {
    if (err) { console.error(err); return; }
  });
});