window.addEventListener('load', () => {
  const input = document.querySelector('input')
  const output = document.querySelector('pre')
  const [exprButton, evalButton] = document.querySelectorAll('button')
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      exprButton.click()
    }
  })
  const onClick = (button, method) => button.addEventListener('click', () => {
    output.innerHTML = ''
    try {
      const expr = method(input.value)
      output.appendChild(document.createTextNode(expr() + '\n' + JSON.stringify(expr.toJSON(), undefined, 2)))
    } catch (e) {
      output.appendChild(document.createTextNode(e.toString()))
    }
  })
  onClick(exprButton, punyexpr)
  onClick(evalButton, eval)
})
