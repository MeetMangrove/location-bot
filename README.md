# Mangrove Pairing

Automatically pair people based on the skills they can teach and those
they want to learn.

## Usage

### Generate a pairing

```bash
$ npm run pair
```

Will fetch the data from Airtable for all people's interests and skills, generate pairings for them and save it to Airtable.

You can set the tables used in Airtable via environment variables:
```
APPLICANTS_TABLE="P2PL Applicants"
PAIRINGS_TABLE="Pairings"
```


### Run the bot

In local for development:
```bash
$ npm run start
```

Building:
```bash
$ npm run build
```

Running in production mode after building:
```bash
$ npm run serve
```

Heroku worker:
```bash
$ npm run worker
```

To get a new token from oauth link:
https://slack.com/oauth/authorize?scope=bot&client_id=24629294631.139251260599

1) Run the app
2) Authorize the application
3) Look at the console
4) Set the bot_access_token in the settings.json file
