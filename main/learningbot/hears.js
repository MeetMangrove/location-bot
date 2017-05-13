/**
 * Created by thomasjeanneau on 09/04/2017.
 */

import Promise from 'bluebird'
import asyncForEach from 'async-foreach'

import {
  checkIfAdmin,
  getAllApplicants,
  getAllNoApplicants,
  updateApplicant,
  getApplicant
} from '../methods'
import { pairAllApplicants } from '../pairing'
import { controller } from './config/slackbot'

import pairingConversation from './pairingConversation'
import startAPairingSession from './startAPairingSession'
import firstTimeConversation from './firstTimeConversation'

const {forEach} = asyncForEach

// Admin Commands

controller.hears('pair all applicants', ['direct_message', 'direct_mention'], async (bot, message) => {
  try {
    const isAdmin = await checkIfAdmin(bot, message)
    if (isAdmin) {
      bot.reply(message, 'Ok, I\'ll start pairing people')
      // generate pairing
      const pairing = await pairAllApplicants()
      // notify about the pairing
      bot.reply(message, `Pairing done, saved to Airtable.\n It contains ${pairing.pairs.length} pairs.`)
    } else {
      bot.reply(message, 'Sorry but it looks like you\'re not an admin. You can\'t use this feature.')
    }
  } catch (e) {
    console.log(e)
    bot.reply(message, `Oops..! :sweat_smile: A little error occur: \`${e.message || e.error || e}\``)
  }
})

controller.hears('introduce new pairings', ['direct_message', 'direct_mention'], async (bot, message) => {
  try {
    const isAdmin = await checkIfAdmin(bot, message)
    if (isAdmin) {
      bot.reply(message, 'Ok, I\'ll start introducing people :sparkles: ')
      const membersPaired = await startAPairingSession(bot, message)
      await pairingConversation(bot, message, membersPaired)
      bot.reply(message, 'All people have been introduced :rocket:')
    } else {
      bot.reply(message, 'Sorry but it looks like you\'re not an admin. You can\'t use this feature.')
    }
  } catch (e) {
    console.log(e)
    bot.reply(message, `Oops..! :sweat_smile: A little error occur: \`${e.message || e.error || e}\``)
  }
})

controller.hears('send message to no-applicants', ['direct_message', 'direct_mention'], async (bot, message) => {
  try {
    const isAdmin = await checkIfAdmin(bot, message)
    if (isAdmin) {
      bot.reply(message, 'Okay, I send a message to all people who are not applicants yet!')
      const noApplicants = await getAllNoApplicants(bot)
      console.log(noApplicants)
      forEach(noApplicants, async function ({ id, name }) {
        const done = this.async()
        // For each member, start a firstTimeConversation
        if (name === 'thomas') { // Remove this if statement for production
          firstTimeConversation(bot, {user: id}, {name})
        }
        done()
      })
      bot.reply(message, 'All done!')
    } else {
      bot.reply(message, 'Sorry but it looks like you\'re not an admin. You can\'t use this feature.')
    }
  } catch (e) {
    console.log(e)
    bot.reply(message, `Oops..! :sweat_smile: A little error occur: \`${e.message || e.error || e}\``)
  }
})

// Applicants Commands

controller.hears(['Hello', 'Yo', 'Hey', 'Hi', 'Ouch'], 'direct_message', async (bot, message) => {
  try {
    await firstTimeConversation(bot, message, {name: ''})
  } catch (e) {
    console.log(e)
    bot.reply(message, `Oops..! :sweat_smile: A little error occur: \`${e.message || e.error || e}\``)
  }
})

controller.hears('status', 'direct_message', async (bot, message) => {
  // TODO
  console.log('status')
  bot.api.users.info({user: message.user}, (err, res) => {
    console.log(res.user.name)
    getApplicant('P2PL Tests', res.user.name, (err, rec) => {
      console.log(rec.id)
      const status = rec.get('Active P2P') ? 'active' : 'inactive'
      bot.startPrivateConversation(message, (err, convo) => {
        convo.say('Hi, Your current status is: ' + status)
        convo.say('You can change your status by messaging me with `start` or `stop`')
      })
    })
  })
})

controller.hears('stop', 'direct_message', async (bot, message) => {
  // TODO
  console.log('stop')
  bot.api.users.info({user: message.user}, (err, res) => {
    console.log(res.user.name)
    updateApplicant('P2PL Tests', res.user.name, {'Active P2P': false}, (err, rec) => {
      if (err) {
        console.log('Error occurred')
      }
      bot.startPrivateConversation(message, (err, convo) => {
        convo.say('Okay 😥, sorry to see you go.')
        convo.say('You can start again by messaging me with `start`.')
      })
    })
  })
})

controller.hears('start', 'direct_message', async (bot, message) => {
  // TODO
  console.log('start')
  bot.api.users.info({user: message.user}, (err, res) => {
    console.log(res.user.name)
    updateApplicant('P2PL Tests', res.user.name, {'Active P2P': true}, (err, rec) => {
      if (err) {
        console.log('Error occurred')
      }
      bot.startPrivateConversation(message, (err, convo) => {
        convo.say('Amaaaaaaaaaaaazing 🎉\'! I\'ll let you know when the next session starts! Happy Learning!')
      })
    })
  })
})

controller.hears('applicants', ['direct_message', 'direct_mention'], async (bot, message) => {
  try {
    const people = await getAllApplicants()
    forEach(people, async function (person) {
      const done = this.async()
      bot.reply(message, {
        'text': `:sparkles: <@${person.name}> :sparkles:`,
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
    bot.reply(message, `Oops..! :sweat_smile: A little error occur: \`${e.message || e.error || e}\``)
  }
})

controller.hears(['help', 'options'], ['direct_message', 'direct_mention'], async (bot, message) => {
  bot.reply(message, `Hi, I'm the Learning Bot. You can message me one of the following things: \n
    \`help\` - this information\n
    \`first-time\` - an intro to the bot\n
    \`status\` - find out if you're active to be paired in the next session\n
    \`stop\` - stop being paired\n
    \`start\` - start being paired\n
    That's it. Happy Learning!`)
})

controller.hears('interactive', 'direct_message', function (bot, message) {
  bot.reply(message, {
    attachments: [
      {
        title: 'Do you want to interact with my buttons?',
        callback_id: '123',
        attachment_type: 'default',
        actions: [
          {
            'name': 'yes',
            'text': 'Yes',
            'value': 'yes',
            'type': 'button'
          },
          {
            'name': 'no',
            'text': 'No',
            'value': 'no',
            'type': 'button'
          }
        ]
      }
    ]
  })
})

controller.on('interactive_message_callback', function (bot, message) {
  // check message.actions and message.callback_id to see what action to take...

  bot.replyInteractive(message, {
    text: '...',
    attachments: [
      {
        title: 'My buttons',
        callback_id: '123',
        attachment_type: 'default',
        actions: [
          {
            'name': 'yes',
            'text': 'Yes!',
            'value': 'yes',
            'type': 'button'
          },
          {
            'text': 'No!',
            'name': 'no',
            'value': 'delete',
            'style': 'danger',
            'type': 'button',
            'confirm': {
              'title': 'Are you sure?',
              'text': 'This will do something!',
              'ok_text': 'Yes',
              'dismiss_text': 'No'
            }
          }
        ]
      }
    ]
  })
})
