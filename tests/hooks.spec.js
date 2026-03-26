'use strict'

const { punyexpr } = require('../punyexpr')

describe('hooks', () => {
  it('propertyOf', () => {
    const expr = punyexpr('a.b === undefined && c.d === 1 && c.hello === "World !"')
    expect(expr({
      c: { d: 1 },
      [punyexpr.propertyOf]: (object, property) => {
        // Can handle situations where object is undefined
        if (object === undefined) {
          return undefined
        }
        // Can subsitute values
        if (property === 'hello') {
          return 'World !'
        }
        return object[property]
      }
    })).toStrictEqual(true)
  })
})
