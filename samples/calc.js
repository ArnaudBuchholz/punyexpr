/* global location */

window.addEventListener('load', () => {
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
    try {
      const expr = punyexpr(input.innerText)
      // https://stackoverflow.com/questions/6249095/how-to-set-the-caret-cursor-position-in-a-contenteditable-element-div
      const sel = window.getSelection()
      console.log(sel)
      // input.innerHTML = `<span>${input.innerText}</span>`
      const result = expr()
      const typeOfResult = typeof result
      if (typeOfResult === 'function') {
        output.appendChild(document.createTextNode(result.toString()))
      } else {
        output.appendChild(document.createTextNode(JSON.stringify(result)))
      }
      output.className = `output ${typeOfResult}`
      toAst(treeRoot, expr.toJSON())
    } catch (e) {
      output.appendChild(document.createTextNode(e.toString()))
      output.className = 'output error'
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
