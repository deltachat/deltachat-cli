const chalk = require('chalk')
const util = require('./util')
const events = require('deltachat-node/events')

class AbstractPage {
  constructor (name) {
    // TODO this.name should be internal and we should have a method
    // for accessing the name so e.g. ChatPage can be dynamic, since
    // the name of a chat can change
    this.name = name
    this._lines = []
    this._allLines = []
    this._scrollback = 0
  }

  render (state, width, height) {
    const all = this._allLines = this._lines.reduce((accum, line) => {
      // TODO 'line' here could actually be an object as well, e.g.
      // a message object (with a msgId etc, which we could use to
      // update status with and in _this_ method we convert it to
      // a string)
      accum.push.apply(accum, util.wrapAnsi(line, width))
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

  pageUp (height) {
    const rest = this._allLines.length - height
    if (rest > 0) {
      this._scrollback = Math.min(this._scrollback + 1, rest)
    }
  }

  pageDown () {
    this._scrollback = Math.max(0, this._scrollback - 1)
  }

  append (obj) {
    if (typeof obj === 'string') {
      obj.split('\n').forEach(line => this._lines.push(line))
    } else {
      this._lines.push(obj)
    }
  }
}

class DebugPage extends AbstractPage {
  constructor () {
    super('debug')
  }

  appendMessage (event, data1, data2) {
    // TODO we might want to tweak the verbosity here since
    // there are rather many info events
    const eventStr = chalk.yellow(events[event] || '<unknown-event>')
    this.append(`${eventStr} (${chalk.green(event)}) ${data1} ${data2}`)
  }
}

class StatusPage extends AbstractPage {
  constructor () {
    super('status')
  }
}

class ChatPage extends AbstractPage {
  constructor (name, chatId) {
    super(name)
    this.chatId = chatId
  }

  appendMessage (msg) {
    const fromId = msg.getFromId()
    const text = msg.getText().replace(/\n/gi, '')
    const timestamp = msg.getTimestamp()
    this.append(`${timestamp}:[${fromId}] > ${text}`)
  }
}

class State {
  constructor (rc, dc) {
    this._rc = rc
    this._dc = dc
    this._page = 0
    this._pages = []

    if (this._rc.debug) {
      this.debug = new DebugPage()
      this._pages.push(this.debug)
    }

    this.status = new StatusPage()
    this._pages.push(this.status)
  }

  loadChats () {
    this._allChats().forEach(chatId => {
      const msgIds = this._dc.getChatMessages(chatId, 0, 0)
      msgIds.forEach(msgId => this.appendToChat(chatId, msgId))
    })
  }

  appendToChat (chatId, msgId) {
    const msg = this._dc.getMessage(msgId)
    if (msg) {
      this._getChatPage(chatId).appendMessage(msg)
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

  appendToStatusPage (line) {
    this.status.append(line)
  }

  logEvent (event, data1, data2) {
    if (this._rc.debug) {
      this.debug.appendMessage(event, data1, data2)
    }
  }

  currentPage () {
    return this._pages[this._page]
  }

  nextPage () {
    this._page = ((this._page + 1) % this._pages.length)
  }

  prevPage () {
    const newPage = this._page - 1
    this._page = newPage < 0 ? this._pages.length - 1 : newPage
  }

  _getChatPage (chatId) {
    const chat = this._dc.getChat(chatId)
    const name = `#${chat.getName()}`
    // TODO we should also use chatId to find the chat and not name
    let page = this._pages.find(p => p.name === name)
    if (!page) {
      // TODO this means we can't change chat name dynamically
      // it's probably better if we just store chatId and then
      // get the chat object to get the name
      page = new ChatPage(name, chatId)
      this._pages.push(page)
    }
    return page
  }

  _allChats () {
    const result = []
    const list = this._dc.getChatList(0, '', 0)
    const count = list.getCount()
    for (let i = 0; i < count; i++) {
      result.push(list.getChatId(i))
    }
    return result
  }
}

module.exports = State
