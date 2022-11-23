'use strict'

describe('expression', () => {
  it('builds a function', () => {
    const expr = punyexpr('1 + 1')
    expect(typeof expr).toBe('function')
  })

  it('evaluates the expression', () => {
    const expr = punyexpr('1 + 1')
    expect(expr()).toBe(2)
  })

  describe('contextual', () => {
    it('evaluates the expression', () => {
      const expr = punyexpr('test')
      expect(expr({
        test: 'Hello World !'
      })).toBe('Hello World !')
    })
  })
})
