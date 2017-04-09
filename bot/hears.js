/**
 * Created by thomasjeanneau on 09/04/2017.
 */

import PythonShell from 'python-shell';

import { controller } from './configSlackbot';
import { checkIfAdmin } from './methods';
import { pairingConversation } from './pairingConversation';
import { startAPairingSession } from './startAPairingSession';

const options = {
  mode: 'text',
  pythonPath: 'python',
  scriptPath: './',
};

controller.hears("pair", ["direct_message", "direct_mention"], function (bot, message) {
  try {
    (async () => {
      const isAdmin = await checkIfAdmin(bot, message);
      if (isAdmin) {
        bot.reply(message, "Ok, I'll start pairing people");
        PythonShell.run("pairing.py", options, function (error) {
          if (!error) {
            bot.reply(message, "Pairing complete. Results should be available in airtable. You can run 'introductions' to send a message to each pair.")
          } else {
            console.log(error);
            bot.reply(message, "An error occurred during pairing.")
          }
        })
      } else {
        bot.reply(message, "Sorry but it looks like you're not an admin. You can't use this feature.")
      }
    })();
  } catch (e) {
    bot.reply(message, "An error occur: " + e.error);
  }
});

controller.hears("introductions", ["direct_message", "direct_mention"], (bot, message) => {
  try {
    (async () => {
      const isAdmin = await checkIfAdmin(bot, message);
      if (isAdmin) {
        bot.reply(message, "Ok, I'll start introducing people :sparkles: ");
        await startAPairingSession(bot, message);
        await pairingConversation(bot, message);
        bot.reply(message, "All people have been introduced :rocket:");
      } else {
        bot.reply(message, "Sorry but it looks like you're not an admin. You can't use this feature.")
      }
    })();
  } catch (e) {
    bot.reply(message, "An error occur: " + e.error);
  }
});
