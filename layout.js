const blit = require('txt-blit')
const util = require('./util')
const chalk = require('chalk')
const gradient = require('gradient-string')
const camelCase = require('camelcase')

class Layout {
  constructor (opts) {
    this.opts = opts
  }

  render (state) {
    const screen = []
    const width = process.stdout.columns
    const height = process.stdout.rows
    const maxPageHeight = this.maxPageHeight()
    const page = state.currentPage()

    const pageText = page.render(state, width, maxPageHeight)

    if (this.titleVisible()) {
      blit(screen, this.titleBar(state), 0, 0)
      blit(screen, pageText, 0, 1)
    } else {
      blit(screen, pageText, 0, 0)
    }

    if (this.statusVisible()) {
      blit(screen, this.statusBar(state), 0, height - 2)
    }

    blit(screen, this.prompt(state), 0, height - 1)

    return screen.join('\n')
  }

  titleBar (state) {
    let text = 'Delta Chat'
    const opts = this.opts.titlebar

    if (opts.gradient) {
      text = (gradient[opts.gradient] || gradient.fruit)(text)
    } else if (opts.textColor) {
      text = (chalk[opts.textColor] || chalk.white)(text)
    }

    if (opts.align === 'center') {
      text = util.centerText(text, process.stdout.columns)
    }

    if (opts.bold === true) {
      text = chalk.bold(text)
    }

    text = bgColor(opts.bgColor)(text)

    return [ text ]
  }

  statusBar (state) {
    return [
      bgColor(this.opts.statusbar.bgColor)(
        ' '.repeat(process.stdout.columns)
      )
    ]
  }

  prompt (state) {
    const index = state.currentPageIndex() + 1
    const name = state.currentPage().name()
    return [
      `[${index}:${name}] ${state.input.line()}`
    ]
  }

  maxPageHeight () {
    let height = process.stdout.rows - 1
    if (this.titleVisible()) height--
    if (this.statusVisible()) height--
    return height
  }

  titleVisible () {
    return this.opts.titlebar.show === true
  }

  statusVisible () {
    return this.opts.statusbar.show === true
  }
}

function bgColor (color) {
  color = color || 'blue'
  return chalk[camelCase(`bg-${color}`)]
}

module.exports = Layout
