import _ from 'lodash'
import Promise from 'bluebird'
import findMatching from 'bipartite-matching'


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
        if (p1Index != p2Index &&
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
      const teacherIndex = pair[0], learnerIndex = pair[1]
      const teacher = people[teacherIndex], learner = people[learnerIndex]
      const skills = _.intersection(teacher.skills, learner.interests)
      return {
        // indexes of teacher and learner in the people array
        teacherIndex,
        learnerIndex,
        // skills that could be taught by teacher to learner
        skills,
        // names added for convenience
        teacherName: teacher.name,
        learnerName: learner.name,
      }
    })
    resolve({
      // a unique-enough time-based id, helps us identify the pairing
      id: new Date().toISOString() + '_' + Math.floor(1000 * Math.random()),
      // a complete pairing = each person is in 2 pairs
      isComplete: (pairs.length == people.length),
      // list of pairs
      pairs,
    })
  })
}
