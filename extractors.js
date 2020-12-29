const extractTextRun = textObj => textObj.R[0]
const extractTextStyle = textObj => extractTextRun(textObj)['TS']
const extractText = textObj => extractTextRun(textObj)['T']

module.exports = {
  extractTextRun,
  extractTextStyle,
  extractText,
}
