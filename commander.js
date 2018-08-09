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
              this.status(renderHelp(cmd.help))
            } else {
              this.warning(`No help for ${arg}`)
            }
          } else {
            this.status(renderCommands(this._commands))
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
          this.status([
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
            this.success(`Contact ${id} created or updated!`)
          } else {
            this.error('Invalid parameters!')
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
            return this.error(`Invalid contact id ${id}`)
          }
          if (this._dc.deleteContact(id)) {
            this.success('Contact deleted successfully.')
          } else {
            this.error('Failed to delete contact!')
          }
        }
      }
    }
  }

  onEnter (line) {
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
      this.error(`Unknown command: ${line[0]}`)
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

  success (line) { this.status(chalk.green(line)) }
  warning (line) { this.status(chalk.yellow(line)) }
  error (line) { this.status(chalk.red(line)) }
  status (line) { this._state.appendToStatusPage(` \n${line}`) }

  onTab () {
    // TODO handle auto complete and modify this._state.input
  }
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
