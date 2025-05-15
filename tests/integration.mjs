import assert from 'node:assert/strict'
import { punyexpr } from '../dist/punyexpr.js'

assert.strictEqual(typeof punyexpr, 'function', 'punyexpr is a function')
assert.strictEqual(typeof punyexpr.version, 'string', 'punyexpr.version exists')
