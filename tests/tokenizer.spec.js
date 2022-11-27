'use strict'

describe('tokenizer', () => {
  const process = tests => {
    Object.keys(tests).forEach(text => {
      const expected = tests[text]
      if (expected instanceof Error) {
        it(`${JSON.stringify(text)} ⇒ fails @${expected.offset}`, () => {
          let exceptionCaught
          try {
            punyexpr.tokenize(text)
          } catch (error) {
            exceptionCaught = error
          }
          expect(exceptionCaught.name).toBe(expected.name)
          expect(exceptionCaught.message).toBe(expected.message)
          expect(exceptionCaught.offset).toBe(expected.offset)
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
      '\'a\'': [['literal', 'a', 0]],
      '\'a\\\'b\'': [['literal', 'a\'b', 0]],
      '"a"': [['literal', 'a', 0]],
      '"a\\"b"': [['literal', 'a"b', 0]],

      1: [['literal', 1, 0]],
      '1.0': [['literal', 1, 0]],
      '1.': [['literal', 1, 0]],
      123: [['literal', 123, 0]],
      1.23: [['literal', 1.23, 0]],
      '.123': [['literal', 0.123, 0]],

      true: [['literal', true, 0]],
      false: [['literal', false, 0]],
      undefined: [['literal', undefined, 0]],
      null: [['literal', null, 0]],

      a: [['identifier', 'a', 0]],
      _a: [['identifier', '_a', 0]],
      A: [['identifier', 'A', 0]],
      _A: [['identifier', '_A', 0]],
      abc: [['identifier', 'abc', 0]],
      abc_def: [['identifier', 'abc_def', 0]],
      abc123: [['identifier', 'abc123', 0]],

      typeof: [['identifier', 'typeof', 0]],

      ...'+-*/[].?:%<=>!&|(),'.split('').reduce((dict, symbol) => {
        dict[symbol] = [['symbol', symbol, 0]]
        return dict
      }, {})
    })
  })

  describe('combining', () => {
    process({
      '1+1': [['literal', 1, 0], ['symbol', '+', 1], ['literal', 1, 2]],
      '1 +  1': [['literal', 1, 0], ['symbol', '+', 2], ['literal', 1, 5]],
      '1\t+\n1': [['literal', 1, 0], ['symbol', '+', 2], ['literal', 1, 4]],
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
    const error = offset => new punyexpr.Error('InvalidTokenError', `Invalid token @${offset}`, offset)
    process({
      '"\'': error(0),
      '9a': error(1),
      '@': error(0),
      if: error(0),
      while: error(0),
      var: error(0)
    })
  })
})
