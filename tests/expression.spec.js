'use strict'

describe('expression', () => {
  it('builds a function', () => {
    const expr = punyexpr('1 + 1')
    expect(typeof expr).toBe('function')
  })

  const process = (tests, context) => {
    Object.keys(tests).forEach(expression => {
      const { json, expected, only, verbose, debug } = tests[expression]
      let label
      if (expected instanceof Error) {
        label = expected.name
      } else {
        label = JSON.stringify(expected)
      }
      let testMethod
      if (only) {
        testMethod = it.only
      } else {
        testMethod = it
      }
      testMethod(`${expression} = ${label}`, () => {
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
          expect(expr.toString()).toBe(expression)
          const exprAsJson = expr.toJSON()
          if (verbose) {
            console.log(JSON.stringify(exprAsJson, undefined, 2))
          }
          if (json) {
            expect(exprAsJson).toStrictEqual(json)
          }
          expect(expr(context)).toBe(expected)
        }
      })
    })
  }

  describe('basic', () => {
    process({
      1: {
        json: {
          op: 'constant',
          at: 0,
          length: 1,
          args: [1]
        },
        expected: 1
      },
      true: {
        json: {
          op: 'constant',
          at: 0,
          length: 4,
          args: [true]
        },
        expected: true
      },
      '"a"': {
        json: {
          op: 'constant',
          at: 0,
          length: 3,
          args: ['a']
        },
        expected: 'a'
      },
      '\'a\'': {
        json: {
          op: 'constant',
          at: 0,
          length: 3,
          args: ['a']
        },
        expected: 'a'
      },
      '1 + 2': {
        json: {
          op: 'add',
          at: 0,
          length: 5,
          args: [{
            op: 'constant',
            at: 0,
            length: 1,
            args: [1]
          }, {
            op: 'constant',
            at: 4,
            length: 1,
            args: [2]
          }]
        },
        expected: 3
      },
      '1 + 2 + 3': {
        json: {
          op: 'add',
          at: 0,
          length: 9,
          args: [{
            op: 'add',
            at: 0,
            length: 5,
            args: [{
              op: 'constant',
              at: 0,
              length: 1,
              args: [1]
            }, {
              op: 'constant',
              at: 4,
              length: 1,
              args: [2]
            }]
          }, {
            op: 'constant',
            at: 8,
            length: 1,
            args: [3]
          }]
        },
        expected: 6
      },
      '1 - 2': {
        json: {
          op: 'sub',
          at: 0,
          length: 5,
          args: [{
            op: 'constant',
            at: 0,
            length: 1,
            args: [1]
          }, {
            op: 'constant',
            at: 4,
            length: 1,
            args: [2]
          }]
        },
        expected: -1
      },
      '1 + 2 - 3': {
        json: {
          op: 'sub',
          at: 0,
          length: 9,
          args: [{
            op: 'add',
            at: 0,
            length: 5,
            args: [{
              op: 'constant',
              at: 0,
              length: 1,
              args: [1]
            }, {
              op: 'constant',
              at: 4,
              length: 1,
              args: [2]
            }]
          }, {
            op: 'constant',
            at: 8,
            length: 1,
            args: [3]
          }]
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
        only: true,
        verbose: true,
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
      '10 ** 2': {
        json: {
          exp: [
            { constant: [10] },
            { constant: [2] }
          ]
        },
        expected: 100
      },
      '2 * 3': {
        json: {
          mul: [
            { constant: [2] },
            { constant: [3] }
          ]
        },
        expected: 6
      },
      '3 / 2': {
        json: {
          div: [
            { constant: [3] },
            { constant: [2] }
          ]
        },
        expected: 1.5
      },
      '3 % 2': {
        json: {
          remainder: [
            { constant: [3] },
            { constant: [2] }
          ]
        },
        expected: 1
      },
      '2 < 2': {
        json: {
          lt: [
            { constant: [2] },
            { constant: [2] }
          ]
        },
        expected: false
      },
      '1 < 2': {
        json: {
          lt: [
            { constant: [1] },
            { constant: [2] }
          ]
        },
        expected: true
      },
      '2 < 1': {
        json: {
          lt: [
            { constant: [2] },
            { constant: [1] }
          ]
        },
        expected: false
      },
      '2 <= 2': {
        json: {
          lte: [
            { constant: [2] },
            { constant: [2] }
          ]
        },
        expected: true
      },
      '1 <= 2': {
        json: {
          lte: [
            { constant: [1] },
            { constant: [2] }
          ]
        },
        expected: true
      },
      '2 <= 1': {
        json: {
          lte: [
            { constant: [2] },
            { constant: [1] }
          ]
        },
        expected: false
      },
      '2 > 2': {
        json: {
          gt: [
            { constant: [2] },
            { constant: [2] }
          ]
        },
        expected: false
      },
      '1 > 2': {
        json: {
          gt: [
            { constant: [1] },
            { constant: [2] }
          ]
        },
        expected: false
      },
      '2 > 1': {
        json: {
          gt: [
            { constant: [2] },
            { constant: [1] }
          ]
        },
        expected: true
      },
      '2 >= 2': {
        json: {
          gte: [
            { constant: [2] },
            { constant: [2] }
          ]
        },
        expected: true
      },
      '1 >= 2': {
        json: {
          gte: [
            { constant: [1] },
            { constant: [2] }
          ]
        },
        expected: false
      },
      '2 >= 1': {
        json: {
          gte: [
            { constant: [2] },
            { constant: [1] }
          ]
        },
        expected: true
      },
      '1 == 2': {
        json: {
          eq: [
            { constant: [1] },
            { constant: [2] }
          ]
        },
        expected: false
      },
      '"1" == 2': {
        json: {
          eq: [
            { constant: ['1'] },
            { constant: [2] }
          ]
        },
        expected: false
      },
      '2 == 2': {
        json: {
          eq: [
            { constant: [2] },
            { constant: [2] }
          ]
        },
        expected: true
      },
      '"2" == 2': {
        json: {
          eq: [
            { constant: ['2'] },
            { constant: [2] }
          ]
        },
        expected: true
      },
      '1 != 2': {
        json: {
          neq: [
            { constant: [1] },
            { constant: [2] }
          ]
        },
        expected: true
      },
      '"1" != 2': {
        json: {
          neq: [
            { constant: ['1'] },
            { constant: [2] }
          ]
        },
        expected: true
      },
      '2 != 2': {
        json: {
          neq: [
            { constant: [2] },
            { constant: [2] }
          ]
        },
        expected: false
      },
      '"2" != 2': {
        json: {
          neq: [
            { constant: ['2'] },
            { constant: [2] }
          ]
        },
        expected: false
      },
      '1 === 2': {
        json: {
          eqq: [
            { constant: [1] },
            { constant: [2] }
          ]
        },
        expected: false
      },
      '"1" === 2': {
        json: {
          eqq: [
            { constant: ['1'] },
            { constant: [2] }
          ]
        },
        expected: false
      },
      '2 === 2': {
        json: {
          eqq: [
            { constant: [2] },
            { constant: [2] }
          ]
        },
        expected: true
      },
      '"2" === 2': {
        json: {
          eqq: [
            { constant: ['2'] },
            { constant: [2] }
          ]
        },
        expected: false
      },
      '1 !== 2': {
        json: {
          neqq: [
            { constant: [1] },
            { constant: [2] }
          ]
        },
        expected: true
      },
      '"1" !== 2': {
        json: {
          neqq: [
            { constant: ['1'] },
            { constant: [2] }
          ]
        },
        expected: true
      },
      '2 !== 2': {
        json: {
          neqq: [
            { constant: [2] },
            { constant: [2] }
          ]
        },
        expected: false
      },
      '"2" !== 2': {
        json: {
          neqq: [
            { constant: ['2'] },
            { constant: [2] }
          ]
        },
        expected: true
      },
      'false && false': {
        json: {
          and: [
            { constant: [false] },
            { constant: [false] }
          ]
        },
        expected: false
      },
      'true && false': {
        json: {
          and: [
            { constant: [true] },
            { constant: [false] }
          ]
        },
        expected: false
      },
      'false && true': {
        json: {
          and: [
            { constant: [false] },
            { constant: [true] }
          ]
        },
        expected: false
      },
      'true && true': {
        json: {
          and: [
            { constant: [true] },
            { constant: [true] }
          ]
        },
        expected: true
      },
      'false || false': {
        json: {
          or: [
            { constant: [false] },
            { constant: [false] }
          ]
        },
        expected: false
      },
      'true || false': {
        json: {
          or: [
            { constant: [true] },
            { constant: [false] }
          ]
        },
        expected: true
      },
      'false || true': {
        json: {
          or: [
            { constant: [false] },
            { constant: [true] }
          ]
        },
        expected: true
      },
      'true || true': {
        json: {
          or: [
            { constant: [true] },
            { constant: [true] }
          ]
        },
        expected: true
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
      },
      '(1 + 2) * 3': {
        json: {
          mul: [
            {
              add: [
                { constant: [1] },
                { constant: [2] }
              ]
            },
            { constant: [3] }
          ]
        },
        expected: 9
      },
      '1 + (2 * 3)': {
        json: {
          add: [
            { constant: [1] },
            {
              mul: [
                { constant: [2] },
                { constant: [3] }
              ]
            }
          ]
        },
        expected: 7
      },
      'typeof 1': {
        json: {
          getTypeof: [
            { constant: [1] }
          ]
        },
        expected: 'number'
      },
      'typeof "abc"': {
        json: {
          getTypeof: [
            { constant: ['abc'] }
          ]
        },
        expected: 'string'
      },
      'typeof true': {
        json: {
          getTypeof: [
            { constant: [true] }
          ]
        },
        expected: 'boolean'
      },
      'typeof null': {
        json: {
          getTypeof: [
            { constant: [null] }
          ]
        },
        expected: 'object'
      },
      '+1': {
        json: {
          constant: [1]
        },
        expected: 1
      },
      '-1': {
        json: {
          neg: [
            { constant: [1] }
          ]
        },
        expected: -1
      },
      '!true': {
        json: {
          not: [
            { constant: [true] }
          ]
        },
        expected: false
      },
      '!false': {
        json: {
          not: [
            { constant: [false] }
          ]
        },
        expected: true
      },
      '!!""': {
        json: {
          not: [
            {
              not: [
                { constant: [''] }
              ]
            }
          ]
        },
        expected: false
      },
      '"typeof"': {
        json: { constant: ['typeof'] },
        expected: 'typeof'
      },
      '(2).toFixed(2)': {
        json: {
          call: [
            {
              property: [
                { constant: [2] },
                { constant: ['toFixed'] }
              ]
            },
            [
              { constant: [2] }
            ]
          ]
        },
        expected: '2.00'
      },
      '(2).toFixed(2).endsWith("00")': {
        json: {
          call: [
            {
              property: [
                {
                  call: [
                    {
                      property: [
                        { constant: [2] },
                        { constant: ['toFixed'] }
                      ]
                    },
                    [
                      { constant: [2] }
                    ]
                  ]
                },
                { constant: ['endsWith'] }
              ]
            },
            [
              { constant: ['00'] }
            ]
          ]
        },
        expected: true
      }
    })
  })

  describe('contextual', () => {
    process({
      hello: {
        json: {
          context: [
            { constant: ['hello'] }
          ]
        },
        expected: 'World !'
      },
      'object.property1': {
        json: {
          property: [
            {
              context: [
                { constant: ['object'] }
              ]
            },
            { constant: ['property1'] }
          ]
        },
        expected: 1
      },
      'object["property1"]': {
        json: {
          property: [
            {
              context: [
                { constant: ['object'] }
              ]
            },
            { constant: ['property1'] }
          ]
        },
        expected: 1
      },
      'object.method()': {
        json: {
          call: [
            {
              property: [
                {
                  context: [
                    { constant: ['object'] }
                  ]
                },
                { constant: ['method'] }
              ]
            },
            []
          ]
        },
        expected: 'OK'
      },
      'object.method(1)': {
        json: {
          call: [
            {
              property: [
                {
                  context: [
                    { constant: ['object'] }
                  ]
                },
                { constant: ['method'] }
              ]
            },
            [
              { constant: [1] }
            ]
          ]
        },
        expected: 'OK1'
      },
      'object.method(1,2)': {
        json: {
          call: [
            {
              property: [
                {
                  context: [
                    { constant: ['object'] }
                  ]
                },
                { constant: ['method'] }
              ]
            },
            [
              { constant: [1] },
              { constant: [2] }
            ]
          ]
        },
        expected: 'OK1,2'
      }
    }, {
      hello: 'World !',
      object: {
        property1: 1,
        method: (...args) => 'OK' + args.join(',')
      }
    })
  })

  describe('error', () => {
    const error = (name, message, offset) => ({
      expected: new punyexpr.Error(name, message, offset)
    })
    process({
      '*': error('UnexpectedTokenError', 'Unexpected token @0', 0),
      '+': error('EndOfExpressionError', 'Unexpected end of expression'),
      '1 +': error('EndOfExpressionError', 'Unexpected end of expression'),
      '1 ++': error('EndOfExpressionError', 'Unexpected end of expression'),
      '1 ? 2 +': error('EndOfExpressionError', 'Unexpected end of expression'),
      '1 ? 2 2': error('UnexpectedTokenError', 'Unexpected token @6', 6),
      '1 ? 2 ,': error('UnexpectedTokenError', 'Unexpected token @6', 6),
      '1 2': error('UnexpectedRemainderError', 'Unexpected left over tokens @2', 2),
      '(1 + 2]': error('UnexpectedTokenError', 'Unexpected token @6', 6),
      'a.+': error('UnexpectedTokenError', 'Unexpected token @2', 2),
      'a[1)': error('UnexpectedTokenError', 'Unexpected token @3', 3),
      'a(1]': error('UnexpectedTokenError', 'Unexpected token @3', 3),
      '1 | "|"': error('UnexpectedRemainderError', 'Unexpected left over tokens @2', 2)
    })
  })
})
