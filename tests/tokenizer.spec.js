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
      '\'a\'': [['literal', 'a', 0, 3]],
      '\'a\\\'b\'': [['literal', 'a\'b', 0, 6]],
      '"a"': [['literal', 'a', 0, 3]],
      '"a\\"b"': [['literal', 'a"b', 0, 6]],

      1: [['literal', 1, 0, 1]],
      '1.0': [['literal', 1, 0, 3]],
      '1.': [['literal', 1, 0, 2]],
      123: [['literal', 123, 0, 3]],
      1.23: [['literal', 1.23, 0, 4]],
      '.123': [['literal', 0.123, 0, 4]],

      true: [['literal', true, 0, 4]],
      false: [['literal', false, 0, 5]],
      undefined: [['literal', undefined, 0, 9]],
      null: [['literal', null, 0, 4]],

      a: [['identifier', 'a', 0, 1]],
      _a: [['identifier', '_a', 0, 2]],
      A: [['identifier', 'A', 0, 1]],
      _A: [['identifier', '_A', 0, 2]],
      abc: [['identifier', 'abc', 0, 3]],
      abc_def: [['identifier', 'abc_def', 0, 7]],
      abc123: [['identifier', 'abc123', 0, 6]],

      typeof: [['identifier', 'typeof', 0, 6]],

      ...'+-*/[].?:%<=>!&|(),'.split('').reduce((dict, symbol) => {
        dict[symbol] = [['symbol', symbol, 0, 1]]
        return dict
      }, {})
    })
  })

  describe('combining', () => {
    process({
      '1+1': [['literal', 1, 0, 1], ['symbol', '+', 1, 1], ['literal', 1, 2, 1]],
      '1 +  1': [['literal', 1, 0, 1], ['symbol', '+', 2, 1], ['literal', 1, 5, 1]],
      '1\t+\n1': [['literal', 1, 0, 1], ['symbol', '+', 2, 1], ['literal', 1, 4, 1]],
      'items[step].member': [
        ['identifier', 'items', 0, 5],
        ['symbol', '[', 5, 1],
        ['identifier', 'step', 6, 4],
        ['symbol', ']', 10, 1],
        ['symbol', '.', 11, 1],
        ['identifier', 'member', 12, 6]
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
