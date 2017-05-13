import _ from 'lodash'
import Promise from 'bluebird'
import findMatching from 'bipartite-matching'
import {getAllPeople, savePairing} from '../methods'

const {env} = process
// constants that can be overridden through environment variables
export const APPLICANTS_TABLE = env.APPLICANTS_TABLE || 'P2PL Applicants'
export const PAIRINGS_TABLE = env.PAIRINGS_TABLE || 'Pairings'

// Main pairing function:
// - reads all applicants from Airtable
// - creates a pairing
// - saves the pairing into Airtable and returns it
// Different tables can be set up through options
export const pairAllApplicants = (opts = {}) => {
  const aTable = opts.applicantsTable || APPLICANTS_TABLE
  const pTable = opts.pairingsTable || PAIRINGS_TABLE
  console.log(`Pairing people in ${aTable}, saving in ${pTable}`)
  return getAllPeople(aTable)
    .then((people) => {
      console.log(`Found ${people.length} people in ${aTable}`)
      return generatePairing(people)
    })
    .then((pairing) => {
      console.log(`Saving ${pairing.pairs.length} pairs to ${pTable}, id=${pairing.id}`)
      return savePairing(pTable, pairing)
    })
}

// takes an Array of people represented as
//   [{name: String, skills: [String], interests: [String]}]
//
// and computes a pairing, represented as an Object with:
//   {
//     isComplete: true|false, // was everyone paired?
//     pairs: [ // list of pairs
//       {
//         teacherIndex: Int,
//         learnerIndex: Int,
//         skills: [String]},
//         teacherName: String,
//         learnerName: String,
//       }
//     ]
//  }
export const generatePairing = (people) => {
  return new Promise((resolve, reject) => {
    people = _.shuffle(people)
    let teachersCount = 0
    let learnersCount = 0
    const edges = []
    people.forEach((p1, p1Index) => {
      // update counters
      if (p1.skills.length) teachersCount += 1
      if (p1.interests.length) learnersCount += 1
      // for every other person, add an edge [p1, p2] to the
      // graph if p1 can teach a skill to p2
      people.forEach((p2, p2Index) => {
        if (p1Index !== p2Index &&
            _.intersection(p1.skills, p2.interests).length) {
          edges.push([p1Index, p2Index])
        }
      })
    })
    console.log(teachersCount, 'teachers')
    console.log(learnersCount, 'learners')
    // find max bipartite matching
    const match = findMatching(people.length, people.length, edges)
    console.log(match.length, 'pairs')
    // return pairing object
    const pairs = match.map((pair) => {
      const teacherIndex = pair[0]
      const learnerIndex = pair[1]
      const teacher = people[teacherIndex]
      const learner = people[learnerIndex]
      const skills = _.intersection(teacher.skills, learner.interests)
      return {
        // indexes of teacher and learner in the people array
        teacherIndex,
        learnerIndex,
        // skills that could be taught by teacher to learner
        skills,
        // names added for convenience
        teacherName: teacher.name,
        learnerName: learner.name
      }
    })
    const dateISO = new Date().toISOString()
    resolve({
      // a unique-enough time-based id, helps us identify the pairing
      id: dateISO + '_' + Math.floor(1000 * Math.random()),
      // ISO8601 creation date
      createdAt: dateISO,
      // a complete pairing = each person is in 2 pairs
      isComplete: (pairs.length === people.length),
      // list of pairs
      pairs
    })
  })
}
