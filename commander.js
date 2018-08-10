const chalk = require('chalk')

class Commander {
  constructor (state, dc) {
    this._state = state
    this._dc = dc
    this._history = []

    this._commands = {
      help: {
        help: {
          syntax: 'help [<command>]',
          description: 'Displays the documentation for the given command.',
          examples: [ '/help', '/help help' ]
        },
        run: arg => {
          if (typeof arg === 'string') {
            // Help about a specific command
            const cmd = this._commands[arg]
            if (cmd && cmd.help) {
              this._result(renderHelp(cmd.help))
            } else {
              this._error(`No help for ${arg}`)
            }
          } else {
            this._result(renderCommands(this._commands))
          }
        }
      },
      clear: {
        help: {
          syntax: 'clear',
          description: 'Clears the log in the debug or status window.',
          examples: [ '/clear' ]
        },
        run: () => {
          if (!this._state.isChat()) {
            this._state.currentPage().clear()
          }
        }
      },
      'get-contacts': {
        help: {
          syntax: 'get-contacts',
          description: 'Displays all contacts.',
          examples: [ '/get-contacts' ]
        },
        run: () => {
          const contacts = this._dc.getContacts().map(id => {
            const c = this._dc.getContact(id)
            return `${c.getNameAndAddress()} (id = ${c.getId()})`
          })
          this._result([
            `${chalk.bold('All Contacts:')}\n \n`,
            `${contacts.map(c => '  ' + c).join('\n')}`
          ].join(''))
        }
      },
      'create-contact': {
        help: {
          syntax: 'create-contact <name> <address>',
          description: 'Create a contact.',
          examples: [ '/create-contact Alice alice@site.org' ]
        },
        run: (name, address) => {
          if (typeof name === 'string' && typeof address === 'string') {
            const id = this._dc.createContact(name, address)
            this._success(`Contact ${id} created or updated!`)
          } else {
            this._error('Invalid parameters!')
          }
        }
      },
      'delete-contact': {
        help: {
          syntax: 'delete-contact <id>',
          description: 'Delete a contact.',
          examples: [ '/delete-contact 22' ]
        },
        run: id => {
          const contact = this._dc.getContact(id)
          if (contact === null) {
            return this._error(`Invalid contact id ${id}`)
          }
          if (this._dc.deleteContact(id)) {
            this._success('Contact deleted successfully.')
          } else {
            this._error('Failed to delete contact!')
          }
        }
      },
      'delete-message': {
        help: {
          syntax: 'delete-message <id>',
          description: 'Delete a message.',
          examples: [ '/delete-message 112' ]
        },
        run: messageId => {
          const message = this._dc.getMessage(messageId)
          if (message === null) {
            return this._error(`Invalid message id ${messageId}!`)
          }
          const chatId = message.getChatId()
          this._dc.deleteMessages(messageId)
          this._state.deleteMessage(chatId, Number(messageId))
          this._success(`Message ${messageId} was deleted.`)
        }
      },
      'star-message': {
        help: {
          syntax: 'star-message <id>',
          description: 'Star/unstar a message.',
          examples: [ '/star-message 49' ]
        },
        run: id => {
          const message = this._dc.getMessage(id)
          if (message === null) {
            return this._error(`Invalid message id ${id}`)
          }
          const star = message.isStarred()
          this._dc.starMessages(id, !star)
          this._success(`Message ${id} was ${star ? 'un' : ''}starred.`)
        }
      }
    }
  }

  onEnter (line) {
    line = line.trim()
    this._history.push(line)

    if (line[0] !== '/') {
      return this._state.onEnter(line)
    }

    line = line.slice(1).split(' ')
    const cmd = this._commands[line[0]]
    const args = line.slice(1)

    if (cmd && typeof cmd.run === 'function') {
      cmd.run.apply(this, args)
    } else {
      this._error(`Unknown command: ${line[0]}`)
    }
  }

  onUp () {
    if (!this._history.length) return
    var command = this._history.pop()
    this._history.unshift(command)
    this._state.input.set(command)
  }

  onDown () {
    if (!this._history.length) return
    var command = this._history.shift()
    this._history.push(command)
    this._state.input.set(command)
  }

  onTab () {
    const line = this._state.input.rawLine()
    if (line.length > 1 && line[0] === '/') {
      // command completion
      const soFar = line.slice(1)
      const commands = Object.keys(this._commands)
      var matchingCommands = commands.filter(cmd => cmd.startsWith(soFar))
      if (matchingCommands.length === 1) {
        this._state.input.set(`/${matchingCommands[0]} `)
      }
      return
    }

    const chatId = this._state.currentPage().chatId
    if (typeof chatId !== 'number') return

    // nick completion
    let nicks = this._dc.getChatContacts(chatId).map(id => {
      return this._dc.getContact(id).getName()
    }).sort()

    const pattern = (/^(\w+)$/)
    const match = pattern.exec(line)
    if (match) {
      nicks = nicks.filter(nick => nick.startsWith(match[0]))
      if (nicks.length > 0) {
        this._state.input.set(`@${nicks[0]}: `)
      }
    }
  }

  _success (line) { this._status(chalk.green(line)) }
  _error (line) { this._status(chalk.red(line)) }
  _result (line) { this._status(` \n${line}\n \n`) }
  _status (line) { this._state.appendToStatusPage(line) }
}

function renderHelp (help) {
  return [
    `${chalk.bold('Syntax:')}\n \n`,
    `  ${help.syntax}\n \n`,
    `${chalk.bold('Description:')}\n \n`,
    `  ${help.description}\n \n`,
    `${chalk.bold('Examples:')}\n \n`,
    `${help.examples.map(ex => '  ' + ex).join('\n')}`
  ].join('')
}

function renderCommands (commands) {
  const syntaxes = Object.keys(commands).sort().map(key => {
    return commands[key].help.syntax
  })
  return [
    `${chalk.bold('All commands:')}\n \n`,
    `${syntaxes.map(s => '  ' + s).join('\n')}`
  ].join('')
}

module.exports = Commander
