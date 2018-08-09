const neatLog = require('neat-log')
const chalk = require('chalk')
const State = require('./state')
const Layout = require('./layout')

class Commander {
  constructor (state) {
    this.state = state

    this.commands = {
      help: {
        help: {
          syntax: 'help [<command>]',
          parameters: 'The command to display the documentation for; if no argument is given, the list of commands will be displayed.',
          description: 'Displays the documentation for the given command.',
          examples: [ '/help', '/help help' ],
          references: '',
          seeAlso: ''
        },
        run: arg => {
          if (typeof arg === 'string') {
            // Help about a specific command
            const cmd = this.commands[arg]
            if (cmd && cmd.help) {
              this.status('TODO: write a method that renders cmd.help')
              // this.status(renderHelp(cmd.help))
            } else {
              this.status(`No help for ${arg}`)
            }
          } else {
            // List all available commands
            const keys = Object.keys(this.commands)
            this.status('deltax commands:\n' + keys.join(' '))
          }
        }
      }
    }
  }

  onEnter (line) {
    if (line[0] !== '/') {
      return this.state.onEnter(line)
    }

    line = line.slice(1).split(' ')
    const cmd = this.commands[line[0]]
    const args = line.slice(1)

    if (cmd && typeof cmd.run === 'function') {
      cmd.run.apply(this, args)
    } else {
      this.status(`Unknown command: ${line[0]}`)
    }
  }

  status (line) {
    this.state.appendToStatusPage(line)
  }

  onTab () {
    // TODO handle auto complete and modify this.state.input
  }
}

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
