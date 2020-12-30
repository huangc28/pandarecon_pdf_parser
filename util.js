const { extractText } = require('./extractors')

const composeContentFromTextChunks = textChunks => {
  return textChunks.reduce((content, chunk) => {
    content += extractText(chunk)

    return content
  }, '')
}

module.exports = composeContentFromTextChunks
