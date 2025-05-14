'use strict'

require('../dist/punyexpr.js')

const { version } = require('../package.json')
global.expectedVersion = version

require('./setup')
