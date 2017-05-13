/**
 * Created by thomasjeanneau on 20/03/2017.
 */

import _ from 'lodash'
import Promise from 'bluebird'
import asyncForEach from 'async-foreach'
import { base } from './airtable/index'

const {forEach} = asyncForEach

// return member fields as an object
const _getMember = async (id) => {
  const {fields} = await Promise.promisify(base('Members').find)(id)
  return fields
}

// reads all records from a table
const _getAllRecords = (select) => {
  return new Promise((resolve, reject) => {
    let allRecords = []
    select.eachPage(function page (records, fetchNextPage) {
      allRecords = allRecords.concat(records)
      fetchNextPage()
    }, function done (err) {
      if (err) return reject(err)
      resolve(allRecords)
    })
  })
}

/* reads all applicants from Airtable, and returns them as an Array of
 {name: String,
 interests: [String],
 skills: [String]}
 */
export const getAllApplicants = async () => {
  const people = []
  const records = await _getAllRecords(base('P2PL Applicants').select({
    view: 'Main View',
    fields: ['Applicant', 'Interests', 'Skills']
  }))
  forEach(records, async function (record) {
    const done = this.async()
    const interests = record.get('Interests')
    const skills = record.get('Skills')
    const {'Slack Handle': name} = await _getMember(record.get('Applicant'))
    // require name, default skills and interests to []
    if (name && name.length) {
      people.push({
        name,
        interests: (interests || []),
        skills: (skills || [])
      })
    }
    done()
  })
  return people
}

// reads all admins applicants from Airtable, and returns
// a boolean checking if the current user is an admin or not.
export const checkIfAdmin = async (bot, message) => {
  const admins = []
  const apiUser = Promise.promisifyAll(bot.api.users)
  const records = await _getAllRecords(base('P2PL Applicants').select({
    view: 'Main View',
    filterByFormula: '{Admin}=1'
  }))
  forEach(records, async function (record) {
    const done = this.async()
    const {'Slack Handle': name} = await _getMember(record.get('Applicant'))
    admins.push(name)
    done()
  })
  const {user: {name}} = await apiUser.infoAsync({user: message.user})
  return admins.indexOf(`@${name}`) >= 0
}

/* reads all pairing from Airtable, and returns them as an Array of
 {name: String,
 isLearner: Boolean,
 teacherName: String,
 learning: String,
 isTeacher: Boolean,
 learnerName: String,
 teaching: String}
 */
export const getMembersPaired = async () => {
  const applicants = await getAllApplicants()
  const members = _.map(applicants, ({name}) => ({name, isLearner: false, isTeacher: false}))
  const records = await _getAllRecords(base('Pairings').select({
    view: 'Main View',
    filterByFormula: '{Bot Introduction}=0'
  }))
  records.forEach((record) => {
    const learner = record.get('Learner')
    const teacher = record.get('Teacher')
    const skills = record.get('Skill')
    const index = _.random(skills.length - 1)
    const skill = skills[index]
    const indexLearner = _.findIndex(members, e => e.name === learner)
    const indexTeacher = _.findIndex(members, e => e.name === teacher)
    members[indexLearner].isLearner = true
    members[indexLearner].teacherName = teacher
    members[indexLearner].learning = skill
    members[indexTeacher].isTeacher = true
    members[indexTeacher].learnerName = learner
    members[indexTeacher].teaching = skill
  })
  return members
}

// reads all people from Airtable, and returns them
// as an Array of
//  {name: String, interests: [String], skills: [String]}
export const getAllPeople = async (applicantsTableName) => {
  // Code below handles the structure of the new P2PL Applicants table
  const records = await _getAllRecords(base(applicantsTableName).select({
    view: 'Main View',
    fields: ['Slack Handle', 'Interests', 'Skills', 'Admin']
  }))
  return _.reduce(records, (people, r) => {
    const name = (r.get('Slack Handle') || [])[0]
    if (name && name.length) {
      people.push({
        name: name.replace(/^@/, ''),
        interests: (r.get('Interests') || []),
        skills: (r.get('Skills') || []),
        isAdmin: !!r.get('Admin')
      })
    }
    return people
  }, [])
}

// reads a Pairing from Airtable
export const getPairing = async (tableName, pairingId) => {
  const pairingRecords = await _getAllRecords(base(tableName).select({
    view: 'Main View',
    fields: ['Teacher', 'Learner', 'Skill', 'Paired On'],
    filterByFormula: `{Pairing Id}='${pairingId}'`
  }))
  let createdAt = pairingRecords.length && pairingRecords[0].get('Paired On')
  return {
    id: pairingId,
    createdAt: createdAt && createdAt + 'T00:00:00Z',
    pairs: _.map(pairingRecords, (r) => {
      return {
        teacherName: r.get('Teacher'),
        learnerName: r.get('Learner'),
        skills: r.get('Skill')
      }
    })
  }
}

// saves a Pairing to Airtable
export const savePairing = async (tableName, pairing) => {
  // ensure we have the proper structure
  if (!pairing.id) {
    console.log('missing pairing.id')
    return
  }
  if (!_.isArray(pairing.pairs)) {
    console.log('invalid pairing.pairs')
    return
  }
  // write the pairs to Airtable
  const create = Promise.promisify(base(tableName).create)
  await Promise.map(pairing.pairs, (pair) => {
    return create({
      'Pairing Id': pairing.id,
      'Paired On': pairing.createdAt.substr(0, 10),
      'Teacher': pair.teacherName,
      'Learner': pair.learnerName,
      'Skill': pair.skills
    })
  })
  return pairing
}

// removes a Pairing from Airtable
export const destroyPairing = async (tableName, pairingId) => {
  const pairingRecords = await _getAllRecords(base(tableName).select({
    view: 'Main View',
    fields: [],
    filterByFormula: `{Pairing Id}='${pairingId}'`
  }))
  const destroy = Promise.promisify(base(tableName).destroy)
  await Promise.map(pairingRecords, (record) => {
    return destroy(record.getId())
  })
  return pairingId
}
