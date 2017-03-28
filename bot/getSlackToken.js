/**
 * Created by thomasjeanneau on 08/02/2017.
 */

import express from 'express';
import request from 'request';

const app = express();
const { env: { SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, PORT_API }} = process;

app.get('/oauth/', function (req) {
  request.get('https://slack.com/api/oauth.access?client_id=' + SLACK_CLIENT_ID + '&client_secret=' + SLACK_CLIENT_SECRET + '&code=' + req.query.code, function (error, result, body) {
    console.log(body);
  });
});

app.listen(PORT_API);