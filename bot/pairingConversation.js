/**
 * Created by thomasjeanneau on 20/03/2017.
 */

import slack from 'slack';

import { controller, base } from './configSlackbot';
import { checkIfAdmin } from './methods';

controller.hears("introductions", "direct_message", function (bot, message) {
  checkIfAdmin(bot, message)
    .then((res) => {
    if (res) {
      bot.reply(message, "Ok, I'll start introducing people");
      base('Pairings').select({
        view: "Main View"
      }).eachPage(function page(records, fetchNextPage) {
        records.forEach(function(record) {
          slack.api.channels.create({token, name}, (err, data) => { })
          console.log('Retrieved', record.get('Id'));
        });
        fetchNextPage();
      }, function done(err) {
        if (err) {
          console.error(err);
        }

      });
    } else {
      bot.reply(message, "Sorry but it looks like you're not an admin. You can't use this feature.")
    }
  })
    .catch(err => console.log(err));
});