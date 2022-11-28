'use strict'

const { punyexpr } = require('../dist/punyexpr.js')
global.punyexpr = punyexpr

const { version } = require('../package.json')
global.expectedVersion = version
