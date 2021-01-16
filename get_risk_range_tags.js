"use strict"

const {
  extractTextStyle,
  extractText,
} = require('./extractors')

const { composeContentFromTextChunks } = require('./util')

const isRiskTitle = textObj => {
  // determine if is text title via text style.
  const [fontFaceID, fontSize] = extractTextStyle(textObj)

  return fontFaceID === 2 && fontSize === 18.96
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

const RISK_TITLE_SEP_REG = /^(\d+\.\d+(\.\d+){0,2})(.*)\((Scored|Not%20Scored)\)$/

function riskRangeTags(texts) {
  const titleChunks = []

  texts.forEach(textObj => {
    if (isRiskTitle(textObj)) {
      titleChunks.push(textObj)
    }
  })

  // Mash all title in to one big chunk on text.
  const titleContent = composeContentFromTextChunks(titleChunks)
  const titleList = parseTitleChunkToTitleList(titleContent)

  return setRiskChunkRange(titleList, texts)
}

function findRefIndex(startRef, endRef, chunks/*, prevEndPos*/) {
  //console.log()

  let startRefPos = 0
  let endRefPos = 0

  for (let i = 0; i < chunks.length; i++) {
    const text = extractText(chunks[i])

    // Find start position for startRef in the text chunks.
    if (text.startsWith(startRef) && isRiskTitle(chunks[i])) {
      //console.log('findRefIndex 1', extractText(chunks[i]))

      startRefPos = i

      //console.log('DEBUG start ref spot 3', i)

      if (endRef === null) {
        endRefPos = chunks.length - 1
      }

      break
    }
  }

  if (endRef !== null) {
    for (let k = 0; k < chunks.length; k++) {
      const text = extractText(chunks[k])

      if (text.startsWith(endRef) && isRiskTitle(chunks[k])) {
        //console.log('findRefIndex 2', extractText(chunks[k]))
        endRefPos = k - 1

        break
      }
    }
  }

  //console.log('DEBUG start ref spot 4', startRefPos)

  return {
    start_pos: startRefPos,
    //end_pos: prevEndPos + endRefPos,
    end_pos: endRefPos,
  }
}

/**
 * Time complexity: O(n^2). Should imporve to O(n)
 */
function setRiskChunkRange(titleList, textChunks) {
  // Iterate through title list, retrieve ref from
  // each title object. We will locate the postion
  // of text chunk in textChunks array.

  let riskRangeTags = []
  let riskRangeStartPos = 0
  let i = 0

  //const pos = findRefIndex('5.2.2', '5.2.3', textChunks)
  //console.log('DEBUG pos 1', pos)
  //console.log('DEBUG pos 2', titleList)

  while (i < titleList.length) {
    const { ref: startRef } = titleList[i]

    //const partialTextChunks = textChunks.slice(riskRangeStartPos)

    // "endRef" equals to null indicates that it is
    // the last risk title. Assume the rest of the PDF
    // content is the content of of the last risk.
    const endRef = titleList[i+1]
      ? titleList[i+1].ref
      : null

    // Now that we got the range position for the risk content.
    // simply push that to out result array.
    const pos = findRefIndex(
      startRef,
      endRef,
      textChunks,
      //riskRangeStartPos,
    )

    //console.log('DEBUG pos', pos)
    riskRangeTags.push({
      ...titleList[i],
      ...pos,
      text_chunks: textChunks.slice(
        pos.start_pos,
        pos.end_pos + 1,
      ),
    })

    //riskRangeStartPos = pos.end_pos + 1

    i++
  }

  return riskRangeTags
}

function parseTitleChunkToTitleList(titleChunks) {
  const titles = titleChunks
    .replace(/\((Scored|Not%20Scored)\)/g, '$&|')
    .split('|')
    .filter(title => !!title)
    .map(title => {
      const [, ref,, ctrlName, scoreStatus] = RISK_TITLE_SEP_REG.exec(title)

      return {
        ref,
        ctrl_name: ctrlName,
        score_status: scoreStatus,
      }
    })

  return titles
}

module.exports = riskRangeTags
