'use strict'

const { punyexpr } = require('../punyexpr')

describe('tokenizer', () => {
  const process = tests => {
    Object.keys(tests).forEach(text => {
      const expected = tests[text]
      if (expected instanceof Error) {
        it(`${JSON.stringify(text)} ⇒ fails @${expected.offset}`, () => {
          expect(() => punyexpr.tokenize(text)).toThrowError(expected)
        })
      } else {
        it(`${JSON.stringify(text)} ⇒ ${JSON.stringify(expected)}`, () => {
          const tokens = punyexpr.tokenize(text)
          expect(tokens).toStrictEqual(expected)
        })
      }
    })
  }

  describe('basic', () => {
    process({
      '\'a\'': [['string', 'a', 0]],
      '\'a\\\'b\'': [['string', 'a\'b', 0]],
      '"a"': [['string', 'a', 0]],
      '"a\\"b"': [['string', 'a"b', 0]],

      '-1': [['number', -1, 0]],
      '-1.0': [['number', -1, 0]],
      '-1.': [['number', -1, 0]],
      '+1': [['number', 1, 0]],
      '+1.0': [['number', 1, 0]],
      '+1.': [['number', 1, 0]],
      1: [['number', 1, 0]],
      '1.0': [['number', 1, 0]],
      '1.': [['number', 1, 0]],
      123: [['number', 123, 0]],
      '-1.23': [['number', -1.23, 0]],
      '+1.23': [['number', 1.23, 0]],
      1.23: [['number', 1.23, 0]],
      '-.123': [['number', -0.123, 0]],
      '+.123': [['number', 0.123, 0]],
      '.123': [['number', 0.123, 0]],

      true: [['boolean', true, 0]],
      false: [['boolean', false, 0]],

      a: [['identifier', 'a', 0]],
      _a: [['identifier', '_a', 0]],
      A: [['identifier', 'A', 0]],
      _A: [['identifier', '_A', 0]],
      abc: [['identifier', 'abc', 0]],
      abc_def: [['identifier', 'abc_def', 0]],
      abc123: [['identifier', 'abc123', 0]],

      '+': [['symbol', '+', 0]],
      '-': [['symbol', '-', 0]],
      '*': [['symbol', '*', 0]],
      '/': [['symbol', '/', 0]],
      '[': [['symbol', '[', 0]],
      ']': [['symbol', ']', 0]],
      '.': [['symbol', '.', 0]]
    })
  })

  describe('combining', () => {
    process({
      '1 + 1': [['number', 1, 0], ['symbol', '+', 2], ['number', 1, 4]],
      'items[step].member': [
        ['identifier', 'items', 0],
        ['symbol', '[', 5],
        ['identifier', 'step', 6],
        ['symbol', ']', 10],
        ['symbol', '.', 11],
        ['identifier', 'member', 12]
      ]
    })
  })

  describe('error', () => {
    process({
      '"': new punyexpr.InvalidTokenError(0)
    })
  })
})
