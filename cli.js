#!/usr/bin/env node

const DeltaChat = require('deltachat-node')
const mkdirp = require('mkdirp')
const rc = require('./rc')

if (!rc.email || !rc.mail_pw) {
  console.error('Missing --email and/or --mail_pw configuration')
  process.exit(1)
}

mkdirp.sync(rc.home)

const dc = new DeltaChat({
  addr: rc.email,
  mail_pw: rc.mail_pw,
  cwd: rc.home
})

dc.open(() => {
  require('./app')(rc, dc)
})
