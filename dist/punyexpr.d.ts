declare module 'punyexpr' {

  type PunyExprToken = 
    | ['literal', string | number | boolean, offset: number, length: number]
    | ['identifier', string, offset: number, length: number]
    | ['regex', [pattern: string, flags: string], offset: number, length: number]
    | ['symbol', '+' | '-' | '*' | '/' | '[' | ']' | '.' | '?' | ':' | '%' | '<' | '=' | '>' | '!' | '&' | '|' | '(' | ')' | ',', offset: number, length: 1]

  class PunyExprError extends Error {
    offset: number
  }

  type PunyExprLocator = { at: number; length: number }
  type PunyExprConstantOp = { op: 'constant', args: [value: string | number | boolean] }

  type PunyExprConstant = PunyExprLocator & PunyExprConstantOp

  type PunyExprNode = PunyExprLocator & (
    | PunyExprConstantOp
    | { op: 'array', args: PunyExprNode[] }
    // TODO missing regex
    | { op: 'context', args: [name: PunyExprConstant] }
    | { op: 'property', args: [context: PunyExprNode, name: string] }
    | { op: 'call', args: [thisValue: PunyExprNode, args: PunyExprNode[]] }
    | { op: 'pos' | 'neg' | 'not' | 'getTypeof', args: [PunyExprNode] }
    | { op: 'exp' | 'mul' | 'div' | 'remainder' | 'add' | 'sub' | 'lt' | 'lte' | 'gt' | 'gte' | 'eq' | 'neq' | 'eqq' | 'neqq' | 'and' | 'or', args: [PunyExprNode, PunyExprNode] }
    | { op: 'ternary', args: [condition: PunyExprNode, whenTrue: PunyExprNode, whenFalse: PunyExprNode] }
  )

  type PunyExprFunction = {
    /** Evaluate the expression with the given context */
    (context?: { [name in string]: any }): any
    /** Returns the abstract syntax tree representation of the expression */
    toJSON(): PunyExprNode
    /** Returns the normalized expression */
    toString(): string
    /** Returns the list of contextual names used in the expression */
    listContextualNames(): string[]
  }

  type PunyExpr = {
    /** Compiles the expression */
    (expression: string, options?: {
      regex: true | ((pattern: string, flags: string) => RegExp)
    }): PunyExprFunction
    Error: typeof PunyExprError
    version: string
    /** Tokenizer */
    tokenize(expression: string): PunyExprToken[]
    /**
     * hook: (value: any, property: string) => any
     * @param value: any
     * @param property: string
     * @returns any
     * @default value[property]
     */
    propertyOf: symbol
  }

  const punyexpr: PunyExpr
}
