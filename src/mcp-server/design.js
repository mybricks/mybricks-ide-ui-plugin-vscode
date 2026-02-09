const path = require('path')
const fs = require('fs')

const styleGuidePath = path.join(__dirname, 'webapp-1-scandinavianminimal.md')

module.exports.getStyleGuide = function getStyleGuide(userRequire) {
  return fs.readFileSync(styleGuidePath, 'utf8')
}