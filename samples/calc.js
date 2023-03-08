/* global location */

window.addEventListener('load', () => {
  [].slice.call(document.querySelectorAll('a')).forEach(a => {
    a.setAttribute('target', '_blank')
    a.setAttribute('rel', 'noopener noreferrer')
  })

  const input = document.querySelector('.input')
  const output = document.querySelector('.output')
  const treeRoot = document.querySelector('.tf-tree ul')

  function toAst (parent, object) {
    const addChild = (title, at, length) => {
      const li = parent.appendChild(document.createElement('li'))
      const span = li.appendChild(document.createElement('span'))
      span.className = 'tf-nc '
      span.appendChild(document.createTextNode(title))
      span.dataset.at = at
      span.dataset.length = length
      return { li, span }
    }
    const { op, args, at, length } = object || true
    if (op === 'constant') {
      const value = JSON.stringify(args[0])
      const { li, span } = addChild(value, at, length)
      li.className = 'constant'
      span.className += typeof args[0]
    } else {
      const { li } = addChild(op, at, length)
      li.className = 'op'
      const ul = li.appendChild(document.createElement('ul'))
      args.forEach(arg => {
        if (Array.isArray(arg)) {
          arg.forEach(param => toAst(ul, param))
        } else {
          toAst(ul, arg)
        }
      })
    }
  }

  window.addEventListener('mouseover', event => {
    const { target } = event
    if (target.className.includes('tf-nc')) {
      const { at: rawAt, length: rawLength } = target.dataset
      const at = Number(rawAt)
      const length = Number(rawLength)
      input.focus()
      const sel = window.getSelection()
      const range = document.createRange()
      range.setStart(input.firstChild, at)
      range.setEnd(input.firstChild, at + length)
      sel.removeAllRanges()
      sel.addRange(range)
    }
  })

  function run () {
    location.hash = encodeURIComponent(input.innerText)
    output.innerHTML = ''
    treeRoot.innerHTML = ''
    let expr
    try {
      expr = punyexpr(input.innerText)
      const result = expr({
        Math
      })
      const typeOfResult = typeof result
      let stringifiedResult
      if (typeOfResult === 'function') {
        stringifiedResult = result.toString()
      } else if (isNaN(result)) {
        stringifiedResult = 'NaN'
      } else {
        stringifiedResult = JSON.stringify(result)
      }
      output.appendChild(document.createTextNode(stringifiedResult))
      output.className = `output ${typeOfResult}`
    } catch (e) {
      output.appendChild(document.createTextNode(e.toString()))
      output.className = 'output error'
    } finally {
      if (expr) {
        toAst(treeRoot, expr.toJSON())
      }
    }
  }

  input.addEventListener('keydown', e => {
    setTimeout(run, 0)
  })

  if (location.hash) {
    input.innerText = decodeURIComponent(location.hash.substring(1))
    run()
  }
})
