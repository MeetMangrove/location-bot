import {bot} from '../bot/config'

const sendPrivateMessage = function(slackId, message) {
  return new Promise((resolve, reject) => {
    bot.startPrivateConversation({user: slackId}, (err, convo) => {
      if (err) return console.error(err)
      console.log('in function')
      convo.say(message)
    })
    resolve()
  })
}

console.log("sending message to Jonathan")
sendPrivateMessage('U30MX249Z', 'hello Jon!').then(() => process.exit(0));

