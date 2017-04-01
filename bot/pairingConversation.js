/**
 * Created by thomasjeanneau on 20/03/2017.
 */

import pick from 'lodash/pick';
import find from 'lodash/find';
import map from 'lodash/map';
import Promise from 'bluebird';
import asyncForEach from 'async-foreach';

import { controller, base } from './configSlackbot';
import { checkIfAdmin, getGroupName } from './methods';
import settings from './settings';

const { SLACK_TOKEN: token } = settings;
const { forEach } = asyncForEach;

controller.hears("introductions", ["direct_message", "direct_mention"], (bot, message) => {
  try {
    (async () => {
      const isAdmin = await checkIfAdmin(bot, message);
      if (isAdmin) {
        bot.reply(message, "Ok, I'll start introducing people :sparkles: ");
        const apiUser = Promise.promisifyAll(bot.api.users);
        const apiGroups = Promise.promisifyAll(bot.api.groups);
        const airtableUpdate = Promise.promisify(base('Pairings').update);
        const botSay = Promise.promisify(bot.say);
        const { members } = await apiUser.listAsync({ token });
        const list = map(members, member => pick(member, ['id', 'name']));
        base('Pairings').select({
          view: "Main View",
          filterByFormula: "{Bot Introduction}=0"
        }).eachPage(function page(records, fetchNextPage) {
          forEach(records, async function (record) {
            const done = this.async();
            const teacher = find(list, ['name', record.get('Teacher')]);
            const learner = find(list, ['name', record.get('Learner')]);
            const skill = record.get('Skill')[0];
            const { groups } = await apiGroups.listAsync({ token });
            const groupName = await getGroupName(teacher.name, learner.name);
            const group = find(groups, ['name', groupName]);
            let groupId;
            if (group) {
              groupId = group.id;
              if (group.is_archived === true) await apiGroups.unarchiveAsync({ token, channel: groupId });
            } else {
              const groupsCreate = await apiGroups.createAsync({ token, name: groupName });
              groupId = groupsCreate.group.id;
            }
            if (teacher.id !== message.user) await apiGroups.inviteAsync({
              token,
              channel: groupId,
              user: teacher.id
            });
            if (learner.id !== message.user) await apiGroups.inviteAsync({
              token,
              channel: groupId,
              user: learner.id
            });
            await apiGroups.inviteAsync({ token, channel: groupId, user: bot.identifyBot().id });
            await airtableUpdate(record.id, { "Bot Introduction": true });
            await botSay({
              text: 'Hey guys ! I\'ve paired you this month :smile:',
              channel: groupId
            });
            await botSay({
              text: `${teacher.name}: ${learner.name} want to learn more about *${skill}*`,
              channel: groupId
            });
            await botSay({
              text: `I let you arrange a meeting together, let me know about the date :wink:`,
              channel: groupId
            });
            done();
          }, fetchNextPage);
        }, function done(err) {
          if (err) {
            console.error(err);
            bot.reply(message, "An error occur: " + err.error);
          } else {
            bot.reply(message, "All people have been introduced :rocket:");
          }
        });
      } else {
        bot.reply(message, "Sorry but it looks like you're not an admin. You can't use this feature.")
      }
    })();
  } catch (e) {
    bot.reply(message, "An error occur: " + e.error);
    console.log(e);
  }
});
