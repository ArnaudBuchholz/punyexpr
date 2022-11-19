'use strict'

const { punyexpr } = require('../punyexpr')

describe('tokenizer', () => {
  describe('basic', () => {
    const basic = {
      '\'a\'': ['string', 'a'],
      '\'a\\\'b\'': ['string', 'a\'b'],
      '"a"': ['string', 'a'],
      '"a\\"b"': ['string', 'a"b'],
      '-1': ['number', -1],
      '-1.0': ['number', -1],
      '-1.': ['number', -1],
      '+1': ['number', 1],
      '+1.0': ['number', 1],
      '+1.': ['number', 1],
      1: ['number', 1],
      '1.0': ['number', 1],
      '1.': ['number', 1],
      123: ['number', 123],
      '-1.23': ['number', -1.23],
      '+1.23': ['number', 1.23],
      1.23: ['number', 1.23],
      '-.123': ['number', -0.123],
      '+.123': ['number', 0.123],
      '.123': ['number', 0.123],

      '"': ['unknown', '"']
    }
    Object.keys(basic).forEach(text => {
      const token = basic[text]
      it(`${JSON.stringify(text)} ⇒ ${token[0]} ${JSON.stringify(token[1])}`, () => {
        const tokens = punyexpr.tokenize(text)
        expect(tokens).toStrictEqual([token])
      })
    })
  })
})
