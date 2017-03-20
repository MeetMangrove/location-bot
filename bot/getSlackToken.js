/**
 * Created by thomasjeanneau on 08/02/2017.
 */

import express from 'express';
import request from 'request';
import jsonfile from 'jsonfile';

const app = express();
const settings = jsonfile.readFileSync('settings.json');
const { port_api } = settings;

app.get('/oauth/', function (req) {
  const { slack_client_id, slack_client_secret } = settings;
  request.get('https://slack.com/api/oauth.access?client_id=' + slack_client_id + '&client_secret=' + slack_client_secret + '&code=' + req.query.code, function (error, result, body) {
    console.log(body);
  });
});

app.listen(port_api);