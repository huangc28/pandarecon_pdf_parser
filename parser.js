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
// {
//   "1.1 Verify all Apple provided software is current (Scored):" {
//     text: [
//       ...pdf2json page objects...
//     ]
//   },
//
//   "1.2 Enable Auto Update (Scored)": {
//     text: [
//       ...pdf2json page objects...,
//     ]
//   }
// }
//
const fs = require('fs')
const path = require('path')
const JSONStream = require('JSONStream')

const riskRangeTags = require('./get_risk_range_tags')
const parseRiskText = require('./parse_risk_text')

//const fileName = path.resolve(__dirname, './macOS_partial.json')
//const fileName = path.resolve(__dirname, './macOS_risk_only.json')
const fileName = path.resolve(__dirname, './CIS_Microsoft_Windows_10_Enterprise_Release_1909_Benchmark_v1.8.1_risk_only.json')

const read = fileName => {
  const s = fs.createReadStream(fileName, { encoding: 'utf8' })

  const parser = JSONStream.parse('*')

  return s.pipe(parser)
}

const handleData = chunk => {
  const fullTexts = getTextElems(chunk.Pages)

  const tags = riskRangeTags(fullTexts)

  //console.log('DEBUG tags', tags)
  //tags.forEach(tag => console.log(tag.ref))

  //const s = tags.find(tag => tag.ref === '2.2.29')
  //console.log('DEBUG s', s)
  //const obj = parseRiskText(s)

  //console.log('res obj', obj)

  const riskInfoObjs = tags.map(chunk => parseRiskText(chunk))

  fs.writeFile('./win10_1909_data_seeder.json', JSON.stringify(riskInfoObjs) , err => {
    if (err) {
        throw err;
    }

    console.error("JSON data is saved.");
  })
}

const getTextElems = pages =>
  pages.reduce((prev, page) => {
    if ('Texts' in page) {
      return prev.concat(page.Texts)
    }

    return prev
  }, [])


const main = () => {
  const rs = read(fileName)
  rs.on('data', handleData)
  rs.on('end ', handleEnd)

  function handleEnd () {
    rs.removeListener('data', handleData)
    rs.removeListener('end', handleEnd)
  }
}


main()
