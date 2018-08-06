// TODO: This code is copied from cabal
// https://github.com/cabal-club/cabal/blob/master/util.js

// Character-wrap text containing ANSI escape codes.
// String, Int -> [String]
function wrapAnsi (text, width) {
  if (!text) return []

  var res = []
  var line = []
  var lineLen = 0
  var insideCode = false

  for (var i = 0; i < text.length; i++) {
    var chr = text.charAt(i)
    if (chr === '\u001b') {
      insideCode = true
    }

    line.push(chr)

    if (!insideCode) {
      lineLen++
      if (lineLen >= width - 1) {
        res.push(line.join(''))
        line = []
        lineLen = 0
      }
    }

    if (chr === 'm' && insideCode) {
      insideCode = false
    }
  }

  if (line.length > 0) {
    res.push(line.join(''))
  }

  return res
}

// Length of 'str' sans ANSI codes
function strlenAnsi (str) {
  var len = 0
  var insideCode = false

  for (var i = 0; i < str.length; i++) {
    var chr = str.charAt(i)
    if (chr === '\u001b') insideCode = true
    if (!insideCode) len++
    if (chr === 'm' && insideCode) insideCode = false
  }

  return len
}

function centerText (text, width) {
  var left = Math.floor((width - strlenAnsi(text)) / 2)
  var right = Math.ceil((width - strlenAnsi(text)) / 2)
  var lspace = left > 0 ? new Array(left).fill(' ').join('') : ''
  var rspace = right > 0 ? new Array(right).fill(' ').join('') : ''
  return lspace + text + rspace
}

function rightAlignText (text, width) {
  var left = width - strlenAnsi(text)
  if (left < 0) return text
  var lspace = new Array(left).fill(' ').join('')
  return lspace + text
}

module.exports = {
  wrapAnsi,
  strlenAnsi,
  centerText,
  rightAlignText
}
