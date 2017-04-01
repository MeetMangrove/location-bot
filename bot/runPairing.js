/**
 * Created by thomasjeanneau on 20/03/2017.
 */

import { controller } from './configSlackbot';
import PythonShell from 'python-shell';

import { checkIfAdmin } from './methods';

const options = {
  mode: 'text',
  pythonPath: 'python',
  scriptPath: './',
};

controller.hears("pair", ["direct_message", "direct_mention"], function (bot, message) {
  try {
    checkIfAdmin(bot, message)
      .then((res) => {
        if (res) {
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
      })
      .catch(err => console.log(err));
  }catch(e){
    console.log(e);
    bot.reply(message, "An error occur: " + e);
  }
});