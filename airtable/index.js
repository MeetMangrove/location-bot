import Promise from 'bluebird'
import _ from 'lodash'
import Airtable from 'airtable'
import settings from '../bot/settings'


const {AIRTABLE_API_KEY, AIRTABLE_BASE_KEY} = settings


Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: AIRTABLE_API_KEY,
})


// allows accessing tables directly
export const base = Airtable.base(AIRTABLE_BASE_KEY);


// reads all records from a table
const _getAllRecords = (select, callback) => {
  return new Promise((resolve, reject) => {
    let allRecords = []
    select.eachPage((records, fetchNextPage) => {
      allRecords = allRecords.concat(records)
      fetchNextPage()
    }, (err) => {
      if (err) return reject(err)
      resolve(allRecords)
    })
  })
}


// reads all people from Airtable, and returns them
// as an Array of
//  {name: String, interests: [String], skills: [String]}
export const getAllPeople = (applicantsTableName) => {
  if (applicantsTableName === 'P2PL Tests') {
    // TODO: this is temporary code to handle the P2PL Tests table
    // and support backwards compatibility
    // Should be removed when we stop using that table
    return _getAllRecords(base(applicantsTableName).select({
      view: "Main View",
      fields: ["Slack Handle", "Interests", "Skills", "Pairing admin"]
    })).then((records) => {
      return _.reduce(records, (people, r) => {
        const name = r.get('Slack Handle')
        // require name, default skills and interests to []
        if (name && name.length) {
          people.push({
            name,
            interests: (r.get('Interests') || []),
            skills: (r.get('Skills') || []),
            isAdmin: !!r.get('Pairing admin'),
          })
        }
        return people
      }, [])
    })
  }
  // Code below handles the structure of the new P2PL Applicants table
  return _getAllRecords(base(applicantsTableName).select({
    view: 'Main View',
    fields: ['Slack Handle', 'Interests', 'Skills', 'Admin']
  })).then((records) => {
    return _.reduce(records, (people, r) => {
      const name = (r.get('Slack Handle') || [])[0]
      if (name && name.length) {
        people.push({
          name: name.replace(/^@/, ''),
          interests: (r.get('Interests') || []),
          skills: (r.get('Skills') || []),
          isAdmin: !!r.get('Admin'),
        })
      }
      return people
    }, [])
  })
}


// reads a Pairing from Airtable
export const getPairing = (tableName, pairingId) => {
  return _getAllRecords(base(tableName).select({
    view: "Main View",
    fields: ['Teacher', 'Learner', 'Skill'],
    filterByFormula: `{Pairing Id}='${pairingId}'`,
  })).then((pairingRecords) => {
    return {
      id: pairingId,
      pairs: _.map(pairingRecords, (r) => {
        return {
          teacherName: r.get('Teacher'),
          learnerName: r.get('Learner'),
          skills: r.get('Skill'),
        }
      })
    }
  })
}


// saves a Pairing to Airtable
export const savePairing = (tableName, pairing) => {
  // ensure we have the proper structure
  if (!pairing.id) return reject("missing pairing.id")
  if (!_.isArray(pairing.pairs)) return reject("invalid pairing.pairs")
  // write the pairs to Airtable
  const create = Promise.promisify(base(tableName).create)
  return Promise.map(pairing.pairs, (pair) => {
    return create({
      'Pairing Id': pairing.id,
      'Teacher': pair.teacherName,
      'Learner': pair.learnerName,
      'Skill': pair.skills,
    })
  }).then((results) => {
    return pairing
  })
}


// removes a Pairing from Airtable
export const destroyPairing = (tableName, pairingId) => {
  return _getAllRecords(base(tableName).select({
    view: "Main View",
    fields: [],
    filterByFormula: `{Pairing Id}='${pairingId}'`,
  })).then((pairingRecords) => {
    const destroy = Promise.promisify(base(tableName).destroy)
    return Promise.map(pairingRecords, (record) => {
      return destroy(record.getId())
    })
  }).then(() => pairingId)
}
