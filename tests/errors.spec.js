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
})
