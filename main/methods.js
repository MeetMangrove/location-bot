/**
 * Created by thomasjeanneau on 20/03/2017.
 */

import Promise from 'bluebird'

import base from './airtable/index'

const {
  AIRTABLE_MEMBERS
} = process.env

if (!AIRTABLE_MEMBERS) {
  console.log('Error: Specify AIRTABLE_MEMBERS in a .env file')
  process.exit(1)
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

// get slack user info by id
export const getSlackUser = async (bot, id) => {
  const apiUser = Promise.promisifyAll(bot.api.users)
  const {user} = await apiUser.infoAsync({user: id})
  return user
}

// get member by id
export const getMember = async (id) => {
  const findMember = Promise.promisify(base(AIRTABLE_MEMBERS).find)
  const member = await findMember(id)
  return member
}

// get member by Slack name
export const getMemberBySlackHandler = async (handle) => {
  const records = await _getAllRecords(base(AIRTABLE_MEMBERS).select({
    maxRecords: 1,
    view: 'Main View',
    filterByFormula: `{Slack Handle} = "@${handle}"`
  }))
  return records[0]
}

// update member
export const updateMember = async (id, fields) => {
  const updateMember = Promise.promisify(base(AIRTABLE_MEMBERS).update)
  const member = await updateMember(id, fields)
  return member
}

// reads all members from Airtable, and returns
// a boolean checking if the current user is an builder or not.
export const checkIfBuilder = async (bot, message) => {
  const slackUser = await getSlackUser(bot, message.user)
  const records = await _getAllRecords(base(AIRTABLE_MEMBERS).select({
    maxRecords: 1,
    view: 'Main View',
    filterByFormula: `AND(
      {Slack Handle} = "@${slackUser.name}",
      {Status} = "Cofounder"
    )`
  }))
  return !!records[0]
}
