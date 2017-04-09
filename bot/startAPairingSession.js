/**
 * Created by thomasjeanneau on 20/03/2017.
 */

import Promise from 'bluebird';
import pick from 'lodash/pick';
import find from 'lodash/find';
import map from 'lodash/map';

import { getMembersPaired } from './methods';
import settings from './settings';

const { SLACK_TOKEN: token } = settings;

export const startAPairingSession = (bot, message) => {
  return new Promise((resolve, reject) => {
    try {
      (async () => {
        const apiUser = Promise.promisifyAll(bot.api.users);
        const { members } = await apiUser.listAsync({ token });
        const botSay = Promise.promisify(bot.say);
        const list = map(members, member => pick(member, ['id', 'name']));
        const membersPaired = await getMembersPaired();
        membersPaired.forEach((member) => {
          const channel = find(list, ['name', member.name]).id;
          const { isLearner, teacherName, learning, isTeacher, learnerName, teaching } = member;
          if(isLearner === true && isTeacher === false){
            botSay({
              text: `Hey, I only find a learning match... you won't teach this month.`,
              channel,
            });
            botSay({
              text: `But next session you will have the priority :wink:`,
              channel,
            });
            botSay({
              text: `Let me introduce @${teacherName} who will teach you *${learning}*`,
              channel,
            });
            botSay({
              text: `I will start a conversation between you two`,
              channel,
            });
            botSay({
              text: `I you want more info about your pairing, just type \`/whois @name\``,
              channel,
            });
          }else if(isLearner === true && isTeacher === true){
            botSay({
              text: `Hey ! I find a good pairing match this month :smile:`,
              channel,
            });
            botSay({
              text: `You will teach *${teaching}* to @${learnerName}...`,
              channel,
            });
            botSay({
              text: `...and @${teacherName} will explain you *${learning}*`,
              channel,
            });
            botSay({
              text: `I will start two separate conversation with them.`,
              channel,
            });
            botSay({
              text: `I you want more info about them, just type \`/whois @name\``,
              channel,
            });
          }else if(isLearner === false && isTeacher === true){
            botSay({
              text: `Hey, I only find a teaching match... you won't learn this month.`,
              channel,
            });
            botSay({
              text: `but next session you will have the priority :wink:`,
              channel,
            });
            botSay({
              text: `Let me introduce you @${learnerName}, he want to know about *${teaching}*`,
              channel,
            });
            botSay({
              text: `I will start a conversation between you two`,
              channel,
            });
            botSay({
              text: `I you want more info about your pairing, just type \`/whois @name\``,
              channel,
            });
          }else{
            botSay({
              text: `Sorry dude... I cannot find a pairing learning for this session...`,
              channel,
            });
          }
        });
        resolve();
      })();
    } catch (e) {
      console.log(e);
      bot.reply(message, "An error occur: " + e.error);
      reject(e);
    }
  });
};
