/**
 * Created by thomasjeanneau on 20/03/2017.
 */

import pick from 'lodash/pick';
import find from 'lodash/find';
import map from 'lodash/map';

import { controller, base } from './configSlackbot';
import { checkIfAdmin } from './methods';

let token = 'xoxp-24629294631-59006434455-162209015923-2a02d6b9b0424f935806e3ae0cae1ec4';

controller.hears("introductions", "direct_message", function (bot, message) {
  checkIfAdmin(bot, message)
    .then((res) => {
        if (res) {
          bot.reply(message, "Ok, I'll start introducing people");
          /*slack.groups.create({ token, name: 'new pairing' }, (err, data) => {
           console.log(err, data);
           });
           slack.usergroups.create({ token, name: 'test' }, (err, data) => {
           console.log(err, data);
           });*/
          bot.api.users.list({ token }, (err, { members }) => {
              if (err) {
                console.error(err);
                return;
              }
              const list = map(members, member => pick(member, ['id', 'name']));
              base('Pairings').select({
                view: "Main View"
              }).eachPage(function page(records, fetchNextPage) {
                records.forEach(function (record) {
                  const users = [];
                  const teacher = record.get('Teacher');
                  const learner = record.get('Learner');
                  users.push(find(list, ['name', record.get('Teacher')]));
                  users.push(find(list, ['name', record.get('Learner')]));
                  console.log(users);
                  bot.api.groups.list({ token }, (err5, data5) => {
                    console.log(data5.groups);
                    console.log(find(data5.groups, ['name', `p2pl-${teacher}-${learner}`]));
                    const { id: groupId } = find(data5.groups, ['name', `p2pl-${teacher}-${learner}`]);
                    if (groupId) {
                      bot.api.groups.unarchive({ token, channel: groupId }, (err1, data1) => {
                        console.log(err1, data1);
                        bot.api.groups.invite({ token, channel: groupId, user: users[0].id }, (err2, data2) => {
                          console.log(err2, data2);
                          bot.api.groups.invite({ token, channel: groupId, user: users[1].id }, (err3, data3) => {
                            console.log(err3, data3);
                            bot.api.groups.invite({
                              token,
                              channel: groupId,
                              user: bot.identifyBot().id
                            }, (err4, data4) => {
                              console.log(err4, data4);
                              bot.sendWebhook({
                                text: 'Hello, vous êtes pairé :D',
                                channel: groupId,
                              }, function (err, res) {
                                console.log(err, res);
                              });
                            });
                          });
                        });
                      });
                    } else {
                      bot.api.groups.create({ token, name: `P2PL-${teacher}-${learner}` }, (err1, data1) => {
                        console.log(err1, data1);
                        bot.api.groups.invite({ token, channel: data1.group.id, user: users[0] }, (err2, data2) => {
                          console.log(err2, data2);
                          bot.api.groups.invite({ token, channel: data1.group.id, user: users[1] }, (err3, data3) => {
                            console.log(err3, data3);
                            bot.api.groups.invite({
                              token,
                              channel: data1.group.id,
                              user: bot.identifyBot().id
                            }, (err4, data4) => {
                              console.log(err4, data4);
                              bot.sendWebhook({
                                text: 'Hello, vous êtes pairé :D',
                                channel: data1.group.id,
                              }, function (err, res) {
                                console.log(err, res);
                              });
                            });
                          });
                        });
                      });
                    }
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
            }
          );
        }
        else {
          bot.reply(message, "Sorry but it looks like you're not an admin. You can't use this feature.")
        }
      }
    )
    .catch(err => console.log(err));
});