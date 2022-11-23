'use strict'

describe('errors', () => {
  describe('InvalidTokenError', () => {
    it('exposes offset', () => {
      const error = new punyexpr.InvalidTokenError(12)
      expect(error.offset).toBe(12)
    })

    it('exposes message', () => {
      const error = new punyexpr.InvalidTokenError(12)
      expect(error.message).toBe('Invalid token @12')
    })
  })

  describe('UnexpectedTokenError', () => {
    it('exposes offset', () => {
      const error = new punyexpr.UnexpectedTokenError(12)
      expect(error.offset).toBe(12)
    })

    it('exposes message', () => {
      const error = new punyexpr.UnexpectedTokenError(12)
      expect(error.message).toBe('Unexpected token @12')
    })
  })

  describe('EndOfExpressionError', () => {
    it('exposes message', () => {
      const error = new punyexpr.UnexpectedTokenError(12)
      expect(error.message).toBe('Unexpected end of expression')
    })
  })
})
