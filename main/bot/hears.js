/**
 * Created by thomasjeanneau on 09/04/2017.
 */

import Promise from 'bluebird'

import { getSlackUser, checkIfBuilder } from '../methods'
import { controller } from './config'

require('dotenv').config()

const {NODE_ENV} = process.env

if (!NODE_ENV) {
  console.log('Error: Specify NODE_ENV in a .env file')
  process.exit(1)
}

// User Commands

controller.hears(['^Hello$', '^Yo$', '^Hey$', '^Hi$', '^Ouch$'], ['direct_message', 'direct_mention'], async (bot, message) => {
  try {
    const {name} = await getSlackUser(bot, message.user)
    bot.startConversation(message, function (err, convo) {
      if (err) return console.log(err)
      convo.say(`Hey ${name}!`)
      convo.say(`I'm a new Mangrove Bot :smile:`)
    })
  } catch (e) {
    console.log(e)
    bot.reply(message, `Oops..! :sweat_smile: A little error occur: \`${e.message || e.error || e}\``)
  }
})

controller.hears(['^help$', '^options$'], ['direct_message', 'direct_mention'], async (bot, message) => {
  try {
    const {name} = await getSlackUser(bot, message.user)
    const botReply = Promise.promisify(bot.reply)
    await botReply(message, `Hi ${name}! What can I do for you ? :slightly_smiling_face:`)
    await botReply(message, {
      attachments: [{
        pretext: 'This is what you can ask me:',
        text: ``,
        mrkdwn_in: ['text', 'pretext']
      }]
    })
    const isBuilder = await checkIfBuilder(bot, message)
    if (isBuilder) {
      await botReply(message, {
        attachments: [{
          pretext: 'And because you\'re a Builder, you can also do:',
          text: ``,
          mrkdwn_in: ['text', 'pretext']
        }]
      })
    }
  } catch (e) {
    console.log(e)
    bot.reply(message, `Oops..! :sweat_smile: A little error occur: \`${e.message || e.error || e}\``)
  }
})

controller.hears('[^\n]+', ['direct_message', 'direct_mention'], async (bot, message) => {
  try {
    const {name} = await getSlackUser(bot, message.user)
    bot.startConversation(message, function (err, convo) {
      if (err) return console.log(err)
      convo.say(`Sorry ${name}, but I'm too young to understand what you mean :flushed:`)
      convo.say(`If you need help, just tell me \`help\` :wink:`)
    })
  } catch (e) {
    console.log(e)
    bot.reply(message, `Oops..! :sweat_smile: A little error occur: \`${e.message || e.error || e}\``)
  }
})
