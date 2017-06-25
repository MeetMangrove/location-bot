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
  return `'!newloc <city or country>' for me to update your location,
  '!myloc' if you want to know where I think you are,
  '!map' for a link to Mangrove Members map!`
};

export const handleError = function(e, bot) {
  console.log(e);
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
          pretext: `It seems like you didn't give me any address... Please send me something like the following example:`,
          text: `!newloc 123 5th av., New York NY`
        }]
      })
      return
    }

    const validatedLocs = await validateAddress(address)
    if (validatedLocs.length === 1) {
      await botReply(message, {
        attachments: [{
          callback_id: '1',
          attachment_type: 'default',
          pretext: `I found a matching address, is it correct?`,
          title: validatedLocs[0].formatted_address,
          actions: [
            {
              'name': 'addressConfirmed',
              'text': 'Yes',
              'type': 'button',
              'value': validatedLocs[0].formatted_address,
              'style': 'primary'
            },
            {
              'name': 'addressConfirmed',
              'text': 'No',
              'type': 'button',
              'value': false,
              'style': 'danger'
            }
          ]
        }]
      })
    } else {
      const actions = [];
      for (let loc of validatedLocs.slice(0, 5)) {
        console.log(validatedLocs)
        let postalCode;
        for (let comp of loc.address_components) {
          if (comp.types.indexOf('postal_code') > -1) {
            postalCode = comp.postal_code
            break
          }
        }
        actions.push({
          name: 'addressSelect',
          text: postalCode,
          'type': 'button',
          'value': loc.formatted_address
        })
      }
      await botReply(message, {
        attachments: [{
          callback_id: '2',
          attachment_type: 'default',
          pretext: `I found multiple matching addresses, please select the correct postasl code!`,
          actions: actions
        }]
      })
    }
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

// receive an interactive message, and reply with a message that will replace the original
controller.on('interactive_message_callback', async function(bot, message) {
  console.log(message)
  switch (message.callback_id) {
    // address confirmation
    case '1':
      handleAddressConfirmation(bot, message)
      break
    // address selection
    case '2':
      handleAddressSelect(bot, message)
      break
  }
})

const handleAddressConfirmation = async function(bot, message) {
  let fields = [];
  if (message.actions[0].value) {
    const slackUser = await getSlackUser(bot, message.user)
    const user = await getMemberBySlackHandler(slackUser.name)

    updateMember(user.id, {
    'Postal Adress': message.actions[0].value
    })

    fields.push({
      value: `:white_check_mark: Address updated!`
    })
  } else {
    fields.push({
      value: `:x: Ping me whenever you want to update your address`
    })
  }

  // replace actions with the confirmation text
  const attachments = message.original_message.attachments
  attachments[0].actions = [];
  attachments[0].fields = fields;
  bot.replyInteractive(message, {attachments})
}

const handleAddressSelect = async function(bot, message) {
  const slackUser = await getSlackUser(bot, message.user)
  const user = await getMemberBySlackHandler(slackUser.name)
  updateMember(user.id, {
    'Postal Adress': message.actions[0].value
  })

  // replace actions with the confirmation text
  const attachments = message.original_message.attachments
  attachments[0].actions = []
  attachments[0].fields = [{
    'text': `:white_check_mark: Ok, I updated your address to ${message.actions[0].value}`
  }]
  bot.replyInteractive(message, {attachments})
}
