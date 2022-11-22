'use strict'

const { punyexpr } = require('../punyexpr.js')
global.punyexpr = punyexpr

beforeAll(() => {
  expect(typeof punyexpr).not.toBe('undefined')
})
