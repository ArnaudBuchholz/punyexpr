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
      value => {
        const endPos = value.lastIndexOf('/')
        const source = value.substring(1, endPos)
        const options = value.substring(endPos + 1)
        return [TOKEN_TYPE_REGEX, [source, options]]
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
    const buildOp = (name, impl) => (range, ...args) => Object.assign(impl.bind(null, ...args), { $: [name, args, range] })

    const constant = buildOp('constant', value => value)
    const array = buildOp('array', (...itemsAndContext) => {
      const context = itemsAndContext[itemsAndContext.length - 1]
      return itemsAndContext.slice(0, -1).map(item => item(context))
    })
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

    const checkNotEndOfExpression = (tokens) => {
      if (tokens.length === 0) {
        PunyExprError.throw('EndOfExpressionError', 'Unexpected end of expression')
      }
    }
    const current = (tokens) => {
      checkNotEndOfExpression(tokens)
      return tokens[0]
    }
    const offset = (tokens) => current(tokens)[2]
    const range = (tokensOrOp, from) => {
      let currentRange
      if (Array.isArray(tokensOrOp)) {
        currentRange = current(tokensOrOp).splice(2)
      } else {
        currentRange = tokensOrOp.$[2]
      }
      const [offset, length] = currentRange
      return [from, offset + length - from]
    }
    const shift = (tokens, steps = 1) => tokens.splice(0, steps)
    const isSymbol = (tokens, expected = undefined) => {
      if (tokens.length === 0) {
        return false
      }
      const [type, value] = tokens[0]
      return (type === TOKEN_TYPE_SYMBOL) && (!expected || expected.includes(value))
    }
    const shiftOnSymbols = (tokens, expected) => {
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
        shift(tokens, matching.length)
        return matching
      }
      return false
    }
    const unexpected = (tokens) => PunyExprError.throw('UnexpectedTokenError', `Unexpected token @${offset(tokens)}`, offset(tokens))

    const arrayLiteral = (tokens) => {
      const from = offset(tokens)
      shift(tokens)
      const items = []
      while (!isSymbol(tokens, ']')) {
        const item = expression(tokens)
        items.push(item)
        if (isSymbol(tokens, ',')) { // accepts trailing comma
          shift(tokens)
        }
      }
      const arrayRange = range(tokens, from)
      shift(tokens)
      return array(arrayRange, ...items)
    }

    const primaryExpression = (tokens) => {
      checkNotEndOfExpression(tokens)
      if (isSymbol(tokens, '(')) {
        shift(tokens)
        const result = expression(tokens)
        if (!isSymbol(tokens, ')')) {
          unexpected(tokens)
        }
        shift(tokens)
        return result
      }
      if (isSymbol(tokens, '[')) {
        return arrayLiteral(tokens)
      }
      if (isSymbol(tokens)) {
        unexpected(tokens)
      }
      const [[type, value, ...valueRange]] = shift(tokens)
      if (type === TOKEN_TYPE_IDENTIFIER) {
        return propertyOfContext(valueRange, constant(valueRange, value))
      }
      return constant(valueRange, value)
    }

    const CallOrMemberExpression = (tokens) => {
      const from = offset(tokens)
      let result = primaryExpression(tokens)
      const operators = {
        '(': () => {
          const args = []
          while (!isSymbol(tokens, ')')) {
            if (args.length > 0) {
              if (!isSymbol(tokens, ',')) {
                unexpected(tokens)
              }
              shift(tokens)
            }
            args.push(expression(tokens))
          }
          const callRange = range(tokens, from)
          shift(tokens)
          result = callFunction(callRange, result, args)
        },
        '[': () => {
          const name = expression(tokens)
          if (!isSymbol(tokens, ']')) {
            unexpected(tokens)
          }
          const propertyRange = range(tokens, from)
          shift(tokens)
          result = propertyOf(propertyRange, result, name)
        },
        '.': () => {
          const [type, value, ...valueRange] = current(tokens)
          if (type !== TOKEN_TYPE_IDENTIFIER) {
            unexpected(tokens)
          }
          const propertyRange = range(tokens, from)
          shift(tokens)
          result = propertyOf(propertyRange, result, constant(valueRange, value))
        }
      }
      while (isSymbol(tokens, '([.')) {
        const [[, symbol]] = shift(tokens)
        operators[symbol](result)
      }
      return result
    }

    const unaryExpression = (tokens) => {
      const [type, value, from] = current(tokens)
      const postProcess = isSymbol(tokens, '+-!') || ((type === TOKEN_TYPE_IDENTIFIER) && value === 'typeof')
      if (!postProcess) {
        return CallOrMemberExpression(tokens)
      }
      const unaryRange = range(tokens, from)
      shift(tokens)
      let result = expression(tokens)
      // + is absorbed
      if (value === '-') {
        result = neg(unaryRange, result)
      } else if (value === '!') {
        result = not(unaryRange, result)
      } else if (value === 'typeof') {
        result = getTypeof(unaryRange, result)
      }
      return result
    }

    const _recursiveExpression = (subExpression, operators) => {
      const expectedSymbols = Object.keys(operators)
      return (tokens) => {
        const from = offset(tokens)
        let result = subExpression(tokens)
        let symbol = shiftOnSymbols(tokens, expectedSymbols)
        while (symbol) {
          const sub = subExpression(tokens)
          const recursiveRange = range(sub, from)
          result = operators[symbol](recursiveRange, result, sub)
          symbol = shiftOnSymbols(tokens, expectedSymbols)
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

    const conditionalExpression = (tokens) => {
      const from = offset(tokens)
      const condition = logicalORExpression(tokens)
      if (shiftOnSymbols(tokens, ['?'])) {
        const trueResult = conditionalExpression(tokens)
        checkNotEndOfExpression(tokens)
        if (!isSymbol(tokens, ':')) {
          unexpected(tokens)
        }
        shift(tokens)
        const falseResult = conditionalExpression(tokens)
        const conditionRange = range(falseResult, from)
        return ternary(conditionRange, condition, trueResult, falseResult)
      }
      return condition
    }

    const expression = conditionalExpression

    return (tokens) => {
      const result = expression(tokens)
      if (tokens.length !== 0) {
        PunyExprError.throw('UnexpectedRemainderError', `Unexpected left over tokens @${offset(tokens)}`, offset(tokens))
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
    const [op, args, [at, length]] = expr.$
    return {
      op,
      at,
      length,
      args: args.map(arg => {
        // eslint-disable-next-line valid-typeof
        if (typeof arg === FUNCTION) {
          return toJSON(arg)
        }
        if (Array.isArray(arg)) {
          return arg.map(toJSON)
        }
        return arg
      })
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
