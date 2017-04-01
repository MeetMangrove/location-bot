/**
 * Created by thomasjeanneau on 20/03/2017.
 */

import Promise from 'bluebird';
import { base } from './configSlackbot';

export const checkIfAdmin = (bot, message) => {
  return new Promise((resolve, reject) => {
    try {
      const admins = [];
      base('P2PL Tests').select({
        filterByFormula: "{Pairing admin}=1"
      }).eachPage(function page(records, fetchNextPage) {
        records.forEach((record) => {
          admins.push(record["fields"]["Slack Handle"])
        });
        fetchNextPage();
      }, function done(err) {
        if (err) reject(err);
        bot.api.users.info({ user: message.user }, (error, response) => {
          let { name } = response.user;
          resolve(admins.indexOf(name) >= 0);
        })
      });
    } catch (e) {
      reject(e);
    }
  });
};

export const getGroupName = (teacher, learner) => {
  return new Promise((resolve, reject) => {
    try {
      let count = 0;
      base('Pairings').select({
        view: "Main View",
      }).eachPage(function page(records, fetchNextPage) {
        records.forEach((record) => {
          if((record.get('Teacher') === teacher && record.get('Learner') === learner)
          || record.get('Teacher') === learner && record.get('Learner') === teacher){
            count++;
          }
        });
        fetchNextPage();
      }, function done(err) {
        if(err) reject(err);
        const number = count < 10 ? `0${count}` : count;
        resolve(`p${number}_${teacher.substring(0, 8)}_${learner.substring(0, 8)}`);
      });
    } catch (e) {
      reject(e);
    }
  });
};