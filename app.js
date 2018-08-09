const neatLog = require('neat-log')
const chalk = require('chalk')
const State = require('./state')
const Commander = require('./commander')
const Layout = require('./layout')

class App {
  constructor (rc, dc) {
    const state = new State(rc, dc)
    const commander = new Commander(state)
    const layout = new Layout(rc.layout)
    const render = layout.render.bind(layout)

    const { input, use } = neatLog(render, {
      fullscreen: true,
      logspeed: rc.logspeed,
      state: state,
      style: (start, cursor, end) => {
        if (!cursor) cursor = ' '
        return start + chalk.bgWhite(cursor) + end
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
    input.on('enter', commander.onEnter.bind(commander))
    input.on('tab', commander.onTab.bind(commander))

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
      if (msg && msg.getState().isPending()) {
        state.appendToChat(chatId, msgId)
      }
    })

    dc.on('DC_EVENT_INCOMING_MSG', (chatId, msgId) => {
      state.appendToChat(chatId, msgId)
    })

    this.render()
  }

  render () {
    this.bus.emit('render')
  }
}

module.exports = (opts, dc) => new App(opts, dc)
