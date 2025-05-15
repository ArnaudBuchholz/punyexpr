'use strict'

global.punyexpr = require('../dist/punyexpr.js').punyexpr

const { version } = require('../package.json')
global.expectedVersion = version

require('./setup')
