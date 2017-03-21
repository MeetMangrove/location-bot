# Mangrove Pairing

Automatically pair people based on the skills they can teach and those
they want to learn.

## Usage

### Generate a pairing

```bash
$ python pairing.py
```

Will fetch the data from airtable for all freinds' interests and skills, generate pairings for them and push it to the Pairings table.

You will need Python 3 installed and ideally use [conda](https://conda.io/miniconda.html))

For the dev environment, once you have `conda` installed you can create an environment with all the dependencies
by running:

```bash
conda env create -f environment.yml
```

You can activate that environment at any time using:

```bash
source activate pairing
```

There's more you can do with conda environments and you can read more on the [managing environments](https://conda.io/docs/using/envs.html) page.

For production, we can install all dependencies from requirements.txt using:
```bash
$ pip install -r requirements.txt
```

### Run the bot

```bash
$ npm run start
```

To get a new token from oauth link:
https://slack.com/oauth/authorize?scope=bot&client_id=24629294631.139251260599

1) Run the app
2) Authorize the application
3) Look at the console
4) Set the bot_access_token in the settings.json file