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
import { getCityCountry, validateAddress } from '../gmaps'

require('dotenv').config()

const {NODE_ENV} = process.env

if (!NODE_ENV) {
  console.log('Error: Specify NODE_ENV in a .env file')
  process.exit(1)
}

const handleError = function(e, bot) {
  console.log(e)
  bot.reply(message, `Oops..! :sweat_smile: A little error occur: \`${e.message || e.error || e}\``)
}

// Messages Methods
const helpMessage = function(name) {
  return {
    attachments: [{
      pretext: `
Hey ${name}!\n
I'm Sally Ride! I'm taking care of keeping everyone's location up to date :boat:
Here are the few commands you can use with me :ok_woman:`,
      text: `
"!newloc <city or country>" for me to update your location,
"!myloc" if you want to know where I think you are,
"!map" for a link to Mangrove Members map!`
    }]
  }
}

const goodbye = function() {
  return {
    attachments: [{
      pretext: `I'll be orbiting in my space shuttle if you need me.
                If you need anything else don't forget the following commands:`,
      text: `"!newloc <city or country>" for me to update your location,
             "!myloc" if you want to know where I think you are,
             "!map" for a link to Mangrove Members map!`
    }]
  }
}

const mylocMessage = function(address) {
  return {
    attachments: [{
      pretext: 'Your location seems to be:',
      text: address,
      mrkdwn_in: ['text', 'pretext']
    }]
  }
}

const noLocationFound = function() {
  return `Oops, doesn't seem like I'm able to find the place
    you are talking about, even with the help of my friend Google Maps.\n
    Maybe try to give me a more complete address?\n
    Don't worry, I will only save the City and Country ;)`
}

const noLocationForUser = function() {
  return {
    attachments: [{
      pretext: `It doesn't seem like I have any information about your current location.\n
                If you want to set your current location, please reply with:`,
      text: '"!newloc <City, Country>"'
    }]
  }
}

const noLocationGiven = function() {
  return {
    attachments: [{
      pretext: 'It seems like you didn\'t give me any address... Please send me something like the following example:',
      text: '"!newloc <City, Country>"'
    }]
  }
}

const wrongLocation = function() {
  return 'My spatial system must be down. Please type "!newloc <City, Country>".'
}

const locationConfirmation = function(address) {
  return {
    attachments: [{
      callback_id: 'location_confirmation',
      attachment_type: 'default',
      pretext: 'I found a matching address, is it correct?',
      title: address,
      actions: [
        {
          'name': 'addressConfirmed',
          'text': 'Yes',
          'type': 'button',
          'value': address,
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
  }
}

const locationConfirmed = function() {
  return 'That was easier than finding Earth\'s location in the Milky Way :)'
}

const locationsConfirmation = function(locations) {
  const actions = [];
  for (const loc of locations) {
    const cityCountry = getCityCountry(loc)
    actions.push({
      name: 'addressSelect',
      text: cityCountry,
      'type': 'button',
      'value': cityCountry
    })
  }
  actions.push({
    name: 'addressSelect',
    text: 'None :(',
    'type': 'button',
    'style': 'danger',
    'value': false
  })
  return {
    attachments: [{
      callback_id: 'locations_confirmation',
      attachment_type: 'default',
      pretext: 'I found multiple matching addresses, please select the correct postasl code!',
      actions: actions
    }]
  }
}

// User Commands
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
    handleError(e, bot)
  }
})

controller.hears('[^\n]+', ['direct_message', 'direct_mention'], async (bot, message) => {
  try {
    const {name} = await getSlackUser(bot, message.user)
    const botReply = Promise.promisify(bot.reply)
    await botReply(message, helpMessage(name))
  } catch (e) {
    handleError(e, bot)
  }
})

// receive an interactive message, and reply with a message that will replace the original
controller.on('interactive_message_callback', async function(bot, message) {
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

const handleAddressConfirmation = async function(bot, message) {
  const fields = []

  // YES
  if (message.actions[0].value) {
    const slackUser = await getSlackUser(bot, message.user)
    const user = await getMemberBySlackHandler(slackUser.name)

    updateMember(user.id, {'Current Location': message.actions[0].value})
    fields.push({value: ':white_check_mark: Address updated!'})

  // NO
  } else {
    fields.push({value: ':x: Ping me whenever you want to update your address'})
  }

  // replace actions with the confirmation text
  const attachments = message.original_message.attachments
  attachments[0].actions = []
  attachments[0].fields = fields
  bot.replyInteractive(message, {attachments})
}

const handleAddressSelect = async function(bot, message) {
  const fields = []
  // ADDRESS SELECTED
  if (message.actions[0].value) {
    const slackUser = await getSlackUser(bot, message.user)
    const user = await getMemberBySlackHandler(slackUser.name)

    updateMember(user.id, {'Current Location': message.actions[0].value})
    fields.push({value: ':white_check_mark: Address updated!'})
  } else {
    fields.push({value: ':x: Ping me whenever you want to update your address'})
  }

  // replace actions with the confirmation text
  const attachments = message.original_message.attachments
  attachments[0].actions = []
  attachments[0].fields = fields
  bot.replyInteractive(message, {attachments})
}
