/**
 * Created by thomasjeanneau on 09/04/2017.
 */

import Promise from 'bluebird'
import asyncForEach from 'async-foreach'

import { controller } from './config/slackbot'
import { checkIfAdmin, getAllApplicants } from '../methods'
import { pairingConversation } from './pairingConversation'
import { startAPairingSession } from './startAPairingSession'
import { pairAllApplicants } from '../pairing'

const {forEach} = asyncForEach

controller.hears('applicants', ['direct_message', 'direct_mention', 'mention'], async (bot, message) => {
  const botReply = Promise.promisify(bot.reply)
  try {
    const people = await getAllApplicants()
    forEach(people, async function (person) {
      const done = this.async()
      await botReply(message, {
        'text': `:sparkles: <${person.name}> :sparkles:`,
        'attachments': [
          {
            'title': ':sleuth_or_spy: Interests',
            'text': person.interests.join(', '),
            'color': '#9575CD'
          },
          {
            'title': ':muscle: Skills',
            'text': person.skills.join(', '),
            'color': '#E57373'
          }
        ]
      })
      done()
    })
  } catch (e) {
    console.log(e)
    await botReply(message, `Oops..! :sweat_smile: A little error occur: \`${e.message || e.error || e}\``)
  }
})

controller.hears('pair', ['direct_message', 'direct_mention'], async (bot, message) => {
  const botReply = Promise.promisify(bot.reply)
  try {
    const isAdmin = await checkIfAdmin(bot, message)
    if (isAdmin) {
      await botReply(message, 'Ok, I\'ll start pairing people')
      // generate pairing
      const pairing = await pairAllApplicants()
      // notify about the pairing
      await botReply(message, `Pairing done, saved to Airtable.\n It contains ${pairing.pairs.length} pairs.`)
    } else {
      await botReply(message, 'Sorry but it looks like you\'re not an admin. You can\'t use this feature.')
    }
  } catch (e) {
    console.log(e)
    await botReply(message, `Oops..! :sweat_smile: A little error occur: \`${e.message || e.error || e}\``)
  }
})

controller.hears('introductions', ['direct_message', 'direct_mention'], async (bot, message) => {
  const botReply = Promise.promisify(bot.reply)
  try {
    const isAdmin = await checkIfAdmin(bot, message)
    if (isAdmin) {
      await botReply(message, 'Ok, I\'ll start introducing people :sparkles: ')
      const membersPaired = await startAPairingSession(bot, message)
      await pairingConversation(bot, message, membersPaired)
      await botReply(message, 'All people have been introduced :rocket:')
    } else {
      await botReply(message, 'Sorry but it looks like you\'re not an admin. You can\'t use this feature.')
    }
  } catch (e) {
    console.log(e)
    await botReply(message, `Oops..! :sweat_smile: A little error occur: \`${e.message || e.error || e}\``)
  }
})
