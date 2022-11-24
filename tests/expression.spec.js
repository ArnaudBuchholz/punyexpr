'use strict'

const { punyexpr } = require('../punyexpr')

const jsonify = expr => ({
  [expr.op]: expr.args.map(
    arg => typeof arg === 'function'
      ? jsonify(arg)
      : arg
  )
})

describe('expression', () => {
  it('builds a function', () => {
    const expr = punyexpr('1 + 1')
    expect(typeof expr).toBe('function')
  })

  const process = (tests, context) => {
    Object.keys(tests).forEach(expression => {
      const { json, expected, verbose, debug } = tests[expression]
      let label
      if (expected instanceof Error) {
        label = expected.name
      } else {
        label = JSON.stringify(expected)
      }
      it(`${expression} = ${label}`, () => {
        if (debug) {
          debugger // eslint-disable-line no-debugger
        }
        let exceptionCaught
        let expr
        try {
          expr = punyexpr(expression)
        } catch (error) {
          exceptionCaught = error
        }
        if (expected instanceof Error) {
          expect(exceptionCaught).not.toBeUndefined()
          expect(exceptionCaught.name).toBe(expected.name)
          expect(exceptionCaught.message).toBe(expected.message)
          expect(exceptionCaught.offset).toBe(expected.offset)
        } else if (exceptionCaught) {
          throw exceptionCaught
        } else {
          expect(expr.str).toBe(expression)
          if (verbose) {
            console.log(JSON.stringify(jsonify(expr.impl), undefined, 2))
          }
          expect(jsonify(expr.impl)).toStrictEqual(json)
          expect(expr(context)).toBe(expected)
        }
      })
    })
  }

  describe('basic', () => {
    process({
      1: {
        json: {
          constant: [1]
        },
        expected: 1
      },
      true: {
        json: {
          constant: [true]
        },
        expected: true
      },
      '"a"': {
        json: {
          constant: ['a']
        },
        expected: 'a'
      },
      '\'a\'': {
        json: {
          constant: ['a']
        },
        expected: 'a'
      },
      '1 + 2': {
        json: {
          add: [
            { constant: [1] },
            { constant: [2] }
          ]
        },
        expected: 3
      },
      '1 + 2 + 3': {
        json: {
          add: [
            {
              add: [
                { constant: [1] },
                { constant: [2] }
              ]
            },
            { constant: [3] }
          ]
        },
        expected: 6
      },
      '1 - 2': {
        json: {
          sub: [
            { constant: [1] },
            { constant: [2] }
          ]
        },
        expected: -1
      },
      '1 + 2 - 3': {
        json: {
          sub: [
            {
              add: [
                { constant: [1] },
                { constant: [2] }
              ]
            },
            { constant: [3] }
          ]
        },
        expected: 0
      },
      '"1" + 2': {
        json: {
          add: [
            { constant: ['1'] },
            { constant: [2] }
          ]
        },
        expected: '12'
      },
      '"1" - 2': {
        json: {
          sub: [
            { constant: ['1'] },
            { constant: [2] }
          ]
        },
        expected: -1
      },
      'true ? 1 : 2': {
        json: {
          ternary: [
            { constant: [true] },
            { constant: [1] },
            { constant: [2] }
          ]
        },
        expected: 1
      },
      'false ? "a" : "b"': {
        json: {
          ternary: [
            { constant: [false] },
            { constant: ['a'] },
            { constant: ['b'] }
          ]
        },
        expected: 'b'
      }
    })
  })

  describe('contextual', () => {
    process({
      hello: {
        json: {
          get: [
            { constant: ['hello'] }
          ]
        },
        expected: 'World !'
      }
    }, {
      hello: 'World !'
    })
  })

  describe('error', () => {
    const error = (name, message, offset) => ({
      expected: new punyexpr.Error(name, message, offset)
    })
    process({
      '+': error('UnexpectedTokenError', 'Unexpected token @0', 0),
      '1 +': error('EndOfExpressionError', 'Unexpected end of expression'),
      '1 ++': error('UnexpectedTokenError', 'Unexpected token @3', 3),
      '1 ? 2 +': error('EndOfExpressionError', 'Unexpected end of expression'),
      '1 ? 2 2': error('UnexpectedTokenError', 'Unexpected token @6', 6),
      '1 2': error('UnexpectedRemainderError', 'Unexpected left over tokens @2', 2)
    })
  })
})
