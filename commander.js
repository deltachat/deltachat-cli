const chalk = require('chalk')

class Commander {
  constructor (state) {
    this.state = state

    this.commands = {
      help: {
        help: {
          syntax: 'help [<command>]',
          description: 'Displays the documentation for the given command.',
          examples: [ '/help', '/help help' ]
        },
        run: arg => {
          if (typeof arg === 'string') {
            // Help about a specific command
            const cmd = this.commands[arg]
            if (cmd && cmd.help) {
              this.status(renderHelp(cmd.help))
            } else {
              this.status(`No help for ${arg}`)
            }
          } else {
            this.status(renderCommands(this.commands))
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

function renderHelp (help) {
  return [
    ` \n${chalk.bold('Syntax:')}\n \n`,
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
    ` \n${chalk.bold('All commands:')}\n \n`,
    `${syntaxes.map(s => '  ' + s).join('\n')}`
  ].join('')
}

module.exports = Commander
