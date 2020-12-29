const {
  extractTextStyle,
  extractText,
} = require('./extractors')

const isRiskTitle = textObj => {
  // determine if is text title via text style.
  const [fontFaceID, fontSize] = extractTextStyle(textObj)

  return fontFaceID == 2 && fontSize == 18.96
}

const RISK_TITLE_REG = /^[0-9]+\.[0-9]+(\.[0-9]+)?.*\((Scored|Not Scored)\)$/
const TITLE_COMPLETION_REG = /^.*\(Scored|Not Scored\)$/

const completeTitleFromTitleList = titleList => {
  const newTitleList = []

  const findCompletedLineToTitle = (titleList, startIndex) => {
    if (TITLE_COMPLETION_REG.test(titleList[startIndex + 1].title)) {
      return startIndex + 1
    }

    return findCompletedLineToTitle(titleList, startIndex + 1)
  }

  const setProperEndPosForTitleTag = titleList => {
    let i = 0
    while (i < titleList.length) {
      if (titleList[i+1]) {
        titleList[i].end_pos = titleList[i+1].start_pos - 1
      }

      i++
    }

    return titleList
  }

  let i = 0
  while (i < titleList.length) {
    if (RISK_TITLE_REG.test(titleList[i].title)) {

      newTitleList.push(titleList[i])

      i++
    } else {
      const idxToCompleteTitle = findCompletedLineToTitle(titleList, i)
      const arrSlice = titleList.slice(i + 1, idxToCompleteTitle + 1)
      arrSlice.unshift(titleList[i])

      newTitleList.push({
        title: arrSlice.reduce((prev, curr) => prev += curr.title, ''),
        start_pos: titleList[i].start_pos,
      })

      i += (idxToCompleteTitle - i) + 1
    }
  }

  return setProperEndPosForTitleTag(newTitleList)
}

/**
 * Tag the line number for each rusk rule. The return format is:
 *
 * [
 *   {
 *     title: 'risk1',
 *     start_pos: 12
 *     end_pos: 30,
 *   },
 *   {
 *     title: 'risk2',
 *     start_pos: 31,
 *     end_pos: 40,
 *   },
 * }
 */
function riskRangeTags(texts) {
  const titlePosTags = []

  texts.forEach((textObj, i) => {
    if (isRiskTitle(textObj)) {
      // Literature resides in text.R.T
      const title = extractText(textObj)

      titlePosTags.push({
        title,
        start_pos: i,
      })
    }
  })

  const riskRangeTags = completeTitleFromTitleList(titlePosTags)
  riskRangeTags[riskRangeTags.length - 1].end_pos = texts.length - 1

  return riskRangeTags
}

module.exports = riskRangeTags
