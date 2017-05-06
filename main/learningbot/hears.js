/**
 * Created by thomasjeanneau on 09/04/2017.
 */

import PythonShell from 'python-shell'
import Promise from 'bluebird'
import asyncForEach from 'async-foreach'

import { controller } from './config/slackbot'
import { checkIfAdmin, getAllApplicants } from '../methods'
import { pairingConversation } from './pairingConversation'
import { startAPairingSession } from './startAPairingSession'

const { forEach } = asyncForEach
const options = {
  mode: 'text',
  pythonPath: 'python',
  scriptPath: './'
}

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
    const botReply = Promise.promisify(bot.reply)
    const isAdmin = await checkIfAdmin(bot, message)
    if (isAdmin) {
      await botReply(message, "Ok, I'll start pairing people")
      PythonShell.run('pairing.py', options, async function (error) {
        if (!error) {
          await botReply(message, "Pairing complete. Results should be available in airtable. You can run 'introductions' to send a message to each pair.")
        } else {
          console.log(error)
          await botReply(message, 'An error occurred during pairing.')
        }
      })
    } else {
      await botReply(message, "Sorry but it looks like you're not an admin. You can't use this feature.")
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
      await botReply(message, "Ok, I'll start introducing people :sparkles: ")
      const membersPaired = await startAPairingSession(bot, message)
      await pairingConversation(bot, message, membersPaired)
      await botReply(message, 'All people have been introduced :rocket:')
    } else {
      await botReply(message, "Sorry but it looks like you're not an admin. You can't use this feature.")
    }
  } catch (e) {
    console.log(e)
    await botReply(message, `Oops..! :sweat_smile: A little error occur: \`${e.message || e.error || e}\``)
  }
})
