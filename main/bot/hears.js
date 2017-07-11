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

import tracker from '../tracking'

require('dotenv').config()

const {NODE_ENV} = process.env

if (!NODE_ENV) {
  console.log('Error: Specify NODE_ENV in a .env file')
  process.exit(1)
}

export const handleError = function (e, bot) {
  bot.reply(message, `Oops..! :sweat_smile: A little error occur: \`${e.message || e.error || e}\``)
}

// User Commands
controller.hears(['^!map'], ['direct_message', 'direct_mention'], async (bot, message) => {
  try {
    tracker.track('user.map', {
      user: message.user
    })
    const botReply = Promise.promisify(bot.reply)
    await botReply(message, await mapMessage())
  } catch (e) {
    handleError(e, bot, message)
  }
})

controller.hears(['^!myloc'], ['direct_message', 'direct_mention'], async (bot, message) => {
  try {
    tracker.track('user.myloc', {
      user: message.user
    })
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

    tracker.track('user.newloc', {
      user: message.user,
      address
    })

    if (address.length === 0) {
      tracker.track('user.newloc.noloc', {
        user: message.user,
        address
      })
      await botReply(message, noLocationGiven())
      return
    }

    const validatedLocs = await validateAddress(address)
    if (validatedLocs.length === 0) {
      tracker.track('user.newloc.notfound', {
        user: message.user,
        address
      })
      await botReply(message, noLocationFound())
    } else if (validatedLocs.length === 1) {
      tracker.track('user.newloc.onefound', {
        user: message.user,
        address,
        validatedLocs
      })
      await botReply(message, locationConfirmation(getCityCountry(validatedLocs[0])))
    } else {
      tracker.track('user.newloc.mulitplefound', {
        user: message.user,
        address,
        validatedLocs
      })
      await botReply(message, locationsConfirmation(validatedLocs.slice(0, 4)))
    }
  } catch (e) {
    handleError(e, bot, message)
  }
})

controller.hears(['[^\n]+', '^Hello', '^Yo', '^Hey', '^Hi', '^Ouch'], ['direct_message', 'direct_mention'], async (bot, message) => {
  try {
    tracker.track('user.hello', {
      user: message.user,
      text: message.text
    })
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
    tracker.track('user.address.confirmation.yes', {
      user: message.user
    })
    const slackUser = await getSlackUser(bot, message.user)
    const user = await getMemberBySlackHandler(slackUser.name)

    updateMember(user.id, {'Current Location': message.actions[0].value})
    fields.push({value: ':white_check_mark:'})

  // NO
  } else {
    tracker.track('user.address.confirmation.no', {
      user: message.user
    })
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
    tracker.track('user.address.confirmations.select', {
      user: message.user
    })
    const slackUser = await getSlackUser(bot, message.user)
    const user = await getMemberBySlackHandler(slackUser.name)

    updateMember(user.id, {'Current Location': message.actions[0].value})
    fields.push({value: ':white_check_mark:'})
  } else {
    tracker.track('user.address.confirmations.no', {
      user: message.user
    })
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
