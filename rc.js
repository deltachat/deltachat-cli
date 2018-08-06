// TODO should do validation on configuration values
// TODO document that textColor, bgColor are chalk values
// and gradient is based on the gradient-string module
module.exports = require('rc')('deltax', {
  layout: {
    titlebar: {
      show: true,
      // Set gradient to null to enable textColor!
      gradient: 'fruit',
      textColor: 'white',
      bold: true,
      align: 'center',
      bgColor: 'bgBlack'
    },
    page: {
      bgColor: 'bgBlack'
    },
    statusbar: {
      show: true,
      bgColor: 'bgBlack'
    }
  },
  logspeed: 50
})
