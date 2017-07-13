import {bot} from '../bot/config'

const sendPrivateMessage = function(slackId, message) {
  bot.startPrivateConversation({user: slackId}, (err, convo) => {
    if (err) return console.error(err)
    console.log('in function')
    convo.say(message)
  })
}

console.log("sending message to Jonathan")
sendPrivateMessage('U30MX249Z', 'hello Jon!');

process.exit(0);