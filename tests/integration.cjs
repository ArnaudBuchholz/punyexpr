const assert = require('node:assert/strict')
const { punyexpr } = require('../dist/punyexpr.js')

assert.strictEqual(typeof punyexpr, 'function', 'punyexpr is a function')
assert.strictEqual(typeof punyexpr.version, 'string', 'punyexpr.version exists')
