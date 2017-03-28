/**
 * Created by thomasjeanneau on 20/03/2017.
 */

import pick from 'lodash/pick';
import find from 'lodash/find';

import { controller, base } from './configSlackbot';
import { checkIfAdmin } from './methods';

controller.hears("introductions", "direct_message", function (bot, message) {
  checkIfAdmin(bot, message)
    .then((res) => {
    if (res) {
      bot.reply(message, "Ok, I'll start introducing people");
      bot.api.users.list({}, (err, { members }) => {
        if (err) {
          console.error(err);
          return;
        }
        const list = pick(members, ['id', 'name']);
        base('Pairings').select({
          view: "Main View"
        }).eachPage(function page(records, fetchNextPage) {
          records.forEach(function(record) {
            const users = [];
            users.push(find(list, ['name', record.get('Teacher')]));
            users.push(find(list, ['name', record.get('Learner')]));
            users.push(find(list, ['name', 'pairingbot']));
            bot.api.groups.create({name: 'new paring !'}, (err, data) => {
              console.log(data);
            });
            console.log('Retrieved', record.get('Id'));
          });
          fetchNextPage();
        }, function done(err) {
          if (err) {
            console.error(err);
            bot.reply(message, "An error occur: " + err.error);
          }
        });
      });
    } else {
      bot.reply(message, "Sorry but it looks like you're not an admin. You can't use this feature.")
    }
  })
    .catch(err => console.log(err));
});