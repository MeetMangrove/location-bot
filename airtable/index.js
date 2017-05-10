import _ from 'lodash'
import Airtable from 'airtable'
import settings from '../bot/settings'


const {AIRTABLE_API_KEY, AIRTABLE_BASE_KEY} = settings


Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: AIRTABLE_API_KEY,
})


// allows accessing tables directly
export const base = Airtable.base(AIRTABLE_BASE_KEY)


// reads all records from a table
const _getAllRecords = (select, callback) => {
  let allRecords = []
  select.eachPage((records, fetchNextPage) => {
    allRecords = allRecords.concat(records)
    fetchNextPage()
  }, (err) => {
    if (err) return callback(err)
    callback(undefined, allRecords)
  })
}


// reads all people from Airtable, and returns them
// as an Array of
//  {name: String, interests: [String], skills: [String]}
export const getAllPeople = (applicantsTableName, membersTableName, callback) => {
  if (applicantsTableName === 'P2PL Tests') {
    // TODO: this is for backwards compatibility with the old
    // P2PL Tests table - remove this when we stop using it
    _getAllRecords(base(tableName).select({
      view: "Main View",
      fields: ["Name", "Interests", "Skills", "Slack Handle", "Pairing admin"]
    }), (err, applicantsRecords) => {
      if (err) return callback(err)
      const people = []
      applicantsRecords.forEach((r) => {
        const interests = r.get('Interests'),
              skills = r.get('Skills'),
              name = r.get('Name'),
              slack_handle = r.get('Slack Handle'),
              is_admin = !!r.get('Pairing admin')
        // require name, default skills and interests to []
        if (name && name.length && slack_handle && slack_handle.length) {
          people.push({
            name,
            interests: (interests || []),
            skills: (skills || []),
            slackHandle,
            isAdmin,
          })
        }
      })
      callback(undefined, people)
    })
  } else {
    // this is based on the structure of the P2PL Applicants table,
    // which references records from the Members table
    const people = []
    const F_MEMBER = 'Applicant',
          F_INTERESTS = 'Interests',
          F_SKILLS = 'Skills',
          F_ADMIN = 'Admin',
          F_NAME = 'Name',
          F_SLACK = 'Slack Handle'
    _getAllRecords(base(applicantsTableName).select({
      view: "Main View",
      fields: [F_MEMBER, F_INTERESTS, F_SKILLS, F_ADMIN],
    }), (err, peopleRecords) => {
      if (err) return callback(err)
      let people = _.reduce(peopleRecords, (all, r) => {
        const memberId = (r.get(F_MEMBER) || [])[0],
              interests = (r.get(F_INTERESTS) || []),
              skills = (r.get(F_SKILLS) || []),
              isAdmin = !!r.get(F_ADMIN)
        // require memberId to be set
        if (memberId && memberId.length) {
          all.push({memberId, interests, skills, isAdmin})
        }
        return all
      }, [])
      // fetch corresponding Members
      _getAllRecords(base(membersTableName).select({
        view: "Main View",
        fields: [F_NAME, F_SLACK],
        // TODO: can we retrieve just records with our memberIds?
      }), (err, memberRecords) => {
        if (err) return callback(err)
        // build a map of memberId => {name, slackHandle}
        const membersById = _.reduce(memberRecords, (all, r) => {
          return _.set(all, r.getId(), {
            name: r.get(F_NAME),
            slackHandle: r.get(F_SLACK),
          })
        }, {})
        // merge all people with the member data, ignoring
        // people without a slack handle
        people = _.reduce(people, (all, person) => {
          const member = membersById[person.memberId]
          if (member && member.slackHandle) {
            all.push({
              slackHandle: member.slackHandle.replace(/^@/, ''),
              name: member.name,
              skills: person.skills,
              interests: person.interests,
              isAdmin: person.isAdmin,
            })
          }
          return all
        }, [])
        // return people
        callback(undefined, people)
      })
    })
  }
}
