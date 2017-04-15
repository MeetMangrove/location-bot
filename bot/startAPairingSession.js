/**
 * Created by thomasjeanneau on 20/03/2017.
 */

import Promise from 'bluebird';
import pick from 'lodash/pick';
import find from 'lodash/find';
import map from 'lodash/map';
import asyncForEach from 'async-foreach';

import { getMembersPaired } from './methods';
import settings from './settings';

const { SLACK_TOKEN: token } = settings;
const { forEach } = asyncForEach;

export const startAPairingSession = (bot, message) => {
  return new Promise((resolve, reject) => {
    try {
      (async () => {
        const apiUser = Promise.promisifyAll(bot.api.users);
        const { members } = await apiUser.listAsync({ token });
        const botSay = Promise.promisify(bot.say);
        const list = map(members, member => pick(member, ['id', 'name']));
        const membersPaired = await getMembersPaired();
        forEach(membersPaired, async function (member) {
          const done = this.async();
          const channel = find(list, ['name', member.name]).id;
          const { isLearner, teacherName, learning, isTeacher, learnerName, teaching } = member;
          if(isLearner === true && isTeacher === false){
            await botSay({
              text: `Hey, I only found a learning match for you. It means that you won't teach this month.`,
              channel,
            });
            await botSay({
              text: `But next session you will have the priority :wink:`,
              channel,
            });
            await botSay({
              text: `Let me introduce you to <@${teacherName}> who will tell you more about *${learning}*`,
              channel,
            });
            await botSay({
              text: `I will start a conversation with the two of you.`,
              channel,
            });
            await botSay({
              text: `If you want more infos about your pairing, beforehand just type \`/whois @name\``,
              channel,
            });
          }else if(isLearner === true && isTeacher === true){
            await botSay({
              text: `Hey, I just found the perfect pairing for you :smile:`,
              channel,
            });
            await botSay({
              text: `You will share your experiences about *${teaching}* with <@${learnerName}>`,
              channel,
            });
            await botSay({
              text: `and <@${teacherName}> will tell you more about *${learning}*`,
              channel,
            });
            await botSay({
              text: `I will start two separate conversation with them.`,
              channel,
            });
            await botSay({
              text: `If you want more info about them, beforehand just type \`/whois @name\``,
              channel,
            });
          }else if(isLearner === false && isTeacher === true){
            await botSay({
              text: `Hey, I only found a teaching match for you. It means that you won't learn this month.`,
              channel,
            });
            await botSay({
              text: `But next session you will have the priority :wink:`,
              channel,
            });
            await botSay({
              text: `Let me introduce you to <@${learnerName}> who wants to learn more about *${teaching}*`,
              channel,
            });
            await botSay({
              text: `I will start a conversation with the two of you.`,
              channel,
            });
            await botSay({
              text: `If you want more info about your pairing, just type \`/whois @name\``,
              channel,
            });
          }else{
            await botSay({
              text: `I'm a really sorry :pensive: I cannot find any pairing for you this month.`,
              channel,
            });
            await botSay({
              text: `I'm sure you want to learn more about other skills: fill in this form to keep me updated on what you want to teach and learn.`,
              channel,
            });
          }
          done();
        });
        resolve(membersPaired);
      })();
    } catch (e) {
      console.log(e);
      bot.reply(message, "An error occur: " + e.error);
      reject(e);
    }
  });
};
