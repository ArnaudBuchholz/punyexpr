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

  const TOKEN_REGEXP_SYMBOL = /(\+|-|\*|\/|\[|\]|\.|\?|:)/
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

  class PunyExprError extends Error {
    constructor (name, message, offset) {
      super(message)
      this.name = name
      this.offset = offset
    }
  }
  PunyExprError.throw = (name, message, offset) => {
    throw new PunyExprError(name, message, offset)
  }

  // const TOKEN_TYPE = 0
  // const TOKEN_VALUE = 1
  const TOKEN_OFFSET = 2

  const tokenize = (string) => {
    const invalidTokenError = offset => PunyExprError.throw('InvalidTokenError', `Invalid token @${offset}`, offset)

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
        invalidTokenError(offset)
      }
      lastTokenType = TOKEN_TYPES[rawType]
      if (lastTokenType === TOKEN_TYPE_UNKNOWN) {
        invalidTokenError(offset)
      }
      tokens.push([lastTokenType, value, offset])
      offset += rawValue.length
    })
    return tokens.filter(([type]) => type !== TOKEN_TYPE_SEPARATOR)
  }

  const bind = (impl, ...args) => Object.assign(impl.bind(null, ...args), { op: impl.name, args })

  const impl = {
    constant (value) {
      return value
    },

    _reduce (op, args) {
      const context = args.pop()
      const first = args.shift()
      return args.reduce((sum, arg) => op(sum, arg, context), first(context))
    },

    add (...args) {
      return impl._reduce((total, arg, context) => total + arg(context), args)
    },

    sub (...args) {
      return impl._reduce((total, arg, context) => total - arg(context), args)
    },

    get (member, context) {
      return context[member(context)]
    },

    ternary (condition, trueValue, falseValue, context) {
      if (condition(context)) {
        return trueValue(context)
      }
      return falseValue(context)
    }
  }

  const parse = (tokens) => {
    const current = () => tokens[0]
    const offset = () => current()[TOKEN_OFFSET]
    const shift = (steps = 1) => {
      // if (tokens.length < steps) {
      //   throw new endOfExpressionError()
      // }
      const result = tokens.slice(0, steps)
      tokens = tokens.slice(steps)
      return result
    }
    const isSymbol = (expected = undefined) => {
      const [type, value] = current() || []
      return (type === TOKEN_TYPE_SYMBOL) && (!expected || expected.includes(value))
    }
    const checkNotEndOfExpression = () => {
      if (tokens.length === 0) {
        PunyExprError.throw('EndOfExpressionError', 'Unexpected end of expression')
      }
    }
    const unexpected = () => PunyExprError.throw('UnexpectedTokenError', `Unexpected token @${offset()}`, offset())

    const parser = {
      literal () {
        checkNotEndOfExpression()
        if (isSymbol()) {
          unexpected()
        }
        const [[type, value]] = shift()
        if (type === TOKEN_TYPE_IDENTIFIER) {
          return bind(impl.get, bind(impl.constant, value))
        }
        return bind(impl.constant, value)
      },

      additiveExpression () {
        let result = parser.literal()
        const token = current()
        if (!token) {
          return result
        }
        while (isSymbol('-+')) {
          const [[, symbol]] = shift()
          const next = parser.literal()
          if (symbol === '+') {
            result = bind(impl.add, result, next)
          } else {
            result = bind(impl.sub, result, next)
          }
        }
        return result
      },

      conditionalExpression () {
        const condition = parser.additiveExpression()
        const token = current()
        if (!token) {
          return condition
        }
        if (isSymbol('?')) {
          shift()
          const trueResult = parser.expression()
          checkNotEndOfExpression()
          if (!isSymbol(':')) {
            unexpected()
          }
          shift()
          const falseResult = parser.expression()
          return bind(impl.ternary, condition, trueResult, falseResult)
        }
        return condition
      },

      expression () {
        return parser.conditionalExpression()
      }
    }

    const result = parser.expression()
    if (tokens.length !== 0) {
      PunyExprError.throw('UnexpectedRemainderError', `Unexpected left over tokens @${offset()}`, offset())
    }
    return result
  }

  const punyexpr = str => {
    const impl = parse(tokenize(str))
    function expr (context = {}) {
      try {
        return impl(context)
      } catch (e) {
        return ''
      }
    }
    return Object.assign(expr, {
      impl,
      str
    })
  }

  Object.assign(punyexpr, {
    tokenize,
    Error: PunyExprError
  })

  exports.punyexpr = punyexpr
}(this))
