const EVENTS = require('deltachat-node/events')
const C = require('deltachat-node/constants')
const boxen = require('boxen')
const chalk = require('chalk')
const dateTime = require('date-time')
const util = require('./util')

const MAX_PAGE_LENGTH = 20000

class ChatMessage {
  constructor (messageId, rc, dc) {
    this.messageId = messageId
    this._rc = rc
    this._dc = dc
  }

  toString () {
    const config = this._rc.layout.message
    const msg = this._dc.getMessage(this.messageId)
    if (msg === null) return ''

    const fromId = msg.getFromId()
    const isMe = () => fromId === 1
    const contact = this._dc.getContact(fromId)

    const header = [
      `#${msg.getId()} `,
      `${dateTime({ date: new Date(msg.getTimestamp() * 1000) })} `,
      `lock:${msg.getShowpadlock() ? 1 : 0} `,
      `star:${msg.isStarred() ? 1 : 0} `,
      `state:${msg.getState().state}`
    ].join('')

    const nickColor = isMe() ? config.me.nick : config.other.nick

    const body = [
      `${chalk[nickColor].bold(contact.getName())} > `,
      `${msg.getText().replace(/\n/gi, '')}`
    ].join('')

    const wrappedBody = util.wrapAnsi(body, 2 * process.stdout.columns / 3).join('\n')
    const complete = header + '\n\n' + wrappedBody
    const bgColor = isMe() ? config.me.bgColor : config.other.bgColor
    const float = isMe() ? config.me.float : config.other.float

    return boxen(complete, {
      margin: config.margin,
      padding: config.padding,
      float: float,
      backgroundColor: bgColor,
      borderStyle: config.borderStyle
    })
  }
}

class AbstractPage {
  constructor (name) {
    this._name = name
    this._lines = []
    this._allLines = []
    this._scrollback = 0
  }

  render (state, width, height) {
    const lines = this.lines()
    const all = this._allLines = lines.reduce((accum, line) => {
      if (typeof line !== 'string') line = line.toString()
      line.split('\n').forEach(l => {
        accum.push.apply(accum, util.wrapAnsi(l, width))
      })
      return accum
    }, [])

    const scrollback = Math.min(this._scrollback, all.length - height)

    if (all.length < height) {
      return all.concat(Array(height - all.length).fill(''))
    }

    return all.slice(
      all.length - height - scrollback,
      all.length - scrollback
    )
  }

  lines () {
    return this._lines
  }

  name () {
    return this._name
  }

  pageUp (height) {
    const rest = this._allLines.length - height
    if (rest > 0) {
      this._scrollback = Math.min(this._scrollback + 1, rest)
    }
  }

  pageDown () {
    this._scrollback = Math.max(0, this._scrollback - 1)
  }

  append (line) {
    this._lines.push(line)
    if (this._lines.length > MAX_PAGE_LENGTH) {
      this._lines.shift()
    }
  }

  clear () {
    this._lines = []
  }
}

class DebugPage extends AbstractPage {
  constructor () {
    super('debug')
  }

  appendMessage (event, data1, data2) {
    // TODO we might want to tweak the verbosity here since
    // there are rather many info events
    if (event === 2091) return
    const eventStr = chalk.yellow(EVENTS[event] || '<unknown-event>')
    this.append(`${eventStr} (${chalk.green(event)}) ${data1} ${data2}`)
  }
}

class StatusPage extends AbstractPage {
  constructor () {
    super('status')
  }
}

class StarPage extends AbstractPage {
  constructor (rc, dc) {
    super('stars')
    this._rc = rc
    this._dc = dc
  }

  lines () {
    return this._dc.getStarredMessages().map(messageId => {
      return new ChatMessage(messageId, this._rc, this._dc)
    })
  }
}

class ChatPage extends AbstractPage {
  constructor (chatId, rc, dc) {
    super('')
    this.chatId = chatId
    this._rc = rc
    this._dc = dc
  }

  name () {
    return `#${this._dc.getChat(this.chatId).getName()}`
  }

  appendMessage (messageId) {
    this.append(new ChatMessage(messageId, this._rc, this._dc))
  }

  deleteMessage (messageId) {
    const index = this._lines.findIndex(line => {
      return line.messageId === messageId
    })
    if (index !== -1) {
      this._lines.splice(index, 1)
    }
  }
}

class State {
  constructor (rc, dc) {
    this.userInput = []
    this._rc = rc
    this._dc = dc
    this._page = 0
    this._pages = []

    if (this._rc.debug) {
      this._debugPage = new DebugPage()
      this._pages.push(this._debugPage)
    }

    this._statusPage = new StatusPage()
    this._pages.push(this._statusPage)

    this._starPage = new StarPage(rc, dc)
    this._pages.push(this._starPage)
  }

