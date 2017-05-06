/**
 * Created by thomasjeanneau on 20/03/2017.
 */

import Promise from 'bluebird'
import { base } from './learningbot/config/slackbot'
import findIndex from 'lodash/findIndex'
import random from 'lodash/random'
import map from 'lodash/map'
import asyncForEach from 'async-foreach'

const {forEach} = asyncForEach

// return member fields as an object
export const getMember = async (id) => {
  const { fields } = await Promise.promisify(base('Members').find)(id)
  return fields
}

// reads all applicants from Airtable, and returns them
// as an Array of
// {name: String, interests: [String], skills: [String]}
export const getAllApplicants = () => {
  const people = []
  return new Promise((resolve, reject) => {
    base('P2PL Applicants').select({
      view: 'Main View',
      fields: ['Applicant', 'Interests', 'Skills']
    }).eachPage(function page (records, fetchNextPage) {
      forEach(records, async function (record) {
        const done = this.async()
        const interests = record.get('Interests')
        const skills = record.get('Skills')
        const { 'Slack Handle': name } = await getMember(record.get('Applicant'))
        // require name, default skills and interests to []
        if (name && name.length) {
          people.push({
            name,
            interests: (interests || []),
            skills: (skills || [])
          })
        }
        done()
      }, fetchNextPage)
    }, function done (err) {
      if (err) {
        reject(err)
        return
      }
      resolve(people)
    })
  })
}

// reads all admins applicants from Airtable, and returns
// a boolean checking if the current user is an admin or not.
export const checkIfAdmin = (bot, message) => {
  const admins = []
  const apiUser = Promise.promisifyAll(bot.api.users)
  return new Promise((resolve, reject) => {
    base('P2PL Applicants').select({
      view: 'Main View',
      filterByFormula: '{Admin}=1'
    }).eachPage(function page (records, fetchNextPage) {
      forEach(records, async function (record) {
        const done = this.async()
        const { 'Slack Handle': name } = await getMember(record.get('Applicant'))
        admins.push(name)
        done()
      }, fetchNextPage)
    }, async function done (err) {
      if (err) {
        reject(err)
        return
      }
      const { user: { name } } = await apiUser.infoAsync({user: message.user})
      resolve(admins.indexOf(`@${name}`) >= 0)
    })
  })
}

// reads all pairing from Airtable, and returns them
// as an Array of
// {name: String, isLearner: Boolean, teacherName, learning, isTeacher: Boolean, learnerName, teaching}
export const getMembersPaired = async () => {
  const applicants = await getAllApplicants()
  const members = map(applicants, ({ name }) => ({ name, isLearner: false, isTeacher: false }))
  return new Promise((resolve, reject) => {
    base('Pairings').select({
      view: 'Main View',
      filterByFormula: '{Bot Introduction}=0'
    }).eachPage(function page (records, fetchNextPage) {
      records.forEach((record) => {
        const learner = record.get('Learner')
        const teacher = record.get('Teacher')
        const skills = record.get('Skill')
        const index = random(skills.length - 1)
        const skill = skills[index]
        const indexLearner = findIndex(members, e => e.name === learner)
        const indexTeacher = findIndex(members, e => e.name === teacher)
        members[indexLearner].isLearner = true
        members[indexLearner].teacherName = teacher
        members[indexLearner].learning = skill
        members[indexTeacher].isTeacher = true
        members[indexTeacher].learnerName = learner
        members[indexTeacher].teaching = skill
      })
      fetchNextPage()
    }, function done (err) {
      if (err) {
        reject(err)
        return
      }
      resolve(members)
    })
  })
}
