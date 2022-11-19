(function (exports) {
  'use strict'

  const TOKEN_REGEXP_SINGLEQUOTE_STRING = '\'((?:[^\'\\\\]|\\\\.)*)\''
  const TOKEN_REGEXP_DOUBLEQUOTE_STRING = '"((?:[^"\\\\]|\\\\.)*)"'
  const TOKEN_TYPE_STRING = 'string'

  const TOKEN_REGEXP_NUMBER = '((?:-|\\+)?(?:\\d+(?:\\.\\d*)?|\\.\\d+))'
  const TOKEN_TYPE_NUMBER = 'number'

  const TOKEN_REGEXP_UNKNOWN = '(.+)'
  const TOKEN_TYPE_UNKNOWN = 'unknown'

  const TOKEN_TYPES = [
    TOKEN_TYPE_STRING,
    TOKEN_TYPE_STRING,
    TOKEN_TYPE_NUMBER,

    TOKEN_TYPE_UNKNOWN
  ]

  const TOKENIZER_REGEXP = new RegExp([
    TOKEN_REGEXP_SINGLEQUOTE_STRING,
    TOKEN_REGEXP_DOUBLEQUOTE_STRING,
    TOKEN_REGEXP_NUMBER,

    TOKEN_REGEXP_UNKNOWN
  ].join('|'), 'g')

  const tokenize = (string) => {
    const tokens = []
    string.replace(TOKENIZER_REGEXP, (match, ...capturedValues) => {
      const index = capturedValues.findIndex(capturedValue => capturedValue !== undefined)
      let value = capturedValues[index]
      if (index === 0) {
        value = value.replace(/\\'/g, '\'')
      } else if (index === 1) {
        value = value.replace(/\\"/g, '"')
      } else if (index === 2) {
        value = parseFloat(value)
      }
      tokens.push([TOKEN_TYPES[index], value])
    })
    return tokens
  }

  const punyexpr = (expr) => {
  }

  punyexpr.tokenize = tokenize

  exports.punyexpr = punyexpr
}(this))
