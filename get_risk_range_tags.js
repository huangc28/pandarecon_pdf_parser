"use strict"

const { extractText } = require('./extractors')
const {
  isRiskTitle,
  isHeaderTitle,
} = require('./text_matchers')
const { composeContentFromTextChunks } = require('./util')
const { config } = require('./pandarisk.config')

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
const RISK_TITLE_SEP_REG = /^(\d+(\.\d+){0,5})(.*)\((Scored|Not%20Scored)\)$/
const HEADER_TITLE_SEP_REG = /^(\d+(%20)?(\.\d+){0,5})(.*)$/

function riskRangeTags(texts) {
  const titleChunks = texts.filter(text => isRiskTitle(text))
  const headerChunks = texts.filter(chunk => isHeaderTitle(chunk))

  // Merge all title to one big chunk on text.
  const titleContent = composeContentFromTextChunks(titleChunks)
  const titleList = parseTitleContentToTitleList(titleContent)

  // Merge all title to one big chunk on text.
  const headerContent = composeContentFromTextChunks(headerChunks)
  const headerList = parseHeaderContentToTitleList(headerContent)

  return {
    headerList: headerList.map(header => ({
      ...header,
      control_group: config.currentGroup,
      control_type: config.currentOs,
    })),
    titleList: setRiskChunkRange(titleList, texts),
  }
}

function findRefIndex(startRef, endRef, chunks/*, prevEndPos*/) {
  let startRefPos = 0
  let endRefPos = 0

  for (let i = 0; i < chunks.length; i++) {
    const text = extractText(chunks[i])

    // Find start position for startRef in the text chunks.
    //if (text.startsWith(startRef) && isRiskTitle(chunks[i])) {
    if (text.startsWith(startRef)) {
      startRefPos = i

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
        endRefPos = k - 1

        break
      }
    }
  }

  return {
    start_pos: startRefPos,
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
  let i = 0

  while (i < titleList.length) {
    const { ref: startRef } = titleList[i]

    if (startRef === '18.9.95.1') {
      console.log('NEXT ref', titleList[i+1])
    }

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
    )

    riskRangeTags.push({
      ...titleList[i],
      ...pos,
      text_chunks: textChunks.slice(
        pos.start_pos,
        pos.end_pos + 1,
      ),
    })

    i++
  }

  return riskRangeTags
}

function parseTitleContentToTitleList(content) {
  const titles = content
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

function parseHeaderContentToTitleList(content) {
  const headers = content
    .replace(/([a-zA-Z]+\)?)(\d+)/g, '$1|$2')
    .split('|')
    .filter(title => !!title)
    .map(title => {
      const [, ref,,, ctrlName] = HEADER_TITLE_SEP_REG.exec(title)

      return {
        control_ref: decodeURIComponent(ref),
        control_name: decodeURIComponent(ctrlName).trim(),
      }
    })

  return headers
}

module.exports = riskRangeTags
