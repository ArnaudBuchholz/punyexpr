'use strict'

describe('expression', () => {
  it('builds a function', () => {
    const expr = punyexpr('1 + 1')
    expect(typeof expr).toBe('function')
  })

  const process = (tests, context, options) => {
    Object.keys(tests).forEach(expression => {
      const { tokens, json, expected, only, verbose, debug } = tests[expression]
      let label
      if (expected instanceof Error) {
        label = expected.name
      } else if (typeof expected === 'function') {
        label = '<custom validation>'
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
        if (tokens) {
          expect(punyexpr.tokenize(expression)).toStrictEqual(tokens)
        }
        let expr
        try {
          expr = punyexpr(expression, options)
        } catch (error) {
          exceptionCaught = error
        }
        if (expected instanceof Error) {
          expect(exceptionCaught).not.toBeUndefined()
          expect(exceptionCaught.name).toStrictEqual(expected.name)
          expect(exceptionCaught.message).toStrictEqual(expected.message)
          expect(exceptionCaught.offset).toStrictEqual(expected.offset)
        } else if (exceptionCaught) {
          throw exceptionCaught
        } else {
          expect(expr.toString()).toStrictEqual(expression)
          const exprAsJson = expr.toJSON()
          if (verbose) {
            console.log(JSON.stringify(exprAsJson, undefined, 2))
          }
          if (json) {
            expect(exprAsJson).toStrictEqual(json)
          }
          let result = expr(context)
          if (Array.isArray(result)) { // Looks like an array ?
            result = [].slice.call(result) // Convert to array
          }
          if (typeof expected === 'function') {
            expected(result)
          } else {
            expect(result).toStrictEqual(expected)
          }
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
          op: 'add',
          at: 0,
          length: 7,
          args: [{
            op: 'constant',
            at: 0,
            length: 3,
            args: ['1']
          }, {
            op: 'constant',
            at: 6,
            length: 1,
            args: [2]
          }]
        },
        expected: '12'
      },
      '"1" - 2': {
        json: {
          op: 'sub',
          at: 0,
          length: 7,
          args: [{
            op: 'constant',
            at: 0,
            length: 3,
            args: ['1']
          }, {
            op: 'constant',
            at: 6,
            length: 1,
            args: [2]
          }]
        },
        expected: -1
      },
      '10 ** 2': {
        json: {
          op: 'exp',
          at: 0,
          length: 7,
          args: [{
            op: 'constant',
            at: 0,
            length: 2,
            args: [10]
          }, {
            op: 'constant',
            at: 6,
            length: 1,
            args: [2]
          }
          ]
        },
        expected: 100
      },
      '2 * 3': {
        json: {
          op: 'mul',
          at: 0,
          length: 5,
          args: [{
            op: 'constant',
            at: 0,
            length: 1,
            args: [2]
          }, {
            op: 'constant',
            at: 4,
            length: 1,
            args: [3]
          }]
        },
        expected: 6
      },
      '3 / 2': {
        json: {
          op: 'div',
          at: 0,
          length: 5,
          args: [{
            op: 'constant',
            at: 0,
            length: 1,
            args: [3]
          },
          {
            op: 'constant',
            at: 4,
            length: 1,
            args: [2]
          }]
        },
        expected: 1.5
      },
      '3 % 2': {
        json: {
          op: 'remainder',
          at: 0,
          length: 5,
          args: [{
            op: 'constant',
            at: 0,
            length: 1,
            args: [3]
          },
          {
            op: 'constant',
            at: 4,
            length: 1,
            args: [2]
          }
          ]
        },
        expected: 1
      },
      '2 < 2': {
        json: {
          op: 'lt',
          at: 0,
          length: 5,
          args: [{
            op: 'constant',
            at: 0,
            length: 1,
            args: [2]
          }, {
            op: 'constant',
            at: 4,
            length: 1,
            args: [2]
          }]
        },
        expected: false
      },
      '1 < 2': {
        json: {
          op: 'lt',
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
        expected: true
      },
      '2 < 1': {
        json: {
          op: 'lt',
          at: 0,
          length: 5,
          args: [{
            op: 'constant',
            at: 0,
            length: 1,
            args: [2]
          }, {
            op: 'constant',
            at: 4,
            length: 1,
            args: [1]
          }]
        },
        expected: false
      },
      '2 <= 2': {
        json: {
          op: 'lte',
          at: 0,
          length: 6,
          args: [{
            op: 'constant',
            at: 0,
            length: 1,
            args: [2]
          }, {
            op: 'constant',
            at: 5,
            length: 1,
            args: [2]
          }]
        },
        expected: true
      },
      '1 <= 2': {
        json: {
          op: 'lte',
          at: 0,
          length: 6,
          args: [{
            op: 'constant',
            at: 0,
            length: 1,
            args: [1]
          }, {
            op: 'constant',
            at: 5,
            length: 1,
            args: [2]
          }]
        },
        expected: true
      },
      '2 <= 1': {
        json: {
          op: 'lte',
          at: 0,
          length: 6,
          args: [{
            op: 'constant',
            at: 0,
            length: 1,
            args: [2]
          }, {
            op: 'constant',
            at: 5,
            length: 1,
            args: [1]
          }]
        },
        expected: false
      },
      '2 > 2': {
        json: {
          op: 'gt',
          at: 0,
          length: 5,
          args: [{
            op: 'constant',
            at: 0,
            length: 1,
            args: [2]
          }, {
            op: 'constant',
            at: 4,
            length: 1,
            args: [2]
          }]
        },
        expected: false
      },
      '1 > 2': {
        json: {
          op: 'gt',
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
        expected: false
      },
      '2 > 1': {
        json: {
          op: 'gt',
          at: 0,
          length: 5,
          args: [{
            op: 'constant',
            at: 0,
            length: 1,
            args: [2]
          }, {
            op: 'constant',
            at: 4,
            length: 1,
            args: [1]
          }]
        },
        expected: true
      },
      '2 >= 2': {
        json: {
          op: 'gte',
          at: 0,
          length: 6,
          args: [{
            op: 'constant',
            at: 0,
            length: 1,
            args: [2]
          }, {
            op: 'constant',
            at: 5,
            length: 1,
            args: [2]
          }]
        },
        expected: true
      },
      '1 >= 2': {
        json: {
          op: 'gte',
          at: 0,
          length: 6,
          args: [{
            op: 'constant',
            at: 0,
            length: 1,
            args: [1]
          }, {
            op: 'constant',
            at: 5,
            length: 1,
            args: [2]
          }]
        },
        expected: false
      },
      '2 >= 1': {
        json: {
          op: 'gte',
          at: 0,
          length: 6,
          args: [{
            op: 'constant',
            at: 0,
            length: 1,
            args: [2]
          }, {
            op: 'constant',
            at: 5,
            length: 1,
            args: [1]
          }]
        },
        expected: true
      },
      '1 == 2': {
        json: {
          op: 'eq',
          at: 0,
          length: 6,
          args: [{
            op: 'constant',
            at: 0,
            length: 1,
            args: [1]
          }, {
            op: 'constant',
            at: 5,
            length: 1,
            args: [2]
          }]
        },
        expected: false
      },
      '"1" == 2': {
        json: {
          op: 'eq',
          at: 0,
          length: 8,
          args: [{
            op: 'constant',
            at: 0,
            length: 3,
            args: ['1']
          }, {
            op: 'constant',
            at: 7,
            length: 1,
            args: [2]
          }]
        },
        expected: false
      },
      '2 == 2': {
        json: {
          op: 'eq',
          at: 0,
          length: 6,
          args: [{
            op: 'constant',
            at: 0,
            length: 1,
            args: [2]
          },
          {
            op: 'constant',
            at: 5,
            length: 1,
            args: [2]
          }]
        },
        expected: true
      },
      '"2" == 2': {
        json: {
          op: 'eq',
          at: 0,
          length: 8,
          args: [{
            op: 'constant',
            at: 0,
            length: 3,
            args: ['2']
          },
          {
            op: 'constant',
            at: 7,
            length: 1,
            args: [2]
          }
          ]
        },
        expected: true
      },
      '1 != 2': {
        json: {
          op: 'neq',
          at: 0,
          length: 6,
          args: [{
            op: 'constant',
            at: 0,
            length: 1,
            args: [1]
          }, {
            op: 'constant',
            at: 5,
            length: 1,
            args: [2]
          }]
        },
        expected: true
      },
      '"1" != 2': {
        json: {
          op: 'neq',
          at: 0,
          length: 8,
          args: [{
            op: 'constant',
            at: 0,
            length: 3,
            args: ['1']
          }, {
            op: 'constant',
            at: 7,
            length: 1,
            args: [2]
          }]
        },
        expected: true
      },
      '2 != 2': {
        json: {
          op: 'neq',
          at: 0,
          length: 6,
          args: [{
            op: 'constant',
            at: 0,
            length: 1,
            args: [2]
          }, {
            op: 'constant',
            at: 5,
            length: 1,
            args: [2]
          }]
        },
        expected: false
      },
      '"2" != 2': {
        json: {
          op: 'neq',
          at: 0,
          length: 8,
          args: [{
            op: 'constant',
            at: 0,
            length: 3,
            args: ['2']
          }, {
            op: 'constant',
            at: 7,
            length: 1,
            args: [2]
          }]
        },
        expected: false
      },
      '1 === 2': {
        json: {
          op: 'eqq',
          at: 0,
          length: 7,
          args: [{
            op: 'constant',
            at: 0,
            length: 1,
            args: [1]
          }, {
            op: 'constant',
            at: 6,
            length: 1,
            args: [2]
          }]
        },
        expected: false
      },
      '"1" === 2': {
        json: {
          op: 'eqq',
          at: 0,
          length: 9,
          args: [{
            op: 'constant',
            at: 0,
            length: 3,
            args: ['1']
          }, {
            op: 'constant',
            at: 8,
            length: 1,
            args: [2]
          }]
        },
        expected: false
      },
      '2 === 2': {
        json: {
          op: 'eqq',
          at: 0,
          length: 7,
          args: [{
            op: 'constant',
            at: 0,
            length: 1,
            args: [2]
          }, {
            op: 'constant',
            at: 6,
            length: 1,
            args: [2]
          }]
        },
        expected: true
      },
      '"2" === 2': {
        json: {
          op: 'eqq',
          at: 0,
          length: 9,
          args: [{
            op: 'constant',
            at: 0,
            length: 3,
            args: ['2']
          }, {
            op: 'constant',
            at: 8,
            length: 1,
            args: [2]
          }]
        },
        expected: false
      },
      '1 !== 2': {
        json: {
          op: 'neqq',
          at: 0,
          length: 7,
          args: [{
            op: 'constant',
            at: 0,
            length: 1,
            args: [1]
          }, {
            op: 'constant',
            at: 6,
            length: 1,
            args: [2]
          }]
        },
        expected: true
      },
      '"1" !== 2': {
        json: {
          op: 'neqq',
          at: 0,
          length: 9,
          args: [{
            op: 'constant',
            at: 0,
            length: 3,
            args: ['1']
          }, {
            op: 'constant',
            at: 8,
            length: 1,
            args: [2]
          }]
        },
        expected: true
      },
      '2 !== 2': {
        json: {
          op: 'neqq',
          at: 0,
          length: 7,
          args: [{
            op: 'constant',
            at: 0,
            length: 1,
            args: [2]
          }, {
            op: 'constant',
            at: 6,
            length: 1,
            args: [2]
          }]
        },
        expected: false
      },
      '"2" !== 2': {
        json: {
          op: 'neqq',
          at: 0,
          length: 9,
          args: [{
            op: 'constant',
            at: 0,
            length: 3,
            args: ['2']
          },
          {
            op: 'constant',
            at: 8,
            length: 1,
            args: [2]
          }]
        },
        expected: true
      },
      'false && false': {
        json: {
          op: 'and',
          at: 0,
          length: 14,
          args: [{
            op: 'constant',
            at: 0,
            length: 5,
            args: [false]
          }, {
            op: 'constant',
            at: 9,
            length: 5,
            args: [false]
          }]
        },
        expected: false
      },
      'true && false': {
        json: {
          op: 'and',
          at: 0,
          length: 13,
          args: [{
            op: 'constant',
            at: 0,
            length: 4,
            args: [true]
          }, {
            op: 'constant',
            at: 8,
            length: 5,
            args: [false]
          }]
        },
        expected: false
      },
      'false && true': {
        json: {
          op: 'and',
          at: 0,
          length: 13,
          args: [{
            op: 'constant',
            at: 0,
            length: 5,
            args: [false]
          }, {
            op: 'constant',
            at: 9,
            length: 4,
            args: [true]
          }]
        },
        expected: false
      },
      'true && true': {
        json: {
          op: 'and',
          at: 0,
          length: 12,
          args: [{
            op: 'constant',
            at: 0,
            length: 4,
            args: [true]
          }, {
            op: 'constant',
            at: 8,
            length: 4,
            args: [true]
          }]
        },
        expected: true
      },
      'false || false': {
        json: {
          op: 'or',
          at: 0,
          length: 14,
          args: [{
            op: 'constant',
            at: 0,
            length: 5,
            args: [false]
          }, {
            op: 'constant',
            at: 9,
            length: 5,
            args: [false]
          }]
        },
        expected: false
      },
      'true || false': {
        json: {
          op: 'or',
          at: 0,
          length: 13,
          args: [{
            op: 'constant',
            at: 0,
            length: 4,
            args: [true]
          }, {
            op: 'constant',
            at: 8,
            length: 5,
            args: [false]
          }]
        },
        expected: true
      },
      'false || true': {
        json: {
          op: 'or',
          at: 0,
          length: 13,
          args: [{
            op: 'constant',
            at: 0,
            length: 5,
            args: [false]
          }, {
            op: 'constant',
            at: 9,
            length: 4,
            args: [true]
          }]
        },
        expected: true
      },
      'true || true': {
        json: {
          op: 'or',
          at: 0,
          length: 12,
          args: [{
            op: 'constant',
            at: 0,
            length: 4,
            args: [true]
          }, {
            op: 'constant',
            at: 8,
            length: 4,
            args: [true]
          }]
        },
        expected: true
      },
      '(1 + 2) * 3': {
        json: {
          op: 'mul',
          at: 0,
          length: 11,
          args: [{
            op: 'add',
            at: 1,
            length: 5,
            args: [{
              op: 'constant',
              at: 1,
              length: 1,
              args: [1]
            }, {
              op: 'constant',
              at: 5,
              length: 1,
              args: [2]
            }]
          }, {
            op: 'constant',
            at: 10,
            length: 1,
            args: [3]
          }]
        },
        expected: 9
      },
      '1 + (2 * 3)': {
        json: {
          op: 'add',
          at: 0,
          length: 10,
          args: [
            {
              op: 'constant',
              at: 0,
              length: 1,
              args: [1]
            },
            {
              op: 'mul',
              at: 5,
              length: 5,
              args: [{
                op: 'constant',
                at: 5,
                length: 1,
                args: [2]
              }, {
                op: 'constant',
                at: 9,
                length: 1,
                args: [3]
              }]
            }]
        },
        expected: 7
      },
      'typeof 1': {
        json: {
          op: 'getTypeof',
          at: 0,
          length: 6,
          args: [{
            op: 'constant',
            at: 7,
            length: 1,
            args: [1]
          }]
        },
        expected: 'number'
      },
      'typeof "abc"': {
        json: {
          op: 'getTypeof',
          at: 0,
          length: 6,
          args: [{
            op: 'constant',
            at: 7,
            length: 5,
            args: ['abc']
          }]
        },
        expected: 'string'
      },
      'typeof true': {
        json: {
          op: 'getTypeof',
          at: 0,
          length: 6,
          args: [{
            op: 'constant',
            at: 7,
            length: 4,
            args: [true]
          }]
        },
        expected: 'boolean'
      },
      'typeof null': {
        json: {
          op: 'getTypeof',
          at: 0,
          length: 6,
          args: [{
            op: 'constant',
            at: 7,
            length: 4,
            args: [null]
          }]
        },
        expected: 'object'
      },
      '+1': {
        json: {
          op: 'pos',
          at: 0,
          length: 1,
          args: [{
            op: 'constant',
            at: 1,
            length: 1,
            args: [1]
          }]
        },
        expected: 1
      },
      '-1': {
        json: {
          op: 'neg',
          at: 0,
          length: 1,
          args: [{
            op: 'constant',
            at: 1,
            length: 1,
            args: [1]
          }]
        },
        expected: -1
      },
      '!true': {
        json: {
          op: 'not',
          at: 0,
          length: 1,
          args: [{
            op: 'constant',
            at: 1,
            length: 4,
            args: [true]
          }]
        },
        expected: false
      },
      '!false': {
        json: {
          op: 'not',
          at: 0,
          length: 1,
          args: [
            {
              op: 'constant',
              at: 1,
              length: 5,
              args: [
                false
              ]
            }
          ]
        },
        expected: true
      },
      '!!""': {
        json: {
          op: 'not',
          at: 0,
          length: 1,
          args: [{
            op: 'not',
            at: 1,
            length: 1,
            args: [{
              op: 'constant',
              at: 2,
              length: 2,
              args: ['']
            }]
          }]
        },
        expected: false
      },
      '"typeof"': {
        json: {
          op: 'constant',
          at: 0,
          length: 8,
          args: ['typeof']
        },
        expected: 'typeof'
      },
      '(2).toFixed(2)': {
        json: {
          op: 'call',
          at: 0,
          length: 14,
          args: [{
            op: 'property',
            at: 0,
            length: 11,
            args: [{
              op: 'constant',
              at: 1,
              length: 1,
              args: [2]
            }, {
              op: 'constant',
              at: 4,
              length: 7,
              args: ['toFixed']
            }]
          }, [
            {
              op: 'constant',
              at: 12,
              length: 1,
              args: [2]
            }
          ]]
        },
        expected: '2.00'
      },
      '(2).toFixed(2).endsWith("00")': {
        json: {
          op: 'call',
          at: 0,
          length: 29,
          args: [{
            op: 'property',
            at: 0,
            length: 23,
            args: [{
              op: 'call',
              at: 0,
              length: 14,
              args: [{
                op: 'property',
                at: 0,
                length: 11,
                args: [{
                  op: 'constant',
                  at: 1,
                  length: 1,
                  args: [2]
                }, {
                  op: 'constant',
                  at: 4,
                  length: 7,
                  args: ['toFixed']
                }]
              }, [
                {
                  op: 'constant',
                  at: 12,
                  length: 1,
                  args: [2]
                }
              ]]
            }, {
              op: 'constant',
              at: 15,
              length: 8,
              args: ['endsWith']
            }]
          }, [
            {
              op: 'constant',
              at: 24,
              length: 4,
              args: ['00']
            }
          ]]
        },
        expected: true
      },
      '"".split().length': {
        tokens: [
          ['literal', '', 0, 2],
          ['symbol', '.', 2, 1],
          ['identifier', 'split', 3, 5],
          ['symbol', '(', 8, 1],
          ['symbol', ')', 9, 1],
          ['symbol', '.', 10, 1],
          ['identifier', 'length', 11, 6]
        ],
        json: {
          op: 'property',
          at: 0,
          length: 17,
          args: [{
            op: 'call',
            at: 0,
            length: 10,
            args: [{
              op: 'property',
              at: 0,
              length: 8,
              args: [{
                op: 'constant',
                at: 0,
                length: 2,
                args: ['']
              }, {
                op: 'constant',
                at: 3,
                length: 5,
                args: ['split']
              }]
            }, [
            ]]
          }, {
            op: 'constant',
            at: 11,
            length: 6,
            args: ['length']
          }]
        },
        expected: 1
      }
    })
  })

  describe('ternary', () => {
    process({
      'true ? 1 : 2': {
        json: {
          op: 'ternary',
          at: 0,
          length: 12,
          args: [{
            op: 'constant',
            at: 0,
            length: 4,
            args: [true]
          }, {
            op: 'constant',
            at: 7,
            length: 1,
            args: [1]
          }, {
            op: 'constant',
            at: 11,
            length: 1,
            args: [2]
          }]
        },
        expected: 1
      },
      'false ? "a" : "b"': {
        json: {
          op: 'ternary',
          at: 0,
          length: 17,
          args: [{
            op: 'constant',
            at: 0,
            length: 5,
            args: [false]
          }, {
            op: 'constant',
            at: 8,
            length: 3,
            args: ['a']
          }, {
            op: 'constant',
            at: 14,
            length: 3,
            args: ['b']
          }]
        },
        expected: 'b'
      }
    })
  })

  describe('array', () => {
    process({
      '[]': {
        json: {
          op: 'array',
          at: 0,
          length: 2,
          args: []
        },
        expected: []
      },
      '[1]': {
        json: {
          op: 'array',
          at: 0,
          length: 3,
          args: [{
            op: 'constant',
            at: 1,
            length: 1,
            args: [1]
          }]
        },
        expected: [1]
      },
      '[1,]': {
        json: {
          op: 'array',
          at: 0,
          length: 4,
          args: [{
            op: 'constant',
            at: 1,
            length: 1,
            args: [1]
          }]
        },
        expected: [1]
      },
      '[1, 2]': {
        json: {
          op: 'array',
          at: 0,
          length: 6,
          args: [{
            op: 'constant',
            at: 1,
            length: 1,
            args: [1]
          }, {
            op: 'constant',
            at: 4,
            length: 1,
            args: [2]
          }]
        },
        expected: [1, 2]
      },
      '[1, [2, 3]]': {
        json: {
          op: 'array',
          at: 0,
          length: 11,
          args: [{
            op: 'constant',
            at: 1,
            length: 1,
            args: [1]
          }, {
            op: 'array',
            at: 4,
            length: 6,
            args: [{
              op: 'constant',
              at: 5,
              length: 1,
              args: [2]
            }, {
              op: 'constant',
              at: 8,
              length: 1,
              args: [3]
            }]
          }]
        },
        expected: [1, [2, 3]]
      }
    })
  })

  describe('regex', () => {
    describe('when not allowed', () => {
      process({
        '/abc/': {
          expected: new punyexpr.Error('RegExpDisabledError', 'Regular expressions are disabled @0', 0)
        }
      })
    })

    describe('when allowed', () => {
      process({
        '/abc/': {
          expected: /abc/,
          json: {
            op: 'regex',
            at: 0,
            length: 5,
            args: [
              'abc',
              ''
            ]
          }
        },
        '"abc".match(/^abc$/)': {
          expected: ['abc'],
          json: {
            op: 'call',
            at: 0,
            length: 20,
            args: [{
              op: 'property',
              at: 0,
              length: 11,
              args: [{
                op: 'constant',
                at: 0,
                length: 5,
                args: [
                  'abc'
                ]
              }, {
                op: 'constant',
                at: 6,
                length: 5,
                args: [
                  'match'
                ]
              }]
            }, [{
              op: 'regex',
              at: 12,
              length: 7,
              args: [
                '^abc$',
                ''
              ]
            }]]
          }
        }
      }, {}, {
        regex: true
      })
    })

    describe('when custom', () => {
      const buildRegEx = (pattern, flags) => {
        const regex = new RegExp(pattern, flags)
        regex.__custom__ = true
        return regex
      }

      process({
        '/abc/': {
          expected: function (value) {
            expect(value instanceof RegExp).toStrictEqual(true)
            expect(value.__custom__).toStrictEqual(true)
          },
          json: {
            op: 'regex',
            at: 0,
            length: 5,
            args: [
              'abc',
              ''
            ]
          }
        },
        '"abc".match(/^abc$/)': {
          expected: ['abc'],
          json: {
            op: 'call',
            at: 0,
            length: 20,
            args: [{
              op: 'property',
              at: 0,
              length: 11,
              args: [{
                op: 'constant',
                at: 0,
                length: 5,
                args: [
                  'abc'
                ]
              }, {
                op: 'constant',
                at: 6,
                length: 5,
                args: [
                  'match'
                ]
              }]
            }, [{
              op: 'regex',
              at: 12,
              length: 7,
              args: [
                '^abc$',
                ''
              ]
            }]]
          }
        }
      }, {}, {
        regex: buildRegEx
      })
    })
  })

  describe('contextual', () => {
    process({
      hello: {
        json: {
          op: 'context',
          at: 0,
          length: 5,
          args: [{
            op: 'constant',
            at: 0,
            length: 5,
            args: ['hello']
          }]
        },
        expected: 'World !'
      },
      '[1, hello]': {
        json: {
          op: 'array',
          at: 0,
          length: 10,
          args: [{
            op: 'constant',
            at: 1,
            length: 1,
            args: [1]
          }, {
            op: 'context',
            at: 4,
            length: 5,
            args: [{
              op: 'constant',
              at: 4,
              length: 5,
              args: [
                'hello'
              ]
            }
            ]
          }]
        },
        expected: [1, 'World !']
      },
      'object.property1': {
        json: {
          op: 'property',
          at: 0,
          length: 16,
          args: [{
            op: 'context',
            at: 0,
            length: 6,
            args: [{
              op: 'constant',
              at: 0,
              length: 6,
              args: ['object']
            }]
          }, {
            op: 'constant',
            at: 7,
            length: 9,
            args: ['property1']
          }]
        },
        expected: 1
      },
      'object["property1"]': {
        json: {
          op: 'property',
          at: 0,
          length: 19,
          args: [{
            op: 'context',
            at: 0,
            length: 6,
            args: [{
              op: 'constant',
              at: 0,
              length: 6,
              args: ['object']
            }]
          }, {
            op: 'constant',
            at: 7,
            length: 11,
            args: ['property1']
          }]
        },
        expected: 1
      },
      'object.method()': {
        json: {
          op: 'call',
          at: 0,
          length: 15,
          args: [{
            op: 'property',
            at: 0,
            length: 13,
            args: [{
              op: 'context',
              at: 0,
              length: 6,
              args: [{
                op: 'constant',
                at: 0,
                length: 6,
                args: ['object']
              }]
            }, {
              op: 'constant',
              at: 7,
              length: 6,
              args: ['method']
            }]
          }, [
          ]]
        },
        expected: 'OK'
      },
      'object.method(1)': {
        json: {
          op: 'call',
          at: 0,
          length: 16,
          args: [{
            op: 'property',
            at: 0,
            length: 13,
            args: [{
              op: 'context',
              at: 0,
              length: 6,
              args: [{
                op: 'constant',
                at: 0,
                length: 6,
                args: ['object']
              }]
            }, {
              op: 'constant',
              at: 7,
              length: 6,
              args: ['method']
            }]
          }, [
            {
              op: 'constant',
              at: 14,
              length: 1,
              args: [1]
            }
          ]]
        },
        expected: 'OK1'
      },
      'object.method(1,2)': {
        json: {
          op: 'call',
          at: 0,
          length: 18,
          args: [{
            op: 'property',
            at: 0,
            length: 13,
            args: [{
              op: 'context',
              at: 0,
              length: 6,
              args: [{
                op: 'constant',
                at: 0,
                length: 6,
                args: ['object']
              }]
            }, {
              op: 'constant',
              at: 7,
              length: 6,
              args: ['method']
            }]
          }, [
            {
              op: 'constant',
              at: 14,
              length: 1,
              args: [1]
            },
            {
              op: 'constant',
              at: 16,
              length: 1,
              args: [2]
            }
          ]]
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

  describe('bugs', () => {
    describe('#1', () => {
      process({
        '1 + +"2" + "2"': {
          expected: '32',
          json: {
            op: 'add',
            at: 0,
            length: 14,
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
                op: 'pos',
                at: 4,
                length: 1,
                args: [{
                  op: 'constant',
                  at: 5,
                  length: 3,
                  args: ['2']
                }]
              }]
            }, {
              op: 'constant',
              at: 11,
              length: 3,
              args: ['2']
            }]
          }
        }
      })
    })
    describe('#2', () => {
      process({
        '!qUnitPages || !qUnitPages["abc"]': {
          expected: true,
          json: {
            op: 'or',
            at: 0,
            length: 16,
            args: [{
              op: 'not',
              at: 0,
              length: 1,
              args: [{
                op: 'context',
                at: 1,
                length: 10,
                args: [{
                  op: 'constant',
                  at: 1,
                  length: 10,
                  args: ['qUnitPages']
                }]
              }]
            }, {
              op: 'not',
              at: 15,
              length: 1,
              args: [{
                op: 'property',
                at: 16,
                length: 17,
                args: [{
                  op: 'context',
                  at: 16,
                  length: 10,
                  args: [{
                    op: 'constant',
                    at: 16,
                    length: 10,
                    args: ['qUnitPages']
                  }]
                }, {
                  op: 'constant',
                  at: 27,
                  length: 5,
                  args: ['abc']
                }]
              }]
            }]
          }
        }
      })
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
      '1 | "|"': error('UnexpectedRemainderError', 'Unexpected left over tokens @2', 2),
      '[': error('EndOfExpressionError', 'Unexpected end of expression'),
      '[,': error('UnexpectedTokenError', 'Unexpected token @1', 1)
    })
  })
})
