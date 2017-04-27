import _ from 'lodash'
import findMatching from 'bipartite-matching'


// takes an Array of people represented as
//   [{name: String, skills: [String], interests: [String]}]
//
// and computes a pairing, represented as an Object with:
//   {
//     isComplete: true|false, // was everyone paired?
//     pairs: [ // list of pairs
//       {
//         teacher_index: Int,
//         learner_index: Int,
//         skills: [String]}
//       }
//     ]
//  }
export const generatePairing = (people, callback) => {
  people = _.shuffle(people)
  let teachers_count = 0
  let learners_count = 0
  const edges = []
  people.forEach((p1, p1_index) => {
    // update counters
    if (p1.skills.length) teachers_count += 1
    if (p1.interests.length) learners_count += 1
    // for every other person, add an edge [p1, p2] to the
    // graph if p1 can teach a skill to p2
    people.forEach((p2, p2_index) => {
      if (p1_index != p2_index &&
          _.intersection(p1.skills, p2.interests).length) {
        edges.push([p1_index, p2_index])
      }
    })
  })
  console.log(teachers_count, 'teachers')
  console.log(learners_count, 'learners')
  // find max bipartite matching
  const match = findMatching(people.length, people.length, edges)
  console.log(match.length, 'pairs')
  // return pairing object
  const pairs = match.map((pair) => {
    const teacher_index = pair[0], learner_index = pair[1]
    const teacher = people[teacher_index], learner = people[learner_index]
    const skills = _.intersection(teacher.skills, learner.interests)
    return {
      // indexes of teacher and learner in the people array
      teacher_index,
      learner_index,
      // skills that could be taught by teacher to learner
      skills,
      // names added for convenience
      teacher_name: teacher.name,
      learner_name: learner.name,
    }
  })
  callback(undefined, {
    isComplete: (pairs.length == people.length),
    pairs,
  })
}
