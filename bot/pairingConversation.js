/**
 * Created by thomasjeanneau on 20/03/2017.
 */

import pick from 'lodash/pick';
import find from 'lodash/find';
import map from 'lodash/map';
import Promise from 'bluebird';

import { controller, base } from './configSlackbot';
import { checkIfAdmin } from './methods';

let token = 'xoxp-24629294631-59006434455-162209015923-2a02d6b9b0424f935806e3ae0cae1ec4';

controller.hears("introductions", "direct_message", (bot, message) => {
  try {
    (async () => {
      const isAdmin = await checkIfAdmin(bot, message);
      if (isAdmin) {
        bot.reply(message, "Ok, I'll start introducing people");
        const apiUser = Promise.promisifyAll(bot.api.users);
        const apiGroups = Promise.promisifyAll(bot.api.groups);
        const { members } = await apiUser.listAsync({ token });
        const list = map(members, member => pick(member, ['id', 'name']));
        base('Pairings').select({
          view: "Main View"
        }).eachPage(function page(records, fetchNextPage) {
          records.forEach(async (record) => {
            const users = [];
            const teacher = record.get('Teacher');
            const learner = record.get('Learner');
            users.push(find(list, ['name', record.get('Teacher')]));
            users.push(find(list, ['name', record.get('Learner')]));
            const { groups } = await apiGroups.listAsync({ token });
            console.log('groupList: ', groups);
            const { id: groupId } = find(groups, ['name', `p2pl-${teacher}-${learner}`]);
            if (groupId) {
              const groupsUnarchive = await apiGroups.unarchiveAsync({ token, channel: groupId });
              console.log('groupsUnarchive: ', groupsUnarchive);
            } else {
              const groupsCreate = await apiGroups.createAsync({ token, name: `P2PL-${teacher}-${learner}` });
              console.log('groupsCreate: ', groupsCreate);
            }
            const groupsInvite1 = await apiGroups.inviteAsync({ token, channel: groupId, user: users[0].id });
            console.log('groupsInvite1: ', groupsInvite1);
            const groupsInvite2 = await apiGroups.inviteAsync({ token, channel: groupId, user: users[1].id });
            console.log('groupsInvite2: ', groupsInvite2);
            const groupsInvite3 = await apiGroups.inviteAsync({
              token,
              channel: groupId,
              user: bot.identifyBot().id
            });
            console.log('groupsInvite3: ', groupsInvite3);
            console.log('Retrieved', record.get('Id'));
          });
          fetchNextPage();
        }, function done(err) {
          if (err) {
            console.error(err);
            bot.reply(message, "An error occur: " + err.error);
          }
        });
      } else {
        bot.reply(message, "Sorry but it looks like you're not an admin. You can't use this feature.")
      }
    })();
  } catch (e) {
    console.log(e);
  }
});
