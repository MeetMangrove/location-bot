/**
 * Created by thomasjeanneau on 20/03/2017.
 */

import Promise from 'bluebird';
import { base } from './configSlackbot';
import findIndex from 'lodash/findIndex';
import random from 'lodash/random';

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
      bot.reply(message, "An error occur: " + e);
      console.log('checkIfAdmin', e);
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
      console.log('getGroupName', e);
      reject(e);
    }
  });
};

export const getAllMembers = () => {
  return new Promise((resolve, reject) => {
    try {
      const p2plMembers = [];
      base('P2PL Tests').select({
        filterByFormula: "{Active P2P}=1"
      }).eachPage(function page(records, fetchNextPage) {
        records.forEach((record) => {
          p2plMembers.push({
            name: record["fields"]["Slack Handle"],
            isLearner: false,
            isTeacher: false,
          })
        });
        fetchNextPage();
      }, function done(err) {
        if (err) reject(err);
        resolve(p2plMembers);
      });
    } catch (e) {
      console.log('getAllMembers', e);
      reject(e);
    }
  });
};

export const getMembersPaired = () => {
  return new Promise((resolve, reject) => {
    try {
      (async () => {
        const members = await getAllMembers();
        base('Pairings').select({
          view: "Main View",
          filterByFormula: "{Bot Introduction}=0"
        }).eachPage(function page(records, fetchNextPage) {
          records.forEach((record) => {
            const learner = record.get('Learner');
            const teacher = record.get('Teacher');
            const skills = record.get('Skill');
            const index = random(skills.length - 1);
            const skill = skills[index];
            const indexLearner = findIndex(members, e => e.name === learner);
            const indexTeacher = findIndex(members, e => e.name === teacher);
            members[indexLearner].isLearner = true;
            members[indexLearner].teacherName = teacher;
            members[indexLearner].learning = skill;
            members[indexTeacher].isTeacher = true;
            members[indexTeacher].learnerName = learner;
            members[indexTeacher].teaching = skill;
          });
          fetchNextPage();
        }, function done(err) {
          if (err) reject(err);
          resolve(members);
        });
      })();
    } catch (e) {
      console.log('getMembersPaired', e);
      reject(e);
    }
  });
};