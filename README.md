# Mangrove Location Bot

A bot that talks to Mangrove members on Slack to update their current location.
See members locations at meetmangrove.com/team

The bot will ping all slack members to ask them if the 'Current Location' we have in Airtable is still valid. If not, user will have the opportunity to update it.

Users can also proactively update their location simply by talking 1:1 to @sally-ride. It offers the 3 following actions:

`!map`: returns the URL of the map  
`!myloc`: returns the current location we have in Airtable  
`!newloc <address>`: updates user's current location to found <City, Country> from address given. Will ask to confirm the found <City, Country> is correct. If multiple pairs are found, the user will be able to choose.

## Usages

### Spam Everyone
🔥⛔ This is DANGER ⛔🔥  
There is a cron job running every X that will make Sally send a message to every Slack members to ask them if the current location she has on file is valid and ask them to update their location if not.  

This can also be ran manually, by logging into a heroku process and run the tasks;
```bash
$ heroku run bash
$ npm run spamEveryone
```
Because this will run in a separate process (one-off dyno), it initiates a new bot instance - Make sure to ctrl+c out of the process once the tasks is done, or else it will leave a clone of Sally, and users will receive duplicated responses when talking to her.

### Tracking

We track events through Mixpanel. Ping @jauny to get access.

Events we track are:  
`user.*`: events initiated by user  
`user.hello`: user is ping the bot without recognized method  
`user.map`: user asked '!map'  
`user.myloc`: user asked '!myloc'  
`user.newloc`: user is updating their location with '!newloc'  
`user.newloc.noloc`: user tried updating loc without a loc  
`user.newloc.notfound`: bot didn't find location given by user  
`user.newloc.onefound`: bot found 1 location  
`user.newloc.multiplefound`: bot found multiple locations  
`user.address.confirmation.yes`: user confimed the unique address found  
`user.address.confirmation.no`: user rejected the unique address found  
`user.address.confirmations.select`: user selected one of the found addresses  
`user.address.confirmations.no`: user rejected all found addresses  

`bot.*`: events initiated by the bot  
`bot.spam.usernotfound`: when slack user is not found in Airtable
`bot.spam.message`: message is initiated

### Installation

Clone the repo, then run:
```bash
$ npm install
```

### Set environmental variables

Create a .env file with the following variables and their values:
```bash
SLACK_CLIENT_ID=***************
SLACK_CLIENT_SECRET=***************
SLACK_BOT_TOKEN=***************
SLACK_WEBHOOK_URL=***************

AIRTABLE_API_KEY=***************
AIRTABLE_BASE_KEY=***************
AIRTABLE_MEMBERS=***************

MIXPANEL_TOKEN=***************

NEW_RELIC_LICENSE_KEY=***************
NEW_RELIC_APP_NAME=***************
NEW_RELIC_APDEX=***************
NEW_RELIC_NO_CONFIG_FILE=***************

GOOGLE_MAPS_API_KEY=***************

MONGO_URL=***************

NODE_ENV=DEVELOPMENT
PORT=3000
```

### Run the bot

In local for development:
```bash
$ npm run start
```

Lint code:
```bash
$ npm run lint
```

Fix lint errors:
```bash
$ npm run fix
```

Building:
```bash
$ npm run build
```

Running in production mode after building:
```bash
$ npm run serve
```

Heroku dynos:
```bash
$ npm run web
```
