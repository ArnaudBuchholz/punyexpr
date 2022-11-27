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
          tokens.push([type, value, offset])
        }
        offset += capturedValue.length
      })
      return tokens
    }
  })()

  const parse = (() => {
  /*

  (Extremely) Simplified grammar (based on https://tc39.es/ecma262/#sec-expressions)

  ⛔ Not implemented
  ⚠️ Modified / adapted
  ➡️ Shortcut

  PrimaryExpression :
    ⛔this
    ⚠️Identifier
    Literal
    ⛔ArrayLiteral
    ⛔ObjectLiteral
    ⛔RegularExpressionLiteral
    ⛔TemplateLiteral
    ⚠️( Expression )

  MemberExpression :
    PrimaryExpression
    MemberExpression [ Expression ] 💬 should we bind ?
    ⚠️MemberExpression . Identifier 💬 should we bind ?
    ⛔MemberExpression TemplateLiteral
    ⛔SuperProperty
    ⛔MetaProperty
    ⛔new MemberExpression Arguments
    ⛔MemberExpression . PrivateIdentifier

   ⛔NewExpression :
    ⛔new NewExpression

  ⚠️CallExpression : 💬 does not support this call
    MemberExpression
    MemberExpression ( )
    MemberExpression ( AssignmentExpression ⟮, AssignmentExpression⟯∗ )

  LeftHandSideExpression :
    CallExpression
    ⛔OptionalExpression

  ⛔UpdateExpression : ➡️ CallExpression
    ⛔LeftHandSideExpression ++
    ⛔LeftHandSideExpression --
    ⛔++ UnaryExpression
    ⛔-- UnaryExpression

  UnaryExpression :
    UpdateExpression
    ⛔delete UnaryExpression
    ⛔void UnaryExpression
    typeof UnaryExpression
    + UnaryExpression
    - UnaryExpression
    ⛔~ UnaryExpression
    ! UnaryExpression
    ⛔AwaitExpression

  ExponentiationExpression :
    ⚠️UnaryExpression ** ExponentiationExpression

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

  ⛔AssignmentExpression : ➡️ ConditionalExpression
    ConditionalExpression
    ⛔YieldExpression
    ⛔ArrowFunction
    ⛔AsyncArrowFunction
    ⛔LeftHandSideExpression = AssignmentExpression
    ⛔LeftHandSideExpression AssignmentOperator AssignmentExpression
    ⛔LeftHandSideExpression &&= AssignmentExpression
    ⛔LeftHandSideExpression ||= AssignmentExpression
    ⛔LeftHandSideExpression ??= AssignmentExpression

  Expression :
    ⚠️AssignmentExpression
*/
    const bind = (impl, ...args) => Object.assign(impl.bind(null, ...args), { op: impl.name, args })

    const constant = value => value
    const rootGet = (member, context) => context[member(context)]
    const get = (object, member, context) => object(context)[member(context)]
    const not = (value, context) => !value(context)
    const mul = (value1, value2, context) => value1(context) * value2(context)
    const div = (value1, value2, context) => value1(context) / value2(context)
    const exp = (value1, value2, context) => value1(context) ** value2(context)
    const remainder = (value1, value2, context) => value1(context) % value2(context)
    const add = (value1, value2, context) => value1(context) + value2(context)
    const sub = (value1, value2, context) => value1(context) - value2(context)
    const lt = (value1, value2, context) => value1(context) < value2(context)
    const gt = (value1, value2, context) => value1(context) > value2(context)
    const lte = (value1, value2, context) => value1(context) <= value2(context)
    const gte = (value1, value2, context) => value1(context) >= value2(context)
    // eslint-disable-next-line eqeqeq
    const eq = (value1, value2, context) => value1(context) == value2(context)
    // eslint-disable-next-line eqeqeq
    const neq = (value1, value2, context) => value1(context) != value2(context)
    const eqq = (value1, value2, context) => value1(context) === value2(context)
    const neqq = (value1, value2, context) => value1(context) !== value2(context)
    const and = (value1, value2, context) => value1(context) && value2(context)
    const or = (value1, value2, context) => value1(context) || value2(context)
    const ternary = (condition, trueValue, falseValue, context) => {
      if (condition(context)) {
        return trueValue(context)
      }
      return falseValue(context)
    }
    const getTypeof = (value, context) => typeof value(context)
    const call = (member, args, context) => member(context).apply(null, args.map(arg => arg(context)))

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
      const [type, value] = tokens[0] || []
      return (type === TOKEN_TYPE_SYMBOL) && (!expected || expected.includes(value))
    }
    const shiftOnSymbols = (tokens, expected) => {
      const maxLength = expected.reduce((length, symbol) => Math.max(length, symbol.length), 0)
      const nextTokens = tokens.slice(0, maxLength)
      let notASymbolIndex = nextTokens.findIndex(([type]) => type !== TOKEN_TYPE_SYMBOL)
      if (notASymbolIndex === -1) {
        notASymbolIndex = nextTokens.length
      }
      const nextSymbols = nextTokens.slice(0, notASymbolIndex).map(([, value]) => value).join('')
      const matching = expected
        .filter(symbol => nextSymbols.startsWith(symbol))
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

    const literal = (tokens) => {
      checkNotEndOfExpression(tokens)
      if (isSymbol(tokens)) {
        unexpected(tokens)
      }
      const [[type, value]] = shift(tokens)
      if (type === TOKEN_TYPE_IDENTIFIER) {
        return bind(rootGet, bind(constant, value))
      }
      return bind(constant, value)
    }

    const primaryExpression = (tokens) => {
      if (isSymbol(tokens, '(')) {
        shift(tokens)
        const result = expression(tokens)
        if (!isSymbol(tokens, ')')) {
          unexpected(tokens)
        }
        shift(tokens)
        return result
      }
      return literal(tokens)
    }

    const memberExpression = (tokens) => {
      let result = primaryExpression(tokens)
      while (isSymbol(tokens, '[.')) {
        const [[, value]] = shift(tokens)
        if (value === '.') {
          const [type, value] = current(tokens)
          if (type !== TOKEN_TYPE_IDENTIFIER) {
            unexpected(tokens)
          }
          shift(tokens)
          result = bind(get, result, bind(constant, value))
        } else {
          const member = expression(tokens)
          if (!isSymbol(tokens, ']')) {
            unexpected(tokens)
          }
          shift(tokens)
          result = bind(get, result, member)
        }
      }
      return result
    }

    const callExpression = (tokens) => {
      const member = memberExpression(tokens)
      if (isSymbol(tokens, '(')) {
        shift(tokens)
        const args = []
        while (!isSymbol(tokens, ')')) {
          if (args.length > 0) {
            if (!isSymbol(tokens, ',')) {
              unexpected(tokens)
            }
            shift(tokens)
          }
          args.push(conditionalExpression(tokens))
        }
        shift(tokens)
        return bind(call, member, args)
      }
      return member
    }

    const unaryExpression = (tokens) => {
      const [type, value] = current(tokens)
      const postProcess = isSymbol(tokens, '+-!') || ((type === TOKEN_TYPE_IDENTIFIER) && value === 'typeof')
      if (!postProcess) {
        return callExpression(tokens)
      }
      shift(tokens)
      let result = expression(tokens)
      if (value === '+') {
        result = bind(add, bind(constant, 0), result)
      } else if (value === '-') {
        result = bind(sub, bind(constant, 0), result)
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
      if (tokens.length === 0) {
        return condition
      }
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

  const punyexpr = str => {
    const impl = parse(tokenize(str))
    function expr (context = {}) {
      try {
        return impl(context)
      } catch (e) {
        return ''
      }
    }
    assignROProperties(expr, {
      impl,
      str
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
