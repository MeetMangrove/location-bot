/**
 * Created by thomasjeanneau on 20/03/2017.
 */

import Promise from 'bluebird';
import { base } from './configSlackbot';

export const checkIfAdmin = (bot, message) => {
  return new Promise((resolve, reject) => {
    try{
      const admins = [];
      base('P2PL Tests').select({
        filterByFormula: "{Pairing admin}=1"
      }).eachPage(function page(records, fetchNextPage) {
        records.forEach((record) => {
          // console.log(record);
          admins.push(record["fields"]["Slack Handle"])
        });
        fetchNextPage();
      }, function done(err) {
        if (err) {
          console.error(err);
          return;
        }
        bot.api.users.info({ user: message.user }, (error, response) => {
          let { name, real_name } = response.user;
          resolve(admins.indexOf(name) >= 0);
        })
      });
    }catch(e){
      console.log(e);
      reject(e);
    }
  });
};