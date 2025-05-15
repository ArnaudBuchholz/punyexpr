# punyexpr 🦴

[![Node.js CI](https://github.com/ArnaudBuchholz/punyexpr/actions/workflows/node.js.yml/badge.svg)](https://github.com/ArnaudBuchholz/punyexpr/actions/workflows/node.js.yml)
[![Mutation Testing](https://img.shields.io/badge/mutation%20testing-100%25-green)](https://arnaudbuchholz.github.io/punyexpr/reports/mutation/mutation.html)
![no dependencies](https://img.shields.io/badge/-no_dependencies-green)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Package Quality](https://npm.packagequality.com/shield/punyexpr.svg)](https://packagequality.com/#?package=punyexpr)
[![Known Vulnerabilities](https://snyk.io/test/github/ArnaudBuchholz/punyexpr/badge.svg?targetFile=package.json)](https://snyk.io/test/github/ArnaudBuchholz/punyexpr?targetFile=package.json)
[![punyexpr](https://badge.fury.io/js/punyexpr.svg)](https://www.npmjs.org/package/punyexpr)
[![punyexpr](http://img.shields.io/npm/dm/punyexpr.svg)](https://www.npmjs.org/package/punyexpr)
[![install size](https://packagephobia.now.sh/badge?p=punyexpr)](https://packagephobia.now.sh/result?p=punyexpr)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🍁 Overview

A minimalist *(4937 bytes)* and safe expression compiler and evaluator.

## 🖥️ Demo

You can experiment with expressions [here](https://arnaudbuchholz.github.io/punyexpr/samples/calc.html).

## 💿 How to install

* `npm install punyexpr`

* with ESM: `import { punyexpor } from 'punyexpr'`

* with CommonJS: `const { punyexpr } = require('punyexpr')`

* [Types](https://github.com/ArnaudBuchholz/punyexpr/blob/main/dist/punyexpr.d.ts) are included in the package

## 📚 Documentation

### *Compile* an expression

```javascript
const incValue = punyexpr('value + 1')
```

### *Evaluate* the compiled expression

```javascript
incValue({ value: 1 }) // 2
``` 

### Use with [punybind](https://www.npmjs.com/package/punybind)@`>=1.2.0`

```javascript
const safebind = punybind.use({
  compiler: punyexpr
 })
// Use safebind to bind HTML
```

## 📚 Implementation notes

### Regular expressions

* Regular expressions are [not secure](https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS) and are not allowed by default,

* Set the option `{ regex: true }` to enable regular expressions using the default [JavaScript implementation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp):

```javascript
const unsecure = punyexpr('value.match(/a+b/)', { regex: true })
```

* Or plug any custom regular expression builder:

```javascript
const unsecure = punyexpr('value.match(/a+b/)', { regex: (pattern, flags) => new RegExp(pattern, flags) })
```

### More details

* Check the [source](https://github.com/ArnaudBuchholz/punyexpr/blob/main/punyexpr.js) for the implemented grammar,<br> in particular the following are not supported :
  * Bitwise, async and coalesce operations
  * `new` and `this`
  * Object literals
* See the [tests](https://github.com/ArnaudBuchholz/punyexpr/blob/main/tests/expression.spec.js) for supported expressions.
* The implementation is **compliant** with [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP).
