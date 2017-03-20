/**
 * Created by thomasjeanneau on 20/03/2017.
 */

import { controller } from './configSlackbot';
import { exec } from 'child_process';

import { checkIfAdmin } from './methods';

controller.hears("pair", "direct_message", function (bot, message) {
  checkIfAdmin(message)
    .then((res) => {
      if (res) {
        bot.reply(message, "Ok, I'll start introducing people");
        exec("python ../pairing.py", function (error, stdout, stderr) {
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
    })
    .catch(err => console.log(err));
});