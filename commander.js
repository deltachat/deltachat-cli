const chalk = require('chalk')
const lcp = require('lcp')
const C = require('deltachat-node/constants')

class Commander {
  constructor (state, dc) {
    this._state = state
    this._dc = dc
    this._history = []

    this._commands = {
      'archive-chat': {
        help: {
          syntax: 'archive-chat [<id>]',
          description: 'Archive a chat. <id> defaults to current chat.',
          examples: [ '/archive-chat', '/archive-chat 12' ]
        },
        run: id => {
          id = id || this._state.currentPage().chatId
          if (!id) return
          const chat = this._dc.getChat(id)
          if (chat === null) {
            return this._error(`Invalid chat id ${id}!`)
          }
          if (!chat.getArchived()) {
            this._state.archiveChat(Number(id))
            this._info(`Chat ${id} archived successfully.`)
          } else {
            this._info(`Chat ${id} is already archived.`)
          }
        }
      },
      'block-contact': {
        help: {
          syntax: 'block-contact <id>',
          description: 'Block a contact.',
          examples: [ '/block-contact 13' ]
        },
        run: id => {
          const contact = this._dc.getContact(id)
          if (contact === null) {
            return this._error(`Invalid contact id ${id}!`)
          }
          if (!contact.isBlocked()) {
            this._dc.blockContact(id, true)
            this._info(`Blocked contact ${id}.`)
          } else {
            this._info('Contact is already blocked.')
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
      'create-chat': {
        help: {
          syntax: 'create-chat <contactId>',
          description: 'Create a normal chat with a single user.',
          examples: [ '/create-chat 12' ]
        },
        run: contactId => {
          const contact = this._dc.getContact(contactId)
          if (contact === null) {
            return this._error(`Invalid contact id ${contactId}!`)
          }
          const chatId = this._state.createChatByContactId(contactId)
          this._info(`Created chat ${chatId} with contact ${contactId}.`)
        }
      },
      'create-contact': {
        help: {
          syntax: 'create-contact [<name>] <address>',
          description: 'Create a contact.',
          examples: [
            '/create-contact Alice alice@site.org',
            '/create-contact bob@site.org'
          ]
        },
        run: (name, address) => {
          const createContact = (name, address) => {
            const id = this._dc.createContact(name, address)
            if (id !== 0) {
              this._info(`Contact ${id} created or updated.`)
            }
          }
          if (typeof name === 'string' && typeof address === 'string') {
            createContact(name, address)
          } else if (typeof name === 'string') {
            createContact(name.split('@')[0], name)
          } else {
            this._error('Invalid parameters!')
          }
        }
      },
      'delete-chat': {
        help: {
          syntax: 'delete-chat [<id>]',
          description: 'Delete a chat. <id> defaults to current chat.',
          examples: [ '/delete-chat', '/delete-chat 12' ]
        },
        run: id => {
          id = id || this._state.currentPage().chatId
          if (!id) return
          const chat = this._dc.getChat(id)
          if (chat === null) {
            return this._error(`Invalid chat id ${id}!`)
          }
          this._state.deleteChat(Number(id))
          this._info(`Chat ${id} deleted successfully.`)
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
            return this._error(`Invalid contact id ${id}!`)
          }
          if (this._dc.deleteContact(id)) {
            this._info('Contact deleted successfully.')
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
          this._state.deleteMessage(chatId, Number(messageId))
          this._info(`Message ${messageId} was deleted.`)
        }
      },
      'get-chats': {
        help: {
          syntax: 'get-chats',
          description: 'List all chats.',
          examples: [ '/get-chats' ]
        },
        run: () => {
          let chats = this._dc.getChats(C.DC_GCL_NO_SPECIALS)
          chats = chats
            .concat(this._dc.getChats(C.DC_GCL_ARCHIVED_ONLY))
            .map(id => this._dc.getChat(id))
          this._result(renderChats(chats))
        }
      },
      'get-contacts': {
        help: {
          syntax: 'get-contacts',
          description: 'Displays all contacts.',
          examples: [ '/get-contacts' ]
        },
        run: () => {
          const toString = id => {
            const c = this._dc.getContact(id)
            let res = `${c.getNameAndAddress()} (id = ${c.getId()})`
            if (c.isBlocked()) {
              res += ' (blocked)'
            }
            return res
          }
          const unblocked = this._dc.getContacts().map(toString)
          const blocked = this._dc.getBlockedContacts().map(toString)
          const all = unblocked.concat(blocked)
          this._result([
            `${chalk.bold('All Contacts:')}\n \n`,
            `${all.map(c => '  ' + c).join('\n')}`
          ].join(''))
        }
      },
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
              this._error(`No help for ${arg}!`)
            }
          } else {
            this._result(renderCommands(this._commands))
          }
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
            return this._error(`Invalid message id ${id}!`)
          }
          const star = message.isStarred()
          this._dc.starMessages(id, !star)
          this._info(`Message ${id} was ${star ? 'un' : ''}starred.`)
        }
      },
      'unarchive-chat': {
        help: {
          syntax: 'unarchive-chat <id>',
          description: 'Unarchive a chat.',
          examples: [ '/unarchive-chat 12' ]
        },
        run: id => {
          const chat = this._dc.getChat(id)
          if (chat === null) {
            return this._error(`Invalid chat id ${id}!`)
          }
          if (chat.getArchived()) {
            this._state.unArchiveChat(Number(id))
            this._info(`Chat ${id} unarchived successfully.`)
          } else {
            this._info(`Chat ${id} is already unarchived.`)
          }
        }
      },
      'unblock-contact': {
        help: {
          syntax: 'unblock-contact <id>',
          description: 'Unblock a contact.',
          examples: [ '/unblock-contact 13' ]
        },
        run: id => {
          const contact = this._dc.getContact(id)
          if (contact === null) {
            return this._error(`Invalid contact id ${id}!`)
          }
          if (contact.isBlocked()) {
            this._dc.blockContact(id, false)
            this._info(`Unblocked contact ${id}.`)
          } else {
            this._info('Contact is already unblocked.')
          }
        }
      }
    }
  }

  onEnter (line) {
    line = line.trim()
    if (line.length === 0) return

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
      this._error(`Unknown command: ${line[0]}!`)
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
      } else if (matchingCommands.length > 1) {
        const prefix = lcp.findLCP(matchingCommands)
        if (prefix.length > soFar.length) {
          this._state.input.set(`/${prefix}`)
        }
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

  _info (line) {
    this._state.info(line)
  }

  _error (line) {
    this._state.error(line)
  }

  _result (line) {
    this._state.result(line)
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
    `${chalk.bold('All Commands:')}\n \n`,
    `${syntaxes.map(s => '  ' + s).join('\n')}`
  ].join('')
}

function renderChats (chats) {
  const lines = chats.map(c => {
    let line = `  ${c.getName()} (id = ${c.getId()})`
    if (c.getArchived()) {
      line += ' (archived)'
    }
    return line
  })
  return [
    `${chalk.bold('All Chats:')}\n \n`,
    `${lines.join('\n')}`
  ].join('')
}

module.exports = Commander
