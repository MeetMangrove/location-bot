# Mangrove Pairing

Automatically pair people based on the skills they can teach and those
they want to learn.

## Usage

### Generate a pairing

```bash
$ python pairing.py data.csv
```

Will compute a pairing from a CSV file (e.g. exported from Google Spreadsheets)
and print it to standard output. See the source code for details.

You will need Python 3 installed
(I recommend [Anaconda](https://www.continuum.io/downloads))
with the `networkx` and `matplotlib` packages.
You should be able to install those with

```bash
$ pip install -r requirements.txt
```

### Run the slackbot

```bash
$ npm run slackbot
```

To get a new token from oauth link:
https://slack.com/oauth/authorize?scope=bot&client_id=24629294631.139251260599

```bash
$ npm run get_token
```

1) Run the app
2) Authorize the application
3) Look at the console
4) Set the bot_access_token in the settings.json file