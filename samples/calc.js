/* global location */

window.addEventListener('load', () => {
  const input = document.querySelector('input')
  const output = document.querySelector('.output')
  const treeRoot = document.querySelector('.tf-tree ul')

  function toAst (parent, object) {
    const addChild = title => {
      const li = parent.appendChild(document.createElement('li'))
      const span = li.appendChild(document.createElement('span'))
      span.className = 'tf-nc'
      span.appendChild(document.createTextNode(title))
      return li
    }
    const op = Object.keys(object)[0]
    const args = object[op]
    if (op === 'constant') {
      addChild(JSON.stringify(args[0])).className = 'constant'
    } else {
      const li = addChild(op)
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
