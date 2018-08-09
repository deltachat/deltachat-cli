const path = require('path')
const osenv = require('osenv')

// TODO
// 1.should do validation on configuration values
// 2. document that textColor, bgColor are chalk values
// and gradient is based on the gradient-string module
module.exports = require('rc')('deltax', {
  home: path.join(osenv.home(), '.deltax'),
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
    }
  },
  logspeed: 50
})
