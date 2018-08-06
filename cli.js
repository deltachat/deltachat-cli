#!/usr/bin/env node

const DeltaChat = require('deltachat-node')
const rc = require('./rc')

if (!rc.email || !rc.mail_pw) {
  console.error('Missing --email and/or --mail_pw configuration')
  process.exit(1)
}

const dc = new DeltaChat({
  email: rc.email,
  mail_pw: rc.mail_pw
})

require('./app')(rc, dc)
