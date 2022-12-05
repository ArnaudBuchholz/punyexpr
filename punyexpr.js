(function (exports) {
  'use strict'

  const TOKEN_TYPE_LITERAL = 'literal'
  const TOKEN_TYPE_IDENTIFIER = 'identifier'
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

    const TOKEN_REGEXP_SYMBOL = /(\+|-|\*|\/|\[|\]|\.|\?|:|%|<|=|>|!|&|\||\(|\)|,)/

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

    return (string) => {
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
          tokens.push([type, value, offset, match.length])
        }
        offset += capturedValue.length
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
    ⛔ArrayLiteral
    ⛔ObjectLiteral
    ( Expression )

  CallOrMemberExpression : 💬 Supports this call thanks to binding
    PrimaryExpression
    CallOrMemberExpression ( )
    CallOrMemberExpression ( Expression ⟮, Expression )
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
    const bind = (impl, ...args) => Object.assign(impl[1].bind(null, ...args), { $: [impl[0], args] })
    const buildOp = (name, impl) => (range, ...args) => Object.assign(impl.bind(null, ...args), { $: [name, args, range] })

    const constant = buildOp('constant', value => value)

    const contextProperty = ['context', (name, context) => context[name(context)]]
    const property = ['property', (object, name, context) => {
      const that = object(context)
      const result = that[name(context)]
      // eslint-disable-next-line valid-typeof
      if (typeof result === FUNCTION) {
        return result.bind(that)
      }
      return result
    }]
    const not = ['not', (value, context) => !value(context)]
    const mul = ['mul', (value1, value2, context) => value1(context) * value2(context)]
    const div = ['div', (value1, value2, context) => value1(context) / value2(context)]
    const exp = ['exp', (value1, value2, context) => value1(context) ** value2(context)]
    const remainder = ['remainder', (value1, value2, context) => value1(context) % value2(context)]
    const add = ['add', (value1, value2, context) => value1(context) + value2(context)]
    const sub = ['sub', (value1, value2, context) => value1(context) - value2(context)]
    const lt = ['lt', (value1, value2, context) => value1(context) < value2(context)]
    const gt = ['gt', (value1, value2, context) => value1(context) > value2(context)]
    const lte = ['lte', (value1, value2, context) => value1(context) <= value2(context)]
    const gte = ['gte', (value1, value2, context) => value1(context) >= value2(context)]
    // eslint-disable-next-line eqeqeq
    const eq = ['eq', (value1, value2, context) => value1(context) == value2(context)]
    // eslint-disable-next-line eqeqeq
    const neq = ['neq', (value1, value2, context) => value1(context) != value2(context)]
    const eqq = ['eqq', (value1, value2, context) => value1(context) === value2(context)]
    const neqq = ['neqq', (value1, value2, context) => value1(context) !== value2(context)]
    const and = ['and', (value1, value2, context) => value1(context) && value2(context)]
    const or = ['or', (value1, value2, context) => value1(context) || value2(context)]
    const ternary = ['ternary', (condition, trueValue, falseValue, context) => {
      if (condition(context)) {
        return trueValue(context)
      }
      return falseValue(context)
    }]
    const getTypeof = ['getTypeof', (value, context) => typeof value(context)]
    const call = ['call', (func, args, context) => func(context).apply(null, args.map(arg => arg(context)))]

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

    const _recursiveExpression = (subExpression, operators) => {
      const expectedSymbols = Object.keys(operators)
      return (tokens) => {
        let result = subExpression(tokens)
        let symbol = shiftOnSymbols(tokens, expectedSymbols)
        while (symbol) {
          const sub = subExpression(tokens)
          result = bind(operators[symbol], result, sub)
          symbol = shiftOnSymbols(tokens, expectedSymbols)
        }
        return result
      }
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
      if (isSymbol(tokens)) {
        unexpected(tokens)
      }
      const [[type, value, ...range]] = shift(tokens)
      if (type === TOKEN_TYPE_IDENTIFIER) {
        return bind(contextProperty, constant(range, value))
      }
      return constant(range, value)
    }

    const CallOrMemberExpression = (tokens) => {
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
          shift(tokens)
          result = bind(call, result, args)
        },
        '[': () => {
          const name = expression(tokens)
          if (!isSymbol(tokens, ']')) {
            unexpected(tokens)
          }
          shift(tokens)
          result = bind(property, result, name)
        },
        '.': () => {
          const [type, value, ...range] = current(tokens)
          if (type !== TOKEN_TYPE_IDENTIFIER) {
            unexpected(tokens)
          }
          shift(tokens)
          result = bind(property, result, constant(range, value))
        }
      }
      while (isSymbol(tokens, '([.')) {
        const [[, symbol]] = shift(tokens)
        operators[symbol](result)
      }
      return result
    }

    const unaryExpression = (tokens) => {
      const [type, value] = current(tokens)
      const postProcess = isSymbol(tokens, '+-!') || ((type === TOKEN_TYPE_IDENTIFIER) && value === 'typeof')
      if (!postProcess) {
        return CallOrMemberExpression(tokens)
      }
      shift(tokens)
      let result = expression(tokens)
      if (value === '+') {
        result = bind(add, constant([], 0), result)
      } else if (value === '-') {
        result = bind(sub, constant([], 0), result)
      } else if (value === '!') {
        result = bind(not, result)
      } else {
        result = bind(getTypeof, result)
      }
      return result
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
      const condition = logicalORExpression(tokens)
      if (shiftOnSymbols(tokens, ['?'])) {
        const trueResult = conditionalExpression(tokens)
        checkNotEndOfExpression(tokens)
        if (!isSymbol(tokens, ':')) {
          unexpected(tokens)
        }
        shift(tokens)
        const falseResult = conditionalExpression(tokens)
        return bind(ternary, condition, trueResult, falseResult)
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

  const toJSON = expr => ({
    [expr.$[0]]: expr.$[1].map(
      // eslint-disable-next-line valid-typeof
      arg => typeof arg === FUNCTION
        ? toJSON(arg)
        : Array.isArray(arg)
          ? arg.map(toJSON)
          : arg
    )
  })

  const punyexpr = str => {
    const impl = parse(tokenize(str))
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
