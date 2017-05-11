import _ from 'lodash'
import {expect} from './helper'
import {generatePairing} from '../pairing'


// helpers to inspect a pairing
function _pairing_size(pairing) {
  return pairing.pairs.length
}
function _pairing_teachers(pairing) {
  return _.orderBy(_.map(pairing.pairs, 'teacher_name'))
}
function _pairing_learners(pairing) {
  return _.orderBy(_.map(pairing.pairs, 'learner_name'))
}


describe(".generatePairing", function() {

  context("with 2 people with mutual skills/interests", function() {
    beforeEach(function() {
      this.people = [
        {name: 'alice', skills: ['js'], interests: ['ruby']},
        {name: 'bob', skills: ['ruby'], interests: ['js']},
      ]
    })

    it("works", function() {
      return generatePairing(this.people).then((pairing) => {
        expect(pairing.id).to.be.a('string')
        expect(pairing.isComplete).to.be.true
        expect(_pairing_size(pairing)).to.eq(2)
        expect(_pairing_teachers(pairing)).to.eql(['alice', 'bob'])
        expect(_pairing_learners(pairing)).to.eql(['alice', 'bob'])
      })
    })
  })


  context("when one person can't be paired", function() {
    beforeEach(function() {
      this.people = [
        {name: 'alice', skills: ['js'], interests: ['ruby']},
        // charlie and bob interested in js, only one can learn
        {name: 'bob', skills: ['ruby'], interests: ['js']},
        {name: 'charlie', skills: ['c++'], interests: ['js']},
      ]
    })

    it("results in an incomplete pairing", function() {
      return generatePairing(this.people).then((pairing) => {
        expect(pairing.id).to.be.a('string')
        expect(pairing.isComplete).to.be.false
        // expect 2 pairs
        expect(_pairing_size(pairing)).to.eq(2)
        // expect alice to be both a learner and a teacher
        expect(_pairing_teachers(pairing)).to.include('alice')
        expect(_pairing_learners(pairing)).to.include('alice')
      })
    })
  })
})
