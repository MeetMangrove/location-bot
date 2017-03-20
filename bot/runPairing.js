/**
 * Created by thomasjeanneau on 20/03/2017.
 */

import { controller, base } from './configSlackbot';
import { exec } from 'child_process';

controller.hears("pair", "direct_message", function (bot, message) {
  const admins = [];
  base('P2PL Tests').select({
    filterByFormula: "{Pairing admin}=1"
  }).eachPage(function page(records, fetchNextPage) {
    records.forEach((record) => {
      // console.log(record);
      admins.push(record["fields"]["Slack Handle"])
    });
    fetchNextPage();
  }, function done(err) {
    if (err) {
      console.error(err);
      return;
    }
    bot.api.users.info({ user: message.user }, (error, response) => {
      let { name, real_name } = response.user;
      if (admins.indexOf(name) >= 0) {
        bot.reply(message, "Ok, I'll start pairing people");
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
  });
});