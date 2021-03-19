// Read json file content via readStream. We should be able to retrieve the data by listening on the 'data' event from the "readStream".
// Concat the result from the event. We then parse the result string into json object.
// Iterate through "Pages" array to retrieve the text element. The first thing we need to do is identifying the "content range of text element" for each rule.
//
// For example, we have:
//
//   - 1.1 Verify all Apple provided software is current (Scored)
//   - 1.2 Enable Auto Update (Scored)
//   - 1.3 Enable Download new updates when available (Scored)
//   - 1.4 Enable app update installs (Scored)
//   - 1.5 Enable system data files and security update installs (Scored)
//
// Each "Page" element has a "Text" element which contains the literature for each rule. We'll need to recognize the rule title using text style or regular expression.
// The expected structure of a ranged chunks are to be like:
//
// - 1.1 is within the range from array index 0 ~ 10.
// - 1.2 is within the range from array index 11 ~ 20.
// - 1.3 is within the range from array index 21 ~ 30.
//
const fs = require('fs')
const path = require('path')
const JSONStream = require('JSONStream')

const riskRangeTags = require('./get_risk_range_tags')
const parseRiskText = require('./parse_risk_text')
const parseHeaderText = require('./parse_header_text')
const pandaRiskConf = require('./pandarisk.config').config
const { isRiskTitle, isHeaderTitle } = require('./text_matchers')
const { extractText } = require('./extractors')
const { Command } = require('commander')

const cmd = new Command()

cmd
  .requiredOption('-f, --file <filePath>', 'specify PDF json path to extract the data from')
  .parse(process.argv)
  .action(parsePDFJson)

function parsePDFJson () {

}

const read = fileName => {
  const s = fs.createReadStream(fileName, { encoding: 'utf8' })

  const parser = JSONStream.parse('*')

  return s.pipe(parser)
}

// Let's try to merge the title chunk all together.
// The title chunk can be separated into several
// text chunks. This causes `setRiskChunkRange` can't
// match the reference number in the text chunks. For example:
// ref: 18.9.95.2 can be seperated into several text chunks after
// parsed by pdf2json.
//
// {
//    "R": [
//      { "T": "18." }
//    ]
// },
//
// {
//   "R": [
//     { "T": "9.95.2" }
//   ]
// }
//
// Thus, we need to merge content of "T" of these two text chunk
// into 1.
const mergeTitleChunks = chunks => {
  const traceTitleChunks = (chunks, at) => {
    if (isRiskTitle(chunks[at + 1])) {
      return traceTitleChunks(chunks, at + 1)
    }

    return at
  }

  const mergeChunksText = chunks => {
    return chunks
      .reduce(
        (accu, chunk) => {
          accu += extractText(chunk)

          return accu
        },
        '',
      )
  }

  const titleList = []

  // Iterate through each chunk. Try to find title chunk in the list.
  // If we find a title chunk, there will be a great chance where the next
  // text chunk is title chunk either.
  let i = 0

  while (i < chunks.length) {
    if (isRiskTitle(chunks[i])) {
      const endRef = traceTitleChunks(chunks, i)

      // Now we found the last text chunk of the current title
      // merge them all together
      const partialTitleChunks = chunks.slice(i, endRef + 1)
      const mergedText = mergeChunksText(partialTitleChunks)

      chunks[i]['R'][0]['T'] = mergedText
      titleList.push(chunks[i])

      i += (endRef - i) + 1
    } else {
      titleList.push(chunks[i])

      i++
    }
  }

  return titleList
};

const mergeHeaderChunks = chunks => {
  const traceHeaderChunks = (chunks, at) => {
    if (isHeaderTitle(chunks[at + 1])) {
      return traceHeaderChunks(chunks, at + 1)
    }

    return at
  }

  const mergeChunksText = chunks => {
    return chunks
      .reduce(
        (accu, chunk) => {
          accu += extractText(chunk)

          return accu
        },
        '',
      )
  }

  const titleList = []

  // Iterate through each chunk. Try to find title chunk in the list.
  // If we find a title chunk, there will be a great chance where the next
  // text chunk is title chunk either.
  let i = 0

  while (i < chunks.length) {
    if (isHeaderTitle(chunks[i])) {
      const endRef = traceHeaderChunks(chunks, i)

      // Now we found the last text chunk of the current title
      // merge them all together
      const partialTitleChunks = chunks.slice(i, endRef + 1)
      const mergedText = mergeChunksText(partialTitleChunks)

      chunks[i]['R'][0]['T'] = mergedText
      titleList.push(chunks[i])

      i += (endRef - i) + 1
    } else {
      titleList.push(chunks[i])

      i++
    }
  }

  return titleList
};

const handleData = chunk => {
  // Retrieve config object
  let fullTexts = getTextElems(chunk.Pages)

  fullTexts = mergeTitleChunks(fullTexts)
  fullTexts = mergeHeaderChunks(fullTexts)

  const {
    headerList,
    titleList,
  } = riskRangeTags(fullTexts)

  const parsedHeaderList = parseHeaderText(headerList, fullTexts)
  const riskInfoObjs = titleList.map(chunk => parseRiskText(chunk))
  const masterInfo = parsedHeaderList.concat(riskInfoObjs)
  const { outputFilename } = pandaRiskConf

  fs.writeFile(
    path.resolve(__dirname, outputFilename),
    JSON.stringify(masterInfo) ,
    err => {
      if (err) {
          throw err;
      }

      console.error("JSON data is saved.");
    }
  )
}

const getTextElems = pages =>
  pages.reduce((prev, page) => {
    if ('Texts' in page) {
      return prev.concat(page.Texts)
    }

    return prev
  }, [])


const main = () => {
  const filename = path.resolve(
    __dirname,
    pandaRiskConf.filePath,
  )

  const rs = read(filename)

  rs.on('data', handleData)
  rs.on('end ', handleEnd)

  function handleEnd () {
    rs.removeListener('data', handleData)
    rs.removeListener('end', handleEnd)
  }
}


main()
