/**
 * Created by thomasjeanneau on 09/04/2017.
 */

import Promise from 'bluebird'

import {
  getSlackUser,
  getMemberBySlackHandler,
  checkIfBuilder,
  updateMember
} from '../methods'
import { controller } from './config'
import { validateAddress } from '../gmaps'

require('dotenv').config()

const {NODE_ENV} = process.env

if (!NODE_ENV) {
  console.log('Error: Specify NODE_ENV in a .env file')
  process.exit(1)
}

// Helper Methods
const giveHelp = function() {
  return `"!newloc <city or country>" for me to update your location,
  "!myloc" if you want to know where I think you are,
  "!map" for a link to Mangrove Members map!`
};

const handleError = function(e, bot) {
  console.log(e)
  bot.reply(message, `Oops..! :sweat_smile: A little error occur: \`${e.message || e.error || e}\``)
}

// User Commands

controller.hears(['^Hello', '^Yo', '^Hey', '^Hi', '^Ouch'], ['direct_message', 'direct_mention'], async (bot, message) => {
  try {
    const {name} = await getSlackUser(bot, message.user)
    bot.startConversation(message, function (err, convo) {
      if (err) return console.log(err)
      convo.say(`Hey ${name}!`)
      convo.say(`I'm Marco Polo! I'm taking care of keeping everyone's location up to date :boat:`)
      convo.say(`Here are the few commands you can use with me :ok_woman:`)
      convo.say(giveHelp())
    })
  } catch (e) {
    handleError(e, bot)
  }
})

controller.hears(['^!myloc'], ['direct_message', 'direct_mention'], async (bot, message) => {
  try {
    const slackUser = await getSlackUser(bot, message.user)
    const user = await getMemberBySlackHandler(slackUser.name)
    const botReply = Promise.promisify(bot.reply)
    await botReply(message, {
      attachments: [{
        pretext: 'Your location seems to be:',
        text: user.fields['Postal Adress'],
        mrkdwn_in: ['text', 'pretext']
      }]
    })
  } catch (e) {
    handleError(e, bot)
  }
})

controller.hears(['^!newloc'], ['direct_message', 'direct_mention'], async (bot, message) => {
  try {
    const botReply = Promise.promisify(bot.reply)

    const slackUser = await getSlackUser(bot, message.user)
    const user = await getMemberBySlackHandler(slackUser.name)

    const address = message.text.replace('!newloc', '')
    if (address.length === 0) {
      await botReply(message, {
        attachments: [{
          pretext: `It seems like you didn't give me any address...`,
          text: `!newloc 123 5th av., New York NY`
        }]
      })
      return
    }

    // TODO: check if multiple addresses have been returned, asked the user to choose the correct one.
    const validatedLocs = await validateAddress(address)

    // TODO: ask user to confirm they want to change their location to validated address
    const updatedMember = await updateMember(user.id, {
      'Postal Adress': validatedLocs[0].formatted_address
    })

    await botReply(message, {
      attachments: [{
        pretext: 'Ok, I updated your location to:',
        text: updatedMember.fields['Postal Adress'],
        mrkdwn_in: ['text', 'pretext']
      }]
    })
  } catch (e) {
    handleError(e, bot)
  }
})

controller.hears(['^help', '^options$'], ['direct_message', 'direct_mention'], async (bot, message) => {
  try {
    const {name} = await getSlackUser(bot, message.user)
    const botReply = Promise.promisify(bot.reply)
    await botReply(message, `Hi ${name}! What can I do for you ? :slightly_smiling_face:`)
    await botReply(message, {
      attachments: [{
        pretext: 'This is what you can ask me:',
        text: giveHelp(),
        mrkdwn_in: ['text', 'pretext']
      }]
    })
    // const isBuilder = await checkIfBuilder(bot, message)
    // if (isBuilder) {
    //   await botReply(message, {
    //     attachments: [{
    //       pretext: 'And because you\'re a Builder, you can also do:',
    //       text: ``,
    //       mrkdwn_in: ['text', 'pretext']
    //     }]
    //   })
    // }
  } catch (e) {
    handleError(e, bot)
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
    handleError(e, bot)
  }
})
