# punyexpr 🦴

[![Node.js CI](https://github.com/ArnaudBuchholz/punyexpr/actions/workflows/node.js.yml/badge.svg)](https://github.com/ArnaudBuchholz/punyexpr/actions/workflows/node.js.yml)
[![Mutation Testing](https://img.shields.io/badge/mutation%20testing-100%25-green)](https://arnaudbuchholz.github.io/punyexpr/reports/mutation/mutation.html)
[![Package Quality](https://npm.packagequality.com/shield/punyexpr.svg)](https://packagequality.com/#?package=punyexpr)
[![Known Vulnerabilities](https://snyk.io/test/github/ArnaudBuchholz/punyexpr/badge.svg?targetFile=package.json)](https://snyk.io/test/github/ArnaudBuchholz/punyexpr?targetFile=package.json)
[![punyexpr](https://badge.fury.io/js/punyexpr.svg)](https://www.npmjs.org/package/punyexpr)
[![punyexpr](http://img.shields.io/npm/dm/punyexpr.svg)](https://www.npmjs.org/package/punyexpr)
[![install size](https://packagephobia.now.sh/badge?p=punyexpr)](https://packagephobia.now.sh/result?p=punyexpr)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)


A minimalist *(⇡ check the install size)* expression compiler and evaluator.

## Usage

### 1. Include the punyexpr helper

```html
<script src="https://cdn.jsdelivr.net/npm/punyexpr/dist/punyexpr.js"></script>
``` 

### 2. *Compile* an expression

```javascript
const incValue = punyexpr('value + 1')
```

### 3. Evaluate the expression

```javascript
incValue({ value: 1 }) // 2
``` 

## Use with [punybind](https://www.npmjs.com/package/punybind)@`1.2.0`

```javascript
// Use before binding
punybind.compiler(punyexpr)
```

## Implementation notes

* See the [source](https://github.com/ArnaudBuchholz/punyexpr/blob/master/punyexpr.js) for the (altered and) implemented grammar,<br> in particular the following are not supported :
  * Bitwise, async and coalesce operations
  * `new` and `this`
  * Object, array and regular expression literals
* See the [tests](https://github.com/ArnaudBuchholz/punyexpr/blob/master/tests/expression.spec.js) for supported expressions.
* The implementation is **compliant** with [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP).
