/**
 * Created by thomasjeanneau on 09/04/2017.
 */

import PythonShell from 'python-shell';
import Promise from 'bluebird';

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
      const botReply = Promise.promisify(bot.reply);
      const isAdmin = await checkIfAdmin(bot, message);
      if (isAdmin) {
        await botReply(message, "Ok, I'll start pairing people");
        PythonShell.run("pairing.py", options, async function (error) {
          if (!error) {
            await botReply(message, "Pairing complete. Results should be available in airtable. You can run 'introductions' to send a message to each pair.")
          } else {
            console.log(error);
            await botReply(message, "An error occurred during pairing.")
          }
        })
      } else {
        await botReply(message, "Sorry but it looks like you're not an admin. You can't use this feature.")
      }
    })();
  } catch (e) {
    bot.reply(message, "An error occur: " + e.error);
  }
});

controller.hears("introductions", ["direct_message", "direct_mention"], (bot, message) => {
  try {
    (async () => {
      const botReply = Promise.promisify(bot.reply);
      const isAdmin = await checkIfAdmin(bot, message);
      if (isAdmin) {
        await botReply(message, "Ok, I'll start introducing people :sparkles: ");
        await startAPairingSession(bot, message);
        await pairingConversation(bot, message);
        await botReply(message, "All people have been introduced :rocket:");
      } else {
        await botReply(message, "Sorry but it looks like you're not an admin. You can't use this feature.")
      }
    })();
  } catch (e) {
    bot.reply(message, "An error occur: " + e.error);
  }
});
