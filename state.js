const events = require('deltachat-node/events')
const boxen = require('boxen')
const chalk = require('chalk')
const util = require('./util')

class ChatMessage {
  constructor (msgId, rc, dc) {
    this._msgId = msgId
    this._rc = rc
    this._dc = dc
  }

  toString () {
    const config = this._rc.layout.message
    const msg = this._dc.getMessage(this._msgId)
    if (msg === null) return ''

    const fromId = msg.getFromId()
    const isMe = () => fromId === 1
    const contact = this._dc.getContact(fromId)

    const header = [
      `#${msg.getId()} `,
      `${toDate(msg.getTimestamp())} `,
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

const toDate = ts => {
  const date = new Date(ts * 1000)
  const hours = date.getHours()
  const minutes = '0' + date.getMinutes()
  const seconds = '0' + date.getSeconds()
  return `${hours}:${minutes.substr(-2)}:${seconds.substr(-2)}`
}

class AbstractPage {
  constructor (name) {
    this._name = name
    this._lines = []
    this._allLines = []
    this._scrollback = 0
  }

  render (state, width, height) {
    const all = this._allLines = this._lines.reduce((accum, line) => {
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
  constructor (chatId, rc, dc) {
    super('')
    this.chatId = chatId
    this._rc = rc
    this._dc = dc
  }

  name () {
    return `#${this._dc.getChat(this.chatId).getName()}`
  }

  appendMessage (msgId) {
    this.append(new ChatMessage(msgId, this._rc, this._dc))
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
      msgIds.forEach(msgId => this.appendMessage(chatId, msgId))
    })
  }

  appendMessage (chatId, msgId) {
    this._getChatPage(chatId).appendMessage(msgId)
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

  // TODO pages are not sorted correctly, should be sorted on
  // chat name
  _getChatPage (chatId) {
    let page = this._pages.find(p => p.chatId === chatId)
    if (!page) {
      page = new ChatPage(chatId, this._rc, this._dc)
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
