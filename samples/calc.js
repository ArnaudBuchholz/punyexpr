/* global location */

window.addEventListener('load', () => {
  const input = document.querySelector('input')
  const output = document.querySelector('.output')
  const treeRoot = document.querySelector('.tf-tree ul')

  function toAst (parent, object) {
    const addChild = (title, at, length) => {
      const li = parent.appendChild(document.createElement('li'))
      const span = li.appendChild(document.createElement('span'))
      span.className = 'tf-nc'
      span.appendChild(document.createTextNode(title))
      span.dataset.at = at
      span.dataset.length = length
      return li
    }
    const { op, args, at, length } = object
    let li
    if (op === 'constant') {
      addChild(JSON.stringify(args[0]), at, length).className = 'constant'
    } else {
      li = addChild(op, at, length)
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
    if (target.className === 'tf-nc') {
      const { at: rawAt, length: rawLength } = target.dataset
      const at = Number(rawAt)
      const length = Number(rawLength)
      input.focus()
      input.setSelectionRange(at, at + length)
    }
  })

  function run () {
    location.hash = encodeURIComponent(input.value)
    output.innerHTML = ''
    treeRoot.innerHTML = ''
    try {
      const expr = punyexpr(input.value)
      output.appendChild(document.createTextNode(expr()))
      toAst(treeRoot, expr.toJSON())
    } catch (e) {
      output.appendChild(document.createTextNode(e.toString()))
    }
  }
  document.querySelector('button').addEventListener('click', run)
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      run()
    }
  })

  if (location.hash) {
    input.value = decodeURIComponent(location.hash.substring(1))
    run()
  }
})
