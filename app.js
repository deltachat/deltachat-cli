const neatLog = require('neat-log')
const chalk = require('chalk')
const State = require('./state')
const Commander = require('./commander')
const Layout = require('./layout')

class App {
  constructor (rc, dc) {
    const state = new State(rc, dc)
    const commander = new Commander(state, dc)
    const layout = new Layout(rc.layout)
    const render = layout.render.bind(layout)

    const userInput = () => {
      const arr = state.userInput
      return arr.length > 0 ? arr[0].question() : ''
    }

    const { input, use } = neatLog(render, {
      fullscreen: true,
      logspeed: rc.logspeed,
      state: state,
      style: (start, cursor, end) => {
        if (!cursor) cursor = ' '
        return userInput() + start + chalk.bgWhite(cursor) + end
      }
    })

    use((state, bus) => {
      state.input = input
      this.bus = bus
    })

    const pageUp = () => {
      state.currentPage().pageUp(layout.maxPageHeight())
    }
    const pageDown = () => {
      state.currentPage().pageDown()
    }

    input.on('ctrl-n', () => state.nextPage())
    input.on('ctrl-p', () => state.prevPage())

    input.on('pageup', pageUp)
    input.on('pagedown', pageDown)
    input.on('alt-p', pageUp)
    input.on('alt-n', pageDown)

    input.on('enter', line => {
      if (state.userInput.length > 0) {
        line = line.trim().toLowerCase()
        const answer = state.userInput[0].answers[line]
        if (typeof answer === 'function') {
          answer()
          state.userInput.shift()
        }
      } else {
        commander.onEnter(line)
      }
    })

    input.on('tab', () => {
      if (state.userInput.length === 0) {
        commander.onTab()
      }
    })

    input.on('up', commander.onUp.bind(commander))
    input.on('down', commander.onDown.bind(commander))

    input.on('keypress', (ch, key) => this.render())

    dc.on('ready', () => {
      state.loadChats()
      state.nextPage()
      this.render()
    })

    dc.on('ALL', (event, data1, data2) => {
      state.logEvent(event, data1, data2)
      this.render()
    })

    dc.on('DC_EVENT_MSGS_CHANGED', (chatId, msgId) => {
      const msg = dc.getMessage(msgId)
      if (msg === null) return

      if (msg.getState().isPending()) {
        state.appendMessage(chatId, msgId)
      } else if (msg.isDeadDrop()) {
        state.queueDeadDropMessage(msg)
      }
    })

    dc.on('DC_EVENT_INCOMING_MSG', (chatId, msgId) => {
      state.appendMessage(chatId, msgId)
    })

    this.render()
  }

  render () {
    this.bus.emit('render')
  }
}

module.exports = (opts, dc) => new App(opts, dc)
