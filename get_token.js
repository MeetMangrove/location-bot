/**
 * Created by thomasjeanneau on 08/02/2017.
 */

import express from 'express';
import request from 'request';
import jsonfile from 'jsonfile';

const app = express();
const settings = jsonfile.readFileSync('settings.json');

app.get('/oauth/', function (req, res) {
  const { slack_client_id, slack_client_secret } = settings;
  request.get('https://slack.com/api/oauth.access?client_id=' + slack_client_id + '&client_secret=' + slack_client_secret + '&code=' + req.query.code, function (error, result, body) {
    console.log(body);
    //TODO: send token to client from body params (not an object, line below doesn't working)
    //res.send('Bot Access Token: ' + body.bot.bot_access_token);
  });
});

app.listen(3000);