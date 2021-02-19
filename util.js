const { extractText } = require('./extractors')

const composeContentFromTextChunks = textChunks => {
  return textChunks.reduce((content, chunk) => {
    content += extractText(chunk)

    return content
  }, '')
}

const PDF_PAGE_TAG_REGEX = /13%7C%20Page/g
const removePDFPageText = text => text.replace(PDF_PAGE_TAG_REGEX, '')

module.exports = {
  removePDFPageText,
  composeContentFromTextChunks,
}
