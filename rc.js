const path = require('path')
const osenv = require('osenv')

// TODO we should do validation on configuration values
module.exports = require('rc')('deltachat_cli', {
  home: path.join(osenv.home(), '.deltachat_cli'),
  layout: {
    titlebar: {
      show: true,
      // Set gradient to null to enable textColor!
      gradient: 'fruit',
      textColor: 'white',
      bold: true,
      align: 'center',
      bgColor: 'black'
    },
    page: {
      bgColor: 'black'
    },
    statusbar: {
      show: true,
      bgColor: 'black'
    },
    message: {
      me: {
        nick: 'yellow',
        bgColor: 'black',
        float: 'right'
      },
      other: {
        nick: 'red',
        bgColor: 'black',
        float: 'left'
      },
      margin: 3,
      padding: 1,
      borderStyle: 'classic'
    }
  },
  logspeed: 50
})