  loadChats () {
    this._getChats().forEach(id => this._loadChat(id))
  }

  _loadChat (chatId) {
    const chat = this._getChatPage(chatId)
    const messageIds = this._dc.getChatMessages(chatId, 0, 0)
    messageIds.forEach(id => chat.appendMessage(id))
  }

  queueDeadDropMessage (message) {
    const contactId = message.getFromId()
    const index = this.userInput.findIndex(obj => {
      return obj.contactId === contactId
    })

    if (index !== -1) return

    const contact = this._dc.getContact(contactId)

    this.userInput.push({
      contactId: contactId,
      question: () => {
        return chalk.yellow(
          `Chat with ${contact.getNameAndAddress()} (yes/no/never)? `
        )
      },
      answers: {
        yes: () => {
          if (this._dc.getContacts().indexOf(contactId) === -1) {
            const address = contact.getAddress()
            const name = contact.getName() || address.split('@')[0]
            this._dc.createContact(name, address)
            this.info(`Added contact ${name} (${address})`)
          }
          const chatId = this.createChatByContactId(contactId)
          this._loadChat(chatId)
          this._selectChatPage(chatId)
        },
        no: () => { /* do nothing */ },
        never: () => {
          this._dc.blockContact(contactId, true)
          const name = contact.getNameAndAddress()
          this.warning(`Blocked contact ${name} (id = ${contactId})`)
        }
      }
    })
  }

  appendMessage (chatId, messageId) {
    this._getChatPage(chatId).appendMessage(messageId)
  }

  deleteMessage (chatId, messageId) {
    this._dc.deleteMessages(messageId)
    this._getChatPage(chatId).deleteMessage(messageId)
  }

  createChatByContactId (contactId) {
    const chatId = this._dc.createChatByContactId(contactId)
    this._getChatPage(chatId)
    return chatId
  }

  deleteChat (chatId) {
    const index = this._pages.findIndex(page => {
      return page.chatId === chatId
    })
    if (index !== -1) {
      this._dc.deleteChat(chatId)
      if (index <= this._page) {
        this._page--
      }
      this._pages.splice(index, 1)
    }
  }

  archiveChat (chatId) {
    const index = this._pages.findIndex(page => {
      return page.chatId === chatId
    })
    if (index !== -1) {
      this._dc.archiveChat(chatId, true)
      if (index <= this._page) {
        this._page--
      }
      this._pages.splice(index, 1)
    }
  }

  unArchiveChat (chatId) {
    const currChatId = this.currentPage().chatId
    this._dc.archiveChat(chatId, false)
    this._loadChat(chatId)
    if (typeof currChatId === 'number') {
      this._selectChatPage(currChatId)
    }
  }

  onEnter (line) {
    const page = this.currentPage()
    if (typeof page.chatId === 'number') {
      // TODO this seems to take some time, measure this and log
      // to debug window
      this._dc.sendTextMessage(page.chatId, line)
    }
  }

  info (line) {
    this._statusPage.append(chalk.green(line))
  }

  result (line) {
    this._statusPage.append(` \n${line}\n \n`)
  }

  warning (line) {
    this._statusPage.append(chalk.yellow(line))
  }

  error (line) {
    this._statusPage.append(chalk.red(line))
  }

  logEvent (event, data1, data2) {
    if (this._rc.debug) {
      this._debugPage.appendMessage(event, data1, data2)
    }
  }

  currentPage () {
    return this._pages[this._page]
  }

  currentPageIndex () {
    return this._page
  }

  setCurrentPageIndex (index) {
    if (index >= 0 && index <= this._pages.length - 1) {
      this._page = index
    }
  }

  isChat () {
    return typeof this.currentPage().chatId === 'number'
  }

  nextPage () {
    this._page = ((this._page + 1) % this._pages.length)
  }

  prevPage () {
    const newPage = this._page - 1
    this._page = newPage < 0 ? this._pages.length - 1 : newPage
  }

  _selectChatPage (chatId) {
    const index = this._pages.findIndex(p => p.chatId === chatId)
    if (index !== -1) {
      this._page = index
    }
  }

  _getChatPage (chatId) {
    let page = this._pages.find(p => p.chatId === chatId)
    if (!page) {
      page = new ChatPage(chatId, this._rc, this._dc)
      // TODO we might want to tweak current this._page here
      this._pages.push(page)
      this._sortPages()
    }
    return page
  }

  _getChats () {
    return this._dc.getChats(C.DC_GCL_NO_SPECIALS)
  }

  _sortPages () {
    this._pages.sort((left, right) => {
      const leftName = left.name()
      const rightName = right.name()
      if (leftName === 'debug' ||
          leftName === 'status' ||
          leftName === 'stars') return -1

      if (leftName < rightName) return -1
      if (leftName === rightName) return 0

      return 1
    })
  }
}

module.exports = State
