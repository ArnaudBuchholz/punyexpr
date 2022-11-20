(function (exports) {
  'use strict'

  const TOKEN_REGEXP_SINGLE_QUOTE_STRING = '\'((?:[^\'\\\\]|\\\\.)*)\''
  const TOKEN_REGEXP_DOUBLE_QUOTE_STRING = '"((?:[^"\\\\]|\\\\.)*)"'
  const TOKEN_TYPE_STRING = 'string'

  const TOKEN_REGEXP_NUMBER = '((?:-|\\+)?(?:\\d+(?:\\.\\d*)?|\\.\\d+))'
  const TOKEN_TYPE_NUMBER = 'number'

  const TOKEN_REGEXP_BOOLEAN = '(true|false)'
  const TOKEN_TYPE_BOOLEAN = 'boolean'

  const TOKEN_REGEXP_UNKNOWN = '(.+)'
  const TOKEN_TYPE_UNKNOWN = 'unknown'

  const TOKEN_TYPES = [
    TOKEN_TYPE_STRING,
    TOKEN_TYPE_STRING,
    TOKEN_TYPE_NUMBER,
    TOKEN_TYPE_BOOLEAN,

    TOKEN_TYPE_UNKNOWN
  ]

  const TOKENIZER_REGEXP = new RegExp([
    TOKEN_REGEXP_SINGLE_QUOTE_STRING,
    TOKEN_REGEXP_DOUBLE_QUOTE_STRING,
    TOKEN_REGEXP_NUMBER,
    TOKEN_REGEXP_BOOLEAN,

    TOKEN_REGEXP_UNKNOWN
  ].join('|'), 'g')

  const TOKENIZER_CONVERTER = [
    value => value.replace(/\\'/g, '\''), // TOKEN_REGEXP_SINGLE_QUOTE_STRING
    value => value.replace(/\\"/g, '"'), // TOKEN_REGEXP_DOUBLE_QUOTE_STRING
    value => parseFloat(value), // TOKEN_REGEXP_NUMBER
    value => value === 'true' // TOKEN_REGEXP_BOOLEAN
  ]

  const tokenize = (string) => {
    const tokens = []
    string.replace(TOKENIZER_REGEXP, (match, ...capturedValues) => {
      const index = capturedValues.findIndex(capturedValue => capturedValue !== undefined)
      let value = capturedValues[index]
      const converter = TOKENIZER_CONVERTER[index]
      if (converter) {
        value = converter(value)
      }
      tokens.push([TOKEN_TYPES[index], value])
    })
    return tokens
  }

  const punyexpr = {} /* (expr) => {
  } */

  punyexpr.tokenize = tokenize

  exports.punyexpr = punyexpr
}(this))
