const {
  isHeaderTitle,
  isRiskTitle,
} = require('./text_matchers')
const { extractText } = require('./extractors')
const { composeContentFromTextChunks } = require('./util')

const findHeaderEnd = chunks =>
  chunks.findIndex(chunk => isHeaderTitle(chunk) || isRiskTitle(chunk))

const parseHeaderText = (headerList, chunks) => {
  const headerRefObj = headerList.reduce((accu, curr) => {
    accu[curr.control_ref] = { ...curr }

    return accu
  }, {})

  // Iterate through chunks
  let i = 0
  while (i < chunks.length) {
    if (isHeaderTitle(chunks[i])) {
      const start = i

      const headerText = decodeURIComponent(extractText(chunks[i]))
      const [chunkCtrlRef] = headerText.split(' ')


      const end = findHeaderEnd(chunks.slice(i+1))
      const headerRange = chunks.slice(start + 1, start + end + 1)

      const content = composeContentFromTextChunks(headerRange)

      if (chunkCtrlRef in headerRefObj) {
        headerRefObj[chunkCtrlRef].control_description = decodeURIComponent(content)
      }

      i += (start + end - i) + 1

      continue
    }

    i++
  }

  const mHeaderList = Object
    .keys(headerRefObj)
    .map(key => headerRefObj[key])

  console.log('DEBUG mHeaderList', mHeaderList)

  return mHeaderList
}

module.exports = parseHeaderText
