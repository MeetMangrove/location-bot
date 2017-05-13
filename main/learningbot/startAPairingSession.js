/**
 * Created by thomasjeanneau on 20/03/2017.
 */

import _ from 'lodash'
import Promise from 'bluebird'
import asyncForEach from 'async-foreach'

import { getMembersPaired } from '../methods'

const { forEach } = asyncForEach

export default async (bot) => {
  const apiUser = Promise.promisifyAll(bot.api.users)
  const { members } = await apiUser.listAsync({ token: bot.config.token })
  const botSay = Promise.promisify(bot.say)
  const list = _.map(members, member => _.pick(member, ['id', 'name']))
  const membersPaired = await getMembersPaired()
  forEach(membersPaired, async function (member) {
    const done = this.async()
    const channel = _.find(list, ['name', member.name.substr(1)]).id
    const { isLearner, teacherName, learning, isTeacher, learnerName, teaching } = member
    if (isLearner === true && isTeacher === false) {
      await botSay({
        text: `Hey, I only found a learning match for you. It means that you won't teach this month.\n
        But next session you will have the priority :wink:\n
        Let me introduce you to <@${teacherName}> who will tell you more about *${learning}*\n
        I will start a conversation with the two of you.\n
        If you want more infos about your pairing, beforehand just type \`/whois @name\``,
        channel
      })
    } else if (isLearner === true && isTeacher === true) {
      await botSay({
        text: `Hey, I just found the perfect pairing for you :smile:\n
        You will share your experiences about *${teaching}* with <@${learnerName}>\n
        and <@${teacherName}> will tell you more about *${learning}*\n
        I will start two separate conversation with them.\n
        If you want more info about them, beforehand just type \`/whois @name\``,
        channel
      })
    } else if (isLearner === false && isTeacher === true) {
      await botSay({
        text: `Hey, I only found a teaching match for you. It means that you won't learn this month.\n
        But next session you will have the priority :wink:\n
        Let me introduce you to <@${learnerName}> who wants to learn more about *${teaching}*\n
        I will start a conversation with the two of you.\n
        If you want more info about your pairing, just type \`/whois @name\``,
        channel
      })
    } else {
      await botSay({
        text: `I'm a really sorry :pensive: I cannot find any pairing for you this month.\n
        I'm sure you want to learn more about other skills: fill in this form to keep me updated on what you want to teach and learn.`,
        channel
      })
    }
    done()
  })
  return membersPaired
}
