import { bot } from './config'
import { handleError } from './hears'

/* sendPrivateMessage take a slackId and a message and send the message to slackId
 *
 * slackId can be a channel or a user
 * message is a string or a slack message object
 */
const sendPrivateMessage = function(slackId, message) {
  bot.startPrivateConversation({user: slackId}, (err, convo) => {
    if (err) return console.error(err)
    convo.say(message)
  })
}

const spamEveryone = function(message) {
  bot.api.users.list({}, (err, response) => {
    if (err) return console.error(err)
    for (const member in response.members) {
      sendPrivateMessage(member.id, message)
    }
  })
}
