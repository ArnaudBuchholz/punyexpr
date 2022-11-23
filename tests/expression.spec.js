'use strict'

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
      it(`${expression} = ${JSON.stringify(expected)}`, () => {
        if (debug) {
          debugger // eslint-disable-line no-debugger
        }
        const expr = punyexpr(expression)
        expect(expr.str).toBe(expression)
        if (verbose) {
          console.log(JSON.stringify(jsonify(expr.impl), undefined, 2))
        }
        expect(jsonify(expr.impl)).toStrictEqual(json)
        expect(expr(context)).toBe(expected)
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
})
