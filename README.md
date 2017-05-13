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

Heroku worker:
```bash
$ npm run web
```
