(function (exports) {
  'use strict'

  const TOKEN_TYPE_LITERAL = 'literal'
  const TOKEN_TYPE_IDENTIFIER = 'identifier'
  const TOKEN_TYPE_REGEX = 'regex'
  const TOKEN_TYPE_SYMBOL = 'symbol'
  const FUNCTION = 'function'

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

  const tokenize = (() => {
    // Removed false,null,undefined,true,typeof
    const JS_FORBIDDEN_KEYWORDS = 'abstract,arguments,await,boolean,break,byte,case,catch,char,class,const,continue,debugger,default,delete,do,double,else,enum,eval,export,extends,final,finally,float,for,function,goto,if,implements,import,in,instanceof,int,interface,let,long,native,new,package,private,protected,public,return,short,static,super,switch,synchronized,this,throw,throws,transient,try,var,void,volatile,while,with,yield'.split(',')

    const TOKEN_REGEXP_SINGLE_QUOTE_STRING = /'((?:[^'\\]|\\.)*)'/
    const TOKEN_REGEXP_DOUBLE_QUOTE_STRING = /"((?:[^"\\]|\\.)*)"/
    const TOKEN_REGEXP_NUMBER = /((?:\d+(?:\.\d*)?|\.\d+))/

    const TOKEN_REGEXP_IDENTIFIER = /([a-zA-Z_][a-zA-Z_0-9]*)/

    const TOKEN_REGEXP_REGEX = /(\/(?:[^/\\]|\\.)+\/[gmiysd]*)/

    const TOKEN_REGEXP_SYMBOL = /(\+|-|\*|\/|\[|\]|\.|\?|:|%|<|=|>|!|&|\||\(|\)|,)/

    const TOKEN_REGEXP_SEPARATOR = /(\s)/

    const TOKEN_REGEXP_UNKNOWN = /(.)/

    const TOKENIZER_REGEXP = new RegExp([
      TOKEN_REGEXP_SINGLE_QUOTE_STRING,
      TOKEN_REGEXP_DOUBLE_QUOTE_STRING,
      TOKEN_REGEXP_NUMBER,
      TOKEN_REGEXP_IDENTIFIER,
      TOKEN_REGEXP_REGEX,
      TOKEN_REGEXP_SYMBOL,

      TOKEN_REGEXP_SEPARATOR,
      TOKEN_REGEXP_UNKNOWN
    ].map(re => { const str = re.toString(); return str.substring(1, str.length - 1) }).join('|'), 'g')

    const invalidTokenError = offset => PunyExprError.throw('InvalidTokenError', `Invalid token @${offset}`, offset)

    const IDENTIFIER_TO_LITERAL = {
      false: false,
      null: null,
      true: true,
      undefined,
      Infinity,
      NaN
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
      value => {
        const endPos = value.lastIndexOf('/')
        const source = value.substring(1, endPos)
        const flags = value.substring(endPos + 1)
        return [TOKEN_TYPE_REGEX, [source, flags]]
      },
      value => [TOKEN_TYPE_SYMBOL, value],
      value => [],
      (value, offset) => invalidTokenError(offset)
    ]

    return (string) => {
      const tokens = []
      let offset = 0
      let lastTokenType
      const requireSeparator = [TOKEN_TYPE_LITERAL, TOKEN_TYPE_IDENTIFIER]
      string.replace(TOKENIZER_REGEXP, ({ length }, ...capturedValues) => {
        const rawType = capturedValues.findIndex(capturedValue => capturedValue !== undefined)
        const capturedValue = capturedValues[rawType]
        const converter = TOKENIZER_CONVERTER[rawType]
        const [type, value] = converter(capturedValue, offset)
        if (requireSeparator.includes(type) && requireSeparator.includes(lastTokenType)) {
          invalidTokenError(offset)
        }
        lastTokenType = type
        if (type !== undefined) {
          tokens.push([type, value, offset, length])
        }
        offset += length
      })
      return tokens
    }
  })()

  // Stryker disable next-line all
  const OP_DETAILS = Symbol('punyexpr')

  const parse = (() => {
  /*

  (Extremely) Simplified grammar (based on https://tc39.es/ecma262/#sec-expressions)

  ⛔ Not yet implemented
  ➡️ Shortcut

  PrimaryExpression :
    Identifier
    Literal
    [ ⟮Expression ⟮, Expression ⟯*⟯? ]
    ⛔ObjectLiteral
    RegularExpressionLiteral
    ( Expression )

  CallOrMemberExpression : 💬 Supports this call thanks to binding
    PrimaryExpression
    CallOrMemberExpression ( )
    CallOrMemberExpression ( Expression ⟮, Expression ⟯* )
    CallOrMemberExpression [ Expression ] 💬 If result is a function, it is bound to the left part
    CallOrMemberExpression . Identifier 💬 If result is a function, it is bound to the left part

  UnaryExpression :
    CallExpression
    typeof UnaryExpression
    + UnaryExpression
    - UnaryExpression
    ⛔~ UnaryExpression
    ! UnaryExpression

  ExponentiationExpression :
    UnaryExpression ** ExponentiationExpression

  MultiplicativeExpression :
    MultiplicativeExpression * ExponentiationExpression
    MultiplicativeExpression / ExponentiationExpression
    MultiplicativeExpression % ExponentiationExpression

  AdditiveExpression :
    AdditiveExpression + MultiplicativeExpression
    AdditiveExpression - MultiplicativeExpression

  ⛔ShiftExpression : ➡️ AdditiveExpression
    ⛔ShiftExpression << AdditiveExpression
    ⛔ShiftExpression >> AdditiveExpression
    ⛔ShiftExpression >>> AdditiveExpression

  RelationalExpression :
    RelationalExpression < ShiftExpression
    RelationalExpression > ShiftExpression
    RelationalExpression <= ShiftExpression
    RelationalExpression >= ShiftExpression
    ⛔RelationalExpression instanceof ShiftExpression
    ⛔RelationalExpression in ShiftExpression
    ⛔PrivateIdentifier in ShiftExpression

  EqualityExpression :
    EqualityExpression == RelationalExpression
    EqualityExpression != RelationalExpression
    EqualityExpression === RelationalExpression
    EqualityExpression !== RelationalExpression

  ⛔BitwiseANDExpression :
    ⛔BitwiseANDExpression & EqualityExpression

  ⛔BitwiseXORExpression :
    ⛔BitwiseXORExpression ^ BitwiseANDExpression

  ⛔BitwiseORExpression : ➡️ EqualityExpression
    ⛔BitwiseORExpression | BitwiseXORExpression

  LogicalANDExpression :
    LogicalANDExpression && BitwiseORExpression

  LogicalORExpression :
    LogicalORExpression || LogicalANDExpression

  ⛔CoalesceExpression :
    ⛔CoalesceExpressionHead ?? BitwiseORExpression

  ShortCircuitExpression : ➡️ LogicalORExpression
    LogicalORExpression
    ⛔CoalesceExpression

  ConditionalExpression :
    ShortCircuitExpression
    ShortCircuitExpression ? AssignmentExpression : AssignmentExpression

  Expression :
    ConditionalExpression
*/
    const buildOp = (name, impl) => (range, ...args) => Object.assign(impl.bind(null, ...args), { [OP_DETAILS]: [name, args, range] })

    const constant = buildOp('constant', value => value)
    const array = buildOp('array', (...itemsAndContext) => {
      const context = itemsAndContext[itemsAndContext.length - 1]
      return itemsAndContext.slice(0, -1).map(item => item(context))
    })
    const regex = buildOp('regex', (pattern, flags, builder) => builder(pattern, flags))
    const regexDefaultBuilder = (pattern, flags) => new RegExp(pattern, flags)
    const propertyOfContext = buildOp('context', (name, context) => context[name(context)])
    const propertyOf = buildOp('property', (object, name, context) => {
      const that = object(context)
      const result = that[name(context)]
      // eslint-disable-next-line valid-typeof
      if (typeof result === FUNCTION) {
        return result.bind(that)
      }
      return result
    })
    const callFunction = buildOp('call', (func, args, context) => func(context).apply(null, args.map(arg => arg(context))))
    const pos = buildOp('pos', (value, context) => +value(context))
    const neg = buildOp('neg', (value, context) => -value(context))
    const not = buildOp('not', (value, context) => !value(context))
    const getTypeof = buildOp('getTypeof', (value, context) => typeof value(context))
    const exp = buildOp('exp', (value1, value2, context) => value1(context) ** value2(context))
    const mul = buildOp('mul', (value1, value2, context) => value1(context) * value2(context))
    const div = buildOp('div', (value1, value2, context) => value1(context) / value2(context))
    const remainder = buildOp('remainder', (value1, value2, context) => value1(context) % value2(context))
    const add = buildOp('add', (value1, value2, context) => value1(context) + value2(context))
    const sub = buildOp('sub', (value1, value2, context) => value1(context) - value2(context))
    const lt = buildOp('lt', (value1, value2, context) => value1(context) < value2(context))
    const gt = buildOp('gt', (value1, value2, context) => value1(context) > value2(context))
    const lte = buildOp('lte', (value1, value2, context) => value1(context) <= value2(context))
    const gte = buildOp('gte', (value1, value2, context) => value1(context) >= value2(context))
    // eslint-disable-next-line eqeqeq
    const eq = buildOp('eq', (value1, value2, context) => value1(context) == value2(context))
    // eslint-disable-next-line eqeqeq
    const neq = buildOp('neq', (value1, value2, context) => value1(context) != value2(context))
    const eqq = buildOp('eqq', (value1, value2, context) => value1(context) === value2(context))
    const neqq = buildOp('neqq', (value1, value2, context) => value1(context) !== value2(context))
    const and = buildOp('and', (value1, value2, context) => value1(context) && value2(context))
    const or = buildOp('or', (value1, value2, context) => value1(context) || value2(context))
    const ternary = buildOp('ternary', (condition, trueValue, falseValue, context) => {
      if (condition(context)) {
        return trueValue(context)
      }
      return falseValue(context)
    })

    let tokens
    let options

    const checkNotEndOfExpression = () => {
      if (tokens.length === 0) {
        PunyExprError.throw('EndOfExpressionError', 'Unexpected end of expression')
      }
    }
    const current = () => {
      checkNotEndOfExpression()
      return tokens[0]
    }
    const offset = () => current()[2]
    const range = (from, op) => {
      let currentRange
      if (op) {
        currentRange = op[OP_DETAILS][2]
      } else {
        currentRange = current().splice(2)
      }
      const [offset, length] = currentRange
      return [from, offset + length - from]
    }
    const shift = (steps = 1) => tokens.splice(0, steps)
    const isSymbol = (expected = undefined) => {
      if (tokens.length === 0) {
        return false
      }
      const [type, value] = tokens[0]
      return (type === TOKEN_TYPE_SYMBOL) && (!expected || expected.includes(value))
    }
    const shiftOnSymbols = (expected) => {
      const nextSymbols = []
      for (const token of tokens) {
        const [type, value] = token
        if (type !== TOKEN_TYPE_SYMBOL) {
          break
        }
        nextSymbols.push(value)
      }
      const nextSymbolsAggregated = nextSymbols.join('')
      const matching = expected
        .filter(symbol => nextSymbolsAggregated.startsWith(symbol))
        .sort((a, b) => b.length - a.length)[0]
      if (matching) {
        shift(matching.length)
        return matching
      }
      return false
    }
    const unexpected = () => PunyExprError.throw('UnexpectedTokenError', `Unexpected token @${offset(tokens)}`, offset(tokens))

    const arrayLiteral = () => {
      const from = offset()
      shift()
      const items = []
      while (!isSymbol(']')) {
        const item = expression()
        items.push(item)
        if (isSymbol(',')) { // accepts trailing comma
          shift()
        }
      }
      const arrayRange = range(from)
      shift()
      return array(arrayRange, ...items)
    }

    const primaryExpression = () => {
      checkNotEndOfExpression()
      if (isSymbol('(')) {
        shift()
        const result = expression()
        if (!isSymbol(')')) {
          unexpected()
        }
        shift()
        return result
      }
      if (isSymbol('[')) {
        return arrayLiteral()
      }
      if (isSymbol()) {
        unexpected()
      }
      const [[type, value, ...valueRange]] = shift()
      if (type === TOKEN_TYPE_IDENTIFIER) {
        return propertyOfContext(valueRange, constant(valueRange, value))
      }
      if (type === TOKEN_TYPE_REGEX) {
        if (!options.regex) {
          const [from] = valueRange
          PunyExprError.throw('RegExpDisabledError', `Regular expressions are disabled @${from}`, from)
        }
        const [pattern, flags] = value
        let builder = options.regex
        // eslint-disable-next-line valid-typeof
        if (typeof builder !== FUNCTION) {
          builder = regexDefaultBuilder
        }
        return regex(valueRange, pattern, flags, builder)
      }
      return constant(valueRange, value)
    }

    const CallOrMemberExpression = () => {
      const from = offset()
      let result = primaryExpression()
      const operators = {
        '(': () => {
          const args = []
          while (!isSymbol(')')) {
            if (args.length > 0) {
              if (!isSymbol(',')) {
                unexpected()
              }
              shift()
            }
            args.push(expression())
          }
          const callRange = range(from)
          shift()
          result = callFunction(callRange, result, args)
        },
        '[': () => {
          const name = expression()
          if (!isSymbol(']')) {
            unexpected()
          }
          const propertyRange = range(from)
          shift()
          result = propertyOf(propertyRange, result, name)
        },
        '.': () => {
          const [type, value, ...valueRange] = current()
          if (type !== TOKEN_TYPE_IDENTIFIER) {
            unexpected()
          }
          const propertyRange = range(from)
          shift()
          result = propertyOf(propertyRange, result, constant(valueRange, value))
        }
      }
      while (isSymbol('([.')) {
        const [[, symbol]] = shift()
        operators[symbol]()
      }
      return result
    }

    const unaryMapper = {
      '+': pos,
      '-': neg,
      '!': not,
      typeof: getTypeof
    }

    const unaryExpression = () => {
      const [type, value, from] = current()
      const postProcess = isSymbol('+-!') || ((type === TOKEN_TYPE_IDENTIFIER) && value === 'typeof')
      if (!postProcess) {
        return CallOrMemberExpression()
      }
      const unaryRange = range(from)
      shift()
      const func = unaryMapper[value]
      return func(unaryRange, unaryExpression())
    }

    const _recursiveExpression = (subExpression, operators) => {
      const expectedSymbols = Object.keys(operators)
      return () => {
        const from = offset()
        let result = subExpression()
        let symbol = shiftOnSymbols(expectedSymbols)
        while (symbol) {
          const sub = subExpression()
          const recursiveRange = range(from, sub)
          result = operators[symbol](recursiveRange, result, sub)
          symbol = shiftOnSymbols(expectedSymbols)
        }
        return result
      }
    }

    const exponentiationExpression = _recursiveExpression(unaryExpression, {
      '**': exp
    })

    const multiplicativeExpression = _recursiveExpression(exponentiationExpression, {
      '*': mul,
      '/': div,
      '%': remainder
    })

    const additiveExpression = _recursiveExpression(multiplicativeExpression, {
      '+': add,
      '-': sub
    })

    const relationalExpression = _recursiveExpression(additiveExpression, {
      '<': lt,
      '>': gt,
      '<=': lte,
      '>=': gte
    })

    const equalityExpression = _recursiveExpression(relationalExpression, {
      '==': eq,
      '!=': neq,
      '===': eqq,
      '!==': neqq
    })

    const logicalANDExpression = _recursiveExpression(equalityExpression, {
      '&&': and
    })

    const logicalORExpression = _recursiveExpression(logicalANDExpression, {
      '||': or
    })

    const conditionalExpression = () => {
      const from = offset()
      const condition = logicalORExpression()
      if (shiftOnSymbols(['?'])) {
        const trueResult = conditionalExpression()
        checkNotEndOfExpression()
        if (!isSymbol(':')) {
          unexpected()
        }
        shift()
        const falseResult = conditionalExpression()
        const conditionRange = range(from, falseResult)
        return ternary(conditionRange, condition, trueResult, falseResult)
      }
      return condition
    }

    const expression = conditionalExpression

    return (...args) => {
      [tokens, options] = args
      const result = expression()
      if (tokens.length !== 0) {
        PunyExprError.throw('UnexpectedRemainderError', `Unexpected left over tokens @${offset()}`, offset())
      }
      return result
    }
  })()

  const ro = value => ({
    value,
    writable: false
  })

  const assignROProperties = (object, properties) => {
    Object.defineProperties(
      object,
      Object.keys(properties).reduce((dict, property) => {
        dict[property] = ro(properties[property])
        return dict
      }, {})
    )
  }

  const toJSON = expr => {
    const [op, args, [at, length]] = expr[OP_DETAILS]
    const filtered = {}
    return {
      op,
      at,
      length,
      args: args
        .map(arg => {
          // eslint-disable-next-line valid-typeof
          if (typeof arg === FUNCTION) {
            if (arg[OP_DETAILS]) {
              return toJSON(arg)
            }
            return filtered
          }
          if (Array.isArray(arg)) {
            return arg.map(toJSON)
          }
          return arg
        })
        .filter(arg => arg !== filtered)
    }
  }

  const punyexpr = (str, options = {}) => {
    const impl = parse(tokenize(str), {
      regex: false,
      ...options
    })
    const expr = (context = {}) => impl(context)
    assignROProperties(expr, {
      toJSON: toJSON.bind(null, impl),
      toString: () => str
    })
    return expr
  }

  assignROProperties(punyexpr, {
    tokenize,
    Error: PunyExprError,
    version: '0.0.0'
  })

  exports.punyexpr = punyexpr
}(this))
