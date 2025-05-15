declare module 'punyexpr' {

  type PunyExprToken = 
    | ['literal', string | number | boolean, offset: number, length: number]
    | ['identifier', string, offset: number, length: number]
    | ['regex', [pattern: string, flags: string], offset: number, length: number]
    | ['symbol', '+' | '-' | '*' | '/' | '[' | ']' | '.' | '?' | ':' | '%' | '<' | '=' | '>' | '!' | '&' | '|' | '(' | ')' | ',', offset: number, length: 1]

  class PunyExprError extends Error {
    offset: number
  }

  type PunyExprNode = { at: number; length: number } & (
    | { op: 'constant', args: [value: string | number | boolean] }
    | { op: 'array', args: PunyExprNode[] }
    // TODO missing regex
    | { op: 'context', args: [name: string] }
    | { op: 'property', args: [context: PunyExprNode, name: string] }
    | { op: 'call', args: [thisValue: PunyExprNode, args: PunyExprNode[]] }
    | { op: 'pos' | 'neg' | 'not' | 'getTypeof', args: [PunyExprNode] }
    | { op: 'exp' | 'mul' | 'div' | 'remainder' | 'add' | 'sub' | 'lt' | 'lte' | 'gt' | 'gte' | 'eq' | 'neq' | 'eqq' | 'neqq' | 'and' | 'or', args: [PunyExprNode, PunyExprNode] }
    | { op: 'ternary', args: [condition: PunyExprNode, whenTrue: PunyExprNode, whenFalse: PunyExprNode] }
  )

  type PunyExprFunction = {
    (context: { [name in string]: any }): any
    toJSON(): PunyExprNode
    toString(): string
  }

  type PunyExpr = {
    (expression: string, options?: {
      regex: true | ((pattern: string, flags: string) => RegExp)
    }): PunyExprFunction
    Error: typeof PunyExprError
    version: string
    tokenize(expression: string): PunyExprToken[]
  }

  const punyexpr: PunyExpr
}
