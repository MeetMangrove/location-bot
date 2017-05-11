/**
 * Created by thomasjeanneau on 09/04/2017.
 */

import Promise from 'bluebird';

import { controller } from './configSlackbot';
import { checkIfAdmin } from './methods';
import { pairingConversation } from './pairingConversation';
import { startAPairingSession } from './startAPairingSession';
import { pairAllApplicants } from '../pairing'


controller.hears("pair", ["direct_message", "direct_mention"], function (bot, message) {
  try {
    (async () => {
      const botReply = Promise.promisify(bot.reply);
      const isAdmin = await checkIfAdmin(bot, message);
      if (isAdmin) {
        await botReply(message, "Ok, I'll start pairing people");
        // generate pairing
        const pairing = await pairAllApplicants()
        // notify about the pairing
        await botReply(message, "Pairing done, saved to Airtable." +
          ` It contains ${pairing.pairs.length} pairs.`
        )
      } else {
        await botReply(message, "Sorry but it looks like you're not an admin. You can't use this feature.")
      }
    })();
  } catch (e) {
    bot.reply(message, "An error occurred: " + e.error);
  }
});

controller.hears("introductions", ["direct_message", "direct_mention"], (bot, message) => {
  try {
    (async () => {
      const botReply = Promise.promisify(bot.reply);
      const isAdmin = await checkIfAdmin(bot, message);
      if (isAdmin) {
        await botReply(message, "Ok, I'll start introducing people :sparkles: ");
        const membersPaired = await startAPairingSession(bot, message);
        await pairingConversation(bot, message, membersPaired);
        await botReply(message, "All people have been introduced :rocket:");
      } else {
        await botReply(message, "Sorry but it looks like you're not an admin. You can't use this feature.")
      }
    })();
  } catch (e) {
    bot.reply(message, "An error occur: " + e.error);
  }
});
