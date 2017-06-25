import { bot } from './config'
import { handleError } from './hears'

/* sendPrivateMessage take a slackId and a message and send the message to slackId
 *
 * slackId can be a channel or a user
 * message is a string or a slack message object
 */
export const sendPrivateMessage = function(slackId, message) {
  bot.startPrivateConversation({user: slackId}, (err, convo) => {
    if (err) return console.error(err)
    convo.say(message)
  })
}

/* spamEveryone will privately send a message to every slack user.
 *
 * message is a string
 */
export const spamEveryone = function(message) {
  bot.api.users.list({}, (err, response) => {
    if (err) return console.error(err)
    for (const member of response.members) {
      sendPrivateMessage(member.id, message)
    }
  })
}
