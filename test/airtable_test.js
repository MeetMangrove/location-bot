import _ from 'lodash'
import {expect} from './helper'
import {getAllPeople, getPairing} from '../airtable'


describe("airtable", function() {

  describe(".getAllPeople", function() {

    function expectSuccessful(applicantsTableName, membersTableName) {
      it("retrieves people, skills and interests", function(done) {
        getAllPeople(applicantsTableName, membersTableName, function(err, people) {
          expect(err).to.be.undefined
          expect(people).to.be.an('array')
          expect(people).not.to.be.empty
          people.forEach(function(person) {
            expect(person).to.be.an('object')
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
            expect(person.slackHandle).to.be.a('string')
            expect(person.slackHandle).not.to.be.empty
            expect(person.slackHandle[0]).not.to.eq('@')
            expect(person.isAdmin).to.be.a('boolean')
          })
          done()
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

})
