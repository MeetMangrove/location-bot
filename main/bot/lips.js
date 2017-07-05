import { CronJob } from 'cron'

import { bot } from './config'
import { handleError } from './hears'
import { pingMessage, pingMessageNoLocation } from './messages'
import { getMemberBySlackHandler } from '../methods'

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
export const spamEveryone = async function() {
  bot.api.users.list({}, async (err, response) => {
    if (err) return console.error(err)

    for (const member of response.members) {
      const airtableUser = await getMemberBySlackHandler(member.name)
      if (!airtableUser) {
        console.log(`member with handle ${member.name} not found in airtable`)
        continue
      }

      let message;
      const currentLocation = airtableUser.fields['Current Location']
      if (currentLocation) {
        message = pingMessage(member.name, currentLocation)
      } else {
        message = pingMessageNoLocation(member.name)
      }

      sendPrivateMessage(member.id, message)
    }
  })
}

// Start the cron job
// commented for safety!
// new CronJob({
//   cronTime: '0 49 * * * *',
//   onTick: spamEveryone,
//   start: true,
//   timeZone: 'Europe/Amsterdam'
// });