/**
 * Created by thomasjeanneau on 09/04/2017.
 */

import Promise from 'bluebird'

import {
  getSlackUser,
  getMemberBySlackHandler,
  updateMember
} from '../methods'
import { controller } from './config'
import { getCityCountry, validateAddress } from '../gmaps'

import {
  helpMessage,
  goodbye,
  mapMessage,
  mylocMessage,
  noLocationFound,
  noLocationForUser,
  noLocationGiven,
  wrongLocation,
  locationConfirmation,
  positiveLocationConfirmation,
  locationsConfirmation
} from './messages'

require('dotenv').config()

const {NODE_ENV} = process.env

if (!NODE_ENV) {
  console.log('Error: Specify NODE_ENV in a .env file')
  process.exit(1)
}

const handleError = function (e, bot, message) {
  console.log(e)
  bot.reply(message, `Oops..! :sweat_smile: A little error occur: \`${e.message || e.error || e}\``)
}

// User Commands
controller.hears(['^!map'], ['direct_message', 'direct_mention'], async (bot, message) => {
  try {
    const botReply = Promise.promisify(bot.reply)
    await botReply(message, await mapMessage())
  } catch (e) {
    handleError(e, bot, message)
  }
})

controller.hears(['^!myloc'], ['direct_message', 'direct_mention'], async (bot, message) => {
  try {
    const slackUser = await getSlackUser(bot, message.user)
    const user = await getMemberBySlackHandler(slackUser.name)
    const botReply = Promise.promisify(bot.reply)
    if (user.fields['Current Location']) {
      await botReply(message, mylocMessage(user.fields['Current Location']))
    } else {
      await botReply(message, noLocationForUser())
    }
  } catch (e) {
    handleError(e, bot, message)
  }
})

controller.hears(['^!newloc'], ['direct_message', 'direct_mention'], async (bot, message) => {
  try {
    const botReply = Promise.promisify(bot.reply)
    const address = message.text.replace('!newloc', '')

    if (address.length === 0) {
      await botReply(message, noLocationGiven())
      return
    }

    const validatedLocs = await validateAddress(address)
    if (validatedLocs.length === 0) {
      await botReply(message, noLocationFound())
    } else if (validatedLocs.length === 1) {
      await botReply(message, locationConfirmation(getCityCountry(validatedLocs[0])))
    } else {
      await botReply(message, locationsConfirmation(validatedLocs.slice(0, 4)))
    }
  } catch (e) {
    handleError(e, bot, message)
  }
})

controller.hears('[^\n]+', '^Hello', '^Yo', '^Hey', '^Hi', '^Ouch', ['direct_message', 'direct_mention'], async (bot, message) => {
  try {
    const {name} = await getSlackUser(bot, message.user)
    const botReply = Promise.promisify(bot.reply)
    await botReply(message, helpMessage(name))
  } catch (e) {
    handleError(e, bot, message)
  }
})

// receive an interactive message, and reply with a message that will replace the original
controller.on('interactive_message_callback', async function (bot, message) {
  switch (message.callback_id) {
    // address confirmation
    case 'location_confirmation':
      handleAddressConfirmation(bot, message)
      break
    // address selection
    case 'locations_confirmation':
      handleAddressSelect(bot, message)
      break
  }
})

const handleAddressConfirmation = async function (bot, message) {
  const fields = []

  // YES
  if (message.actions[0].value) {
    const slackUser = await getSlackUser(bot, message.user)
    const user = await getMemberBySlackHandler(slackUser.name)

    updateMember(user.id, {'Current Location': message.actions[0].value})
    fields.push({value: ':white_check_mark: Address updated!'})

  // NO
  } else {
    fields.push({value: ':x:'})
  }

  // replace actions with the confirmation text
  const attachments = message.original_message.attachments
  attachments[0].actions = []
  attachments[0].fields = fields
  bot.replyInteractive(message, {attachments})

  // YES message follow up
  if (message.actions[0].value) {
    addressUpdateFollowUp(bot, message)
  // NO message follow up
  } else {
    addressUpdateFollowUpFail(bot, message)
  }
}

const handleAddressSelect = async function (bot, message) {
  const fields = []
  // ADDRESS SELECTED
  if (message.actions[0].value) {
    const slackUser = await getSlackUser(bot, message.user)
    const user = await getMemberBySlackHandler(slackUser.name)

    updateMember(user.id, {'Current Location': message.actions[0].value})
    fields.push({value: ':white_check_mark: Address updated!'})
  } else {
    fields.push({value: ':x:'})
  }

  // replace actions with the confirmation text
  const attachments = message.original_message.attachments
  attachments[0].actions = []
  attachments[0].fields = fields
  bot.replyInteractive(message, {attachments})

  // YES message follow up
  if (message.actions[0].value) {
    addressUpdateFollowUp(bot, message)
  // NO message follow up
  } else {
    addressUpdateFollowUpFail(bot, message)
  }
}

const addressUpdateFollowUp = async function (bot, message) {
  bot.startConversation(message, async (err, convo) => {
    if (err) {
      return handleError(err, bot, message)
    }
    const mapMsg = await mapMessage()
    convo.say(positiveLocationConfirmation())
    convo.say(mapMsg)
    convo.say(goodbye())
  })
}

const addressUpdateFollowUpFail = function (bot, message) {
  bot.startConversation(message, (err, convo) => {
    if (err) {
      return handleError(err, bot, message)
    }
    convo.say(wrongLocation())
  })
}
