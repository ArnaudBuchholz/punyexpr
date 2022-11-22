(function (exports) {
  'use strict'

  const TOKEN_REGEXP_SINGLE_QUOTE_STRING = /'((?:[^'\\]|\\.)*)'/
  const TOKEN_REGEXP_DOUBLE_QUOTE_STRING = /"((?:[^"\\]|\\.)*)"/
  const TOKEN_TYPE_STRING = 'string'

  const TOKEN_REGEXP_NUMBER = /((?:\d+(?:\.\d*)?|\.\d+))/
  const TOKEN_TYPE_NUMBER = 'number'

  const TOKEN_REGEXP_BOOLEAN = /(true|false)/
  const TOKEN_TYPE_BOOLEAN = 'boolean'

  const TOKEN_REGEXP_IDENTIFIER = /([a-zA-Z_][a-zA-Z_0-9]*)/
  const TOKEN_TYPE_IDENTIFIER = 'identifier'

  const TOKEN_REGEXP_SYMBOL = /(\+|-|\*|\/|\[|\]|\.)/
  const TOKEN_TYPE_SYMBOL = 'symbol'

  const TOKEN_REGEXP_SEPARATOR = /(\s)/
  const TOKEN_TYPE_SEPARATOR = {}

  const TOKEN_REGEXP_UNKNOWN = /(.)/
  const TOKEN_TYPE_UNKNOWN = {}

  const TOKEN_TYPES = [
    TOKEN_TYPE_STRING,
    TOKEN_TYPE_STRING,
    TOKEN_TYPE_NUMBER,
    TOKEN_TYPE_BOOLEAN,
    TOKEN_TYPE_IDENTIFIER,
    TOKEN_TYPE_SYMBOL,

    TOKEN_TYPE_SEPARATOR,
    TOKEN_TYPE_UNKNOWN
  ]

  const TOKENIZER_REGEXP = new RegExp([
    TOKEN_REGEXP_SINGLE_QUOTE_STRING,
    TOKEN_REGEXP_DOUBLE_QUOTE_STRING,
    TOKEN_REGEXP_NUMBER,
    TOKEN_REGEXP_BOOLEAN,
    TOKEN_REGEXP_IDENTIFIER,
    TOKEN_REGEXP_SYMBOL,

    TOKEN_REGEXP_SEPARATOR,
    TOKEN_REGEXP_UNKNOWN
  ].map(re => { const str = re.toString(); return str.substring(1, str.length - 1) }).join('|'), 'g')

  const TOKENIZER_CONVERTER = [
    value => value.replace(/\\'/g, '\''), // TOKEN_REGEXP_SINGLE_QUOTE_STRING
    value => value.replace(/\\"/g, '"'), // TOKEN_REGEXP_DOUBLE_QUOTE_STRING
    value => parseFloat(value), // TOKEN_REGEXP_NUMBER
    value => value === 'true' // TOKEN_REGEXP_BOOLEAN
  ]

  class InvalidTokenError extends Error {
    constructor (offset) {
      super(`Invalid token @${offset}`)
      this.offset = offset
    }
  }

  const tokenize = (string) => {
    const tokens = []
    let offset = 0
    let lastTokenType = TOKEN_TYPE_SEPARATOR
    const separatorLess = [TOKEN_TYPE_SEPARATOR, TOKEN_TYPE_SYMBOL]
    string.replace(TOKENIZER_REGEXP, (match, ...capturedValues) => {
      const rawType = capturedValues.findIndex(capturedValue => capturedValue !== undefined)
      const rawValue = capturedValues[rawType]
      let value
      const converter = TOKENIZER_CONVERTER[rawType]
      if (converter) {
        value = converter(rawValue)
      } else {
        value = rawValue
      }
      const type = TOKEN_TYPES[rawType]
      if (!separatorLess.includes(type) && !separatorLess.includes(lastTokenType)) {
        throw new InvalidTokenError(offset)
      }
      lastTokenType = TOKEN_TYPES[rawType]
      if (lastTokenType === TOKEN_TYPE_UNKNOWN) {
        throw new InvalidTokenError(offset)
      }
      tokens.push([lastTokenType, value, offset])
      offset += rawValue.length
    })
    return tokens.filter(([type]) => type !== TOKEN_TYPE_SEPARATOR)
  }

  const punyexpr = {} /* (expr) => {
  } */

  punyexpr.tokenize = tokenize
  punyexpr.InvalidTokenError = InvalidTokenError

  exports.punyexpr = punyexpr
}(this))
