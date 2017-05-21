# Mangrove Pairing

Automatically pair people based on the skills they can teach and those
they want to learn.

## Usages

### Generate a pairing

```bash
$ npm run pair
```

Will fetch the data from Airtable for all people's interests and skills, generate pairings for them and save it to Airtable.

You can set the tables used in Airtable via environment variables:
```
AIRTABLE_APPLICANTS="P2PL Applicants"
AIRTABLE_PAIRING="Pairings"
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
