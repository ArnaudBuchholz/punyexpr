(function (exports) {
  'use strict'

  const TOKEN_TYPE_LITERAL = 'literal'
  const TOKEN_TYPE_IDENTIFIER = 'identifier'
  const TOKEN_TYPE_SYMBOL = 'symbol'

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

  const tokenize = (string) => {
    // Removed false,null,undefined,true,typeof
    const JS_FORBIDDEN_KEYWORDS = 'abstract,arguments,await,boolean,break,byte,case,catch,char,class,const,continue,debugger,default,delete,do,double,else,enum,eval,export,extends,final,finally,float,for,function,goto,if,implements,import,in,instanceof,int,interface,let,long,native,new,package,private,protected,public,return,short,static,super,switch,synchronized,this,throw,throws,transient,try,var,void,volatile,while,with,yield'.split(',')

    const TOKEN_REGEXP_SINGLE_QUOTE_STRING = /'((?:[^'\\]|\\.)*)'/
    const TOKEN_REGEXP_DOUBLE_QUOTE_STRING = /"((?:[^"\\]|\\.)*)"/
    const TOKEN_REGEXP_NUMBER = /((?:\d+(?:\.\d*)?|\.\d+))/

    const TOKEN_REGEXP_IDENTIFIER = /([a-zA-Z_][a-zA-Z_0-9]*)/

    const TOKEN_REGEXP_SYMBOL = /(\+|-|\*|\/|\[|\]|\.|\?|:)/

    const TOKEN_REGEXP_SEPARATOR = /(\s)/

    const TOKEN_REGEXP_UNKNOWN = /(.)/

    const TOKENIZER_REGEXP = new RegExp([
      TOKEN_REGEXP_SINGLE_QUOTE_STRING,
      TOKEN_REGEXP_DOUBLE_QUOTE_STRING,
      TOKEN_REGEXP_NUMBER,
      TOKEN_REGEXP_IDENTIFIER,
      TOKEN_REGEXP_SYMBOL,

      TOKEN_REGEXP_SEPARATOR,
      TOKEN_REGEXP_UNKNOWN
    ].map(re => { const str = re.toString(); return str.substring(1, str.length - 1) }).join('|'), 'g')

    const invalidTokenError = offset => PunyExprError.throw('InvalidTokenError', `Invalid token @${offset}`, offset)

    const IDENTIFIER_TO_LITERAL = {
      true: true,
      false: false,
      undefined,
      null: null
    }

    const TOKENIZER_CONVERTER = [
      value => [TOKEN_TYPE_LITERAL, value.replace(/\\'/g, '\'')],
      value => [TOKEN_TYPE_LITERAL, value.replace(/\\"/g, '"')],
      value => [TOKEN_TYPE_LITERAL, parseFloat(value)],
      (value, offset) => {
        if (Object.prototype.hasOwnProperty.call(IDENTIFIER_TO_LITERAL, value)) {
          return [TOKEN_TYPE_LITERAL, IDENTIFIER_TO_LITERAL[value]]
        }
        if (JS_FORBIDDEN_KEYWORDS.includes(value)) {
          invalidTokenError(offset)
        }
        return [TOKEN_TYPE_IDENTIFIER, value]
      },
      value => [TOKEN_TYPE_SYMBOL, value],
      value => [],
      (value, offset) => invalidTokenError(offset)
    ]

    const tokens = []
    let offset = 0
    let lastTokenType
    const requireSeparator = [TOKEN_TYPE_LITERAL, TOKEN_TYPE_IDENTIFIER]
    string.replace(TOKENIZER_REGEXP, (match, ...capturedValues) => {
      const rawType = capturedValues.findIndex(capturedValue => capturedValue !== undefined)
      const capturedValue = capturedValues[rawType]
      const converter = TOKENIZER_CONVERTER[rawType]
      const [type, value] = converter(capturedValue, offset)
      if (requireSeparator.includes(type) && requireSeparator.includes(lastTokenType)) {
        invalidTokenError(offset)
      }
      lastTokenType = type
      if (type !== undefined) {
        tokens.push([type, value, offset])
      }
      offset += capturedValue.length
    })
    return tokens
  }

  const parse = (tokens) => {
    const bind = (impl, ...args) => Object.assign(impl.bind(null, ...args), { op: impl.name, args })

    const impl = {
      constant (value) {
        return value
      },

      add (value1, value2, context) {
        return value1(context) + value2(context)
      },

      sub (value1, value2, context) {
        return value1(context) - value2(context)
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

    const current = () => tokens[0]
    const offset = () => current()[2]
    const shift = (steps = 1) => {
      const beforeSlicing = tokens
      tokens = tokens.slice(steps)
      return beforeSlicing
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
