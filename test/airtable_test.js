import _ from 'lodash'
import {expect} from './helper'
import {getAllPeople, getPairing, savePairing, destroyPairing} from '../airtable'


const PAIRINGS_TABLE = 'Pairings'
const SKILLS = ['Node.js', 'UX Design']


describe("airtable", function() {

  describe(".getAllPeople", function() {

    function expectSuccessful(applicantsTableName, membersTableName) {
      it("retrieves people, skills and interests", function() {
        return getAllPeople(applicantsTableName, membersTableName)
        .then((people) => {
          expect(people).to.be.an('array')
          expect(people).not.to.be.empty
          people.forEach(function(person) {
            expect(person).to.be.an('object')
            expect(_.keys(person)).to.have.members(['name', 'interests', 'skills', 'isAdmin'])
            expect(person.name).to.be.a('string')
            expect(person.name).not.to.be.empty
            expect(person.interests).to.be.a('array')
            expect(person.skills).to.be.a('array')
            person.interests.forEach(function(i) {
              expect(i).to.be.a('string')
            })
            person.skills.forEach(function(i) {
              expect(i).to.be.a('string')
            })
            expect(person.isAdmin).to.be.a('boolean')
          })
        })
      })
    }

    describe("with the old 'P2PL Tests' table", function() {
      expectSuccessful('P2PL Tests', null)
    })

    describe("with the new 'P2PL Applicants' table", function() {
      expectSuccessful('P2PL Applicants', 'Members')
    })
  })

  describe(".getPairing", function() {
    const pairingId = "201704170001"

    it ("returns an existing pairing", function() {
      return getPairing(PAIRINGS_TABLE, pairingId).then((pairing) => {
        expect(pairing).to.be.an('object')
        expect(pairing.id).to.eq(pairingId)
        expect(pairing.pairs).to.be.an('array')
        _.each(pairing.pairs, (pair) => {
          expect(pair).to.be.an('object')
          expect(pair.teacherName).to.be.a('string')
          expect(pair.learnerName).to.be.a('string')
          expect(pair.skills).to.be.an('array')
          expect(pair.skills).not.to.be.empty
        })
      })
    })
  })

  describe(".savePairing and .destroyPairing", function() {
    const pairingId = `test_${Date.now().toString()}`

    it ("saves, reads, and destroys a pairing", function() {
      const pairing = {
        id: pairingId,
        pairs: [
          {teacherName: 'test1', learnerName: 'test2',
            skills: _.sampleSize(SKILLS, 2)},
        ]
      }
      return savePairing(PAIRINGS_TABLE, pairing).then((pairing) => {
        expect(pairing.id).to.eq(pairingId)
        // try to read back the pairing
        return getPairing(PAIRINGS_TABLE, pairingId).then((readPairing) => {
          // assert the pairing was properly created
          expect(readPairing.id).to.eq(pairingId)
          expect(readPairing.pairs.length).to.eq(pairing.pairs.length)
          _.each(readPairing.pairs, (readPair, i) => {
            const pair = pairing.pairs[i]
            expect(readPair.teacherName).to.eq(pair.teacherName)
            expect(readPair.learnerName).to.eq(pair.learnerName)
          })
        }).then(() => {
          // try to destroy the pairing
          return destroyPairing(PAIRINGS_TABLE, pairingId)
            .then((destroyedPairingId) => {
              expect(destroyedPairingId).to.eq(pairingId)
            })
        })
      })
    })
  })

})
