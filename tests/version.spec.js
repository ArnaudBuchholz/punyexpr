'use strict'

describe('version', () => {
  it('exposes the version information', () => {
    expect(punyexpr.version).toBe(global.expectedVersion)
  })

  it('is readonly', () => {
    expect(() => { punyexpr.version = 'test' }).toThrow(TypeError)
  })
})
