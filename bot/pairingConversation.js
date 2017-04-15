/**
 * Created by thomasjeanneau on 20/03/2017.
 */

import pick from 'lodash/pick';
import find from 'lodash/find';
import map from 'lodash/map';
import Promise from 'bluebird';
import asyncForEach from 'async-foreach';
import findIndex from 'lodash/findIndex';

import { base } from './configSlackbot';
import settings from './settings';

const { SLACK_TOKEN: token } = settings;
const { forEach } = asyncForEach;

export const pairingConversation = (bot, message, membersPaired) => {
  return new Promise((resolve, reject) => {
    try {
      (async () => {
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
            const indexTeacher = findIndex(membersPaired, e => e.name === teacher.name);
            const skill = membersPaired[indexTeacher].teaching;
            const { groups } = await apiGroups.listAsync({ token });
            const groupName = `p2pl_${teacher.name.substring(0, 8)}_${learner.name.substring(0, 8)}`;
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
              text: 'Hey guys! I\'ve paired you this month :smile:',
              channel: groupId
            });
            await botSay({
              text: `<@${teacher.name}>: <@${learner.name}> would like to know more about *${skill}*. I'm sure you have a lot to share!`,
              channel: groupId
            });
            await botSay({
              text: `I let you two arrange a meeting together, let me know about the date :blush:.`,
              channel: groupId
            });
            done();
          }, fetchNextPage);
        }, function done(err) {
          if (err) reject();
          resolve();
        });
      })();
    } catch (e) {
      console.log(e);
      bot.reply(message, "An error occur: " + e.error);
      reject(e);
    }
  });
};
