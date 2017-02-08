/**
 * Created by thomasjeanneau on 08/02/2017.
 */

import Botkit from 'botkit';
import jsonfile from 'jsonfile';

const settings = jsonfile.readFileSync('settings.json');
const controller = Botkit.slackbot({
  debug: false
});

controller.spawn({
  token: settings.slack_token,
}).startRTM();

controller.hears('hello', ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.reply(message, 'Hello yourself.');
});


