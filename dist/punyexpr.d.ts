declare global {
  interface globalThis {
    punyexpr: {
      (expression: string, options?: {
        regex: true | ((pattern: string, flags: string) => RegExp);
      }): (context: { [name in string]: any }) => any;
      Error: typeof PunyExprError;
      version: string;
      tokenize(expression: string): PunyExprToken[];
    }
  }
}

type PunyExprToken = 
  | ['literal', string | number | boolean, offset: number, length: number]
  | ['identifier', string, offset: number, length: number]
  | ['regex', [pattern: string, flags: string], offset: number, length: number]
  | ['symbol', '+' | '-' | '*' | '/' | '[' | ']' | '.' | '?' | ':' | '%' | '<' | '=' | '>' | '!' | '&' | '|' | '(' | ')' | ',', offset: number, length: 1]
  ;

class PunyExprError extends Error {
  offset: number;
}

export {};
