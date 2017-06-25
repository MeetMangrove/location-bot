/**
 * Created by thomasjeanneau on 08/02/2017.
 */

import Botkit from 'botkit'
import BotkitStorageMongo from 'botkit-storage-mongo'

const _bots = {}
const {
  SLACK_CLIENT_ID,
  SLACK_CLIENT_SECRET,
  SLACK_BOT_TOKEN,
  PORT,
  MONGO_URL
} = process.env

if (!SLACK_CLIENT_ID || !SLACK_CLIENT_SECRET || !PORT || !MONGO_URL) {
  console.log('Error: Specify SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, PORT and MONGO_URL in a .env file')
  process.exit(1)
}

const trackBot = (bot) => {
  _bots[bot.config.token] = bot
}

const mongoStorage = new BotkitStorageMongo({
  mongoUri: MONGO_URL
})

const controller = Botkit.slackbot({
  interactive_replies: true,
  require_delivery: true,
  storage: mongoStorage,
  debug: true
})

controller.configureSlackApp({
  clientId: SLACK_CLIENT_ID,
  clientSecret: SLACK_CLIENT_SECRET,
  scopes: ['bot', 'chat:write:bot', 'groups:history', 'groups:read', 'groups:write', 'users:read', 'users:read.email']
})

controller.setupWebserver(PORT, (err) => {
  if (err) return console.log(err)
  controller
    .createWebhookEndpoints(controller.webserver)
    .createHomepageEndpoint(controller.webserver)
    .createOauthEndpoints(controller.webserver, (err, req, res) => {
      if (err) return res.status(500).send('ERROR: ' + err)
      res.send('Success!')
    })
})

controller.on('create_bot', (bot, config) => {
  if (_bots[bot.config.token]) {
    // already online! do nothing.
  } else {
    bot.startRTM((err) => {
      if (!err) trackBot(bot)
      bot.startPrivateConversation({user: config.createdBy}, (err, convo) => {
        if (err) return console.log(err)
        convo.say('I am a bot that has just joined your team')
        convo.say('You must now /invite me to a channel so that I can be of use!')
      })
    })
  }
})

controller.on('rtm_open', () => {
  console.log('** The RTM api just connected!')
})

controller.on('rtm_close', () => {
  console.log('** The RTM api just closed')
})

// controller.storage.teams.all((err, teams) => {
//   if (err) throw new Error(err)
//   for (let t in teams) {
//     if (teams[t].bot) {
//       controller.spawn(teams[t]).startRTM((err, bot) => {
//         if (err) return console.log('Error connecting bot to Slack:', err)
//         trackBot(bot)
//       })
//     }
//   }
// })
controller.spawn({token: SLACK_BOT_TOKEN}).startRTM((err, bot) => {
  if (err) return console.log('Error connecting bot to Slack:', err)
  trackBot(bot)
})

export { controller }
